import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, TABLES } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";
import { generateShareKey } from "@/lib/keys";
import type { Project } from "@/lib/types";

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const ownerId = url.searchParams.get("ownerId") ?? user.sub;

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.projects,
      IndexName: "ownerId-index",
      KeyConditionExpression: "ownerId = :ownerId",
      ExpressionAttributeValues: { ":ownerId": ownerId },
    })
  );

  const projects = ((result.Items ?? []) as Project[]).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  return Response.json({ projects });
}

export async function POST(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const body = await req.json() as { name: string; description: string; currency: string };
  const id = crypto.randomUUID();

  const project: Project = {
    id,
    name: body.name,
    description: body.description,
    budget: 0,
    currency: body.currency,
    ownerId: user.sub,
    shareKey: generateShareKey(),
    spent: 0,
    createdAt: Date.now(),
  };

  await dynamo.send(new PutCommand({ TableName: TABLES.projects, Item: project }));
  return Response.json({ id });
}
