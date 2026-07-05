import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { createError } from "@heart-message/shared";
import { AppError } from "../errors";

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: createError("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request")
    };
  }

  if (error instanceof HTTPException) {
    return {
      status: error.status,
      body: createError("HTTP_ERROR", error.message)
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.status,
      body: createError(error.code, error.message)
    };
  }

  console.error(error);

  return {
    status: 500,
    body: createError("INTERNAL_ERROR", "Internal server error")
  };
}
