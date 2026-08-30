import type { z } from "zod";
import { z as zod } from "zod";
import type { ModelGateway } from "./model-gateway";

type ChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

function isChatResponse(value: unknown): value is ChatResponse {
  return typeof value === "object" && value !== null && "choices" in value;
}

export class HttpModelGateway implements ModelGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly apiKey: string,
  ) {}

  async generate<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    requestId: string;
  }): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      try {
        const response = await fetch(
          `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${this.apiKey}`,
              "content-type": "application/json",
              "x-request-id": input.requestId,
            },
            body: JSON.stringify({
              model: this.model,
              temperature: 0,
              messages: [
                { role: "system", content: input.system },
                { role: "user", content: input.user },
              ],
              max_tokens: 4_096,
              ...(process.env.MODEL_PROVIDER === "glm"
                ? { thinking: { type: "disabled" } }
                : {}),
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "resume_service_output",
                  strict: true,
                  schema: zod.toJSONSchema(input.schema),
                },
              },
            }),
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
        const payload: unknown = await response.json();
        if (!isChatResponse(payload)) throw new Error("MODEL_RESPONSE_INVALID");
        const content = payload.choices?.[0]?.message?.content;
        if (!content) throw new Error("MODEL_CONTENT_EMPTY");
        return input.schema.parse(JSON.parse(content));
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error(
      lastError instanceof Error ? lastError.message : "MODEL_REQUEST_FAILED",
    );
  }
}

export function createHttpModelGateway(): HttpModelGateway {
  const baseUrl = process.env.MODEL_BASE_URL;
  const model = process.env.MODEL_NAME;
  const apiKey = process.env.MODEL_API_KEY;
  if (!baseUrl || !model || !apiKey) throw new Error("MODEL_NOT_CONFIGURED");
  return new HttpModelGateway(baseUrl, model, apiKey);
}
