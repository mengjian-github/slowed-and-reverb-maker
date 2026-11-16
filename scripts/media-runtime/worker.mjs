import { env, pipeline } from './transformers.mjs';
import * as ort from './ort.webgpu.mjs';
import {createPinnedModelFetch} from './pinned-model-fetch.mjs';
import modelParts from './model-parts.mjs';
import {buildTranscriptHighlights} from './transcript-highlights.mjs';
import {createPinnedAssetsFetch} from './pinned-assets-fetch.mjs';
import compressedAssets from './compressed-assets.mjs';
env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath='/__shipsite/media/models/';
env.useBrowserCache=false;env.useWasmCache=false;
const assetFetch=createPinnedAssetsFetch(compressedAssets,{origin:self.location.origin,fetchImpl:fetch});
env.fetch=createPinnedModelFetch(modelParts,{origin:self.location.origin,fetchImpl:assetFetch});
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths={mjs:'/__shipsite/media/ort-wasm-simd-threaded.asyncify.mjs',wasm:'/__shipsite/media/ort-wasm-simd-threaded.asyncify.wasm'};
let transcriber, vad;
// Tensor interface from the pinned Silero MIT-licensed wrapper; LICENSE is
// retained in the prepared assets. No filename/expected text enters detection.
async function speechEvidence(audio) {
 let state=new ort.Tensor('float32',new Float32Array(256),[2,1,128]);let context=new Float32Array(64);
 let voiced=0,longest=0,consecutive=0,peakProbability=0;
 try {
  for(let offset=0;offset<audio.length;offset+=512) {
   const samples=new Float32Array(576);samples.set(context);samples.set(audio.subarray(offset,offset+512),64);
   const input=new ort.Tensor('float32',samples,[1,576]);const sr=new ort.Tensor('int64',new BigInt64Array([16000n]),[]);
   const result=await vad.run({input,sr,state});state.dispose();input.dispose();sr.dispose();state=result.stateN;
   const probability=Number(result.output.data[0]);result.output.dispose();peakProbability=Math.max(peakProbability,probability);
   if(probability>=0.5){voiced++;consecutive++;longest=Math.max(longest,consecutive);}else consecutive=0;
   context=samples.slice(-64);
  }
 }finally{state.dispose();}
 return {detected:longest>=3&&voiced>=6,voicedMs:voiced*32,peakProbability};
}
self.onmessage=async ({data})=>{
 const start=performance.now();
 let partialTranscript;
 try {
  if(data.type==='load') {
   env.backends.onnx.wasm.wasmBinary=new Uint8Array(await (await assetFetch('/__shipsite/media/ort-wasm-simd-threaded.asyncify.wasm')).arrayBuffer());
   transcriber=await pipeline('automatic-speech-recognition','whisper-tiny',{device:'wasm',dtype:'q8',local_files_only:true,session_options:{graphOptimizationLevel:'disabled'}});
   const vadBytes=new Uint8Array(await (await assetFetch('/__shipsite/media/models/vad/silero_vad.onnx')).arrayBuffer());
   vad=await ort.InferenceSession.create(vadBytes,{executionProviders:['wasm'],graphOptimizationLevel:'disabled'});
   self.postMessage({id:data.id,ok:true,type:'loaded',durationMs:performance.now()-start});return;
  }
  if(!transcriber)throw Error('Model is not loaded');
  if(!(data.audio instanceof Float32Array)||!data.audio.length||data.audio.length>16000*120||data.audio.some(x=>!Number.isFinite(x)))throw Error('Invalid or oversized decoded audio');
  const speech=await speechEvidence(data.audio);
  if(!speech.detected){self.postMessage({id:data.id,ok:false,error:'No speech detected',speech,durationMs:performance.now()-start});return;}
  self.postMessage({id:data.id,type:'progress',phase:'transcribing'});
  const result=await transcriber(data.audio,{language:'english',task:'transcribe',return_timestamps:true,chunk_length_s:30,stride_length_s:5,max_new_tokens:256});
  partialTranscript=result.text;
  const highlights=buildTranscriptHighlights(result,data.audio.length/16000);
  self.postMessage({id:data.id,ok:true,result,highlights,speech,durationMs:performance.now()-start});
 }catch(error){self.postMessage({id:data.id,ok:false,error:String(error?.message??error),partialTranscript,durationMs:performance.now()-start});}
};
