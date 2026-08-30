import type { z } from "zod";
import type { ModelGateway } from "./model-gateway";
import { commonOutputSchema, type CommonOutput } from "./schemas";

const emptyOutput: CommonOutput = {
  task: "通用诊断",
  completeness: "材料待补充",
  summary: "当前为测试模型输出，请配置真实模型服务。",
  facts: [],
  risks: [],
  questions: [],
  sentences: [],
};

export class MockModelGateway implements ModelGateway {
  nextResult: unknown = emptyOutput;

  async generate<T>(input: { schema: z.ZodType<T> }): Promise<T> {
    return input.schema.parse(this.nextResult);
  }
}

export function createMockModelGateway(): MockModelGateway {
  return new MockModelGateway();
}

export { commonOutputSchema };
