import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { ServiceKind } from "@/lib/service-catalog";

type RoleGroup = "product_operations_growth";

export type SkillLoadOptions = {
  roleGroup?: RoleGroup;
};

export type SkillBundle = {
  entrypoint: string;
  references: Array<{ path: string; content: string }>;
  skillRevision: string;
};

function referencePaths(
  serviceKind: ServiceKind,
  options: SkillLoadOptions,
): string[] {
  const paths: Record<ServiceKind, string[]> = {
    diagnosis: ["references/fact-ledger.md", "references/diagnosis.md"],
    one_page: [
      "references/fact-ledger.md",
      "references/one-page-resume.md",
    ],
    jd_tailoring: [
      "references/fact-ledger.md",
      "references/jd-tailoring.md",
    ],
    multi_jd: [
      "references/fact-ledger.md",
      "references/jd-tailoring.md",
    ],
    interview_review: [
      "references/fact-ledger.md",
      "references/interview-and-review.md",
    ],
    deep_follow_up: [
      "references/fact-ledger.md",
      "references/interview-and-review.md",
    ],
  };
  const result = [...paths[serviceKind]];
  if (
    options.roleGroup === "product_operations_growth" &&
    (serviceKind === "one_page" ||
      serviceKind === "jd_tailoring" ||
      serviceKind === "multi_jd")
  ) {
    result.push("references/roles/product-operations-growth.md");
  }
  return result;
}

export class SkillLoader {
  constructor(private readonly startingDirectory = process.cwd()) {}

  async load(
    serviceKind: ServiceKind,
    options: SkillLoadOptions = {},
  ): Promise<SkillBundle> {
    const root = await this.findSkillRoot();
    const entrypointPath = path.join(root, "SKILL.md");
    const entrypoint = await readFile(entrypointPath, "utf8");
    const references = await Promise.all(
      referencePaths(serviceKind, options).map(async (relativePath) => ({
        path: relativePath,
        content: await readFile(path.join(root, relativePath), "utf8"),
      })),
    );
    const hash = createHash("sha256");
    hash.update(entrypoint);
    for (const reference of references) {
      hash.update(reference.path);
      hash.update(reference.content);
    }

    return {
      entrypoint: "SKILL.md",
      references,
      skillRevision: hash.digest("hex"),
    };
  }

  private async findSkillRoot(): Promise<string> {
    let directory = path.resolve(this.startingDirectory);
    for (let depth = 0; depth < 6; depth += 1) {
      try {
        await access(path.join(directory, "SKILL.md"));
        return directory;
      } catch {
        const parent = path.dirname(directory);
        if (parent === directory) break;
        directory = parent;
      }
    }
    throw new Error("SKILL_ROOT_NOT_FOUND");
  }
}
