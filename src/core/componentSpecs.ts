/**
 * Component Specifications and Thermal/Damage Models
 * Defines parameters for thermal accumulation, overload curves, wire ampacity,
 * and failure behaviors used across simulation steps.
 */

export interface ComponentThermalSpec {
  tauHeatSec: number;        // Thermal time constant for heating (s)
  tauCoolSec: number;        // Thermal time constant for cooling (s) - default 4s
  calculateStress: (params: {
    voltage: number;
    current: number;
    power: number;
    ratedVoltage?: number;
    ratedCurrent?: number;
    ratedPower?: number;
    isReversePolarity?: boolean;
    frequency?: number;
  }) => {
    stress: number;          // s: normalized load ratio (s > 1 means overload)
    instantTrip?: boolean;   // e.g. > 5*In for breaker/fuse
    instantExplode?: boolean;// e.g. electrolytic cap reversed
    damageType?: 'burn' | 'trip' | 'blow' | 'explode' | 'melt';
    overloadRate: number;    // rate = f(s), e.g. s^2 - 1 or s - 1
  };
}

// Ampacity for household copper wires by cross-section (TCVN standard approximation for education)
export const WIRE_AMPACITY_MAP: Record<number, number> = {
  1.0: 10,   // 1.0 mm² -> 10 A
  1.5: 16,   // 1.5 mm² -> 16 A
  2.5: 24,   // 2.5 mm² -> 24 A
  4.0: 32,   // 4.0 mm² -> 32 A
};

export const DEFAULT_TAU_COOL = 4.0; // Cooling time constant (s)

export const COMPONENT_THERMAL_SPECS: Record<string, ComponentThermalSpec> = {
  // LED: s = I / 30mA, overload = s² - 1, tau = 0.3s; damage: burns open
  led: {
    tauHeatSec: 0.3,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current }) => {
      const iRated = 0.030; // 30 mA
      const s = Math.abs(current) / iRated;
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Resistor: s = P / P_rated (default 0.25W), overload = s - 1, tau = 2s; damage: burns open
  resistor: {
    tauHeatSec: 2.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ power, ratedPower = 0.25 }) => {
      const pMax = ratedPower || 0.25;
      const s = power / pMax;
      const overloadRate = s > 1 ? s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Diode: s = I / 1A, overload = s² - 1, tau = 0.5s; damage: burns open
  diode: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current }) => {
      const s = Math.abs(current) / 1.0;
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Transistor: s = max(P / 0.4W, Ic / 0.15A), overload = s - 1, tau = 1s; damage: burns open
  transistor_npn: {
    tauHeatSec: 1.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ power, current }) => {
      const sPower = power / 0.4;
      const sCurrent = Math.abs(current) / 0.15;
      const s = Math.max(sPower, sCurrent);
      const overloadRate = s > 1 ? s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  transistor_pnp: {
    tauHeatSec: 1.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ power, current }) => {
      const sPower = power / 0.4;
      const sCurrent = Math.abs(current) / 0.15;
      const s = Math.max(sPower, sCurrent);
      const overloadRate = s > 1 ? s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  opamp: {
    tauHeatSec: 1.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current }) => {
      const s = Math.abs(current) / 0.025; // 25 mA
      const overloadRate = s > 1 ? s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Electrolytic Capacitor: |V| > 1.2*Vđm or reverse voltage > 1V -> rapid explode (tau = 0.1s)
  capacitor_electrolytic: {
    tauHeatSec: 0.1,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 16, isReversePolarity }) => {
      const vAbs = Math.abs(voltage);
      let s = 0;
      let instantExplode = false;

      if (isReversePolarity && vAbs > 1.0) {
        // Reverse polarity by more than 1V -> explodes fast
        s = 5.0; // Extreme stress
        instantExplode = true;
      } else if (vAbs > 1.2 * ratedVoltage) {
        s = vAbs / (1.2 * ratedVoltage);
      }

      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        instantExplode,
        damageType: 'explode',
        overloadRate,
      };
    },
  },

  // Ceramic Capacitor: only overvoltage > 1.2*Vđm (default 50V)
  capacitor_ceramic: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 50 }) => {
      const vAbs = Math.abs(voltage);
      const s = vAbs > 1.2 * ratedVoltage ? vAbs / (1.2 * ratedVoltage) : 0;
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // DC Power Source: s = I / I_max (default 5A), overload = s² - 1, tau = 2s
  dc_source: {
    tauHeatSec: 2.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current, ratedCurrent = 5 }) => {
      const s = Math.abs(current) / (ratedCurrent || 5);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Household Loads by rated voltage Udm (220V): overvoltage V > 1.25 * Udm for tau = 0.5s -> burns coil/filament
  ceiling_fan: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 220 }) => {
      const s = Math.abs(voltage) / (1.25 * ratedVoltage);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  lamp: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 220 }) => {
      const s = Math.abs(voltage) / (1.25 * ratedVoltage);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  lamp_fluorescent: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 220 }) => {
      const s = Math.abs(voltage) / (1.25 * ratedVoltage);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  electric_bell: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 220 }) => {
      const s = Math.abs(voltage) / (1.25 * ratedVoltage);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  appliance_generic: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 220 }) => {
      const s = Math.abs(voltage) / (1.25 * ratedVoltage);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  lamp_dc: {
    tauHeatSec: 0.5,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ voltage, ratedVoltage = 5 }) => {
      const s = Math.abs(voltage) / (1.25 * (ratedVoltage || 5));
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },
  relay_module_1ch: {
    tauHeatSec: 5.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current, ratedCurrent = 10 }) => {
      const s = Math.abs(current) / (ratedCurrent || 10);
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        damageType: 'burn',
        overloadRate,
      };
    },
  },

  // Circuit Breaker (MCB / CB): s = I / In, overload = s² - 1, tau = 8s; I > 5*In -> instant trip (<= 20ms)
  cb: {
    tauHeatSec: 8.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current, ratedCurrent = 16 }) => {
      const iAbs = Math.abs(current);
      const inVal = ratedCurrent || 16;
      const s = iAbs / inVal;
      const instantTrip = s >= 5.0; // Magnetic trip curve
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        instantTrip,
        damageType: 'trip',
        overloadRate,
      };
    },
  },

  // Knife Switch / Cầu dao: behaves identically to MCB in terms of protection tripping
  knife_switch: {
    tauHeatSec: 8.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current, ratedCurrent = 16 }) => {
      const iAbs = Math.abs(current);
      const inVal = ratedCurrent || 16;
      const s = iAbs / inVal;
      const instantTrip = s >= 5.0; // Magnetic trip curve
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        instantTrip,
        damageType: 'trip',
        overloadRate,
      };
    },
  },

  // Fuse: s = I / In, overload = s² - 1, tau = 2s; I > 5*In -> instant blow
  fuse: {
    tauHeatSec: 2.0,
    tauCoolSec: DEFAULT_TAU_COOL,
    calculateStress: ({ current, ratedCurrent = 10 }) => {
      const iAbs = Math.abs(current);
      const inVal = ratedCurrent || 10;
      const s = iAbs / inVal;
      const instantTrip = s >= 5.0; // Fast blow
      const overloadRate = s > 1 ? s * s - 1 : 0;
      return {
        stress: s,
        instantTrip,
        damageType: 'blow',
        overloadRate,
      };
    },
  },
};

/**
 * Calculate wire thermal stress
 * s = I / Imax (by cross-section); overload = s² - 1; tau = 6s
 */
export function calculateWireStress(current: number, crossSection: number = 2.5) {
  const iMax = WIRE_AMPACITY_MAP[crossSection] || (crossSection * 10);
  const s = Math.abs(current) / iMax;
  const overloadRate = s > 1 ? s * s - 1 : 0;
  return {
    stress: s,
    iMax,
    overloadRate,
    tauHeatSec: crossSection <= 1.0 ? 5.0 : 12.0,
    tauCoolSec: DEFAULT_TAU_COOL,
  };
}
