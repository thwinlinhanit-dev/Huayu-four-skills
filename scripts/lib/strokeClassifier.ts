/**
 * Derives the app's stroke-type vocabulary (横 / 竖 / 撇 / 捺 / 点 / 提 / 折-family)
 * from the median polylines inside hanzi-writer-data.
 *
 * hanzi-writer medians are polylines in a 1024x1024 grid with the y axis pointing
 * DOWN. Stroke order in that data is the standard writing order, so the generated
 * sequence is correct; only the *type name* has to be inferred from geometry, which
 * is what this module does. Accuracy is measured against the hand-authored entries
 * by `bun scripts/calibrateStrokes.ts`.
 */

export const STROKE_LABELS: Record<string, string> = {
  横: 'Héng (Horizontal)',
  竖: 'Shù (Vertical)',
  撇: 'Piě (Left Falling)',
  捺: 'Nà (Right Falling)',
  点: 'Diǎn (Dot)',
  提: 'Tí (Upward Flick)',
  竖钩: 'Shù Gōu (Vertical Hook)',
  弯钩: 'Wān Gōu (Curved Hook)',
  卧钩: 'Wò Gōu (Cradle Hook)',
  斜钩: 'Xié Gōu (Slanting Hook)',
  横折: 'Héng Zhé (Horizontal Fold)',
  横折钩: 'Héng Zhé Gōu (Horizontal Fold Hook)',
  横折提: 'Héng Zhé Tí (Fold and Rise)',
  横撇: 'Héng Piě (Horizontal Then Left Falling)',
  横折折撇: 'Héng Zhé Zhé Piě (Double Fold Then Left Falling)',
  横折弯钩: 'Héng Zhé Wān Gōu (Fold, Bend and Hook)',
  竖折: 'Shù Zhé (Vertical Fold)',
  竖折折钩: 'Shù Zhé Zhé Gōu (Double Fold Hook)',
  竖弯钩: 'Shù Wān Gōu (Vertical Bend Hook)',
  撇折: 'Piě Zhé (Left Falling Fold)',
  撇点: 'Piě Diǎn (Left Falling Dot)',
};

type Vec = { x: number; y: number; len: number };

const vec = (a: number[], b: number[]): Vec => {
  const x = b[0] - a[0];
  const y = b[1] - a[1];
  return { x, y, len: Math.hypot(x, y) };
};

/** Angle in degrees between two vectors (0 = same direction). */
const angleBetween = (a: Vec, b: Vec): number => {
  const dot = a.x * b.x + a.y * b.y;
  const cos = dot / (a.len * b.len || 1);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
};

/** Direction bucket ignoring magnitude, y-down: thinks in terms of screen space. */
type Direction = 'horizontal' | 'vertical' | 'downLeft' | 'downRight' | 'upRight';

const directionOf = (v: Vec): Direction => {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  if (ay <= ax * 0.45) return v.y < 0 && Math.abs(v.y) > ax * 0.12 ? 'upRight' : 'horizontal';
  if (ax <= ay * 0.45) return 'vertical';
  return v.x < 0 ? 'downLeft' : 'downRight';
};

/** Total polyline length. */
const pathLength = (points: number[][]): number =>
  points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);

export function classifyStroke(median: number[][]): string {
  const points = median.filter((p) => Array.isArray(p) && p.length >= 2);
  if (points.length < 2) return '点';

  const total = pathLength(points);
  if (total < 1) return '点';

  const start = points[0];
  const end = points[points.length - 1];
  const overall = vec(start, end);

  // --- short strokes are dots -------------------------------------------------
  if (total < 62 || overall.len < 28) return '点';

  // --- split the polyline into halves to spot folds and hooks -------------------
  const half = total / 2;
  let acc = 0;
  let splitIndex = 1;
  for (let i = 1; i < points.length; i++) {
    acc += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    if (acc >= half) {
      splitIndex = i;
      break;
    }
  }
  const head = vec(points[0], points[splitIndex]);
  const tail = vec(points[splitIndex], end);

  // Trailing hook: the last segment turns sharply away from the main run.
  let hookLen = 0;
  let hookTurn = 0;
  if (points.length >= 3) {
    const lastSegment = vec(points[points.length - 2], end);
    const beforeLast = vec(start, points[points.length - 2]);
    hookLen = lastSegment.len;
    hookTurn = angleBetween(beforeLast, lastSegment);
  }
  const hasHook = hookTurn > 42 && hookLen < total * 0.45 && hookLen > 22;

  const foldAngle = head.len > 12 && tail.len > 12 ? angleBetween(head, tail) : 0;
  const isFolded = foldAngle > 38;

  if (isFolded) {
    const headDir = directionOf(head);
    const tailDir = directionOf(tail);
    if (headDir === 'horizontal' && tailDir === 'vertical') return hasHook ? '横折钩' : '横折';
    if (headDir === 'horizontal' && tailDir === 'downLeft') return '横撇';
    if (headDir === 'horizontal' && tailDir === 'horizontal') return hasHook ? '横折提' : '横折';
    if (headDir === 'vertical' && tailDir === 'horizontal') return hasHook ? '竖弯钩' : '竖折';
    if (headDir === 'vertical' && tailDir === 'vertical') return hasHook ? '竖折折钩' : '竖';
    if (headDir === 'downLeft' && tailDir === 'horizontal') return '撇折';
    // 辶 / 廴 style multi-segment sweeps
    if (headDir === 'horizontal' || headDir === 'downRight') return '横折折撇';
    return hasHook ? '横折钩' : '横折';
  }

  const dir = directionOf(overall);
  if (dir === 'horizontal') {
    // Rising short strokes are 提; long flat or dipping strokes are 横.
    if (overall.y < -overall.len * 0.12) return total < 150 ? '提' : '横';
    return '横';
  }
  if (dir === 'vertical') {
    if (hasHook) return foldAngle > 25 && total > 260 ? '弯钩' : '竖钩';
    return '竖';
  }
  if (dir === 'downLeft') return hasHook ? '撇点' : '撇';
  if (dir === 'upRight') return '提';
  // downRight
  if (hasHook) {
    const wide = Math.abs(overall.x) >= Math.abs(overall.y) * 0.9;
    return wide ? '卧钩' : '斜钩';
  }
  return '捺';
}

/** Build the CharacterData.strokeSequence payload for a hanzi-writer entry. */
export function buildStrokeSequence(medians: number[][][]): { step: number; type: string; name: string }[] {
  return medians.map((median, index) => {
    const type = classifyStroke(median);
    return { step: index + 1, type, name: STROKE_LABELS[type] ?? type };
  });
}
