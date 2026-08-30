import type { z } from "zod";

export interface ModelGateway {
  generate<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    requestId: string;
  }): Promise<T>;
}
