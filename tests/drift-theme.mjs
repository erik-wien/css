// Cross-Repo-Drift-Guard: vergleicht css_library/js/api-call.js mit dem TUEV-Pendant
// (~/TUEV/theme/js/api-call.js). Beide MÜSSEN verhaltensidentisch bleiben (§21).
// Läuft nur auf Dev-Rechnern mit beiden Checkouts: node tests/drift-theme.mjs
// Herkunft: strenger Review des Robustheit-Audits 2026-07-16 (drift2.mjs).
const C = await import('../js/api-call.js');
const T = await import(process.env.HOME + '/TUEV/theme/js/api-call.js');
function mkRes(ok, status, body){ return { ok, status, text: async()=>body }; }
async function run(mod, fetchImpl, opts){
  const orig = globalThis.fetch; globalThis.fetch = fetchImpl;
  try { const r = await mod.apiCall('/x', opts); return {ret:r}; }
  catch(e){ return {err:{message:e.message, kind:e.kind, detail:e.detail, status:e.status, isApiError:e.name==='ApiError'}}; }
  finally { globalThis.fetch = orig; }
}
const long = 'X'.repeat(500);
const cases = [
  ['{detail:"D"} only + 400', ()=>mkRes(false,400,JSON.stringify({detail:'D'}))],
  ['array body [1,2] + 400', ()=>mkRes(false,400,'[1,2]')],
  ['literal null + 400', ()=>mkRes(false,400,'null')],
  ['whitespace-only body + 200', ()=>mkRes(true,200,'   ')],
  ['whitespace-only body + 400', ()=>mkRes(false,400,'   ')],
  ['long 500-char HTML + 500 (cap 300)', ()=>mkRes(false,500,long)],
  ['long 500-char nonJSON + 200 ok', ()=>mkRes(true,200,long)],
  ['{error:42} numeric error + 400', ()=>mkRes(false,400,'{"error":42}')],
  ['res.text() throws + ok', ()=>({ok:true,status:200,text:async()=>{throw new TypeError('stream err');}})],
  ['res.text() throws + 500', ()=>({ok:false,status:500,text:async()=>{throw new TypeError('stream err');}})],
  ['empty body + 400', ()=>mkRes(false,400,'')],
];
let allMatch = true;
for (const [label, f] of cases){
  const c = await run(C, async()=>f()); const t = await run(T, async()=>f());
  const m = JSON.stringify(c)===JSON.stringify(t);
  if (!m) allMatch = false;
  console.log((m?'MATCH ':'DRIFT!'), label);
  if (!m){ console.log('  C:',JSON.stringify(c)); console.log('  T:',JSON.stringify(t)); }
  else console.log('  ->', JSON.stringify(c).slice(0,160));
}
// detail cap length check
const c500 = await run(C, async()=>mkRes(false,500,long));
console.log('detail length (cap 300+ellipsis=301):', c500.err.detail.length);
// ApiError('m') bare
try { const e=new C.ApiError('m'); console.log('CSSLIB bare ApiError ok, kind=',e.kind,'status=',e.status,'detail=',e.detail);}catch(e){console.log('CSSLIB bare THROWS');}
try { const e=new T.ApiError('m'); console.log('THEME  bare ApiError ok, kind=',e.kind,'status=',e.status,'detail=',e.detail);}catch(e){console.log('THEME  bare THROWS');}
// pre-aborted external signal
function hang(){ return (_u,o)=>new Promise((_r,rej)=>{ const f=()=>{const e=new Error('a');e.name='AbortError';rej(e);}; if(o.signal.aborted)return f(); o.signal.addEventListener('abort',f); }); }
const ac = new AbortController(); ac.abort();
const cA = await run(C, hang(), {signal:ac.signal, timeoutMs:5000});
const tA = await run(T, hang(), {signal:ac.signal, timeoutMs:5000});
console.log('pre-aborted signal  C:', JSON.stringify(cA.err), ' T:', JSON.stringify(tA.err), ' MATCH:', JSON.stringify(cA)===JSON.stringify(tA));
// apiForm lowercase content-type override
async function form(mod, payload, opts){ let seen; const o=globalThis.fetch; globalThis.fetch=async(u,x)=>{seen=x; return mkRes(true,200,'{"ok":true}');}; try{ await mod.apiForm('/x',payload,opts);}finally{globalThis.fetch=o;} return seen; }
const cf = await form(C,{a:'1'},{headers:{'content-type':'text/plain'}});
const tf = await form(T,{a:'1'},{headers:{'content-type':'text/plain'}});
console.log('apiForm lowercase ct override  C:', JSON.stringify(cf.headers), ' T:', JSON.stringify(tf.headers), ' MATCH:', JSON.stringify(cf.headers)===JSON.stringify(tf.headers));
const cf2 = await form(C,{a:'1'},{});
const tf2 = await form(T,{a:'1'},{});
console.log('apiForm default ct  C:', JSON.stringify(cf2.headers), ' T:', JSON.stringify(tf2.headers), ' MATCH:', JSON.stringify(cf2.headers)===JSON.stringify(tf2.headers));
console.log('EXTENDED ALL MATCH:', allMatch);
