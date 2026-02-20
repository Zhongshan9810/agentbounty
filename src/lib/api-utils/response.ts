import { NextResponse } from "next/server";
import { ApiError, ErrorCode } from "./errors";

export function success<T>(data: T, meta?: { page?: number; perPage?: number; total?: number }) {
  return NextResponse.json({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function paginated<T>(data: T[], page: number, perPage: number, total: number) {
  return NextResponse.json({
    ok: true,
    data,
    meta: { page, perPage, total },
  });
}

export function error(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
      },
      { status: err.status }
    );
  }
  if (err instanceof Error && err.constructor.name === "ZodError" && "issues" in err) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Request validation failed",
          details: { issues: (err as unknown as { issues: unknown[] }).issues },
        },
      },
      { status: 400 }
    );
  }
  console.error("Unhandled error:", err);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
    { status: 500 }
  );
}
