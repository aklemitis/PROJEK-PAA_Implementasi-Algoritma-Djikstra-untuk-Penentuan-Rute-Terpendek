// ========================================================
// 📐 SISTEM KONVERSI JARAK (Sesuai Laporan Anggota 4)
// ========================================================
const SCALE_PX_TO_METER = 2; // 1 piksel SVG = 2 meter [cite: 509]

function pxToMeter(px) {
  return px * SCALE_PX_TO_METER; // [cite: 510, 511]
}

function formatJarak(px) {
  let m = pxToMeter(px); // [cite: 514]
  if (m >= 1000) return (m / 1000).toFixed(2) + ' km'; // [cite: 515]
  return Math.round(m) + ' m'; // [cite: 516]
}

// ========================================================
// 🚗 ENGINE ANIMASI KURIR (requestAnimationFrame Loop)
// ========================================================
function animLoop() {
  if (!animOn) return; // [cite: 557]
  pathProgress += carSpeed; // [cite: 558]

  if (pathProgress >= 1) { // [cite: 559]
    pathProgress = 1; // [cite: 560]
    let vpos = getVehiclePos();
    if (vpos && document.getElementById('g-vehicle')) {
      document.getElementById('g-vehicle').innerHTML = '';
      drawCar(document.getElementById('g-vehicle'), vpos.x, vpos.y, vpos.angle);
    }
    animOn = false; // [cite: 561]
    cancelAnimationFrame(animFrame); // [cite: 562]
    let b = document.getElementById('anim-btn');
    if (b) { b.innerHTML = '🔁 Ulangi'; b.classList.remove('active'); }
    tampilNotifikasiTiba(); // [cite: 563]
    return; // [cite: 564]
  }

  let vpos = getVehiclePos();
  if (vpos && document.getElementById('g-vehicle')) {
    document.getElementById('g-vehicle').innerHTML = '';
    drawCar(document.getElementById('g-vehicle'), vpos.x, vpos.y, vpos.angle);
  }
  animFrame = requestAnimationFrame(animLoop); // [cite: 577]
}

// ========================================================
// 🛣️ REKONSTRUKSI PATH SVG RUTE BEZIER
// ========================================================
function buildRouteSVGPath(rp) {
  if(rp.length < 2) return ''; // [cite: 526]
  let parts = []; // [cite: 527]
  for(let i = 0; i < rp.length - 1; i++){ // [cite: 529]
    let fromId = rp[i], toId = rp[i+1]; // [cite: 530]
    let e = edges.find(e => (e.a === fromId && e.b === toId) || (e.a === toId && e.b === fromId)); // [cite: 532, 533, 534]
    if(!e){ continue; } // [cite: 535]
    
    let a = nodes[e.a], b = nodes[e.b];
    let reversed = (e.a === toId); // [cite: 536]
    if(e.isStraight || !e.cx1){ // [cite: 537]
      let sx = reversed ? b.x : a.x, sy = reversed ? b.y : a.y;
      let ex = reversed ? a.x : b.x, ey = reversed ? a.y : b.y;
      parts.push(i === 0 ? `M ${sx} ${sy} L ${ex} ${ey}` : `L ${ex} ${ey}`); // [cite: 539, 540]
    } else {
      let sx, sy, ex, ey, c1x, c1y, c2x, c2y;
      if(!reversed){ // [cite: 543, 546]
        sx = a.x; sy = a.y; c1x = e.cx1; c1y = e.cy1; c2x = e.cx2; c2y = e.cy2; ex = b.x; ey = b.y;
      } else { // [cite: 544, 545]
        sx = b.x; sy = b.y; c1x = e.cx2; c1y = e.cy2; c2x = e.cx1; c2y = e.cy1; ex = a.x; ey = a.y;
      }
      parts.push(i === 0 ? `M ${sx} ${sy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}` // [cite: 547]
                      : `C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`);
    }
  }
  return parts.join(' '); // [cite: 550]
}