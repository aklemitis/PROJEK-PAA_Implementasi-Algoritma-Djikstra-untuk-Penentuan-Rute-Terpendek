function extractMinNode(distArr, visitedArr) {
  let minDistance = Infinity;
  let minNodeIdx = -1;
  // Scanning linear: cari simpul belum dikunjungi dengan jarak terkecil
  for (let i = 0; i < distArr.length; i++) {
    if (!visitedArr[i] && distArr[i] < minDistance) {
      minDistance = distArr[i];
      minNodeIdx = i;
    }
  }
  return minNodeIdx;
}

function relaxEdges(u, adjList, distArr, prev, visited) {
  let results = [];
  for (let edge of adjList[u]) {
    let v = edge.node;
    if (visited[v]) {
      results.push({ relaxed: false, node: v, reason: 'visited' });
      continue;
    }
    let altJalur = distArr[u] + edge.weight;
    // Relaksasi: jika jalur alternatif lebih pendek, perbarui jarak dan pointer
    if (altJalur < distArr[v]) {
      distArr[v] = altJalur;
      prev[v] = u;   // Catat asal simpul untuk backtracking
      results.push({ relaxed: true, node: v, newDist: altJalur });
    } else {
      results.push({ relaxed: false, node: v, oldDist: distArr[v], altDist: altJalur });
    }
  }
  return results;
}