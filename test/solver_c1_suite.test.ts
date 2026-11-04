import { describe, it, expect } from 'vitest';
import { ALL_SOLVER_TEST_CASES } from '../src/core/testCircuits';

describe('C-1 and PE 18 Solver Test Cases', () => {
  it('has exactly 18 test cases', () => {
    expect(ALL_SOLVER_TEST_CASES.length).toBe(18);
  });

  for (const tc of ALL_SOLVER_TEST_CASES) {
    it(`Case ${tc.stt} [${tc.group}]: ${tc.name}`, () => {
      const res = tc.evaluate();
      expect(res.passed).toBe(true);
      expect(res.actualStr).toBeDefined();
    });
  }
});
