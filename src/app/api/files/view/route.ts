import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "@/lib/aws-clients";

// Public route — generates a short-lived presigned GET URL and redirects.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return Response.redirect(presignedUrl, 302);
}
