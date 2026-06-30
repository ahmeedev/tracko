import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "@/lib/aws-clients";
import { verifyAuth } from "@/lib/auth-server";

export async function POST(req: Request) {
  // Require at minimum a shareKey or auth token
  const user = await verifyAuth(req);
  const body = await req.json() as {
    projectId: string;
    folder: "entries" | "budgetEntries";
    filename: string;
    contentType: string;
    shareKey?: string;
  };

  if (!user && !body.shareKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Date.now();
  const safeName = body.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `projects/${body.projectId}/${body.folder}/${timestamp}_${safeName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: body.contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return Response.json({ presignedUrl, key });
}

export async function DELETE(req: Request) {
  const user = await verifyAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await req.json() as { key: string };
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  return Response.json({ ok: true });
}
