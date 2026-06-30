import { UpdateCommand, TransactWriteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";

type Ctx = { params: Promise<{ projectId: string; entryId: string }> };

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

export async function PUT(req: Request, { params }: Ctx) {
  const { projectId, entryId } = await params;
  if (!(await validateAccess(req, projectId))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    amount: number;
    category: string;
    date: string;
    note: string;
    previousAmount: number;
    attachmentUrl?: string;
    attachmentName?: string;
  };

  const delta = body.amount - body.previousAmount;

  if (delta !== 0) {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: TABLES.entries,
              Key: { projectId, id: entryId },
              UpdateExpression:
                "SET amount = :amount, category = :category, #date = :date, note = :note, attachmentUrl = :au, attachmentName = :an",
              ExpressionAttributeNames: { "#date": "date" },
              ExpressionAttributeValues: {
                ":amount": body.amount,
                ":category": body.category,
                ":date": body.date,
                ":note": body.note,
                ":au": body.attachmentUrl ?? null,
                ":an": body.attachmentName ?? null,
              },
            },
          },
          {
            Update: {
              TableName: TABLES.projects,
              Key: { id: projectId },
              UpdateExpression: "ADD spent :delta",
              ExpressionAttributeValues: { ":delta": delta },
            },
          },
        ],
      })
    );
  } else {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.entries,
        Key: { projectId, id: entryId },
        UpdateExpression:
          "SET amount = :amount, category = :category, #date = :date, note = :note, attachmentUrl = :au, attachmentName = :an",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: {
          ":amount": body.amount,
          ":category": body.category,
          ":date": body.date,
          ":note": body.note,
          ":au": body.attachmentUrl ?? null,
          ":an": body.attachmentName ?? null,
        },
      })
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { projectId, entryId } = await params;
  if (!(await validateAccess(req, projectId))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const amount = Number(url.searchParams.get("amount") ?? "0");

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLES.entries,
            Key: { projectId, id: entryId },
          },
        },
        {
          Update: {
            TableName: TABLES.projects,
            Key: { id: projectId },
            UpdateExpression: "ADD spent :delta",
            ExpressionAttributeValues: { ":delta": -amount },
          },
        },
      ],
    })
  );

  return Response.json({ ok: true });
}
