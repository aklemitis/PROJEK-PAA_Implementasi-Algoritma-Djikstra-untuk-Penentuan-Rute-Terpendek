//  INISIALISASI VARIABEL MEMORI UTAMA PROYEK
let vx = 0, vy = 0, scale = 1, isDrag = false, ds = {x:0, y:0}, vs = {x:0, y:0};
let animOn = false, animFrame = null, pathProgress = 0;
let nodes = [], edges = [], routePath = [], startN = null, endN = null;
let carSpeed = 40 * 0.000042; // Konversi natural 40 km/h ke frame-rate

//  SISTEM MANAGEMENT LOG PANEL REALTIME
function addLog(text, cssClass) {
  let body = document.getElementById('log-body');
  if (!body) return;
  let entry = document.createElement('div');
  entry.className = 'log-entry ' + (cssClass || '');
  entry.textContent = text;
  body.appendChild(entry);
  body.scrollTop = body.scrollHeight; // Auto-scroll kontinu
}

function clearLog() {
  let body = document.getElementById('log-body');
  if (body) body.innerHTML = '';
}

function addLogSeparator() {
  let body = document.getElementById('log-body');
  if (!body) return;
  let sep = document.createElement('div');
  sep.className = 'log-entry log-separator';
  sep.textContent = '─'.repeat(38);
  body.appendChild(sep);
}

//  UTULITAS KONTROL KECEPATAN (SLIDER & INPUT NUMERIK)
function syncSpeed(val) {
  val = Math.max(10, Math.min(200, parseInt(val) || 40));
  carSpeed = val * 0.000042;
  let slider = document.getElementById('speed-slider');
  let input = document.getElementById('speed-input');
  if (slider) slider.value = Math.min(val, 120);
  if (input) input.value = val;
}

function syncSpeedInput(val) { 
  syncSpeed(val); 
}

//  TRIGGER UTAMA: HITUNG RUTE MANUAL
function hitungRuteManual() {
  resetAnim(true); // Stop animasi lama tanpa dobel render
  let startSelect = document.getElementById('select-start');
  let endSelect = document.getElementById('select-end');
  if (!startSelect || !endSelect) return;

  startN = parseInt(startSelect.value);
  endN = parseInt(endSelect.value);
  
  if (startN === endN) {
    alert('Titik awal dan tujuan tidak boleh sama!');
    return;
  }
  computeRoute(); // Jalankan orkestrator Dijkstra
  render();       // Gambar ulang peta
  updateStatusText();
}

function updateStatusText() {
  let sn = nodes[startN], en = nodes[endN];
  if (!sn || !en) return;
  
  let totalPx = 0;
  for (let i = 0; i < routePath.length - 1; i++) {
    let fromId = routePath[i], toId = routePath[i+1];
    let e = edges.find(e => (e.a === fromId && e.b === toId) || (e.a === toId && e.b === fromId));
    totalPx += e ? e.bezierLen : dist(nodes[fromId], nodes[toId]);
  }
  let jarakInfo = routePath.length > 1 ? ` | 🗺️ Jarak: <b style="color:#f8961e">${formatJarak(totalPx)}</b>` : '';
  let statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.innerHTML =
      `<span><span class="route-label start-label">Start:</span> #${sn.id} ${sn.asset.label}</span>` +
      `<span><span class="route-label finish-label">Finish:</span> #${en.id} ${en.asset.label}</span>` +
      `<span style="color:#888;font-size:11px">${routePath.length > 1 ? routePath.length - 1 + ' ruas jalan' : 'langsung'}${jarakInfo}</span>`;
  }
}