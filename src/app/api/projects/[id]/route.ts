import { GetCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";
import { isAllowedCurrency } from "@/lib/format";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const result = await dynamo.send(
    new GetCommand({ TableName: TABLES.projects, Key: { id } })
  );

  if (!result.Item) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ project: result.Item });
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json() as { name: string; description: string; currency: string };
  if (!isAllowedCurrency(body.currency)) {
    return Response.json({ error: "Currency must be USD or PKR" }, { status: 400 });
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.projects,
      Key: { id },
      UpdateExpression: "SET #name = :name, description = :description, currency = :currency",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": body.name,
        ":description": body.description,
        ":currency": body.currency,
      },
    })
  );
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;

  for (const table of [TABLES.entries, TABLES.budgetEntries, TABLES.members]) {
    let lastKey: Record<string, unknown> | undefined;
    const pkField = table === TABLES.members ? "userId" : "id";
    do {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: table,
          KeyConditionExpression: "projectId = :pid",
          ExpressionAttributeValues: { ":pid": id },
          ExclusiveStartKey: lastKey,
        })
      );

      const items = result.Items ?? [];
      for (let i = 0; i < items.length; i += 25) {
        const chunk = items.slice(i, i + 25);
        await dynamo.send(
          new BatchWriteCommand({
            RequestItems: {
              [table]: chunk.map((item) => ({
                DeleteRequest: { Key: { projectId: item.projectId, [pkField]: item[pkField] } },
              })),
            },
          })
        );
      }
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (lastKey);
  }

  await dynamo.send(new DeleteCommand({ TableName: TABLES.projects, Key: { id } }));
  return Response.json({ ok: true });
}
