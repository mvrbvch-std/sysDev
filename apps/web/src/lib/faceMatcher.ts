export type FaceDescriptorRow = {
  consumerId: string;
  descriptor: number[];
};

function euclideanDistance(a: number[], b: number[]) {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i] - b[i];
    sum += delta * delta;
  }

  return Math.sqrt(sum);
}

export function matchFaceDescriptor(
  probe: number[],
  knownRows: FaceDescriptorRow[],
  threshold = 0.48,
): { consumerId: string; score: number } | null {
  let best: { consumerId: string; score: number } | null = null;

  for (const row of knownRows) {
    const score = euclideanDistance(probe, row.descriptor);
    if (!best || score < best.score) {
      best = { consumerId: row.consumerId, score };
    }
  }

  if (!best || best.score > threshold) {
    return null;
  }

  return best;
}
