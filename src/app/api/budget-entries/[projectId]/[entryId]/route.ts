import { UpdateCommand, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { canModifyEntry, resolveCallerUserId } from "@/lib/entry-access";
import type { BudgetEntry } from "@/lib/types";

type Ctx = { params: Promise<{ projectId: string; entryId: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { projectId, entryId } = await params;
  const body = await req.json() as {
    shareKey?: string;
    userId?: string;
    amount: number;
    note: string;
    date: string;
    previousAmount: number;
    attachmentUrl?: string;
    attachmentName?: string;
  };

  const callerId = await resolveCallerUserId(req, projectId, body.shareKey, body.userId);
  if (!callerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await dynamo.send(
    new GetCommand({ TableName: TABLES.budgetEntries, Key: { projectId, id: entryId } })
  );
  const entry = existing.Item as BudgetEntry | undefined;
  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canModifyEntry(req, entry.userId, callerId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
  const userId = url.searchParams.get("userId") ?? undefined;
  const amount = Number(url.searchParams.get("amount") ?? "0");

  const callerId = await resolveCallerUserId(req, projectId, shareKey, userId);
  if (!callerId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await dynamo.send(
    new GetCommand({ TableName: TABLES.budgetEntries, Key: { projectId, id: entryId } })
  );
  const entry = existing.Item as BudgetEntry | undefined;
  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await canModifyEntry(req, entry.userId, callerId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
