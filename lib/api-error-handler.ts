// lib/api-error-handler.ts

import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 },
  );
}

export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
