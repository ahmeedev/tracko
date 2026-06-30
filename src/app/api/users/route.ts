import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";
import { dynamo, cognitoAdmin, TABLES, USER_POOL_ID } from "@/lib/aws-clients";
import { verifyAuth, unauthorized } from "@/lib/auth-server";
import type { UserProfile } from "@/lib/types";

export async function GET(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return unauthorized();

  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.users,
      IndexName: "role-index",
      KeyConditionExpression: "#role = :role",
      ExpressionAttributeNames: { "#role": "role" },
      ExpressionAttributeValues: { ":role": "user" },
    })
  );

  const users = (result.Items ?? []) as UserProfile[];
  return Response.json({ users });
}

export async function POST(req: Request) {
  const admin = await verifyAuth(req);
  if (!admin) return unauthorized();

  const { email, password } = await req.json() as { email: string; password: string };

  // Create the Cognito user without sending an invite email
  const createRes = await cognitoAdmin.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      MessageAction: MessageActionType.SUPPRESS,
      TemporaryPassword: password,
      UserAttributes: [{ Name: "email", Value: email }, { Name: "email_verified", Value: "true" }],
    })
  );

  // Set a permanent password so the user doesn't have to change it on first login
  const sub = createRes.User?.Attributes?.find((a) => a.Name === "sub")?.Value;
  if (!sub) throw new Error("Cognito user creation returned no sub");

  await cognitoAdmin.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );

  // Store user profile in DynamoDB
  const profile: UserProfile = {
    uid: sub,
    email,
    role: "user",
    assignedProjectIds: [],
    createdAt: Date.now(),
  };
  await dynamo.send(new PutCommand({ TableName: TABLES.users, Item: { ...profile, id: sub } }));

  return Response.json({ uid: sub });
}
