import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "_refresh";

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      type: "refresh", // Distinguish from access tokens
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const err: any = new Error("Access token expired");
      err.code = "TOKEN_EXPIRED";
      err.status = 401;
      throw err;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const err: any = new Error("Invalid access token");
      err.code = "TOKEN_INVALID";
      err.status = 401;
      throw err;
    }
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload & { type?: string };
    
    // Ensure it's a refresh token
    if (decoded.type !== "refresh") {
      const err: any = new Error("Invalid token type");
      err.code = "TOKEN_INVALID";
      err.status = 401;
      throw err;
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const err: any = new Error("Refresh token expired");
      err.code = "TOKEN_EXPIRED";
      err.status = 401;
      throw err;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const err: any = new Error("Invalid refresh token");
      err.code = "TOKEN_INVALID";
      err.status = 401;
      throw err;
    }
    throw error;
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
