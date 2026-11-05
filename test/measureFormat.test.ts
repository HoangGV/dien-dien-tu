import { describe, it, expect } from 'vitest';
import { formatMeasure } from '../src/core/measureFormat';

describe('formatMeasure (Vietnamese Decimal Comma & TCVN)', () => {
  it('formats current values per E7 specification', () => {
    // 0.2727 A -> 272,7 mA
    expect(formatMeasure(0.2727, 'current')).toBe('272,7 mA');
    // 1.5 A -> 1,50 A
    expect(formatMeasure(1.5, 'current')).toBe('1,50 A');
    // 0.00005 A -> 50,0 µA
    expect(formatMeasure(0.00005, 'current')).toBe('50,0 µA');
    // 0 A -> 0 A
    expect(formatMeasure(0, 'current')).toBe('0 A');
    // Under 0.01 µA -> 0 A
    expect(formatMeasure(0.000000005, 'current')).toBe('0 A');
  });

  it('formats voltage values per E7 specification', () => {
    // 0.5 V -> 500 mV
    expect(formatMeasure(0.5, 'voltage')).toBe('500 mV');
    // 220 V -> 220,0 V
    expect(formatMeasure(220, 'voltage')).toBe('220,0 V');
    // 9 V -> 9,00 V
    expect(formatMeasure(9, 'voltage')).toBe('9,00 V');
  });

  it('formats power values correctly', () => {
    expect(formatMeasure(60, 'power')).toBe('60,0 W');
    expect(formatMeasure(0.03, 'power')).toBe('30,0 mW');
  });

  it('formats resistance values per section 1.1', () => {
    expect(formatMeasure(1000000, 'resistance')).toBe('1,00 MΩ');
    expect(formatMeasure(2500000, 'resistance')).toBe('2,50 MΩ');
    expect(formatMeasure(1000, 'resistance')).toBe('1,00 kΩ');
    expect(formatMeasure(3000, 'resistance')).toBe('3,00 kΩ');
    expect(formatMeasure(500, 'resistance')).toBe('500 Ω');
    expect(formatMeasure(806.67, 'resistance')).toBe('806,7 Ω');
    expect(formatMeasure(1e9, 'resistance')).toBe('∞ (hở)');
    expect(formatMeasure(Infinity, 'resistance')).toBe('∞ (hở)');
  });
});
