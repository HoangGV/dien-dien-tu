import { describe, it, expect } from 'vitest';
import { ALL_SOLVER_TEST_CASES } from '../src/core/testCircuits';

describe('Solver Self-Test Suite (C-1, PE, C-2, and C-3)', () => {
  it('has exactly 60 test cases', () => {
    expect(ALL_SOLVER_TEST_CASES.length).toBe(60);
  });

  for (const tc of ALL_SOLVER_TEST_CASES) {
    it(`Case ${tc.stt} [${tc.group}]: ${tc.name}`, () => {
      const res = tc.evaluate();
      expect(res.passed).toBe(true);
      expect(res.actualStr).toBeDefined();
    });
  }
});
