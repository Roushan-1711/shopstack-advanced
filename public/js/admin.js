const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
async function loadDashboard(){
  $('logsBody').innerHTML='<tr><td colspan="7">Loading…</td></tr>';
  try{
    const response=await fetch('/api/admin/logs?limit=100');
    if(!response.ok) throw new Error('Could not load request logs');
    const data=await response.json();
    $('total').textContent=data.summary.total;
    $('ips').textContent=data.summary.unique_ips;
    $('countriesCount').textContent=data.countries.filter(x=>x.country!=='Unknown').length;
    $('countryList').innerHTML=data.countries.length?data.countries.map(x=>`<div class="country-item"><strong>${esc(x.country)}</strong><span>${x.requests} requests</span></div>`).join(''):'<p class="muted">No requests yet. Simulate a visitor above.</p>';
    $('logsBody').innerHTML=data.logs.length?data.logs.map(log=>`<tr><td>${esc(log.created_at)}</td><td>${esc(log.ip_address)}</td><td>${esc(log.country)}</td><td>${esc(log.method)}</td><td>${esc(log.path)}</td><td>${esc(log.status_code)}</td><td><span class="tag ${log.source==='live'?'live':''}">${esc(log.source)}</span></td></tr>`).join(''):'<tr><td colspan="7">No request logs yet.</td></tr>';
  }catch(error){$('logsBody').innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`;}
}
$('simulateBtn').addEventListener('click',async()=>{
  $('message').textContent='Sending…';
  try{const response=await fetch('/api/admin/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ip:$('demoIp').value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Simulation failed');$('message').textContent=`Recorded ${data.log.ip_address} (${data.log.country}).`;await loadDashboard();}
  catch(error){$('message').textContent=error.message;}
});
$('refreshBtn').addEventListener('click',loadDashboard);
$('clearBtn').addEventListener('click',async()=>{if(!confirm('Clear all request logs?'))return;const response=await fetch('/api/admin/logs',{method:'DELETE'});if(response.ok)loadDashboard();});
loadDashboard();
