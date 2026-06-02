function buildAdjacencyList() {
  // Membangun adjacency list berbobot berdasarkan jarak Euclidean antar node
  let adj = Array.from({length: nodes.length}, () => []);
  for (let e of edges) {
    // Bobot sisi = panjang bezier aktual (konsisten dengan label di peta)
    let w = e.bezierLen;
    adj[e.a].push({ node: e.b, weight: w });
    adj[e.b].push({ node: e.a, weight: w });
  }
  return adj;
}
function computeRoute() {
  if (startN === null || endN === null) return;

  clearLog();
  addLogSeparator();
  addLog(`[Dijkstra] Memulai pencarian dari Node ${startN}`, 'log-init');
  addLog(`[Dijkstra] Target: Node ${endN} | Total Node: ${nodes.length}`, 'log-init');
  addLogSeparator();

  let n = nodes.length;

  // --- M1: Inisialisasi memori ---
  let adjList = buildAdjacencyList();
  let distArr = new Array(n).fill(Infinity);  // Jarak akumulatif, awal = Infinity
  let prev    = new Array(n).fill(null);       // Pointer balik untuk backtracking
  let visited = new Array(n).fill(false);      // Status kunjungan simpul

  distArr[startN] = 0;  // Jarak ke titik awal = 0
  addLog(`[Init] distArr[${startN}] = 0 (titik asal)`, 'log-init');
  addLog(`[Init] Seluruh ${n} node diisi Infinity`, 'log-init');
  addLogSeparator();

  // --- Loop utama Dijkstra: jalankan sebanyak V iterasi ---
  for (let i = 0; i < n; i++) {

    // M2 Bagian 1: Ekstrak simpul dengan jarak minimum (Greedy)
    let u = extractMinNode(distArr, visited);

    // Kondisi berhenti: semua node tercapai atau target sudah ditemukan
    if (u === -1 || distArr[u] === Infinity) {
      addLog(`[Stop] Tidak ada node terjangkau tersisa.`, 'log-error');
      break;
    }
    if (u === endN) {
      addLog(`[Stop] Node target (${endN}) diekstrak → Pencarian selesai.`, 'log-success');
      break;
    }

    visited[u] = true;
    let namaNode = nodes[u].asset ? nodes[u].asset.label : `Node ${u}`;
    addLog(`► Eksplorasi Node Terdekat → Node ${u} [${namaNode}] (Jarak: ${formatJarak(distArr[u])})`, 'log-extract');

    // M2 Bagian 2: Relaksasi semua sisi tetangga node u via relaxEdges()
    let relaxResults = relaxEdges(u, adjList, distArr, prev, visited);
    for (let res of relaxResults) {
      if (res.reason === 'visited') {
        addLog(`  ↳ Skip Node ${res.node} (sudah dikunjungi)`, 'log-skip');
      } else if (res.relaxed) {
        addLog(`  ✓ Relaksasi ke tetangga Node ${res.node}, jarak diperbarui → ${formatJarak(res.newDist)}`, 'log-relax');
      } else {
        addLog(`  ✗ Node ${res.node} tidak diperbarui (${formatJarak(res.oldDist)} ≤ ${formatJarak(res.altDist)})`, 'log-skip');
      }
    }
  }

  // --- Backtracking: susun ulang rute dari Goal ke Start via array prev ---
  addLogSeparator();
  addLog(`[Backtracking] Menyusun rute balik dari Node ${endN} ke Node ${startN}:`, 'log-backtrack');

  routePath = [];
  let cur = endN;
  let backtrackStr = [];

  while (cur !== null) {
    routePath.unshift(cur);   // Sisipkan di depan (urutan terbalik → jadi lurus)
    backtrackStr.push(cur);
    cur = prev[cur];
  }

  addLog(`  Jejak balik: [${backtrackStr.join(' → ')}]`, 'log-backtrack');

  // Validasi: rute harus dimulai dari startN
  if (routePath[0] !== startN) {
    routePath = [];
    addLog(`[Error] Rute tidak terhubung dari Start ke Finish!`, 'log-error');
  } else {
    addLogSeparator();
    addLog(`✅ [Sukses] Rute Terpendek Ditemukan!`, 'log-success');
    addLog(`   Start → ${routePath.join(' → ')} → Finish`, 'log-success');
    addLog(`   Total ${routePath.length - 1} ruas jalan | Jarak Tempuh: ${formatJarak(distArr[endN])}`, 'log-success');
  }

  addLogSeparator();
  pathProgress = 0;
}
