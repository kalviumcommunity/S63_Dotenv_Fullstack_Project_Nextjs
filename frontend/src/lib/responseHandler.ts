import { NextResponse } from "next/server";

export const sendSuccess = <T>(
  data: T,
  message = "Success",
  status = 200
) => {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};

export const sendError = <D = unknown>(
  message = "Something went wrong",
  code = "INTERNAL_ERROR",
  status = 500,
  details?: D
) => {
  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
};