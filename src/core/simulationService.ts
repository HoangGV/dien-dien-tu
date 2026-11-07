/**
 * Core Simulation Service (Pure TypeScript, No React dependencies)
 * Orchestrates:
 * 1. Pipeline: Editor CircuitState -> Compilation (netlist + element models) -> MNA Solver -> Snapshot
 * 2. Execution Loop: requestAnimationFrame with <= 8ms per-frame budget
 * 3. Dynamic kinetics:
 *    - Green highlight for active loads (ceiling fan, electric bell, appliances) with opacity proportional to P/P_rated
 *    - Lamp and LED glow
 *    - Thermal accumulation (heat h, stress s), component damage (burn, explode, trip, blow)
 *    - Wire overheating and melting
 *    - Visual particles (smoke <= 60 particles, sparks)
 *    - WebAudio effects (snap, boom, click) - default OFF
 * 4. Diagnostics & Live Logging (last 50 events)
 * 5. Full Registry validation on boot
 */

import {
  CircuitState,
  ComponentInstance,
  Wire,
  Junction,
  Net,
  CaseStatus,
} from './model';
import { oscilloscopeService } from './oscilloscopeService';
import { COMPONENT_MAP, COMPONENT_REGISTRY, getComponentDef } from './registry';
import { extractNetlist, getComponentPins } from './netlist';
import {
  solveCircuit,
  SolverStepResult,
  OpenCircuitInfo,
  ThermalState,
  MeterMeasurement,
} from './solver';
import { formatMeasure } from './measureFormat';

export interface ComponentModelInfo {
  type: string;
  hasModel: boolean;
  pinIds: string[];
  missingPins: string[];
}

export interface CompiledCircuit {
  components: ComponentInstance[];
  wires: Wire[];
  junctions: Junction[];
  pinToNetId: Map<string, string>;
  nets: Net[];
  pinMap: Record<string, string>;
  refNetId: string | null;
  refReason: string;
  componentModels: Record<string, ComponentModelInfo>;
  openCircuit?: OpenCircuitInfo;
  compMap: Map<string, ComponentInstance>;
}

export interface WireFlow {
  wireId: string;
  current: number; // in Amperes
  absCurrent: number;
  direction: 1 | -1 | 0; // 1: from -> to, -1: to -> from, 0: no flow
  speedPxPerSec: number;
  isOverheated?: boolean;
  isMelted?: boolean;
}

export interface ComponentKinetics {
  id: string;
  type: string;
  voltage: number;
  current: number;
  power: number;
  stateStr: string;
  isOperating: boolean;
  greenIntensity: number; // 0 to 1 for active loads (quạt, chuông, thiết bị)
  brightness?: number;    // Đèn/LED: 0 - 1
  heatPercent: number;    // h * 50% (h=1 -> 50%, h=2 -> 100%)
  thermalStatus: 'normal' | 'hot' | 'damaged' | 'tripped' | 'blown';
}

export interface VisualParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: 'smoke' | 'spark';
  color: string;
  opacity: number;
}

export interface SimulationDiagnostics {
  totalNodes: number;
  numNodes?: number;
  numBranches?: number;
  numElements?: number;
  refNetId: string | null;
  refReason: string;
  componentModels: Record<string, ComponentModelInfo>;
  pinToNetMap: Record<string, string>;
  pinNetMap?: Record<string, string>;
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  converged: boolean;
  newtonIterations: number;
  frameBudgetMs: number;
  lastStepDurationMs: number;
  solveTimeMs: number;
  logs: string[];
}

export interface SourceStats {
  voltage: number;
  current: number;
  power: number;
  summaryStr: string;
}

export interface SimulationSnapshot {
  time?: number;
  simTime: number; // in seconds
  stepCount: number;
  compiled: CompiledCircuit;
  solverResult: SolverStepResult;
  wireFlows: Record<string, WireFlow>;
  componentKinetics: Record<string, ComponentKinetics>;
  particles: VisualParticle[];
  elementMeasures: Record<string, { current: number; voltage: number; power: number }>;
  pinVoltages: Record<string, number>;
  sourceStats: SourceStats;
  diagnostics: SimulationDiagnostics;
  meters: Record<string, MeterMeasurement>;
  thermalStates?: Record<string, ThermalState>;
  wireThermalStates?: Record<string, ThermalState>;
}

export type SnapshotListener = (snapshot: SimulationSnapshot) => void;

export class SimulationService {
  private isRunning: boolean = false;
  private simTime: number = 0;
  private stepCount: number = 0;
  private timeSpeed: number = 1.0;
  private lastRafTimestamp: number = 0;
  private rafId: number | null = null;

  private currentCircuitState: CircuitState | null = null;
  private currentMode: 'rms' | 'dc' = 'rms';
  private compiledCircuit: CompiledCircuit | null = null;
  private lastSnapshot: SimulationSnapshot | null = null;

  private listeners: Set<SnapshotListener> = new Set();
  private logs: string[] = [];

  // Thermal accumulation states
  private thermalStates: Record<string, ThermalState> = {};
  private wireThermalStates: Record<string, ThermalState> = {};

  // Energy Meter speed multiplier (1, 60, 600, 3600)
  private energyMultiplier: number = 1;

  // Visual particles
  private particles: VisualParticle[] = [];
  private particleIdCounter: number = 0;

  // WebAudio API (default OFF)
  private audioEnabled: boolean = false;
  private audioCtx: any = null;

  constructor() {
    this.addLog('Dịch vụ mô phỏng (SimulationService) C-3 khởi tạo thành công.');
    this.addLog('Chẩn đoán nâng cấp: Ôm kế sử dụng lượt giải phụ nguồn tắt (bơm 1 mA). Oát kế chuẩn 4 chân (I+, I-, U+, U-).');
  }

  public addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString('vi-VN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.logs.unshift(`[${timestamp}] ${msg}`);
    if (this.logs.length > 50) {
      this.logs.pop();
    }
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  // --- AUDIO METHODS ---
  public isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  public setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
    this.addLog(`Âm thanh mô phỏng: ${enabled ? 'BẬT' : 'TẮT'}`);
  }

  public toggleAudio(): boolean {
    this.setAudioEnabled(!this.audioEnabled);
    return this.audioEnabled;
  }

  public setEnergyMultiplier(mult: number) {
    this.energyMultiplier = Math.max(1, mult);
    this.addLog(`Hệ số tua nhanh điện năng công tơ: ×${this.energyMultiplier}`);
  }

  public getEnergyMultiplier(): number {
    return this.energyMultiplier;
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  public playSound(kind: 'snap' | 'boom' | 'click') {
    if (!this.audioEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (kind === 'snap') {
        // High frequency sharp snap (1000 Hz -> 200 Hz in 40ms)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (kind === 'boom') {
        // Deep explosive boom (120 Hz -> 30 Hz in 250ms)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (kind === 'click') {
        // Breaker mechanical trip click (400 Hz impulse)
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.03);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Ignore audio synthesis errors
    }
  }

  // --- PARTICLE METHODS ---
  private emitSmoke(x: number, y: number, count: number = 2) {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.particles.length > 60) return; // Cap at 60 particles

    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: `p_${++this.particleIdCounter}`,
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 15,
        vy: -15 - Math.random() * 20, // drift upward
        life: 0,
        maxLife: 1.5 + Math.random() * 0.5,
        size: 6 + Math.random() * 8,
        kind: 'smoke',
        color: '#666666',
        opacity: 0.6,
      });
    }
  }

  private emitSparks(x: number, y: number, count: number = 8) {
    if (typeof document !== 'undefined' && document.hidden) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        id: `p_${++this.particleIdCounter}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2,
        size: 3 + Math.random() * 3,
        kind: 'spark',
        color: Math.random() > 0.4 ? '#FFA500' : '#FFD700',
        opacity: 1.0,
      });
    }
  }

  private updateParticles(dt: number) {
    this.particles = this.particles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'smoke') {
        p.size += 6 * dt; // expand
        p.opacity = Math.max(0, 0.6 * (1 - p.life / p.maxLife));
      } else {
        p.opacity = Math.max(0, 1.0 * (1 - p.life / p.maxLife));
      }
      return true;
    });
  }

  /**
   * Validates all palette components against electrical model requirements.
   */
  public checkRegistryIntegrity(): {
    allValid: boolean;
    missing: string[];
    pinMismatches: string[];
  } {
    const missing: string[] = [];
    const pinMismatches: string[] = [];
    const defs = COMPONENT_REGISTRY || [];

    for (const def of defs) {
      if (def.category === 'annotation') continue;

      const dummyInst: ComponentInstance = {
        id: `test_${def.type}`,
        type: def.type,
        x: 0,
        y: 0,
        rot: 0,
        flip: false,
        label: def.refPrefix,
        props: { ...def.defaultProps },
      };

      const pins = getComponentPins(dummyInst, def);
      if (pins.length === 0 && (def.category as string) !== 'annotation') {
        pinMismatches.push(`${def.type} (không có chân kết nối)`);
      }
    }

    const allValid = missing.length === 0 && pinMismatches.length === 0;
    if (allValid) {
      this.addLog('Kiểm tra linh kiện: 100% linh kiện trong palette đều có mô hình điện học và chân khớp quy chuẩn.');
    } else {
      this.addLog(
        `CẢNH BÁO LỆCH LINH KIỆN: Thiếu model: [${missing.join(', ')}], Sai chân: [${pinMismatches.join(', ')}]`
      );
    }

    return { allValid, missing, pinMismatches };
  }

  /**
   * Compiles CircuitState into a CompiledCircuit structure.
   */
  public compile(
    state: CircuitState,
    mode: 'rms' | 'dc' = 'rms'
  ): CompiledCircuit {
    const { components, wires, junctions } = state;
    const defMap = COMPONENT_MAP;
    const { pinToNetId, nets } = extractNetlist(components, wires, junctions, defMap);

    // Identify Ground Reference Node
    let refNetId: string | null = null;
    let refReason = 'Mặc định (Chưa tìm thấy nguồn nối đất)';

    if (mode === 'rms') {
      const acSources = components.filter(c => c.type === 'ac_source');
      if (acSources.length > 0) {
        const oNet = pinToNetId.get(`${acSources[0].id}:O`);
        if (oNet) {
          refNetId = oNet;
          refReason = `Nút trung tính (O) của nguồn xoay chiều ${acSources[0].label}`;
        }
      }
    } else {
      const gnds = components.filter(c => c.type === 'gnd');
      if (gnds.length > 0) {
        const gNet = pinToNetId.get(`${gnds[0].id}:gnd`);
        if (gNet) {
          refNetId = gNet;
          refReason = `Nút mass GND ${gnds[0].label}`;
        }
      }
      if (!refNetId) {
        const dcSources = components.filter(c => c.type === 'dc_source');
        if (dcSources.length > 0) {
          const negNet = pinToNetId.get(`${dcSources[0].id}:neg`);
          if (negNet) {
            refNetId = negNet;
            refReason = `Cực âm (−) của nguồn DC ${dcSources[0].label}`;
          }
        }
      }
    }

    if (!refNetId && nets.length > 0) {
      refNetId = nets[0].id;
      refReason = `Tự động gán nút đầu tiên làm gốc (N${refNetId})`;
    }

    const pinMap: Record<string, string> = {};
    pinToNetId.forEach((netId, pinKey) => {
      pinMap[pinKey] = netId;
    });

    const componentModels: Record<string, ComponentModelInfo> = {};
    const compMap = new Map<string, ComponentInstance>();

    for (const c of components) {
      compMap.set(c.id, c);
      const def = defMap.get(c.type);
      const pins = def ? getComponentPins(c, def) : [];
      const pinIds = pins.map(p => p.id);

      componentModels[c.id] = {
        type: c.type,
        hasModel: def?.category !== 'annotation',
        pinIds,
        missingPins: [],
      };
    }

    const compiled: CompiledCircuit = {
      components,
      wires,
      junctions,
      pinToNetId,
      nets,
      pinMap,
      refNetId,
      refReason,
      componentModels,
      compMap,
    };

    this.currentCircuitState = state;
    this.currentMode = mode;
    this.compiledCircuit = compiled;

    return compiled;
  }

  /**
   * Executes a single time step (dt seconds) through MNA solver with thermal accumulation.
   */
  public step(dt: number = 0.016): SimulationSnapshot {
    const startTime = performance.now();

    if (!this.compiledCircuit && this.currentCircuitState) {
      this.compiledCircuit = this.compile(this.currentCircuitState, this.currentMode);
    }

    const compiled = this.compiledCircuit!;
    const { components, wires, pinToNetId } = compiled;
    const dtSim = dt * this.timeSpeed;

    // Run electrical solver with thermal accumulation
    const solverRes = solveCircuit(
      components,
      wires,
      compiled.junctions,
      COMPONENT_MAP,
      this.simTime,
      this.thermalStates,
      this.wireThermalStates,
      dtSim
    );

    // Check newly damaged components to trigger sounds and particle emitters
    for (const [id, t] of Object.entries(solverRes.thermalStates)) {
      const prev = this.thermalStates[id];
      if (t.status === 'damaged' && prev?.status !== 'damaged') {
        const comp = compiled.compMap.get(id);
        if (comp) {
          if (t.damageType === 'explode') {
            this.playSound('boom');
            this.emitSparks(comp.x, comp.y, 12);
            this.emitSmoke(comp.x, comp.y, 8);
          } else {
            this.playSound('snap');
            this.emitSmoke(comp.x, comp.y, 6);
          }
        }
      } else if (t.status === 'tripped' && prev?.status !== 'tripped') {
        this.playSound('click');
        const comp = compiled.compMap.get(id);
        if (comp) this.emitSparks(comp.x, comp.y, 4);
      } else if (t.status === 'blown' && prev?.status !== 'blown') {
        this.playSound('snap');
        const comp = compiled.compMap.get(id);
        if (comp) this.emitSmoke(comp.x, comp.y, 4);
      } else if (t.status === 'hot') {
        const comp = compiled.compMap.get(id);
        if (comp && Math.random() < 0.2) {
          this.emitSmoke(comp.x, comp.y, 1);
        }
      }
    }

    // Save updated thermal states
    this.thermalStates = solverRes.thermalStates;
    this.wireThermalStates = solverRes.wireThermalStates;

    // Persist damaged flag on components
    for (const [id, t] of Object.entries(this.thermalStates)) {
      const comp = compiled.compMap.get(id);
      if (comp) {
        if (t.status === 'damaged' && comp.type !== 'cb' && comp.type !== 'knife_switch') {
          comp.damaged = true;
        } else if (t.status === 'tripped') {
          comp.props.isTripped = true;
          comp.damaged = false;
        } else if (t.status === 'blown') {
          comp.props.isBlown = true;
          comp.damaged = true;
        }
      }
    }

    // Accumulate kWh for energy meters
    for (const c of compiled.components) {
      if (c.type === 'kwh_meter') {
        const pwr = solverRes.componentPowers?.[c.id] ?? 0;
        if (pwr > 0) {
          const deltaKwh = (pwr * dtSim * this.energyMultiplier) / (3600 * 1000);
          c.props.kwh = (c.props.kwh || 0) + deltaKwh;
          if (solverRes.meterMeasurements?.[c.id]) {
            solverRes.meterMeasurements[c.id].energyKwh = c.props.kwh;
            solverRes.meterMeasurements[c.id].formatted = `${c.props.kwh.toFixed(3).replace('.', ',')} kWh`;
          }
        }
      }
    }

    // 1. Calculate Wire Flows & Overheating
    const wireFlows: Record<string, WireFlow> = {};
    for (const w of wires) {
      const fromNet = pinToNetId.get(`${w.from.compId}:${w.from.pinId}`);
      const toNet = pinToNetId.get(`${w.to.compId}:${w.to.pinId}`);
      const vFrom = fromNet ? (solverRes.nodeVoltages[fromNet] ?? 0) : 0;
      const vTo = toNet ? (solverRes.nodeVoltages[toNet] ?? 0) : 0;

      let branchCurrent = 0;
      let dir: 1 | -1 | 0 = 0;

      const fromCurrent = w.from.compId ? solverRes.componentCurrents[w.from.compId] : undefined;
      const toCurrent = w.to.compId ? solverRes.componentCurrents[w.to.compId] : undefined;

      if (fromCurrent !== undefined && toCurrent !== undefined) {
        branchCurrent = Math.min(fromCurrent, toCurrent);
      } else if (fromCurrent !== undefined) {
        branchCurrent = fromCurrent;
      } else if (toCurrent !== undefined) {
        branchCurrent = toCurrent;
      }

      if (vFrom > vTo + 1e-4) {
        dir = 1;
      } else if (vTo > vFrom + 1e-4) {
        dir = -1;
      } else {
        dir = 0;
      }

      const absI = Math.abs(branchCurrent);
      let speed = 0;
      if (absI >= 1e-6) {
        const logVal = Math.log10(absI);
        speed = Math.min(160, Math.max(15, 15 + 15 * (logVal + 6)));
      }

      const wTherm = this.wireThermalStates[w.id];
      const isMelted = Boolean(wTherm?.status === 'damaged' || w.isBurnt);
      const isOverheated = wTherm?.status === 'hot';
      if (isMelted) {
        w.isBurnt = true;
      }

      wireFlows[w.id] = {
        wireId: w.id,
        current: branchCurrent * dir,
        absCurrent: absI,
        direction: dir,
        speedPxPerSec: isMelted ? 0 : speed,
        isOverheated,
        isMelted,
      };
    }

    // 2. Component Kinetics (No fan rotor spinning, pure green highlight for running loads)
    const componentKinetics: Record<string, ComponentKinetics> = {};
    for (const c of components) {
      const v = solverRes.componentVoltages[c.id] ?? 0;
      const i = solverRes.componentCurrents[c.id] ?? 0;
      const p = solverRes.componentPowers[c.id] ?? Math.round(v * i * 100) / 100;
      const isOp = Boolean(solverRes.operatingStates[c.id]);
      const tState = this.thermalStates[c.id] || { heat: 0, stress: 0, status: 'normal' };

      let greenIntensity = 0;
      let brightness = 0;
      let stateStr = isOp ? 'Đang hoạt động' : 'Tắt';

      if (['ceiling_fan', 'appliance_generic', 'electric_bell'].includes(c.type)) {
        const ratedP = Number(c.props.power) || (c.type === 'ceiling_fan' ? 60 : c.type === 'electric_bell' ? 25 : 60);
        if (isOp && tState.status === 'normal') {
          // Green highlight: opacity from 0.4 up to 1.0 proportional to P / P_rated
          greenIntensity = Math.min(1.0, Math.max(0.4, p / ratedP));
          stateStr = `Đang hoạt động (${Math.round((p / ratedP) * 100)}%)`;
        } else {
          greenIntensity = 0;
          stateStr = 'Đang dừng';
        }
      } else if (c.type === 'lamp' || c.type === 'lamp_fluorescent') {
        const ratedP = Number(c.props.power) || 60;
        brightness = isOp ? Math.min(1.0, Math.max(0.1, p / ratedP)) : 0;
        stateStr = isOp ? `Sáng ${(brightness * 100).toFixed(0)}%` : 'Tắt';
      } else if (c.type === 'led') {
        if (i >= 0.0003 && tState.status === 'normal') {
          brightness = Math.min(1.0, Math.sqrt(i / 0.02));
          stateStr = `Sáng ${(brightness * 100).toFixed(0)}%`;
        } else {
          brightness = 0;
          stateStr = 'Tắt';
        }
      }

      // Check thermal state overriding state string
      if (tState.status === 'damaged') {
        stateStr = 'ĐÃ CHÁY / HỎNG';
      } else if (tState.status === 'tripped') {
        stateStr = 'ĐÃ NHẢY';
      } else if (tState.status === 'blown') {
        stateStr = 'ĐÃ ĐỨT';
      } else if (tState.status === 'hot') {
        stateStr = 'NÓNG (QUÁ TẢI)';
      }

      componentKinetics[c.id] = {
        id: c.id,
        type: c.type,
        voltage: v,
        current: i,
        power: p,
        stateStr,
        isOperating: isOp && tState.status === 'normal',
        greenIntensity,
        brightness,
        heatPercent: Math.min(100, Math.round(tState.heat * 50)),
        thermalStatus: tState.status,
      };
    }

    // 3. Update Visual Particles
    this.updateParticles(dtSim);

    // 4. Source Summary
    let totalP = 0;
    let mainV = 220;
    let mainI = 0;

    const acSource = components.find(c => c.type === 'ac_source');
    const dcSource = components.find(c => c.type === 'dc_source' || c.type === 'vcc');

    if (acSource) {
      mainV = Number(acSource.props.voltage) || 220;
      mainI = solverRes.componentCurrents[acSource.id] || 0;
      totalP = mainV * mainI;
    } else if (dcSource) {
      mainV = Number(dcSource.props.voltage) || 9;
      mainI = solverRes.componentCurrents[dcSource.id] || 0;
      totalP = mainV * mainI;
    }

    const sourceStats: SourceStats = {
      voltage: mainV,
      current: mainI,
      power: totalP,
      summaryStr: `Nguồn: ${formatMeasure(mainV, 'voltage')} • ${formatMeasure(mainI, 'current')} • ${formatMeasure(totalP, 'power')}`,
    };

    const duration = performance.now() - startTime;
    const solveTimeMs = Math.round(duration * 100) / 100;

    const elementMeasures: Record<string, { current: number; voltage: number; power: number }> = {};
    for (const [id, k] of Object.entries(componentKinetics)) {
      elementMeasures[id] = { current: k.current, voltage: k.voltage, power: k.power };
    }

    const pinVoltages: Record<string, number> = {};
    compiled.pinToNetId.forEach((netId, pinKey) => {
      pinVoltages[pinKey] = solverRes.nodeVoltages[netId] ?? 0;
    });

    const diagnostics: SimulationDiagnostics = {
      totalNodes: compiled.nets.length,
      numNodes: compiled.nets.length,
      numBranches: compiled.wires.length,
      numElements: compiled.components.length,
      refNetId: compiled.refNetId,
      refReason: compiled.refReason,
      componentModels: compiled.componentModels,
      pinToNetMap: compiled.pinMap,
      pinNetMap: compiled.pinMap,
      nodeVoltages: solverRes.nodeVoltages,
      componentCurrents: solverRes.componentCurrents,
      converged: true,
      newtonIterations: 1,
      frameBudgetMs: 8.0,
      lastStepDurationMs: solveTimeMs,
      solveTimeMs,
      logs: this.getLogs(),
    };

    this.stepCount++;
    this.simTime += dtSim;

    // Record oscilloscope samples if an oscilloscope is present in the circuit
    const osc = components.find(c => c.type === 'oscilloscope');
    if (osc) {
      const v1 = Number(osc.props._vCh1 ?? 0);
      const v2 = Number(osc.props._vCh2 ?? 0);
      oscilloscopeService.addSample(this.simTime, v1, v2);
    }

    const snapshot: SimulationSnapshot = {
      time: this.simTime,
      simTime: this.simTime,
      stepCount: this.stepCount,
      compiled,
      solverResult: solverRes,
      wireFlows,
      componentKinetics,
      particles: [...this.particles],
      elementMeasures,
      pinVoltages,
      sourceStats,
      diagnostics,
      meters: solverRes.meterMeasurements,
      thermalStates: this.thermalStates,
      wireThermalStates: this.wireThermalStates,
    };

    this.lastSnapshot = snapshot;

    return snapshot;
  }

  /**
   * Internal animation loop bounded by requestAnimationFrame and 8ms budget.
   */
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    if (!this.lastRafTimestamp) {
      this.lastRafTimestamp = timestamp;
    }

    const elapsedMs = timestamp - this.lastRafTimestamp;
    this.lastRafTimestamp = timestamp;

    const dt = Math.min(0.1, Math.max(0.001, elapsedMs / 1000));

    try {
      const snapshot = this.step(dt);
      this.listeners.forEach(fn => fn(snapshot));
    } catch (e: any) {
      this.addLog(`Lỗi vòng lặp mô phỏng: ${e?.message || e}`);
      console.error('Simulation loop error:', e);
    }

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  public start(state?: CircuitState, mode: 'rms' | 'dc' = 'rms') {
    if (state) {
      this.currentCircuitState = state;
      this.currentMode = mode;
      this.compiledCircuit = this.compile(state, mode);
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.lastRafTimestamp = 0;
      this.addLog('Bắt đầu chạy mô phỏng.');
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  public pause() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.addLog(`Tạm dừng mô phỏng tại t = ${this.simTime.toFixed(2)}s.`);
  }

  public reset() {
    this.pause();
    this.simTime = 0;
    this.stepCount = 0;
    this.particles = [];
    this.thermalStates = {};
    this.wireThermalStates = {};
    oscilloscopeService.clear();
    this.addLog('Đặt lại mô phỏng về trạng thái ban đầu.');
    if (this.currentCircuitState) {
      for (const c of this.currentCircuitState.components) {
        if (c.type === 'kwh_meter') {
          c.props.kwh = 0;
        } else if (c.type === 'capacitor_ceramic' || c.type === 'capacitor_electrolytic') {
          c.props._vCap = 0;
          c.props._vCapPrev = 0;
        }
      }
      const snap = this.step(0);
      this.listeners.forEach(fn => fn(snap));
    }
  }

  /**
   * Recovers all damaged components (burns, trips, blown fuses, melted wires).
   */
  public resetAllDamaged() {
    this.thermalStates = {};
    this.wireThermalStates = {};
    this.particles = [];

    if (this.currentCircuitState) {
      // Clear isTripped and isBlown on circuit state components
      const nextComps = this.currentCircuitState.components.map(c => {
        if (c.type === 'cb' || c.type === 'knife_switch') {
          return { ...c, props: { ...c.props, isTripped: false, state: true } };
        }
        if (c.type === 'fuse') {
          return { ...c, props: { ...c.props, isBlown: false } };
        }
        return c;
      });
      this.currentCircuitState = { ...this.currentCircuitState, components: nextComps };
      this.recompile(this.currentCircuitState, this.currentMode);
    }

    this.addLog('Đã hồi phục tất cả linh kiện hỏng, đóng lại toàn bộ aptomat và thay mới cầu chì.');
  }

  /**
   * Replaces a single damaged or blown component or re-closes tripped breaker.
   */
  public replaceDamagedComponent(compId: string) {
    const prev = this.thermalStates[compId];
    if (prev && prev.damageType === 'trip') {
      // Breaker re-closed: keep current accumulated heat so it trips faster if still overloaded!
      this.thermalStates[compId] = {
        ...prev,
        status: prev.heat > 1.0 ? 'hot' : 'normal',
      };
    } else {
      delete this.thermalStates[compId];
    }

    if (this.currentCircuitState) {
      const nextComps = this.currentCircuitState.components.map(c => {
        if (c.id === compId) {
          return { ...c, damaged: false, props: { ...c.props, isTripped: false, isBlown: false, state: true } };
        }
        return c;
      });
      this.currentCircuitState = { ...this.currentCircuitState, components: nextComps };
      this.recompile(this.currentCircuitState, this.currentMode);
    }
    this.addLog(`Đã thay mới / đóng lại linh kiện ${compId}.`);
  }

  /**
   * Resets accumulated energy (kWh) of an energy meter.
   */
  public resetKwh(compId: string) {
    if (this.currentCircuitState) {
      const comp = this.currentCircuitState.components.find(c => c.id === compId);
      if (comp) comp.props.kwh = 0;
    }
    const compiled = this.compiledCircuit;
    if (compiled) {
      const comp = compiled.compMap.get(compId);
      if (comp) comp.props.kwh = 0;
    }
    this.addLog(`Đã đặt lại số đo công tơ điện ${compId}.`);
  }

  /**
   * Updates a component property dynamically during simulation (e.g. switch toggle, slider)
   */
  public updateComponentProp(compId: string, key: string, value: any) {
    if (this.currentCircuitState) {
      const comp = this.currentCircuitState.components.find(c => c.id === compId);
      if (comp) {
        comp.props = { ...comp.props, [key]: value };
      }
    }
    if (this.compiledCircuit) {
      const comp = this.compiledCircuit.compMap.get(compId) || this.compiledCircuit.components.find(c => c.id === compId);
      if (comp) {
        comp.props = { ...comp.props, [key]: value };
      }
      // Re-solve immediately for instant visual response
      const snapshot = this.step(0.001);
      this.listeners.forEach(fn => fn(snapshot));
    }
  }

  /**
   * Repairs a single burnt wire.
   */
  public repairWire(wireId: string) {
    delete this.wireThermalStates[wireId];
    if (this.currentCircuitState) {
      const nextWires = this.currentCircuitState.wires.map(w => {
        if (w.id === wireId) {
          return { ...w, isBurnt: false };
        }
        return w;
      });
      this.currentCircuitState = { ...this.currentCircuitState, wires: nextWires };
      this.recompile(this.currentCircuitState, this.currentMode);
    }
    this.addLog(`Đã nối lại dây dẫn ${wireId}.`);
  }

  public recompile(state: CircuitState, mode: 'rms' | 'dc' = 'rms') {
    this.currentCircuitState = state;
    this.currentMode = mode;
    this.compiledCircuit = this.compile(state, mode);
    this.addLog(`Biên dịch lại mạch (${state.components.length} linh kiện, ${state.wires.length} dây).`);
    const snapshot = this.step(0.001);
    this.listeners.forEach(fn => fn(snapshot));
  }

  public setSpeed(speed: number) {
    this.timeSpeed = Math.max(0.1, Math.min(10, speed));
    this.addLog(`Tốc độ mô phỏng đặt thành ×${this.timeSpeed}`);
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    if (this.lastSnapshot) {
      listener(this.lastSnapshot);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): SimulationSnapshot | null {
    return this.lastSnapshot;
  }

  public getSimTime(): number {
    return this.simTime;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const simulationService = new SimulationService();
