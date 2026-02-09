import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Verify and decode JWT token from Authorization header
 * Throws an error if token is invalid or missing
 */
export async function verifyAuthToken(authHeader: string | null): Promise<TokenPayload> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error: any = new Error("Authentication token missing");
    error.status = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  const token = authHeader.substring(7);

  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      id: payload.id as number,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    const err: any = new Error("Invalid or expired token");
    err.status = 403;
    err.code = "FORBIDDEN";
    throw err;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
