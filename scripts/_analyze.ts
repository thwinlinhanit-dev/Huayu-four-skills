// Temporary calibration analysis — groups geometric features by the hand-authored stroke type.
import { CHARACTERS_DATABASE } from '../src/data/chineseData';
import { PRECACHED_STROKES } from '../src/data/strokeData';

const statsFor = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return `n=${s.length} min=${q(0).toFixed(0)} p25=${q(0.25).toFixed(0)} med=${q(0.5).toFixed(0)} p75=${q(0.75).toFixed(0)} max=${q(s.length - 1).toFixed(0)}`;
};

const features: Record<string, { len: number[]; ratio: number[]; ang: number[]; fold: number[]; hook: number[] }> = {};

for (const c of CHARACTERS_DATABASE) {
  const data = PRECACHED_STROKES[c.character];
  if (!data) continue;
  data.medians.forEach((median, i) => {
    const hand = c.strokeSequence[i];
    if (!hand) return;
    const pts = median.filter((p) => Array.isArray(p) && p.length >= 2);
    if (pts.length < 2) return;
    const seg = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
    const len = seg.reduce((a, b) => a + b, 0);
    const dx = pts[pts.length - 1][0] - pts[0][0];
    const dy = pts[pts.length - 1][1] - pts[0][1];
    const overall = Math.hypot(dx, dy) || 1;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const ratio = Math.abs(dx) / (Math.abs(dy) || 1);
    // half-split directions
    let acc = 0;
    let split = 1;
    for (let k = 1; k < pts.length; k++) {
      acc += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (acc >= len / 2) {
        split = k;
        break;
      }
    }
    const hx = pts[split][0] - pts[0][0];
    const hy = pts[split][1] - pts[0][1];
    const tx = pts[pts.length - 1][0] - pts[split][0];
    const ty = pts[pts.length - 1][1] - pts[split][1];
    const a1 = Math.atan2(hy, hx);
    const a2 = Math.atan2(ty, tx);
    let fold = ((a2 - a1) * 180) / Math.PI;
    if (fold > 180) fold -= 360;
    if (fold < -180) fold += 360;
    const lx = pts[pts.length - 2][0] - pts[0][0];
    const ly = pts[pts.length - 2][1] - pts[0][1];
    const a3 = Math.atan2(ly, lx);
    let hook = ((a2 - a3) * 180) / Math.PI;
    if (hook > 180) hook -= 360;
    if (hook < -180) hook += 360;

    const key = hand.type;
    features[key] ??= { len: [], ratio: [], ang: [], fold: [], hook: [] };
    features[key].len.push(len);
    features[key].ratio.push(ratio);
    features[key].ang.push(ang);
    features[key].fold.push(Math.abs(fold));
    features[key].hook.push(Math.abs(hook));
  });
}

for (const [type, f] of Object.entries(features).sort((a, b) => b[1].len.length - a[1].len.length)) {
  console.log(`\n${type}  (${f.len.length})`);
  console.log(`  len  ${statsFor(f.len)}`);
  console.log(`  |dx|/|dy|  ${statsFor(f.ratio)}`);
  console.log(`  angle(deg) ${statsFor(f.ang.map((a) => (a + 360) % 360))}`);
  console.log(`  fold(deg)  ${statsFor(f.fold)}`);
  console.log(`  hook(deg)  ${statsFor(f.hook)}`);
}
