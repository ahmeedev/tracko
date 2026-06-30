"use client";

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID!,
});

export function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool });
}

export async function cognitoSignIn(
  email: string,
  password: string
): Promise<{ sub: string; email: string; idToken: string }> {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    const user = getCognitoUser(email);
    user.authenticateUser(authDetails, {
      onSuccess(session) {
        const payload = session.getIdToken().decodePayload();
        resolve({
          sub: payload.sub as string,
          email: (payload.email ?? email) as string,
          idToken: session.getIdToken().getJwtToken(),
        });
      },
      onFailure: reject,
    });
  });
}

export async function cognitoSignOut(): Promise<void> {
  const user = userPool.getCurrentUser();
  user?.signOut();
}

export async function getCurrentSession(): Promise<CognitoUserSession | null> {
  const user = userPool.getCurrentUser();
  if (!user) return null;
  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      resolve(!err && session?.isValid() ? session : null);
    });
  });
}

export async function getIdToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.getIdToken().getJwtToken() ?? null;
}
