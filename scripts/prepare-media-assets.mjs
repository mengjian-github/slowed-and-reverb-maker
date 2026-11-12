import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, lstat, realpath, rename, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';
import manifest from './media-runtime/manifest.json' with { type: 'json' };

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const here = dirname(fileURLToPath(import.meta.url));
function importsRuntime(source, path, root) {
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  let selected = false;
  const matches = specifier => {
    const target = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : specifier.startsWith('.') ? resolve(dirname(path), specifier) : '';
    return target.replace(/\.[cm]?[jt]s$/, '') === join(root, 'lib', 'media-transcription');
  };
  function visit(node) {
    if ((ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly || ts.isExportDeclaration(node) && !node.isTypeOnly) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && matches(node.moduleSpecifier.text)) selected = true;
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && matches(node.arguments[0].text)) selected = true;
    ts.forEachChild(node, visit);
  }
  visit(tree); return selected;
}

async function used(directory, root) {
  const info = await lstat(directory).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (!info || info.isSymbolicLink() || !info.isDirectory()) return false;
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
    if (entry.isSymbolicLink() || ['node_modules', '.git', '.next', '.cache', 'dist', 'out'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory() && await used(path, root)) return true;
    if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name) && path !== join(root, 'lib', 'media-transcription.ts') && importsRuntime(await readFile(path, 'utf8'), path, root)) return true;
  }
  return false;
}

async function ownedDirectory(root, path) {
  const suffix = relative(root, path);
  if (suffix.startsWith('..') || resolve(root, suffix) !== path) throw Error('Media path outside project');
  let current = root;
  for (const part of suffix.split(sep).filter(Boolean)) {
    current = join(current, part);
    await mkdir(current).catch(error => { if (error.code !== 'EEXIST') throw error; });
    const info = await lstat(current);
    if (info.isSymbolicLink() || !info.isDirectory()) throw Error('Media directory must not be a symlink');
  }
}

async function writeOwned(root, path, bytes) {
  await ownedDirectory(root, dirname(path));
  const info = await lstat(path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (info && (!info.isFile() || info.isSymbolicLink())) throw Error('Media output must be a regular file');
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, bytes, { flag: 'wx' });
  try { await rename(temporary, path); } finally { await unlink(temporary).catch(() => {}); }
}

export async function verifiedResource(entry, cache, fetcher = fetch) {
  const cached = join(cache, entry.sha256);
  const info = await lstat(cached).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (info && (!info.isFile() || info.isSymbolicLink())) throw Error('Media cache must be a regular file');
  if (info && info.size === entry.bytes) {
    const bytes = await readFile(cached);
    if (hash(bytes) === entry.sha256) return bytes;
  }
  const response = await fetcher(entry.url, { signal: AbortSignal.timeout(60000), credentials: 'omit' });
  if (!response.ok || !response.body) throw Error(`Media resource unavailable: ${entry.path}`);
  const length = response.headers.get('content-length');
  // fetch decompresses the body, while Content-Length can describe gzip/br bytes.
  const encoded = response.headers.get('content-encoding');
  if ((!encoded || encoded === 'identity') && length && Number(length) !== entry.bytes) { await response.body.cancel(); throw Error(`Media resource size mismatch: ${entry.path}`); }
  const bytes = Buffer.alloc(entry.bytes); let offset = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      if (offset + chunk.value.length > bytes.length) throw Error(`Media resource too large: ${entry.path}`);
      bytes.set(chunk.value, offset); offset += chunk.value.length;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  if (offset !== entry.bytes || hash(bytes) !== entry.sha256) throw Error(`Media resource integrity mismatch: ${entry.path}`);
  await writeOwned(cache, cached, bytes);
  return bytes;
}

export async function prepareMediaAssets(project = process.cwd(), fetcher = fetch) {
  const root = await realpath(project);
  const selected = (await Promise.all(['app', 'components', 'lib'].map(name => used(join(root, name), root)))).some(Boolean);
  if (!selected) return { prepared: false, reason: 'No media-transcription imports' };
  const output = join(root, 'public', '__shipsite', 'media');
  const cache = join(root, '.cache', 'shipsite-media');
  await ownedDirectory(root, output); await ownedDirectory(root, cache);
  const ready = join(output, 'ready.json');
  const readyInfo = await lstat(ready).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (readyInfo?.isSymbolicLink()) throw Error('Media readiness file must not be a symlink');
  if (readyInfo) {
    const previous = JSON.parse(await readFile(ready, 'utf8'));
    // Remove only receipt-listed files inside the reserved runtime directory.
    // This also prevents old uncompressed models from inflating later bundles.
    const previousFiles = previous.resources ?? [];
    if (!Array.isArray(previousFiles)) throw Error('Invalid media readiness receipt');
    for (const entry of previousFiles) {
      if (typeof entry?.path !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(entry.path) || entry.path.split('/').some(part => !part || part === '.' || part === '..') || entry.path === 'ready.json') throw Error('Invalid previous media asset path');
      const target = resolve(output, entry.path);
      if (!target.startsWith(output + sep)) throw Error('Previous media asset outside runtime');
      await ownedDirectory(root, dirname(target));
      const info = await lstat(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
      if (info && (!info.isFile() || info.isSymbolicLink())) throw Error('Previous media asset must be a regular file');
    }
    await unlink(ready);
    for (const entry of previousFiles) await unlink(resolve(output, entry.path)).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
  const written = [], compressedAssets = [];
  async function writeAsset(path, bytes, compress = false) {
    if (bytes.length > 25 * 1024 * 1024) throw Error('Media static asset exceeds deployment limit');
    if (compress) {
      const compressed = gzipSync(bytes);
      compressedAssets.push({ path: manifest.basePath + path, bytes: bytes.length, sha256: hash(bytes), compressed: { path: manifest.basePath + path + '.gz', bytes: compressed.length, sha256: hash(compressed) } });
      path += '.gz'; bytes = compressed;
    }
    await writeOwned(root, join(output, path), bytes);
    written.push({ path, bytes: bytes.length, sha256: hash(bytes) });
  }
  for (const entry of manifest.resources) {
    let bytes = await verifiedResource(entry, cache, fetcher);
    if (entry.transform === 'browser-imports') {
      let source = bytes.toString('utf8');
      for (const [from, to] of [['onnxruntime-web/webgpu', './ort.webgpu.mjs'], ['onnxruntime-common', './common/index.js']]) {
        const token = JSON.stringify(from);
        if (source.split(token).length !== 2) throw Error(`Unexpected pinned browser import: ${from}`);
        source = source.replace(token, JSON.stringify(to));
      }
      bytes = Buffer.from(source);
    }
    if (entry.transform === 'model-parts') {
      const parts = [];
      for (let offset = 0, index = 0; offset < bytes.length; offset += manifest.partBytes, index++) {
        const part = bytes.subarray(offset, offset + manifest.partBytes), path = `models/parts/${entry.sha256}-${index}.bin`;
        await writeAsset(path, part, true);
        parts.push({ path: manifest.basePath + path, bytes: part.length, sha256: hash(part) });
      }
      const descriptor = { path: manifest.basePath + entry.path, bytes: entry.bytes, sha256: entry.sha256, parts };
      const descriptorBytes = Buffer.from(`export default ${JSON.stringify(descriptor)};\n`);
      await writeOwned(root, join(output, 'model-parts.mjs'), descriptorBytes);
      written.push({ path: 'model-parts.mjs', bytes: descriptorBytes.length, sha256: hash(descriptorBytes) });
    } else {
      await writeAsset(entry.path, bytes, /\.(json|wasm|onnx)$/.test(entry.path));
    }
  }
  await writeAsset('compressed-assets.mjs', Buffer.from(`export default ${JSON.stringify(compressedAssets)};\n`));
  for (const name of ['worker.mjs', 'pinned-assets-fetch.mjs', 'pinned-model-fetch.mjs', 'transcript-highlights.mjs', 'NOTICE.txt']) {
    const bytes = await readFile(join(here, 'media-runtime', name));
    await writeOwned(root, join(output, name), bytes);
    written.push({ path: name, bytes: bytes.length, sha256: hash(bytes) });
  }
  const result = { prepared: true, runtimeId: manifest.runtimeId, resources: written };
  await writeOwned(root, ready, JSON.stringify(result));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareMediaAssets();
  console.log(result.prepared ? `Media runtime prepared: ${result.resources.length} pinned assets` : 'Media runtime skipped: no media-transcription imports');
}
