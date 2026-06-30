import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";
import { generateShareKey } from "@/lib/keys";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const { id } = await params;
  const shareKey = generateShareKey();

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.projects,
      Key: { id },
      UpdateExpression: "SET shareKey = :shareKey",
      ExpressionAttributeValues: { ":shareKey": shareKey },
    })
  );
  return Response.json({ shareKey });
}
