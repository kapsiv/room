import { get } from "@vercel/blob";

const PREFIX = process.env.COLLECTIV_ALBUM_ART_PREFIX || "collectiv/";
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const pathname = Array.isArray(request.query?.pathname)
    ? request.query.pathname[0]
    : request.query?.pathname;

  if (!pathname || !pathname.startsWith(PREFIX)) {
    response.status(400).json({ error: "Invalid pathname" });
    return;
  }

  try {
    const result = await get(pathname, {
      access: "private",
      token: BLOB_TOKEN,
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      response.status(404).json({ error: "Blob not found" });
      return;
    }

    const bytes = await new Response(result.stream).arrayBuffer();
    response.setHeader("Content-Type", result.blob.contentType || "image/jpeg");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400");
    if (result.blob.etag) response.setHeader("ETag", result.blob.etag);
    response.status(200).send(Buffer.from(bytes));
  } catch (err) {
    response.status(500).json({
      error: "Failed to fetch cover",
      detail: err?.message || "unknown",
    });
  }
}
