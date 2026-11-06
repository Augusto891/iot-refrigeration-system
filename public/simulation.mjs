export const peakAt = minute => { const h = (minute / 60) % 24; return (h >= 6 && h < 10) || (h >= 18 && h < 23); };
export function createSimulation() {
  return { minute: 0, temp: 4, baselineTemp: 4, compressor: false, baselineOn: false, state: 'IDLE', energy: 0, cost: 0, baselineCost: 0, peakOff: 0, door: false, safety: false, readings: [] };
}
export function step(s, ambient = 28, smart = true) {
  const hour = s.minute / 60 % 24;
  const peak = peakAt(s.minute);
  const pre = (hour >= 5 && hour < 6) || (hour >= 17 && hour < 18);
  if (s.temp >= 8) s.safety = true;
  if (s.temp <= 5) s.safety = false;
  if (!smart) s.state = 'IDLE';
  else if (peak) s.state = 'PEAK_HOLD';
  else if (pre) s.state = 'PRE_COOL';
  else if (s.state === 'PEAK_HOLD' || (s.state === 'RESUME' && s.temp > 4)) s.state = 'RESUME';
  else s.state = 'IDLE';
  if (s.safety) s.compressor = true;
  else if (s.state === 'PEAK_HOLD') s.compressor = false;
  else if (s.state === 'PRE_COOL') s.compressor = s.temp > 2;
  else if (s.state === 'RESUME') s.compressor = s.temp > 4;
  else if (s.temp >= 5) s.compressor = true;
  else if (s.temp <= 3.5) s.compressor = false;
  if (s.baselineTemp >= 5) s.baselineOn = true;
  else if (s.baselineTemp <= 3.5) s.baselineOn = false;
  const rate = peak ? 7.5 : 3.5;
  const energy = s.compressor ? .15 / 60 : 0;
  s.energy += energy;
  s.cost += energy * rate;
  s.baselineCost += (s.baselineOn ? .15 / 60 : 0) * rate;
  if (peak && !s.compressor) s.peakOff++;
  const leak = .0015 * (s.door ? 5 : 1);
  s.temp += leak * (ambient - s.temp) - (s.compressor ? .28 : 0);
  s.baselineTemp += leak * (ambient - s.baselineTemp) - (s.baselineOn ? .28 : 0);
  s.minute++;
  const reading = {minute:s.minute,temp:s.temp,compressor:s.compressor,state:s.safety?'SAFETY OVERRIDE':s.state,rate,cost:s.cost};
  s.readings.push(reading);
  if(s.readings.length > 1440) s.readings.shift();
  return reading;
}
