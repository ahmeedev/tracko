import { jwtVerify, createRemoteJWKSet } from "jose";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION!;
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export interface AuthUser {
  sub: string;
  email: string;
}

export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
    return {
      sub: payload.sub as string,
      email: (payload.email ?? "") as string,
    };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export function isAdminEmail(email: string): boolean {
  return !!(ADMIN_EMAIL && email === ADMIN_EMAIL);
}

export async function verifyAdmin(req: Request): Promise<AuthUser | null> {
  const user = await verifyAuth(req);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
