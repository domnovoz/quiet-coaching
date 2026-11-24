// Limit request bodies before OAuth or MCP JSON parsing, including chunked bodies.
export const MAX_BODY_BYTES = 64 * 1024;

export async function limitRequestBody(request, max = MAX_BODY_BYTES) {
  if (!request.body) return request;
  const declared = request.headers.get('content-length');
  if (declared !== null && Number(declared) > max) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Request(request, { body: new Blob(chunks) });
}
