/**
 * History Manager for Undo / Redo
 * Pure TypeScript implementation, independent of React.
 * HISTORY_LIMIT is set to 5 by default (configurable).
 */

import { CircuitState } from './types';

export const DEFAULT_HISTORY_LIMIT = 5;

export class HistoryManager {
  private past: CircuitState[] = [];
  private future: CircuitState[] = [];
  private limit: number;

  constructor(limit = DEFAULT_HISTORY_LIMIT) {
    this.limit = limit;
  }

  public setLimit(limit: number) {
    this.limit = limit;
    while (this.past.length > this.limit) {
      this.past.shift();
    }
  }

  public getLimit(): number {
    return this.limit;
  }

  /**
   * Clone circuit state excluding transient viewport (zoom/pan are not tracked in undo/redo)
   */
  private cloneState(state: CircuitState): CircuitState {
    return {
      components: state.components.map(c => ({
        id: c.id,
        type: c.type,
        x: c.x,
        y: c.y,
        rot: c.rot,
        flip: c.flip,
        label: c.label || '',
        props: JSON.parse(JSON.stringify(c.props)),
        damaged: !!c.damaged,
        damageReason: c.damageReason,
      })),
      wires: state.wires.map(w => ({
        id: w.id,
        from: { ...w.from },
        to: { ...w.to },
        points: w.points.map(p => ({ x: p.x, y: p.y })),
        color: w.color,
        crossSection: w.crossSection,
        isBurnt: !!w.isBurnt,
      })),
      junctions: state.junctions.map(j => ({ id: j.id, x: j.x, y: j.y })),
      viewport: { ...state.viewport },
    };
  }

  /**
   * Records a new state into history.
   * Call this when a discrete user action completes (mouse release after drop/move, wire complete, prop change).
   */
  public push(currentState: CircuitState) {
    this.past.push(this.cloneState(currentState));
    if (this.past.length > this.limit) {
      this.past.shift(); // remove oldest
    }
    // Any new action invalidates redo branch
    this.future = [];
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Performs undo, returns previous state or null if not possible.
   * Requires passing current state so it can be pushed onto the redo stack.
   */
  public undo(currentState: CircuitState): CircuitState | null {
    if (!this.canUndo()) return null;

    const previousState = this.past.pop()!;
    this.future.push(this.cloneState(currentState));

    // Preserve the current viewport so undo doesn't jarringly jump camera
    return {
      ...previousState,
      viewport: { ...currentState.viewport },
    };
  }

  /**
   * Performs redo, returns next state or null if not possible.
   * Requires passing current state so it can be pushed onto the past stack.
   */
  public redo(currentState: CircuitState): CircuitState | null {
    if (!this.canRedo()) return null;

    const nextState = this.future.pop()!;
    this.past.push(this.cloneState(currentState));

    return {
      ...nextState,
      viewport: { ...currentState.viewport },
    };
  }

  public clear() {
    this.past = [];
    this.future = [];
  }

  public getStats() {
    return {
      undoSteps: this.past.length,
      redoSteps: this.future.length,
      limit: this.limit,
    };
  }
}
