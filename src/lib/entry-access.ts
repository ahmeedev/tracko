import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { isAdminEmail, verifyAuth } from "@/lib/auth-server";

/** Resolves the caller's user id from JWT or share-key + client identity. */
export async function resolveCallerUserId(
  req: Request,
  projectId: string,
  shareKey?: string,
  clientUserId?: string
): Promise<string | null> {
  const user = await verifyAuth(req);
  if (user) return user.sub;
  if (!shareKey || !clientUserId) return null;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
  );
  if (result.Item?.shareKey !== shareKey) return null;
  return clientUserId;
}

export async function validateProjectAccess(
  req: Request,
  projectId: string,
  shareKey?: string
): Promise<boolean> {
  const user = await verifyAuth(req);
  if (user) return true;
  if (!shareKey) return false;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
  );
  return result.Item?.shareKey === shareKey;
}

/** True when the caller may update or delete an entry they did not create (admin only). */
export async function canModifyEntry(
  req: Request,
  entryUserId: string | undefined,
  callerId: string
): Promise<boolean> {
  if (entryUserId === callerId) return true;
  const user = await verifyAuth(req);
  return !!(user && isAdminEmail(user.email));
}
