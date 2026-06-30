import { QueryCommand, PutCommand, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";
import type { BudgetEntry, UserIdentity } from "@/lib/types";

type Ctx = { params: Promise<{ projectId: string }> };

async function validateAccess(req: Request, projectId: string, shareKey?: string): Promise<boolean> {
  const user = await verifyAuth(req);
  if (user) return true;
  if (!shareKey) return false;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
  );
  return result.Item?.shareKey === shareKey;
}

export async function GET(req: Request, { params }: Ctx) {
  const { projectId } = await params;
  const url = new URL(req.url);
  const shareKey = url.searchParams.get("shareKey") ?? undefined;

  if (!(await validateAccess(req, projectId, shareKey))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.budgetEntries,
      KeyConditionExpression: "projectId = :pid",
      ExpressionAttributeValues: { ":pid": projectId },
    })
  );

  const entries = ((result.Items ?? []) as BudgetEntry[]).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return Response.json({ entries });
}

export async function POST(req: Request, { params }: Ctx) {
  const { projectId } = await params;
  const body = await req.json() as {
    shareKey?: string;
    identity: UserIdentity;
    source: "admin" | "user";
    amount: number;
    note: string;
    date: string;
    attachmentUrl?: string;
    attachmentName?: string;
  };

  if (!(await validateAccess(req, projectId, body.shareKey))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { identity, source, shareKey: _sk, ...fields } = body;
  const id = crypto.randomUUID();

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.members,
      Item: {
        projectId,
        userId: identity.id,
        name: identity.name,
        color: identity.color,
        source,
        joinedAt: Date.now(),
      },
    })
  );

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLES.budgetEntries,
            Item: {
              projectId,
              id,
              userId: identity.id,
              userName: identity.name,
              userColor: identity.color,
              ...fields,
              createdAt: Date.now(),
            },
          },
        },
        {
          Update: {
            TableName: TABLES.projects,
            Key: { id: projectId },
            UpdateExpression: "ADD budget :amount",
            ExpressionAttributeValues: { ":amount": fields.amount },
          },
        },
      ],
    })
  );

  return Response.json({ id });
}
