import { diff_match_patch } from 'diff-match-patch';

export function computeSimilarity(a: string, b: string): number {
  const dmp = new diff_match_patch();
  const diff = dmp.diff_main(a, b);
  dmp.diff_cleanupSemantic(diff);
  const equalParts = diff.filter((entry: any) => entry?.[0] === 0);
  const equalLength = equalParts.reduce((sum: number, entry: any) => {
    return sum + (entry?.[1]?.length || 0);
  }, 0);
  const totalLength = a.length + b.length;
  return totalLength === 0 ? 1 : (2 * equalLength) / totalLength;
}
