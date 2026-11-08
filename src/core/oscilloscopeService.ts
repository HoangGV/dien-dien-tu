/**
 * Virtual Oscilloscope Service
 * High-performance circular ring buffer (max 4000 samples)
 * Designed for <= 20 FPS canvas rendering without React re-renders per sample.
 */

export interface OscilloscopeSample {
  t: number;  // Simulation time in seconds
  v1: number; // Channel 1 voltage (V)
  v2: number; // Channel 2 voltage (V)
}

export type TriggerMode = 'auto' | 'rising';

export const TIME_DIV_STEPS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0];
export const VOLT_DIV_STEPS = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0];

export class OscilloscopeService {
  private maxSamples: number = 4000;
  // Tier 1: fine resolution for the most recent 4000 steps
  private fineBuffer: OscilloscopeSample[] = [];
  // Tier 2: downsampled coarse history covering from t = 0
  private coarseBuffer: OscilloscopeSample[] = [];
  private coarseSampleInterval: number = 1;
  private coarseStepCounter: number = 0;

  // Display and acquisition settings
  public isHeld: boolean = false;
  public timePerDiv: number = 0.02; // 20 ms / div default (10 horizontal divs = 200 ms total)
  public vPerDiv1: number = 1.0;    // 1 V / div
  public vPerDiv2: number = 1.0;    // 1 V / div
  public offset1: number = 0;       // Vertical offset in divisions
  public offset2: number = 0;       // Vertical offset in divisions
  public ch1Enabled: boolean = true;
  public ch2Enabled: boolean = true;
  public triggerMode: TriggerMode = 'auto';
  public triggerLevel: number = 1.0; // Volts for rising edge on CH1

  private lastSampleTime: number = -1;

  /**
   * Adds a sample to both the fine buffer and coarse downsampled history.
   * Maintains strict non-decreasing chronological order.
   */
  public addSample(t: number, v1: number, v2: number): void {
    if (this.isHeld) return;

    // Reset detection (e.g. simulation restarted or looped)
    if (this.fineBuffer.length > 0 && t < this.lastSampleTime) {
      this.clear();
    }

    const sample: OscilloscopeSample = { t, v1, v2 };

    // 1. Fine buffer (last 4000 steps)
    this.fineBuffer.push(sample);
    this.lastSampleTime = t;
    if (this.fineBuffer.length > this.maxSamples) {
      this.fineBuffer.shift();
    }

    // 2. Coarse buffer (all history since start with decimation)
    this.coarseStepCounter++;
    if (this.coarseStepCounter % this.coarseSampleInterval === 0) {
      this.coarseBuffer.push(sample);
      if (this.coarseBuffer.length >= this.maxSamples) {
        // Keep every 2nd sample and double interval
        this.coarseBuffer = this.coarseBuffer.filter((_, idx) => idx % 2 === 0);
        this.coarseSampleInterval *= 2;
      }
    }
  }

  public recordSample(t: number, v1: number, v2: number): void {
    this.addSample(t, v1, v2);
  }

  /**
   * Returns copy of fine buffer for test cases and short windows.
   */
  public getSamples(): OscilloscopeSample[] {
    return this.fineBuffer.slice();
  }

  public getFineBuffer(): OscilloscopeSample[] {
    return this.fineBuffer;
  }

  public getCoarseBuffer(): OscilloscopeSample[] {
    return this.coarseBuffer;
  }

  /**
   * Chooses fine buffer if the window is fully inside fineBuffer, else coarseBuffer.
   */
  public getSamplesForWindow(tStart: number, tSpan: number): OscilloscopeSample[] {
    if (this.fineBuffer.length > 0 && tStart >= this.fineBuffer[0].t) {
      return this.fineBuffer;
    }
    return this.coarseBuffer.length > 0 ? this.coarseBuffer : this.fineBuffer;
  }

  public getCount(): number {
    return this.fineBuffer.length;
  }

  public clear(): void {
    this.fineBuffer = [];
    this.coarseBuffer = [];
    this.coarseSampleInterval = 1;
    this.coarseStepCounter = 0;
    this.lastSampleTime = -1;
    this.isHeld = false;
  }

  /**
   * Auto-Set (TỰ ĐẶT): automatically chooses optimal Time/div, Volt/div, and offsets.
   */
  public autoScale(components: any[] = []): void {
    // 1. Time / Div
    const acSources = components.filter(
      (c) => c.type === 'ac_source' && (c.props?.peakVoltage !== undefined || c.props?.frequency !== undefined)
    );
    if (acSources.length > 0) {
      const fMin = Math.min(...acSources.map((c) => Number(c.props?.frequency || 50)));
      const targetTimeDiv = 0.2 / Math.max(0.1, fMin);
      // Select smallest standard step >= targetTimeDiv
      const matched = TIME_DIV_STEPS.find((s) => s >= targetTimeDiv - 1e-6);
      this.timePerDiv = matched || TIME_DIV_STEPS[TIME_DIV_STEPS.length - 1];
    } else {
      const firstT = this.coarseBuffer[0]?.t ?? this.fineBuffer[0]?.t ?? 0;
      const totalTime = Math.max(0.01, this.lastSampleTime - firstT);
      const targetTimeDiv = Math.max(0.001, totalTime / 10);
      const matched = TIME_DIV_STEPS.find((s) => s >= targetTimeDiv - 1e-6);
      this.timePerDiv = matched || TIME_DIV_STEPS[TIME_DIV_STEPS.length - 1];
    }

    // 2. Volt / Div and Offset
    const samples = this.fineBuffer.length > 0 ? this.fineBuffer : this.coarseBuffer;
    if (samples.length > 0) {
      // Channel 1
      const v1s = samples.map((s) => s.v1);
      const min1 = Math.min(...v1s);
      const max1 = Math.max(...v1s);
      const span1 = Math.max(0.05, max1 - min1);
      const neededVDiv1 = span1 / 6;
      const matchedVDiv1 = VOLT_DIV_STEPS.find((s) => s >= neededVDiv1 - 1e-6) || VOLT_DIV_STEPS[VOLT_DIV_STEPS.length - 1];
      this.vPerDiv1 = matchedVDiv1;
      const mid1 = (max1 + min1) / 2;
      this.offset1 = Math.round((-mid1 / matchedVDiv1) * 2) / 2;

      // Channel 2
      const v2s = samples.map((s) => s.v2);
      const min2 = Math.min(...v2s);
      const max2 = Math.max(...v2s);
      const span2 = Math.max(0.05, max2 - min2);
      const neededVDiv2 = span2 / 6;
      const matchedVDiv2 = VOLT_DIV_STEPS.find((s) => s >= neededVDiv2 - 1e-6) || VOLT_DIV_STEPS[VOLT_DIV_STEPS.length - 1];
      this.vPerDiv2 = matchedVDiv2;
      const mid2 = (max2 + min2) / 2;
      this.offset2 = Math.round((-mid2 / matchedVDiv2) * 2) / 2;
    }
  }

  public setHeld(held: boolean): void {
    this.isHeld = held;
  }

  public setTimePerDiv(t: number): void {
    this.timePerDiv = Math.max(0.001, t);
  }

  public setVPerDiv1(v: number): void {
    this.vPerDiv1 = Math.max(0.01, v);
  }

  public setVPerDiv2(v: number): void {
    this.vPerDiv2 = Math.max(0.01, v);
  }

  public setOffset1(divs: number): void {
    this.offset1 = divs;
  }

  public setOffset2(divs: number): void {
    this.offset2 = divs;
  }

  public setCh1Enabled(enabled: boolean): void {
    this.ch1Enabled = enabled;
  }

  public setCh2Enabled(enabled: boolean): void {
    this.ch2Enabled = enabled;
  }

  public setTriggerMode(mode: TriggerMode): void {
    this.triggerMode = mode;
  }

  public setTriggerLevel(v: number): void {
    this.triggerLevel = v;
  }
}

export const oscilloscopeService = new OscilloscopeService();
