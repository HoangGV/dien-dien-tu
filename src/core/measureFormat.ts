/**
 * Measurement formatting utility adhering to Vietnamese pedagogical and TCVN standards.
 * Uses comma ',' as decimal separator.
 * Implements strict engineering unit scaling for currents, voltages, and powers.
 */

export type MeasureKind = 'current' | 'voltage' | 'power' | 'resistance' | 'frequency';

export interface FormatOptions {
  signed?: boolean;
  reverseDirection?: boolean;
}

/**
 * Formats a measurement value with appropriate SI prefixes and comma decimal separator.
 * Rules:
 * Current:
 *  - |I| < 0.00000001 A (0.01 µA): "0 A"
 *  - 0.01 µA <= |I| < 1 mA: formatted in µA (e.g. 0.00005 A -> "50,0 µA")
 *  - 1 mA <= |I| < 1 A: formatted in mA (e.g. 0.2727 A -> "272,7 mA")
 *  - |I| >= 1 A: formatted in A with 2 decimal places (e.g. 1.5 A -> "1,50 A")
 *
 * Voltage:
 *  - |U| < 0.001 V: "0 V"
 *  - 0.001 V <= |U| < 1 V: formatted in mV (e.g. 0.5 V -> "500 mV" or "500,0 mV")
 *  - |U| >= 1 V: formatted in V (3-4 significant digits, e.g. "220,0 V", "9,00 V")
 *
 * Power:
 *  - |P| < 1 W: formatted in mW
 *  - |P| >= 1 W: formatted in W (e.g. "60,0 W")
 */
export function formatMeasure(
  val: number,
  kind: MeasureKind = 'current',
  options: FormatOptions = {}
): string {
  if (isNaN(val) || !isFinite(val)) {
    if (kind === 'resistance') {
      return '∞ (hở)';
    }
    return '—';
  }

  const sign = val < 0 ? '-' : options.signed ? '+' : '';
  const absVal = Math.abs(val);

  const toComma = (n: number, decimals: number): string => {
    return n.toFixed(decimals).replace('.', ',');
  };

  switch (kind) {
    case 'current': {
      // Threshold under 0.01 µA (1e-8 A)
      if (absVal < 1e-8) {
        return '0 A';
      }
      // Microamperes: 0.01 µA <= I < 1 mA (1e-3 A)
      if (absVal < 0.001) {
        const uA = absVal * 1e6;
        return `${sign}${toComma(uA, 1)} µA`;
      }
      // Milliamperes: 1 mA <= I < 1 A
      if (absVal < 1.0) {
        const mA = absVal * 1000;
        return `${sign}${toComma(mA, 1)} mA`;
      }
      // Amperes: I >= 1 A
      return `${sign}${toComma(absVal, 2)} A`;
    }

    case 'voltage': {
      if (absVal < 1e-6) {
        return '0 V';
      }
      if (absVal < 1.0) {
        const mV = absVal * 1000;
        // If integer or exact tenths
        const dec = mV >= 100 ? 0 : 1;
        return `${sign}${toComma(mV, dec)} mV`;
      }
      if (absVal >= 100) {
        return `${sign}${toComma(absVal, 1)} V`;
      }
      return `${sign}${toComma(absVal, 2)} V`;
    }

    case 'power': {
      if (absVal < 1e-6) {
        return '0 W';
      }
      if (absVal < 1.0) {
        const mW = absVal * 1000;
        return `${sign}${toComma(mW, 1)} mW`;
      }
      return `${sign}${toComma(absVal, 1)} W`;
    }

    case 'resistance': {
      if (absVal >= 1e8 || !isFinite(val)) {
        return '∞ (hở)';
      }
      if (absVal >= 1e6) {
        return `${toComma(absVal / 1e6, 2)} MΩ`;
      }
      if (absVal >= 1000) {
        return `${toComma(absVal / 1000, 2)} kΩ`;
      }
      // Below 1000 Ω
      const hasFraction = Math.abs(absVal - Math.round(absVal)) > 0.01;
      return hasFraction ? `${toComma(absVal, 1)} Ω` : `${Math.round(absVal)} Ω`;
    }

    case 'frequency': {
      return `${toComma(absVal, 1)} Hz`;
    }

    default:
      return `${toComma(absVal, 2)}`;
  }
}
