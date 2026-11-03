import { describe, it, expect } from 'vitest';
import { HistoryManager } from '../src/core/history';
import { CircuitState } from '../src/core/types';

describe('HistoryManager (Undo / Redo with 5-step limit)', () => {
  const createMockState = (compCount: number): CircuitState => ({
    components: Array.from({ length: compCount }, (_, i) => ({
      id: `c_${i}`,
      type: 'resistor',
      x: i * 20,
      y: 100,
      rot: 0,
      flip: false,
      label: `R${i + 1}`,
      props: { resistance: 1000 },
    })),
    wires: [],
    junctions: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  });

  it('records actions and maintains 5 steps limit', () => {
    const history = new HistoryManager(5);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);

    // Push 7 states
    for (let i = 1; i <= 7; i++) {
      history.push(createMockState(i));
    }

    // Should only have 5 steps recorded in past
    expect(history.getStats().undoSteps).toBe(5);
    expect(history.canUndo()).toBe(true);
  });

  it('performs undo and redo correctly without mutating current viewport', () => {
    const history = new HistoryManager(5);
    const state0 = createMockState(0);
    const state1 = createMockState(1);
    const state2 = createMockState(2);

    history.push(state0);
    history.push(state1);

    // Undo from state2
    const undone = history.undo(state2);
    expect(undone).not.toBeNull();
    expect(undone?.components.length).toBe(1);
    expect(history.canRedo()).toBe(true);

    // Redo back
    const redone = history.redo(undone!);
    expect(redone).not.toBeNull();
    expect(redone?.components.length).toBe(2);
    expect(history.canRedo()).toBe(false);
  });
});
