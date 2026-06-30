import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";
import type { ProjectMember } from "@/lib/types";

type Ctx = { params: Promise<{ projectId: string }> };

// Public route: requires either auth or valid shareKey
export async function GET(req: Request, { params }: Ctx) {
  const { projectId } = await params;
  const url = new URL(req.url);
  const shareKey = url.searchParams.get("shareKey");

  const user = await verifyAuth(req);
  if (!user) {
    if (!shareKey) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const proj = await dynamo.send(
      new GetCommand({ TableName: TABLES.projects, Key: { id: projectId } })
    );
    if (proj.Item?.shareKey !== shareKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.members,
      KeyConditionExpression: "projectId = :pid",
      ExpressionAttributeValues: { ":pid": projectId },
    })
  );

  const members = ((result.Items ?? []) as ProjectMember[]).sort(
    (a, b) => a.joinedAt - b.joinedAt
  );
  return Response.json({ members });
}
