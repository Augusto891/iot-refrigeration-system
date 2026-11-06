import { createSimulation, step, peakAt } from './simulation.mjs';
const $ = id => document.getElementById(id);
let sim = createSimulation(), running = true, smart = true, range = 180;
let ambient = 28;
const stateNames = {IDLE:'Normal cooling',PRE_COOL:'Pre-cooling',PEAK_HOLD:'Peak hold',RESUME:'Resuming cooling'};
const descriptions = {IDLE:'Maintaining the target temperature.',PRE_COOL:'Storing cool before the next peak window.',PEAK_HOLD:'Holding cooling while electricity costs more.',RESUME:'Returning to the normal temperature target.'};
const money = n => `₹${n.toFixed(2)}`;
const clock = minute => `${String(Math.floor(minute/60)%24).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
const dayTime = minute => `Day ${Math.floor(minute/1440)+1} · ${clock(minute)}`;
const set = (id,value) => $(id).textContent = value;
function drawChart() {
  const data = sim.readings.filter(r=>r.minute >= sim.minute-range);
  const x = m => 40 + (m - Math.max(0,sim.minute-range)) / Math.min(Math.max(sim.minute,1),range) * 700;
  const y = t => 211 - t / 12 * 190;
  let svg = `<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#97b67b" stop-opacity=".2"/><stop offset="100%" stop-color="#97b67b" stop-opacity="0"/></linearGradient></defs>`;
  [0,2,4,6,8,10,12].forEach(t=>{svg += `<line x1="40" y1="${y(t)}" x2="740" y2="${y(t)}" stroke="${t===8?'#d0b37e':'#edf0e8'}" ${t===8?'stroke-dasharray="5 5"':''}/><text x="28" y="${y(t)+3}" text-anchor="end" fill="#9ba58e" font-size="9" font-family="DM Sans,sans-serif">${t}°</text>`;});
  for(let i=0;i<=6;i++) { const m=Math.max(0,sim.minute-range)+Math.round(i*Math.min(Math.max(sim.minute,1),range)/6); svg += `<text x="${40+i*700/6}" y="239" text-anchor="middle" fill="#9ba58e" font-size="9" font-family="DM Sans,sans-serif">${clock(m)}</text>`; }
  if(data.length){const points=data.map(r=>`${x(r.minute)},${y(r.temp)}`);svg += `<path d="M ${x(data[0].minute)},${y(0)} L ${points.join(' L ')} L ${x(data.at(-1).minute)},${y(0)} Z" fill="url(#fill)"/><polyline points="${points.join(' ')}" fill="none" stroke="#72915a" stroke-width="2" stroke-linejoin="round"/><circle cx="${x(data.at(-1).minute)}" cy="${y(data.at(-1).temp)}" r="3.5" fill="#6e8c56" stroke="white" stroke-width="2"/>`;}
  $('chart').innerHTML = svg;
  $('chart-empty').hidden = data.length > 1;
}
function render() {
  const last = sim.readings.at(-1);
  const peak = peakAt(Math.max(0,sim.minute-1));
  set('sim-time',dayTime(sim.minute));set('temp',sim.temp.toFixed(1));
  set('compressor',sim.compressor?'Running':'Standby');
  $('compressor-dot').classList.toggle('active',sim.compressor);
  set('compressor-detail',sim.compressor?'150 W · actively cooling':'No power draw');
  set('rate',peak?'7.50':'3.50');set('tariff-tag',peak?'Peak hours':'Off-peak');
  $('tariff-tag').className=`tag ${peak?'amber':'green'}`;
  const hour=sim.minute/60%24;
  set('next-peak',peak?'Higher tariff window active':`Next peak window at ${hour<6?'06:00':hour<18?'18:00':'06:00 tomorrow'}`);
  const savings=sim.baselineCost-sim.cost;
  set('savings',savings.toFixed(2));
  const percent = sim.baselineCost>0?savings/sim.baselineCost*100:0;
  set('saving-percent',`${Math.abs(percent).toFixed(1)}% ${percent>=0?'lower':'higher'} cost`);
  $('saving-percent').className=`tag ${percent>=0?'green':'amber'}`;
  set('state',sim.safety?'Safety override':stateNames[sim.state]);
  set('state-description',sim.safety?'Cooling to 5°C before releasing override.':descriptions[sim.state]);
  document.querySelectorAll('[data-state]').forEach(el=>el.classList.toggle('current',el.dataset.state===sim.state));
  set('safe-badge',sim.safety?'Safety cooling active':sim.temp>5?'Above normal target':'Within normal range');
  $('safe-badge').className=`tag ${sim.safety?'danger':sim.temp>5?'amber':'green'}`;
  const temps=sim.readings.map(r=>r.temp);
  set('minimum',temps.length?`${Math.min(...temps).toFixed(1)}°C`:'—');
  set('maximum',temps.length?`${Math.max(...temps).toFixed(1)}°C`:'—');
  set('average',temps.length?`${(temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1)}°C`:'—');
  set('energy',sim.energy.toFixed(3));set('cost',money(sim.cost));set('baseline',money(sim.baselineCost));set('peak-off',`${sim.peakOff} min`);
  $('time-marker').style.left=`${sim.minute%1440/1440*100}%`;
  set('reading-count',`${sim.readings.length} readings · latest 6 shown`);
  $('readings').innerHTML = last?sim.readings.slice(-6).reverse().map(r=>`<tr><td>${dayTime(r.minute)}</td><td>${r.temp.toFixed(2)} °C</td><td><span class="table-state">${r.state.replaceAll('_',' ')}</span></td><td><span class="table-dot ${r.compressor?'on':''}"></span>${r.compressor?'Running':'Standby'}</td><td>₹${r.rate.toFixed(2)} / kWh</td></tr>`).join(''):'<tr><td colspan="5">Start the simulation to collect readings.</td></tr>';
  drawChart();
}
function notify(message) {set('toast',message);$('toast').classList.add('visible');clearTimeout(notify.timeout);notify.timeout=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
function advance(n){for(let i=0;i<n;i++)step(sim,ambient,smart);render();}
// Start at noon with the first 12 hours of this demo run simulated.
advance(720);
setInterval(()=>{if(running)advance(Number($('speed').value));},1000);
$('pause').onclick=()=>{running=!running;set('pause',running?'Ⅱ Pause':'▷ Resume');set('run-label',running?'Simulation running':'Simulation paused');document.querySelector('.pulse').style.background=running?'#64865a':'#b6a47b';};
$('reset').onclick=()=>{sim=createSimulation();sim.door=$('door-toggle').getAttribute('aria-checked')==='true';render();notify('Simulation reset to Day 1 · 00:00');};
$('smart-toggle').onclick=()=>{smart=!smart;$('smart-toggle').classList.toggle('on',smart);$('smart-toggle').setAttribute('aria-checked',String(smart));set('mode-tag',smart?'Auto':'Conventional');notify(smart?'Tariff-aware cooling enabled':'Conventional thermostat enabled');};
$('door-toggle').onclick=()=>{sim.door=!sim.door;$('door-toggle').classList.toggle('on',sim.door);$('door-toggle').setAttribute('aria-checked',String(sim.door));notify(sim.door?'Door open · heat gain increases':'Door closed');};
$('ambient').oninput=e=>{ambient=Number(e.target.value);set('ambient-value',`${ambient}°C`);};
document.querySelectorAll('[data-range]').forEach(button=>button.onclick=()=>{range=Number(button.dataset.range);document.querySelectorAll('[data-range]').forEach(b=>b.classList.toggle('selected',b===button));drawChart();});
document.querySelectorAll('nav a').forEach(link=>link.onclick=()=>{document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a===link));});
$('export').onclick=()=>{if(!sim.readings.length){notify('No readings to export yet. Let the simulation run.');return;}const csv=['simulated_day,time,temperature_c,compressor_on,controller_state,tariff_inr_per_kwh,cumulative_cost_inr',...sim.readings.map(r=>[Math.floor(r.minute/1440)+1,clock(r.minute),r.temp.toFixed(3),r.compressor,r.state,r.rate,r.cost.toFixed(5)].join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='coldshift-simulation.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Simulation readings exported');};
