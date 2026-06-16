// ========================================================
// 🗺️ VARIABEL GLOBAL PATH ANIMASI & FUNGSI PENDUKUNG
// ========================================================
let routeSvgPath = null; // Referensi ke SVG <path> rute aktif (diisi oleh render())

// Mengembalikan posisi dan sudut hadap kendaraan berdasarkan pathProgress [0..1]
function getVehiclePos() {
  if (!routeSvgPath || routePath.length < 2) return null;
  let totalLen = routeSvgPath.getTotalLength();
  let travel = pathProgress >= 1 ? totalLen : (pathProgress * totalLen);
  let pt  = routeSvgPath.getPointAtLength(travel);
  let pt2 = routeSvgPath.getPointAtLength(Math.min(travel + 2, totalLen));
  let angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
  return { x: pt.x, y: pt.y, angle };
}

// Pop-up status bar saat kurir tiba di tujuan
function tampilNotifikasiTiba() {
  let en = nodes[endN];
  let nama = en ? en.asset.label : 'Tujuan';
  let totalPx = 0;
  for (let i = 0; i < routePath.length - 1; i++) {
    let fromId = routePath[i], toId = routePath[i + 1];
    let e = edges.find(e => (e.a === fromId && e.b === toId) || (e.a === toId && e.b === fromId));
    totalPx += e ? e.bezierLen : Math.hypot(nodes[fromId].x - nodes[toId].x, nodes[fromId].y - nodes[toId].y);
  }
  let statusEl = document.getElementById('status');
  if (statusEl) {
    statusEl.innerHTML =
      `<span style="color:#3fb950;font-weight:700;font-size:13px">📦 Paket Terkirim! ${nama} tercapai</span>` +
      `<span style="color:#888;font-size:11px"> | Jarak tempuh: <b style="color:#f8961e">${formatJarak(totalPx)}</b></span>` +
      `<span style="color:#888;font-size:11px"> | Tekan 🔁 untuk ulangi</span>`;
  }
}

// ========================================================
// 📐 SISTEM KONVERSI JARAK (Sesuai Laporan Anggota 4)
// ========================================================
const SCALE_PX_TO_METER = 2; // 1 piksel SVG = 2 meter 

function pxToMeter(px) {
  return px * SCALE_PX_TO_METER; 
}

function formatJarak(px) {
  let m = pxToMeter(px); 
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km'; 
  return Math.round(m) + ' m'; 
}

// ========================================================
// 🚗 ENGINE ANIMASI KURIR (requestAnimationFrame Loop)
// ========================================================
function animLoop() {
  if (!animOn) return; 
  pathProgress += carSpeed;

  if (pathProgress >= 1) { 
    pathProgress = 1; 
    let vpos = getVehiclePos();
    if (vpos && document.getElementById('g-vehicle')) {
      document.getElementById('g-vehicle').innerHTML = '';
      drawCar(document.getElementById('g-vehicle'), vpos.x, vpos.y, vpos.angle);
    }
    animOn = false; 
    cancelAnimationFrame(animFrame); 
    let b = document.getElementById('anim-btn');
    if (b) { b.innerHTML = '🔁 Ulangi'; b.classList.remove('active'); }
    tampilNotifikasiTiba(); 
    return; 
  }

  let vpos = getVehiclePos();
  if (vpos && document.getElementById('g-vehicle')) {
    document.getElementById('g-vehicle').innerHTML = '';
    drawCar(document.getElementById('g-vehicle'), vpos.x, vpos.y, vpos.angle);
  }
  animFrame = requestAnimationFrame(animLoop); 
}

// ========================================================
// 🛣️ REKONSTRUKSI PATH SVG RUTE BEZIER
// ========================================================
function buildRouteSVGPath(rp) {
  if(rp.length < 2) return ''; 
  let parts = []; 
  for(let i = 0; i < rp.length - 1; i++){ 
    let fromId = rp[i], toId = rp[i+1]; 
    let e = edges.find(e => (e.a === fromId && e.b === toId) || (e.a === toId && e.b === fromId));
    if(!e){ continue; } 
    
    let a = nodes[e.a], b = nodes[e.b];
    let reversed = (e.a === toId); //edge disimpan terbalik?
    if(e.isStraight || !e.cx1){ 
      let sx = reversed ? b.x : a.x, sy = reversed ? b.y : a.y;
      let ex = reversed ? a.x : b.x, ey = reversed ? a.y : b.y;
      parts.push(i === 0 ? `M ${sx} ${sy} L ${ex} ${ey}` : `L ${ex} ${ey}`); 
    } else {
      let sx, sy, ex, ey, c1x, c1y, c2x, c2y;
      if(!reversed){ 
        sx = a.x; sy = a.y; c1x = e.cx1; c1y = e.cy1; c2x = e.cx2; c2y = e.cy2; ex = b.x; ey = b.y;
      } else { 
        sx = b.x; sy = b.y; c1x = e.cx2; c1y = e.cy2; c2x = e.cx1; c2y = e.cy1; ex = a.x; ey = a.y;
      }
      parts.push(i === 0 ? `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}` 
                      : `C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`);
    }
  }
  return parts.join(' '); 
}


// =========================================================================
// ⏸️ FUNGSI KONTROL SISTEM ANIMASI (Tambahan Kontribusi Anggota 4)
// =========================================================================
function resetAnim(skipRender = false) {
  animOn = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  let b = document.getElementById('anim-btn');
  if (b) { b.innerHTML = '🚗 Mulai Animasi Kurir'; b.classList.remove('active'); }
  pathProgress = 0;
  if (!skipRender) render();
}

function pauseAnim() {
  animOn = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  let b = document.getElementById('anim-btn');
  if (b) { b.innerHTML = '▶️ Lanjutkan'; b.classList.remove('active'); }
  
  let gv = document.getElementById('g-vehicle');
  if (gv && routeSvgPath && routePath.length >= 2) {
    let totalLen = routeSvgPath.getTotalLength();
    let travel = pathProgress >= 1 ? totalLen : (pathProgress * totalLen);
    let pt = routeSvgPath.getPointAtLength(travel);
    let pt2 = routeSvgPath.getPointAtLength(Math.min(travel + 2, totalLen));
    let angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
    gv.innerHTML = '';
    drawCar(gv, pt.x, pt.y, angle);
  }
}

function toggleAnim() {
  let b = document.getElementById('anim-btn');
  if (!b) return;
  if (animOn) {
    pauseAnim();
  } else if (pathProgress >= 1) {
    pathProgress = 0;
    b.innerHTML = '🚗 Mulai Animasi Kurir';
    b.classList.remove('active');
    render();
  } else {
    if (routePath.length < 2) { alert('Rute gagal dihitung.'); return; }
    animOn = true;
    b.innerHTML = '⏸ Hentikan';
    b.classList.add('active');
    animLoop();
  }
}