import { QueryCommand, TransactWriteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";
import type { Entry, UserIdentity } from "@/lib/types";

type Ctx = { params: Promise<{ projectId: string }> };

async function validateAccess(req: Request, projectId: string): Promise<boolean> {
  const user = await verifyAuth(req);
  if (user) return true;
  const url = new URL(req.url);
  const shareKey = url.searchParams.get("shareKey");
  if (!shareKey) return false;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
  );
  return result.Item?.shareKey === shareKey;
}

export async function GET(req: Request, { params }: Ctx) {
  const { projectId } = await params;
  if (!(await validateAccess(req, projectId))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.entries,
      KeyConditionExpression: "projectId = :pid",
      ExpressionAttributeValues: { ":pid": projectId },
    })
  );

  const entries = ((result.Items ?? []) as Entry[]).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
  return Response.json({ entries });
}

export async function POST(req: Request, { params }: Ctx) {
  const { projectId } = await params;

  const body = await req.json() as {
    shareKey?: string;
    amount: number;
    category: string;
    date: string;
    note: string;
    source: "admin" | "user";
    identity?: UserIdentity;
    attachmentUrl?: string;
    attachmentName?: string;
  };

  const user = await verifyAuth(req);
  if (!user) {
    if (!body.shareKey) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const proj = await dynamo.send(
      new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
    );
    if (proj.Item?.shareKey !== body.shareKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const id = crypto.randomUUID();
  const { shareKey: _sk, identity, ...entryFields } = body;

  // Upsert the member record so the user appears in avatar lists
  if (identity) {
    await dynamo.send(
      new PutCommand({
        TableName: TABLES.members,
        Item: {
          projectId,
          userId: identity.id,
          name: identity.name,
          color: identity.color,
          source: body.source,
          joinedAt: Date.now(),
        },
      })
    );
  }

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLES.entries,
            Item: {
              projectId,
              id,
              ...entryFields,
              userId: identity?.id ?? null,
              userName: identity?.name ?? null,
              userColor: identity?.color ?? null,
              createdAt: Date.now(),
            },
          },
        },
        {
          Update: {
            TableName: TABLES.projects,
            Key: { id: projectId },
            UpdateExpression: "ADD spent :amount",
            ExpressionAttributeValues: { ":amount": body.amount },
          },
        },
      ],
    })
  );

  return Response.json({ id });
}
