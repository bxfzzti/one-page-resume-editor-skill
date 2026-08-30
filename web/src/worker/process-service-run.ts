import { and, eq } from "drizzle-orm";
import { db, type ResumeDb } from "@/db/client";
import { serviceRuns } from "@/db/schema";
import type { ServiceKind } from "@/lib/service-catalog";
import { auditGeneratedSentences } from "@/server/audit/source-audit";
import { PointLedgerService } from "@/server/points/point-ledger";
import { HttpModelGateway } from "@/server/model/http-model";
import { MockModelGateway } from "@/server/model/mock-model";
import { commonOutputSchema, jdOutputSchema } from "@/server/model/schemas";
import { SkillLoader } from "@/server/skill/skill-loader";
import type { ModelGateway } from "@/server/model/model-gateway";

type ProcessDependencies = {
  database: ResumeDb;
  ledger: PointLedgerService;
  model: ModelGateway;
  loader: SkillLoader;
};

function defaultModel(): ModelGateway {
  if ((process.env.MODEL_PROVIDER ?? "mock") === "mock") {
    return new MockModelGateway();
  }
  return new HttpModelGateway(
    process.env.MODEL_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4",
    process.env.MODEL_NAME ?? "glm-5.3",
    process.env.MODEL_API_KEY ?? "",
  );
}

function defaultDependencies(): ProcessDependencies {
  return {
    database: db,
    ledger: new PointLedgerService(db),
    model: defaultModel(),
    loader: new SkillLoader(),
  };
}

export async function processServiceRun(
  runId: string,
  dependencies: ProcessDependencies = defaultDependencies(),
) {
  const { database, ledger, model, loader } = dependencies;
  const [run] = await database
    .select()
    .from(serviceRuns)
    .where(eq(serviceRuns.id, runId))
    .limit(1);
  if (!run) throw new Error("SERVICE_RUN_NOT_FOUND");
  if (run.state !== "reserved") return run;

  const [running] = await database
    .update(serviceRuns)
    .set({ state: "running", updatedAt: new Date() })
    .where(and(eq(serviceRuns.id, runId), eq(serviceRuns.state, "reserved")))
    .returning();
  if (!running) return run;

  try {
    const serviceKind = run.serviceKind as ServiceKind;
    const bundle = await loader.load(serviceKind, {
      roleGroup:
        serviceKind === "one_page" ||
        serviceKind === "jd_tailoring" ||
        serviceKind === "multi_jd"
          ? "product_operations_growth"
          : undefined,
    });
    const schema =
      serviceKind === "jd_tailoring" || serviceKind === "multi_jd"
        ? jdOutputSchema
        : commonOutputSchema;
    const output = await model.generate({
      system: `${bundle.entrypoint}\n\n${bundle.references
        .map((reference) => `## ${reference.path}\n${reference.content}`)
        .join("\n\n")}`,
      user: JSON.stringify(running.inputSnapshot),
      schema,
      requestId: run.id,
    });
    const audit = auditGeneratedSentences({
      facts: output.facts,
      sentences: output.sentences,
    });
    if (!audit.ok) throw new Error("SOURCE_AUDIT_FAILED");

    const [succeeded] = await database
      .update(serviceRuns)
      .set({
        state: "succeeded",
        outputSnapshot: output,
        updatedAt: new Date(),
      })
      .where(eq(serviceRuns.id, run.id))
      .returning();
    await ledger.settle({
      userId: run.userId,
      serviceRunId: run.id,
      idempotencyKey: `settle:${run.id}`,
    });
    return succeeded;
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : "SERVICE_FAILED";
    await database
      .update(serviceRuns)
      .set({ state: "failed", errorCode, updatedAt: new Date() })
      .where(eq(serviceRuns.id, run.id));
    await ledger.release({
      userId: run.userId,
      serviceRunId: run.id,
      idempotencyKey: `release:${run.id}`,
    });
    const [failed] = await database
      .select()
      .from(serviceRuns)
      .where(eq(serviceRuns.id, run.id));
    return failed;
  }
}
