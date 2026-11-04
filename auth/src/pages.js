// The hosted sign-in page at auth.tantrafiles.xyz/signin (Satsang's dark design, no web fonts). Sites on other domains
// (nibbana.stonedoorway.com, body.stonedoorway.com) send people here; it hands back a one-time code in the URL fragment.
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

export function signinPage({ clientId = '', ret = '', cc = '', state = '', site = '', error = '' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Sign in · Satsang</title>
<style>
:root{--bg:#0a0d14;--panel:#141a27;--line:#242c3d;--text:#efe9dd;--muted:#929aab;--red:#d9982f;--gold:#e8cf96}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:420px;margin:12vh 16px 0;padding:28px 24px;background:var(--panel);border:1px solid var(--line);border-radius:18px}
h1{font:500 30px/1.2 Georgia,"Times New Roman",serif;color:var(--red);letter-spacing:.03em;margin:0 0 6px}
p{color:var(--muted);margin:10px 0}b{color:var(--gold);font-weight:500}#g{min-height:48px;margin:22px 0 8px}
small{display:block;color:var(--muted);font-size:13px;margin-top:18px;border-top:1px solid var(--line);padding-top:14px}
a{color:var(--gold)}.err{color:#f0a3a3}@media(min-width:460px){main{margin:12vh auto 0}}
</style></head><body><main>
<h1>Satsang</h1>
${error ? `<p class="err">${esc(error)}</p>` : `<p>Sign in once for <b>${esc(site)}</b> and the other Satsang sites (tantrafiles.xyz, the journey journal, the practice lab).</p>
<div id="g"></div><p id="msg" aria-live="polite"></p>
<small>We keep a random account id, a scrambled form of your Google id, and a pen name. No email, no name, no photo. <a href="https://tantrafiles.xyz/privacy.html" target="_blank" rel="noopener">Privacy</a></small>`}
</main>
${error ? '' : `<script>
const C=${js({ clientId, ret, cc, state })};
const msg=(t)=>{document.getElementById('msg').textContent=t};
async function onCred(r){msg('Signing in…');try{const x=await fetch('/v1/google',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({credential:r.credential,return:C.ret,state:C.state,cc:C.cc})});const j=await x.json();if(x.ok&&j.redirect){location.replace(j.redirect)}else{msg(x.status===503?'Sign-in is not switched on yet.':'Sign-in did not work. Please try again.')}}catch(e){msg('Could not reach Satsang. Check your connection.')}}
function boot(){if(!C.clientId){msg('Sign-in is not switched on yet.');return}google.accounts.id.initialize({client_id:C.clientId,callback:onCred,auto_select:false,itp_support:true,use_fedcm_for_prompt:true});google.accounts.id.renderButton(document.getElementById('g'),{type:'standard',theme:'filled_black',size:'large',shape:'pill',text:'signin_with',width:300})}
</script><script src="https://accounts.google.com/gsi/client" async onload="boot()" onerror="msg('Could not reach Google.')"></script>`}
</body></html>`
}
