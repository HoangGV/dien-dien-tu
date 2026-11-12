/**
 * Transient Analysis Store
 * Manages transient analysis parameters (scan time, V/div) and results.
 * Completely separate from circuit data; does NOT trigger schematic re-compilations.
 */

import { create } from 'zustand';
import { CircuitState } from '../core/model';
import { runTransient, TransientResult } from '../core/solver/transient';

export const STANDARD_VOLT_DIVS = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0];

interface TransientState {
  scanTimeMs: number;
  vPerDiv1: number;
  vPerDiv2: number;
  ch1Enabled: boolean;
  ch2Enabled: boolean;
  result: TransientResult | null;
  isCalculating: boolean;
  progressPct: number;

  setScanTimeMs: (ms: number) => void;
  setVPerDiv1: (v: number) => void;
  setVPerDiv2: (v: number) => void;
  setCh1Enabled: (enabled: boolean) => void;
  setCh2Enabled: (enabled: boolean) => void;
  setResult: (res: TransientResult | null) => void;
  setIsCalculating: (calculating: boolean, pct?: number) => void;

  autoSetScanTime: (circuit: CircuitState) => number;
  autoScaleVolts: (channel: 1 | 2) => void;
  calculateAndDraw: (circuit: CircuitState) => Promise<TransientResult>;
}

export const useTransientStore = create<TransientState>((set, get) => ({
  scanTimeMs: 100,
  vPerDiv1: 1.0,
  vPerDiv2: 1.0,
  ch1Enabled: true,
  ch2Enabled: true,
  result: null,
  isCalculating: false,
  progressPct: 0,

  setScanTimeMs: (ms: number) => {
    const validMs = Math.max(1, Math.min(60000, Math.round(ms)));
    set({ scanTimeMs: validMs });
  },

  setVPerDiv1: (v: number) => set({ vPerDiv1: Math.max(0.001, v) }),
  setVPerDiv2: (v: number) => set({ vPerDiv2: Math.max(0.001, v) }),
  setCh1Enabled: (enabled: boolean) => set({ ch1Enabled: enabled }),
  setCh2Enabled: (enabled: boolean) => set({ ch2Enabled: enabled }),
  setResult: (res: TransientResult | null) => set({ result: res }),
  setIsCalculating: (calculating: boolean, pct: number = 0) =>
    set({ isCalculating: calculating, progressPct: pct }),

  autoSetScanTime: (circuit: CircuitState): number => {
    const components = circuit.components || [];

    // 1. Check if circuit has AC sources
    const acSources = components.filter((c) => c.type === 'ac_source');
    if (acSources.length > 0) {
      let minF = Infinity;
      for (const ac of acSources) {
        const f = Number(ac.props.frequency ?? 50);
        if (f > 0 && f < minF) minF = f;
      }
      if (minF === Infinity) minF = 50;
      // tStop = 5 periods of min frequency
      const tStopSec = 5 / minF;
      const scanMs = Math.max(1, Math.round(tStopSec * 1000));
      set({ scanTimeMs: scanMs });
      return scanMs;
    }

    // 2. No AC source: run probe simulation up to 10s with coarse dt
    const osc = components.find((c) => c.type === 'oscilloscope');
    const probes = osc ? [`${osc.id}:ch1`, `${osc.id}:ch2`] : ['c1:pos'];
    const probeRes = runTransient(circuit, {
      tStop: 10.0,
      dt: 0.01, // 10 ms coarse step
      probes,
    });

    let settleTime = 10.0;
    const len = probeRes.t.length;
    if (len > 10) {
      // Find time point after which all channels change < 0.1% per second
      for (let i = 1; i < len; i++) {
        let allSettled = true;
        for (let p = 0; p < probeRes.v.length; p++) {
          const currentV = probeRes.v[p][i];
          const finalV = probeRes.v[p][len - 1];
          const maxV = Math.max(1.0, Math.abs(finalV));
          const diffFromEnd = Math.abs(currentV - finalV) / maxV;
          if (diffFromEnd > 0.005) {
            allSettled = false;
            break;
          }
        }
        if (allSettled) {
          settleTime = probeRes.t[i];
          break;
        }
      }
    }

    // tStop = 1.2 * settleTime, minimum 10 ms
    const tStopSec = Math.max(0.01, 1.2 * settleTime);
    const scanMs = Math.max(10, Math.round(tStopSec * 1000));
    set({ scanTimeMs: scanMs });
    return scanMs;
  },

  autoScaleVolts: (channel: 1 | 2) => {
    const { result } = get();
    if (!result || !result.v) return;
    const idx = channel - 1;
    const arr = result.v[idx];
    if (!arr || arr.length === 0) return;

    let minV = Infinity;
    let maxV = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i];
      if (val < minV) minV = val;
      if (val > maxV) maxV = val;
    }

    const span = Math.max(1e-4, maxV - minV);
    // Find smallest standard step where span <= 6 * step (i.e. step >= span / 6)
    const requiredStep = span / 6;
    let chosenStep = STANDARD_VOLT_DIVS[STANDARD_VOLT_DIVS.length - 1];
    for (const step of STANDARD_VOLT_DIVS) {
      if (step >= requiredStep) {
        chosenStep = step;
        break;
      }
    }

    if (channel === 1) {
      set({ vPerDiv1: chosenStep });
    } else {
      set({ vPerDiv2: chosenStep });
    }
  },

  calculateAndDraw: async (circuit: CircuitState): Promise<TransientResult> => {
    set({ isCalculating: true, progressPct: 10 });
    const { scanTimeMs } = get();
    const tStop = Math.max(0.001, scanTimeMs / 1000);

    const osc = (circuit.components || []).find((c) => c.type === 'oscilloscope');
    const probes = osc ? [`${osc.id}:ch1`, `${osc.id}:ch2`] : [];

    // Allow UI to render the "Đang tính..." state
    await new Promise((resolve) => setTimeout(resolve, 10));
    set({ progressPct: 50 });

    const startTime = performance.now();
    const res = runTransient(circuit, { tStop, probes });
    const elapsed = performance.now() - startTime;

    set({
      result: res,
      isCalculating: false,
      progressPct: 100,
    });

    // Auto scale volts if result is fresh and currently at default 1.0
    get().autoScaleVolts(1);
    get().autoScaleVolts(2);

    return res;
  },
}));
