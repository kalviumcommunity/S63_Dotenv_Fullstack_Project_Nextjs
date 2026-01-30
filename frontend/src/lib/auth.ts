import jwt from "jsonwebtoken";
import { ERROR_CODES } from "@/lib/errorCodes";

const JWT_SECRET = process.env.JWT_SECRET!;

export function verifyAuthToken(authHeader: string | null) {
  if (!authHeader) {
    throw {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: "Token missing",
      status: 401,
    };
  }

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Invalid or expired token",
      status: 403,
    };
  }
}