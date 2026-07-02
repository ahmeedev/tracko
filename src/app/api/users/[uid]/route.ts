import { GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { dynamo, cognitoAdmin, TABLES, USER_POOL_ID } from "@/lib/aws-clients";
import { isAdminEmail, verifyAuth, unauthorized } from "@/lib/auth-server";
import { colorFromId, isValidHexColor, normalizeHexColor } from "@/lib/identity";
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

export async function PATCH(req: Request, { params }: Ctx) {
  const caller = await verifyAuth(req);
  if (!caller) return unauthorized();

  const { uid } = await params;
  const isSelf = caller.sub === uid;
  const isAdmin = isAdminEmail(caller.email);
  if (!isSelf && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { name?: string; color?: string };
  const trimmedName = body.name?.trim();
  const hasName = trimmedName !== undefined;
  const hasColor = body.color !== undefined;

  if (!hasName && !hasColor) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (hasName && !trimmedName) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }
  if (hasColor && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (hasColor && !isValidHexColor(body.color!)) {
    return Response.json({ error: "Invalid colour" }, { status: 400 });
  }

  const existing = await dynamo.send(
    new GetCommand({ TableName: TABLES.users, Key: { id: uid } })
  );
  if (!existing.Item) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, string> = {};
  if (hasName) updates.name = trimmedName!;
  if (hasColor) updates.color = normalizeHexColor(body.color!);

  const names = Object.keys(updates).map((k) => `#${k}`);
  const values = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [`:${k}`, v])
  );

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { id: uid },
      UpdateExpression: `SET ${names.map((n) => `${n} = :${n.slice(1)}`).join(", ")}`,
      ExpressionAttributeNames: Object.fromEntries(names.map((n) => [n, n.slice(1)])),
      ExpressionAttributeValues: values,
    })
  );

  const item = existing.Item as UserProfile;
  return Response.json({
    user: {
      ...item,
      uid,
      name: updates.name ?? item.name,
      color: updates.color ?? item.color ?? colorFromId(uid),
    },
  });
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
