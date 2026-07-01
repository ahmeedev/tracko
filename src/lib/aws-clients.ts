import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.AWS_REGION!;

const dynamoRaw = new DynamoDBClient({ region });
export const dynamo = DynamoDBDocumentClient.from(dynamoRaw, {
  marshallOptions: { removeUndefinedValues: true },
});

export const s3 = new S3Client({ region });

export const cognitoAdmin = new CognitoIdentityProviderClient({ region });

export const TABLES = {
  projects: process.env.DYNAMODB_TABLE_PROJECTS!,
  entries: process.env.DYNAMODB_TABLE_ENTRIES!,
  budgetEntries: process.env.DYNAMODB_TABLE_BUDGET_ENTRIES!,
  members: process.env.DYNAMODB_TABLE_MEMBERS!,
  users: process.env.DYNAMODB_TABLE_USERS!,
} as const;

export const S3_BUCKET = process.env.S3_BUCKET_NAME!;
export const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
