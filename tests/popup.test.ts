import { computeSimilarity } from '../src/similarity';
import { diff_match_patch } from 'diff-match-patch';

(global as any).diff_match_patch = diff_match_patch;

describe('computeSimilarity', () => {
  test('identical strings', () => {
    expect(computeSimilarity('abc', 'abc')).toBe(1);
  });

  test('partial overlap', () => {
    expect(computeSimilarity('abc', 'abcd')).toBeCloseTo(0.8571, 4);
  });

  test('no overlap', () => {
    expect(computeSimilarity('abc', 'xyz')).toBe(0);
  });
});
