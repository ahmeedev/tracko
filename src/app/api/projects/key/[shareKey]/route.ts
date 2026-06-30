import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";

type Ctx = { params: Promise<{ shareKey: string }> };

// Public route — no auth required, share key is the credential.
export async function GET(_req: Request, { params }: Ctx) {
  const { shareKey } = await params;

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.projects,
      IndexName: "shareKey-index",
      KeyConditionExpression: "shareKey = :shareKey",
      ExpressionAttributeValues: { ":shareKey": shareKey },
      Limit: 1,
    })
  );

  if (!result.Items?.length) {
    return Response.json({ project: null });
  }
  return Response.json({ project: result.Items[0] });
}
