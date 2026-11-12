const normalize = value => value.replace(/\s+/g, ' ').trim();

/** Extract source passages with their original chunk/time references.
 * This validates structure and provenance; ASR word accuracy needs separate QA.
 */
export function buildTranscriptHighlights(result, durationSeconds, maxHighlights = 5) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 120 || !Number.isInteger(maxHighlights) || maxHighlights < 1 || maxHighlights > 8) throw Error('transcript_limits_invalid');
  if (!result || typeof result.text !== 'string' || !result.text.trim() || result.text.length > 20000 || !Array.isArray(result.chunks) || !result.chunks.length || result.chunks.length > 1000) throw Error('transcript_structure_invalid');
  const chunks = [];
  let previousEnd = 0;
  for (const [index, chunk] of result.chunks.entries()) {
    if (!chunk || typeof chunk.text !== 'string' || !chunk.text.trim() || !Array.isArray(chunk.timestamp) || chunk.timestamp.length !== 2) throw Error('transcript_chunk_invalid');
    const [start,end] = chunk.timestamp;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start < previousEnd || end <= start || end > durationSeconds + 0.05) throw Error('transcript_timeline_incomplete');
    chunks.push({index,start,end,text:chunk.text}); previousEnd=end;
  }
  if (normalize(chunks.map(chunk=>chunk.text).join('')) !== normalize(result.text)) throw Error('transcript_text_not_covered');
  // A model chunk can split a sentence at a decoding window boundary. Carry
  // all contributing chunk IDs so an extracted passage remains traceable.
  const passages = [];
  let pending = [];
  for (const chunk of chunks) {
    pending.push(chunk);
    if (/[.!?。！？]["'’”)]?$/.test(chunk.text.trim())) {
      passages.push({text:normalize(pending.map(c=>c.text).join('')),start:pending[0].start,end:chunk.end,sourceChunkIndices:pending.map(c=>c.index)});
      pending=[];
    }
  }
  // Finalized timestamps do not require written punctuation. Preserve an
  // unpunctuated ending verbatim rather than inventing an ending or dropping it.
  if (pending.length) passages.push({text:normalize(pending.map(c=>c.text).join('')),start:pending[0].start,end:pending.at(-1).end,sourceChunkIndices:pending.map(c=>c.index)});
  const selected = new Map();
  for (const passage of passages) {
    const bin=Math.min(maxHighlights-1,Math.floor(passage.start / durationSeconds * maxHighlights));
    const current=selected.get(bin);
    const words=text=>(text.match(/[\p{L}\p{N}]+/gu)??[]).length;
    if (!current || words(passage.text)>words(current.text)) selected.set(bin,passage);
  }
  const seen=new Set();
  const highlights=[...selected.values()].sort((a,b)=>a.start-b.start).filter(p=>{
    const key=p.text.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
  });
  return {kind:'extractive-highlights',transcript:result.text.trim(),durationSeconds,highlights};
}
