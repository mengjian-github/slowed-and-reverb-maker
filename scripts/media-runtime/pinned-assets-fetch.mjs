const hash = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
const validPath = path => typeof path === 'string' && /^\/__shipsite\/media\/[a-zA-Z0-9_./-]+$/.test(path) && !path.split('/').some(part => part === '.' || part === '..');
const validSize = size => Number.isSafeInteger(size) && size > 0 && size <= 25 * 1024 * 1024;
async function boundedBytes(stream, expected, signal) {
  const bytes = new Uint8Array(expected), reader = stream.getReader(); let offset = 0;
  try {
    while (true) {
      signal?.throwIfAborted();
      const chunk = await reader.read(); if (chunk.done) break;
      if (offset + chunk.value.length > expected) throw Error('Media asset oversized');
      bytes.set(chunk.value, offset); offset += chunk.value.length;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (offset !== expected) throw Error('Media asset size mismatch');
  return bytes;
}

/** Compressed files stay ordinary static assets; decompression never needs a proxy or relaxed CSP. */
export function createPinnedAssetsFetch(entries, { origin, fetchImpl = fetch } = {}) {
  if (!origin || new URL(origin).origin !== origin || !Array.isArray(entries)) throw Error('Invalid media asset manifest');
  const resources = new Map();
  for (const entry of entries) {
    if (!entry || !validPath(entry.path) || !validPath(entry.compressed?.path) || entry.compressed.path !== entry.path + '.gz' || !validSize(entry.bytes) || !validSize(entry.compressed.bytes) || !/^[a-f0-9]{64}$/.test(entry.sha256) || !/^[a-f0-9]{64}$/.test(entry.compressed.sha256) || resources.has(entry.path)) throw Error('Invalid media asset descriptor');
    resources.set(entry.path, { ...entry, compressed: { ...entry.compressed } });
  }
  return async (input, init = {}) => {
    const url = new URL(input, origin);
    if (url.origin !== origin || url.search || url.hash || init.method && init.method.toUpperCase() !== 'GET') throw Error('Media asset URL is not admitted');
    init.signal?.throwIfAborted();
    const entry = resources.get(url.pathname);
    if (!entry) return fetchImpl(url, { ...init, redirect: 'error', credentials: 'omit' });
    const response = await fetchImpl(new URL(entry.compressed.path, origin), { ...init, method: 'GET', redirect: 'error', credentials: 'omit' });
    if (!response.ok || response.status !== 200 || !response.body || response.redirected) throw Error('Media asset unavailable');
    const compressed = await boundedBytes(response.body, entry.compressed.bytes, init.signal);
    if (await hash(compressed) !== entry.compressed.sha256) throw Error('Compressed media asset integrity mismatch');
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const bytes = await boundedBytes(stream, entry.bytes, init.signal);
    if (await hash(bytes) !== entry.sha256) throw Error('Media asset integrity mismatch');
    init.signal?.throwIfAborted();
    return new Response(bytes, { headers: { 'Content-Type': entry.path.endsWith('.json') ? 'application/json' : 'application/octet-stream', 'Content-Length': String(bytes.length) } });
  };
}
