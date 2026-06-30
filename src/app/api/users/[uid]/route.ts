import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { dynamo, cognitoAdmin, TABLES, USER_POOL_ID } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";
import type { UserProfile } from "@/lib/types";

type Ctx = { params: Promise<{ uid: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { uid } = await params;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.users, Key: { id: uid } })
  );

  if (!result.Item) return Response.json({ user: null });
  const { id, ...rest } = result.Item;
  return Response.json({ user: { uid: id, ...rest } as UserProfile });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const admin = await verifyAuth(req);
  if (!admin) return unauthorized();

  const { uid } = await params;

  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.users, Key: { id: uid } })
  );
  const email = result.Item?.email as string | undefined;

  if (email) {
    await cognitoAdmin
      .send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email }))
      .catch(() => {});
  }

  await dynamo.send(new DeleteCommand({ TableName: TABLES.users, Key: { id: uid } }));
  return Response.json({ ok: true });
}
