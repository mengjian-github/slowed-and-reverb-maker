const MAX_TOTAL = 64 * 1024 * 1024;
const MAX_PART = 16 * 1024 * 1024;
const validPath = path => typeof path === 'string' && /^\/__shipsite\/media\/models\/[a-zA-Z0-9_./-]+$/.test(path) && !path.split('/').some(p=>p==='.'||p==='..');
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),n=>n.toString(16).padStart(2,'0')).join('');

// Receives the manifest emitted by the trusted media resource build step.
export function createPinnedModelFetch(manifest, {origin, fetchImpl=fetch}={}) {
 if (!origin || new URL(origin).origin !== origin) throw Error('Expected exact origin');
 if (!manifest || !validPath(manifest.path) || !/^[a-f0-9]{64}$/.test(manifest.sha256) || !Number.isSafeInteger(manifest.bytes) || manifest.bytes < 1 || manifest.bytes > MAX_TOTAL || !Array.isArray(manifest.parts) || manifest.parts.length < 1 || manifest.parts.length > 4) throw Error('Invalid model manifest');
 const parts=manifest.parts.map(part=>{
  if (!part || !validPath(part.path) || part.path===manifest.path || !/^[a-f0-9]{64}$/.test(part.sha256) || !Number.isSafeInteger(part.bytes) || part.bytes < 1 || part.bytes > MAX_PART) throw Error('Invalid model part');
  return {...part};
 });
 if (new Set(parts.map(p=>p.path)).size !== parts.length || parts.reduce((n,p)=>n+p.bytes,0) !== manifest.bytes) throw Error('Invalid part total');
 const pinned={path:manifest.path,bytes:manifest.bytes,sha256:manifest.sha256,parts};
 return async (input, init={}) => {
  const url=new URL(input,origin);
  if (url.origin !== origin || url.search || url.hash) throw Error('Model URL is not admitted');
  if (init.method && init.method.toUpperCase() !== 'GET') throw Error('Model method is not admitted');
  if (url.pathname !== pinned.path) return fetchImpl(url, {...init,redirect:'error',credentials:'omit'});
  init.signal?.throwIfAborted();
  const combined=new Uint8Array(pinned.bytes);
  let offset=0;
  for (const part of pinned.parts) {
   init.signal?.throwIfAborted();
   const response=await fetchImpl(new URL(part.path,origin),{...init,method:'GET',redirect:'error',credentials:'omit'});
   if (!response.ok || response.status !== 200 || !response.body || response.redirected) throw Error('Model part unavailable');
   const length=response.headers.get('content-length');
   const encoded=response.headers.get('content-encoding');
   if ((!encoded || encoded==='identity') && length !== null && (!/^\d+$/.test(length) || Number(length)!==part.bytes)) { await response.body.cancel(); throw Error('Model part size mismatch'); }
   const reader=response.body.getReader(); let read=0;
   try {
    while (true) {
     init.signal?.throwIfAborted();
     const chunk=await reader.read(); if (chunk.done) break;
     if (read+chunk.value.length>part.bytes) throw Error('Model part oversized');
     combined.set(chunk.value,offset+read);read+=chunk.value.length;
    }
   } catch (error) { await reader.cancel().catch(()=>{}); throw error; }
   finally { reader.releaseLock(); }
   if (read!==part.bytes || await digest(combined.subarray(offset,offset+read))!==part.sha256) throw Error('Model part integrity mismatch');
   offset+=read;
  }
  init.signal?.throwIfAborted();
  if (await digest(combined)!==pinned.sha256) throw Error('Model integrity mismatch');
  init.signal?.throwIfAborted();
  return new Response(combined,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(combined.length)}});
 };
}
