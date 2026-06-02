function generateMap() {
  resetAnim();
  nodes = []; edges = []; routePath = [];
  startN = null; endN = null;

  let id = 0;
  const cols = ri(5, 8), rows = ri(4, 6);
  const marginX = ri(80, 150), marginY = ri(70, 120);
  const cellW = (W - marginX * 2) / (cols - 1);
  const cellH = (H - marginY * 2) / (rows - 1);
  const layoutStyle = ri(0, 3);

  const grid = [];
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      if (Math.random() < 0.1 && row > 0 && row < rows-1 && col > 0 && col < cols-1) {
        grid[row][col] = -1; continue;
      }
      let x, y;
      if (layoutStyle === 1) {
        let offsetX = (row % 2 === 1) ? cellW * 0.4 : 0;
        x = marginX + col * cellW + offsetX + (Math.random() - 0.5) * 40;
        y = marginY + row * cellH + (Math.random() - 0.5) * 30;
      } else if (layoutStyle === 2) {
        x = marginX + col * cellW + (Math.random() - 0.5) * cellW * 0.6;
        y = marginY + row * cellH + (Math.random() - 0.5) * cellH * 0.5;
      } else if (layoutStyle === 3) {
        let cx2 = W/2, cy2 = H/2;
        let baseX = marginX + col * cellW, baseY = marginY + row * cellH;
        let dx = baseX - cx2, dy = baseY - cy2;
        let angle = Math.atan2(dy, dx);
        let spread = (Math.random() - 0.5) * 60;
        x = baseX + Math.cos(angle + 0.3) * spread + (Math.random() - 0.5) * 30;
        y = baseY + Math.sin(angle + 0.3) * spread + (Math.random() - 0.5) * 30;
      } else {
        x = marginX + col * cellW + (Math.random() - 0.5) * 30;
        y = marginY + row * cellH + (Math.random() - 0.5) * 25;
      }
      x = Math.min(W-60, Math.max(60, x));
      y = Math.min(H-60, Math.max(60, y));
      grid[row][col] = id;
      nodes.push({ id: id++, x, y, asset: null, gridRow: row, gridCol: col });
    }
  }

  const edgeSet = new Set();
  function addEdge(a, b) {
    if (a === b || a < 0 || b < 0) return;
    const key = `${Math.min(a,b)}_${Math.max(a,b)}`;
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    let na = nodes[a], nb = nodes[b];
    let dx = nb.x - na.x, dy = nb.y - na.y;
    let len = Math.hypot(dx, dy);
    // Edge pendek → selalu lurus agar tidak tumpang tindih
    let isStraight = (len < 150) || (Math.random() < 0.10);
    // Perp vector (tegak lurus) untuk membengkokkan jalan
    let px = -dy / len, py = dx / len;
    // Satu arah lengkung per edge (positif atau negatif, tidak berganti)
    // Offset maks 18% dari panjang edge → kurva wajar, tidak melintasi node lain
    let bendSign = Math.random() < 0.5 ? 1 : -1;
    let bendMag  = isStraight ? 0 : (0.08 + Math.random() * 0.10) * len * bendSign;
    // Titik kontrol di 1/3 dan 2/3 sepanjang edge (konsisten)
    let cx1 = na.x + dx * 0.33 + px * bendMag;
    let cy1 = na.y + dy * 0.33 + py * bendMag;
    let cx2 = na.x + dx * 0.67 + px * bendMag;
    let cy2 = na.y + dy * 0.67 + py * bendMag;
    // Hitung panjang bezier aktual dengan temporary path element
    let tempPath = document.createElementNS('http://www.w3.org/2000/svg','path');
    let pd = isStraight || !cx1
      ? `M ${na.x} ${na.y} L ${nb.x} ${nb.y}`
      : `M ${na.x} ${na.y} C ${cx1} ${cy1} ${cx2} ${cy2} ${nb.x} ${nb.y}`;
    tempPath.setAttribute('d', pd);
    document.body.appendChild(tempPath);
    let bezierLen = tempPath.getTotalLength();
    document.body.removeChild(tempPath);
    edges.push({a, b, cx1, cy1, cx2, cy2, isStraight, bezierLen});
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === -1) continue;
      if (col < cols-1) { for (let c2=col+1;c2<cols;c2++) { if(grid[row][c2]!==-1){addEdge(grid[row][col],grid[row][c2]);break;} } }
      if (row < rows-1) { for (let r2=row+1;r2<rows;r2++) { if(grid[r2][col]!==-1){addEdge(grid[row][col],grid[r2][col]);break;} } }
    }
  }
  for (let row=0;row<rows-1;row++) {
    for (let col=0;col<cols-1;col++) {
      if (grid[row][col]===-1) continue;
      if (Math.random()<0.25 && grid[row+1][col+1]!==undefined && grid[row+1][col+1]!==-1) addEdge(grid[row][col],grid[row+1][col+1]);
      if (Math.random()<0.2 && col>0 && grid[row+1][col-1]!==undefined && grid[row+1][col-1]!==-1) addEdge(grid[row][col],grid[row+1][col-1]);
    }
  }

  let extraEdges = ri(2, 5);
  for (let attempt=0;attempt<extraEdges*5&&extraEdges>0;attempt++) {
    let a=ri(0,nodes.length-1), b=ri(0,nodes.length-1);
    if (a===b) continue;
    let d=dist(nodes[a],nodes[b]);
    if (d>cellW*0.8 && d<cellW*2.2) {
      let key=`${Math.min(a,b)}_${Math.max(a,b)}`;
      if (!edgeSet.has(key)) { addEdge(a,b); extraEdges--; }
    }
  }

  let removeTarget = Math.floor(edges.length * r(0.1,0.25));
  let removed = new Set();
  let shuffled = edges.map((_,i)=>i).sort(()=>Math.random()-0.5);
  for (let idx of shuffled) {
    if (removed.size>=removeTarget) break;
    let testEdges = edges.filter((_,i)=>!removed.has(i)&&i!==idx);
    let deg = new Array(nodes.length).fill(0);
    for (let e of testEdges) { deg[e.a]++; deg[e.b]++; }
    let allOk = true;
    for (let i=0;i<nodes.length;i++) { if(deg[i]<2){allOk=false;break;} }
    if (allOk) {
      let adjTest = Array.from({length:nodes.length},()=>[]);
      for (let e of testEdges) { adjTest[e.a].push(e.b); adjTest[e.b].push(e.a); }
      let vis=new Array(nodes.length).fill(false), st=[0]; vis[0]=true; let cnt=1;
      while(st.length){let u=st.pop();for(let v of adjTest[u])if(!vis[v]){vis[v]=true;st.push(v);cnt++;}}
      if (cnt===nodes.length) removed.add(idx);
    }
  }
  edges = edges.filter((_,i)=>!removed.has(i));

  let finalDeg = new Array(nodes.length).fill(0);
  for (let e of edges){finalDeg[e.a]++;finalDeg[e.b]++;}
  for (let i=0;i<nodes.length;i++) {
    if (finalDeg[i]<2) {
      let candidates=[];
      for(let j=0;j<nodes.length;j++){if(i===j)continue;let key=`${Math.min(i,j)}_${Math.max(i,j)}`;if(edgeSet.has(key))continue;candidates.push({j,d:dist(nodes[i],nodes[j])});}
      candidates.sort((a,b)=>a.d-b.d);
      let needed=2-finalDeg[i];
      for(let k=0;k<Math.min(needed,candidates.length);k++){addEdge(i,candidates[k].j);finalDeg[i]++;finalDeg[candidates[k].j]++;}
    }
  }

  let adj2=Array.from({length:nodes.length},()=>[]);
  for(let e of edges){adj2[e.a].push(e.b);adj2[e.b].push(e.a);}
  let vis2=new Array(nodes.length).fill(false),st2=[0];vis2[0]=true;
  while(st2.length){let u=st2.pop();for(let v of adj2[u])if(!vis2[v]){vis2[v]=true;st2.push(v);}}
  for(let i=0;i<nodes.length;i++){
    if(!vis2[i]){
      let nearest=-1,nd=Infinity;
      for(let j=0;j<nodes.length;j++){if(vis2[j]){let d=dist(nodes[i],nodes[j]);if(d<nd){nd=d;nearest=j;}}}
      if(nearest!==-1)addEdge(i,nearest);
    }
  }

  finalDeg=new Array(nodes.length).fill(0);
  for(let e of edges){finalDeg[e.a]++;finalDeg[e.b]++;}
  for(let i=0;i<nodes.length;i++){
    if(finalDeg[i]<2){
      let best=-1,bestD=Infinity;
      for(let j=0;j<nodes.length;j++){if(i===j)continue;let key=`${Math.min(i,j)}_${Math.max(i,j)}`;if(edgeSet.has(key))continue;let d=dist(nodes[i],nodes[j]);if(d<bestD){bestD=d;best=j;}}
      if(best!==-1)addEdge(i,best);
    }
  }

  let cnt2={};
  for(let i=0;i<nodes.length;i++){
    let a; let attempts=0;
    do { a=ASSETS[ri(0,ASSETS.length-1)]; attempts++; }
    while(attempts<30&&(cnt2[a.type]||0)>=(a.type==='house'?14:a.type==='park'?2:a.type==='cafe'?2:3));
    cnt2[a.type]=(cnt2[a.type]||0)+1;
    nodes[i].asset=a;
  }

  for(let i=0;i<nodes.length;i++){
    let n=nodes[i],avgDx=0,avgDy=0;
    for(let e of edges){if(e.a===i){avgDx+=nodes[e.b].x-n.x;avgDy+=nodes[e.b].y-n.y;}if(e.b===i){avgDx+=nodes[e.a].x-n.x;avgDy+=nodes[e.a].y-n.y;}}
    let len=Math.hypot(avgDx,avgDy);
    if(len>0){n.bx=n.x-(avgDx/len)*35;n.by=n.y-(avgDy/len)*35;}else{n.bx=n.x+30;n.by=n.y+30;}
    n.bx=Math.min(W-40,Math.max(40,n.bx));
    n.by=Math.min(H-40,Math.max(40,n.by));
  }

  populateDropdowns();
  startN=0; endN=nodes.length-1;
  document.getElementById('select-start').value=startN;
  document.getElementById('select-end').value=endN;
  // Alur 2: pan peta ke node default, tapi belum hitung rute
  panToNodes(startN, endN);
  render();
  let sn0=nodes[startN], en0=nodes[endN];
  document.getElementById('status').innerHTML=
    '<span><span class="route-label start-label">Start:</span> '+sn0.asset.label+' (ID: '+sn0.id+')</span>'+
    '<span><span class="route-label finish-label">Finish:</span> '+en0.asset.label+' (ID: '+en0.id+')</span>'+
    '<span style="color:#f8961e;font-size:11px">⚡ Tekan "Hitung Rute" untuk memulai kalkulasi Dijkstra</span>';
}

function populateDropdowns() {
  let startSelect=document.getElementById('select-start');
  let endSelect=document.getElementById('select-end');
  startSelect.innerHTML=''; endSelect.innerHTML='';
  nodes.forEach(n=>{
    let nama=`#${n.id} — ${n.asset.label}`;
    startSelect.add(new Option(nama,n.id));
    endSelect.add(new Option(nama,n.id));
  });
  // Alur 2: setiap ganti dropdown langsung pan peta ke node yg dipilih
  startSelect.onchange = () => onNodeSelectChange();
  endSelect.onchange   = () => onNodeSelectChange();
}

// Dipanggil saat user ganti dropdown — pan peta agar kedua node terlihat, tapi TIDAK hitung rute
function onNodeSelectChange() {
  let sIdx = parseInt(document.getElementById('select-start').value);
  let eIdx = parseInt(document.getElementById('select-end').value);
  if (isNaN(sIdx) || isNaN(eIdx)) return;

  // Update marker start/end visual di peta tanpa komputasi rute
  startN = sIdx;
  endN   = eIdx;
  routePath = []; // hapus rute lama agar tidak menyesatkan
  resetAnim(true); // skipRender=true: render() akan dipanggil di bawah, tidak dobel

  // Pan peta agar kedua node terlihat di tengah viewport
  panToNodes(sIdx, eIdx);
  render();

  // Update status bar tapi tandai belum dihitung
  let sn = nodes[startN], en = nodes[endN];
  document.getElementById('status').innerHTML =
    `<span><span class="route-label start-label">Start:</span> #${sn.id} ${sn.asset.label}</span>` +
    `<span><span class="route-label finish-label">Finish:</span> #${en.id} ${en.asset.label}</span>` +
    `<span style="color:#f8961e;font-size:11px">⚡ Tekan "Hitung Rute" untuk memulai kalkulasi Dijkstra</span>`;
}

// Pan viewport agar dua node muat terlihat di tengah map-wrap
function panToNodes(aIdx, bIdx) {
  let a = nodes[aIdx], b = nodes[bIdx];
  let midX = (a.x + b.x) / 2;
  let midY = (a.y + b.y) / 2;
  let wrapW = document.getElementById('map-wrap').clientWidth;
  let wrapH = document.getElementById('map-wrap').clientHeight;
  // Hitung skala supaya kedua node muat dengan margin 20%
  let spanX = Math.abs(a.x - b.x) * 1.4 + 200;
  let spanY = Math.abs(a.y - b.y) * 1.4 + 200;
  let targetScale = Math.min(wrapW / spanX, wrapH / spanY, 1.8);
  targetScale = Math.max(targetScale, 0.4);
  scale = targetScale;
  vx = wrapW / 2 - midX * scale;
  vy = wrapH / 2 - midY * scale;
  document.getElementById('zoominfo').innerHTML = `Zoom: ${Math.round(scale*100)}%`;
  let gb = document.getElementById('g-base');
  if (gb) gb.setAttribute('transform', `translate(${vx},${vy}) scale(${scale})`);
}
