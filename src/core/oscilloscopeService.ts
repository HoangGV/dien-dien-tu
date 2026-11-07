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

export class OscilloscopeService {
  private maxSamples: number = 4000;
  private buffer: OscilloscopeSample[] = [];

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
   * Adds a sample to the circular ring buffer.
   * Maintains strict non-decreasing chronological order and caps at 4000 samples.
   */
  public addSample(t: number, v1: number, v2: number): void {
    if (this.isHeld) return;

    // Discard duplicates or out-of-order time steps
    if (this.buffer.length > 0 && t < this.lastSampleTime) {
      // Simulation was reset or looped
      this.buffer = [];
    }

    this.buffer.push({ t, v1, v2 });
    this.lastSampleTime = t;

    if (this.buffer.length > this.maxSamples) {
      this.buffer.shift();
    }
  }

  public recordSample(t: number, v1: number, v2: number): void {
    this.addSample(t, v1, v2);
  }

  /**
   * Returns a copy of current buffer in chronological order.
   */
  public getSamples(): OscilloscopeSample[] {
    return this.buffer.slice();
  }

  public getCount(): number {
    return this.buffer.length;
  }

  public clear(): void {
    this.buffer = [];
    this.lastSampleTime = -1;
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
