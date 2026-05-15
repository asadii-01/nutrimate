import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === "body") req.body = result.data;
    else if (source === "query") (req as unknown as { query: T }).query = result.data;
    else (req as unknown as { params: T }).params = result.data;
    next();
  };
}
