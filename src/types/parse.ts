import { ZodError, type ZodSchema } from "zod";
import { NextResponse } from "next/server";

export function parseJsonBody<T>(raw: unknown, schema: ZodSchema<T>): T {
  return schema.parse(raw);
}

export function handleParseError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "validation_error", issues: err.issues },
      { status: 400 }
    );
  }
  return NextResponse.json({ error: "invalid_json" }, { status: 400 });
}
