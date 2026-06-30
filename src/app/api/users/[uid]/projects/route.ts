import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";

type Ctx = { params: Promise<{ uid: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const admin = await verifyAuth(req);
  if (!admin) return unauthorized();

  const { uid } = await params;
  const { projectId, action } = await req.json() as {
    projectId: string;
    action: "assign" | "unassign";
  };

  if (action === "assign") {
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.users,
        Key: { id: uid },
        UpdateExpression:
          "SET assignedProjectIds = list_append(if_not_exists(assignedProjectIds, :empty), :pid)",
        ConditionExpression: "not contains(assignedProjectIds, :pidStr)",
        ExpressionAttributeValues: {
          ":pid": [projectId],
          ":pidStr": projectId,
          ":empty": [],
        },
      })
    ).catch(() => {
      // Condition failed — already assigned, fine
    });
  } else {
    const current = await dynamo.send(
      new GetCommand({ TableName: TABLES.users, Key: { id: uid } })
    );
    const existing: string[] = (current.Item?.assignedProjectIds as string[]) ?? [];
    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.users,
        Key: { id: uid },
        UpdateExpression: "SET assignedProjectIds = :ids",
        ExpressionAttributeValues: { ":ids": existing.filter((id) => id !== projectId) },
      })
    );
  }

  return Response.json({ ok: true });
}
