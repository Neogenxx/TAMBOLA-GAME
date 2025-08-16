// client/src/utils/ticketGenerator.ts
// Produces the same 3x9 tambola ticket that the server generates (0 = blank)
export function generateTambolaTicket(): number[][] {
  const colRanges = Array.from({length:9}, (_,i) => {
    const start = i*10 + 1;
    const end = i === 8 ? 90 : i*10 + 10;
    const arr = [];
    for (let n = start; n <= end; n++) arr.push(n);
    return arr;
  });

  const colCounts = Array(9).fill(0);
  let remaining = 15;
  const colsIdx = [...Array(9).keys()];
  while (remaining > 0) {
    const availableCols = colsIdx.filter(i => colCounts[i] < 3);
    const idx = availableCols[Math.floor(Math.random() * availableCols.length)];
    colCounts[idx]++;
    remaining--;
  }

  const colNumbers = colCounts.map((count, col) => {
    if (count === 0) return [];
    const pool = [...colRanges[col]];
    const chosen = [];
    for (let k = 0; k < count; k++) {
      const i = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(i, 1)[0]);
    }
    chosen.sort((a,b) => a-b);
    return chosen;
  });

  const rows = [Array(9).fill(0), Array(9).fill(0), Array(9).fill(0)];
  const rowCounts = [0,0,0];
  const colOrder = [...Array(9).keys()].sort(() => Math.random() - 0.5);

  for (const c of colOrder) {
    const nums = colNumbers[c];
    if (!nums || nums.length === 0) continue;
    const rowOrder = [0,1,2].sort((a,b) => rowCounts[a] - rowCounts[b]);
    for (let i = 0; i < nums.length; i++) {
      let placed = false;
      for (const r of rowOrder) {
        if (rowCounts[r] < 5 && rows[r][c] === 0) {
          rows[r][c] = nums[i];
          rowCounts[r]++;
          placed = true;
          break;
        }
      }
      if (!placed) {
        const fallback = rowCounts.findIndex(rc => rc < 5);
        if (fallback !== -1) {
          rows[fallback][c] = nums[i];
          rowCounts[fallback]++;
        } else {
          return generateTambolaTicket();
        }
      }
    }
  }

  if (rowCounts.some(rc => rc !== 5)) {
    return generateTambolaTicket();
  }
  return rows;
}
