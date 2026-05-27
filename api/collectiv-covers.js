import { list } from "@vercel/blob";

const PREFIX = process.env.COLLECTIV_ALBUM_ART_PREFIX || "collectiv/";
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const LIMIT = 1000;

function isImagePath(pathname) {
  const lower = pathname.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let cursor;
    const urls = [];

    do {
      const page = await list({
        prefix: PREFIX,
        limit: LIMIT,
        cursor,
        token: BLOB_TOKEN,
      });

      for (const blob of page.blobs || []) {
        if (isImagePath(blob.pathname)) {
          urls.push(blob.url);
        }
      }

      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    response.status(200).json({ prefix: PREFIX, count: urls.length, urls });
  } catch (err) {
    response.status(500).json({
      error: "Failed to list collectiv covers",
      detail: err?.message || "unknown",
    });
  }
}
