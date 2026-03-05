import { get } from "@vercel/blob";

const CSV_PATH = process.env.SCROBBLES_BLOB_PATH || "reflectiv/scrobbles.csv";
const BLOB_ACCESS = process.env.SCROBBLES_BLOB_ACCESS || "private";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).send("Method not allowed");
    return;
  }

  try {
    const blob = await get(CSV_PATH, { access: BLOB_ACCESS });
    if (blob) {
      response.setHeader("Content-Type", "text/csv; charset=utf-8");
      response.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
      const text = await new Response(blob.stream).text();
      response.status(200).send(text);
      return;
    }
  } catch (err) {
    if (err?.code !== "BLOB_NOT_FOUND") {
      response.status(500).send("Blob fetch failed");
      return;
    }
  }

  response.status(404).send("Scrobbles not found");
}
