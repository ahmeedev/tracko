import { UpdateCommand, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";

type Ctx = { params: Promise<{ projectId: string; entryId: string }> };

async function validateAccess(req: Request, projectId: string, shareKey?: string): Promise<boolean> {
  const user = await verifyAuth(req);
  if (user) return true;
  if (!shareKey) return false;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
  );
  return result.Item?.shareKey === shareKey;
}

export async function PUT(req: Request, { params }: Ctx) {
  const { projectId, entryId } = await params;
  const body = await req.json() as {
    shareKey?: string;
    amount: number;
    note: string;
    date: string;
    previousAmount: number;
    attachmentUrl?: string;
    attachmentName?: string;
  };

  if (!(await validateAccess(req, projectId, body.shareKey))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delta = body.amount - body.previousAmount;
  const entryUpdate = {
    TableName: TABLES.budgetEntries,
    Key: { projectId, id: entryId },
    UpdateExpression: "SET amount = :amount, note = :note, #date = :date, attachmentUrl = :au, attachmentName = :an",
    ExpressionAttributeNames: { "#date": "date" },
    ExpressionAttributeValues: {
      ":amount": body.amount,
      ":note": body.note,
      ":date": body.date,
      ":au": body.attachmentUrl ?? null,
      ":an": body.attachmentName ?? null,
    },
  };

  if (delta !== 0) {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          { Update: entryUpdate },
          {
            Update: {
              TableName: TABLES.projects,
              Key: { id: projectId },
              UpdateExpression: "ADD budget :delta",
              ExpressionAttributeValues: { ":delta": delta },
            },
          },
        ],
      })
    );
  } else {
    await dynamo.send(new UpdateCommand(entryUpdate));
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { projectId, entryId } = await params;
  const url = new URL(req.url);
  const shareKey = url.searchParams.get("shareKey") ?? undefined;
  const amount = Number(url.searchParams.get("amount") ?? "0");

  if (!(await validateAccess(req, projectId, shareKey))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: { TableName: TABLES.budgetEntries, Key: { projectId, id: entryId } },
        },
        {
          Update: {
            TableName: TABLES.projects,
            Key: { id: projectId },
            UpdateExpression: "ADD budget :delta",
            ExpressionAttributeValues: { ":delta": -amount },
          },
        },
      ],
    })
  );
  return Response.json({ ok: true });
}
