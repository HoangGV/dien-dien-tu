import { create } from 'zustand';
import {
  CircuitState,
  ComponentInstance,
  Wire,
  Junction,
  ViewportState,
  WorkspaceConfig,
  Point,
  Endpoint,
  LintWarning,
  WireType,
  CircuitViewMode,
  FloorPlanData,
  FloorDoor,
  FloorWall,
} from '../core/model';
import { HistoryManager, DEFAULT_HISTORY_LIMIT } from '../core/history';
import { StorageService, createDebouncedSaver, StorageStats } from '../core/storage';
import { getWorkspaceBySlug, WORKSPACE_HOUSEHOLD } from '../core/workspaces';
import { COMPONENT_MAP, getComponentDef } from '../core/registry';
import { snapToGrid, snapPointToGrid, pinWorldPos } from '../core/geometry';
import {
  normalizePolyline,
  routeOrthogonal,
  splitWireAtJunction,
  updateWireOnComponentMoved,
  dragWireSegment,
} from '../core/wiring';
import { extractNetlist, lintCircuit, getComponentPins } from '../core/netlist';
import { migrateCircuitState } from '../core/migration';
import { solveCircuit } from '../core/solver';
import { simulationService, SimulationSnapshot } from '../core/simulationService';
import { oscilloscopeService } from '../core/oscilloscopeService';
import { runLogicSimulation, LogicSimulationResult } from '../core/logicSimulator';

const storage = StorageService.getInstance();
const history = new HistoryManager(DEFAULT_HISTORY_LIMIT);

const defaultViewport: ViewportState = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const defaultFloorPlan: FloorPlanData = {
  name: 'MẶT BẰNG PHÒNG',
  widthM: 5,
  lengthM: 4,
  x: 80,
  y: 80,
  doors: [
    { id: 'door1', wall: 'bottom', offset: 1.0, width: 0.9 },
  ],
  partitionWalls: [],
};

const initialCircuitState: CircuitState = {
  components: [],
  wires: [],
  junctions: [],
  viewport: { ...defaultViewport },
  floorPlan: { ...defaultFloorPlan },
};

const autoSaver = createDebouncedSaver((slug, state) => {
  return storage.saveCircuit(slug, state);
}, 500);

export type ActiveTool = 'select' | 'wire' | 'delete' | 'pan';
export type EditorMode =
  | 'idle'
  | 'placing'
  | 'draggingComponent'
  | 'rotatingComponent'
  | 'marquee'
  | 'wiring'
  | 'draggingSegment'
  | 'panning';

export interface WiringDraft {
  from: Endpoint;
  startPos: Point;
  waypoints: Point[];
  currentPos: Point;
  horizontalFirst: boolean;
}

interface WorkspaceStore {
  activeSlug: string;
  config: WorkspaceConfig;
  circuit: CircuitState;
  isSimulating: boolean;
  soundEnabled: boolean;
  allowDiagonalWires: boolean;
  showGrid: boolean;
  showWireLabels: boolean;
  fullFrameMode: boolean;
  timeSpeed: number;
  viewMode: CircuitViewMode;
  showFloorPlan: boolean;
  wireSummaryOpen: boolean;
  floorPlanModalOpen: boolean;
  wireAuditModalOpen: boolean;
  colorWiresByLoad: boolean;
  drawingWall: boolean;
  selectedWallId: string | null;

  activeTool: ActiveTool;
  editorMode: EditorMode;
  selectedComponentIds: string[];
  selectedWireIds: string[];
  placingType: string | null;
  wiringDraft: WiringDraft | null;
  draggedSegment: { wireId: string; segIndex: number; initialPoints: Point[] } | null;
  rotatingComponent: { compId: string; initialRot: number; startAngle: number; currentAngle: number } | null;

  hoveredNetId: string | null;
  hoveredPin: { compId: string; pinId: string } | null;
  hoveredWireId: string | null;

  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  oscilloscopePanelOpen: boolean;
  toggleOscilloscopePanel: () => void;
  setOscilloscopePanelOpen: (open: boolean) => void;

  canUndo: boolean;
  canRedo: boolean;
  lintWarnings: LintWarning[];
  statusMessage: string | null;
  storageStats: StorageStats | null;

  // Live Simulation state
  simTime: number;
  sourceSummaryStr: string;
  simulationSnapshot: SimulationSnapshot | null;
  showMeterOverlay: boolean;

  // Actions
  loadWorkspace: (slug: string) => Promise<void>;
  setCircuit: (state: CircuitState, recordHistory?: boolean) => void;
  updateViewport: (vp: Partial<ViewportState>) => void;
  setTool: (tool: ActiveTool) => void;
  setEditorMode: (mode: EditorMode) => void;
  toggleSimulating: () => void;
  stopSimulating: () => void;
  resetSimulation: () => void;
  toggleShowMeterOverlay: () => void;
  toggleSound: () => void;
  toggleDiagonalWires: () => void;
  toggleShowGrid: () => void;
  toggleWireLabels: () => void;
  toggleFullFrame: () => void;
  setTimeSpeed: (speed: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  closeRightPanel: () => void;
  setStatusMessage: (msg: string | null) => void;
  setViewMode: (mode: CircuitViewMode) => void;
  toggleViewMode: () => void;
  toggleShowFloorPlan: () => void;
  setWireSummaryOpen: (open: boolean) => void;
  setFloorPlanModalOpen: (open: boolean) => void;
  setWireAuditModalOpen: (open: boolean) => void;
  setColorWiresByLoad: (enable: boolean) => void;
  toggleColorWiresByLoad: () => void;
  updateFloorPlan: (patch: Partial<FloorPlanData>) => void;
  addFloorDoor: (door: Omit<FloorDoor, 'id'>) => void;
  removeFloorDoor: (doorId: string) => void;
  addFloorWall: (wall: Omit<FloorWall, 'id'>) => void;
  removeFloorWall: (wallId: string) => void;
  setDrawingWall: (drawing: boolean) => void;
  setSelectedWallId: (id: string | null) => void;
  moveJunction: (junctionId: string, x: number, y: number) => void;

  // Digital Logic state & actions
  logicResult: LogicSimulationResult | null;
  truthTableModalOpen: boolean;
  setTruthTableModalOpen: (open: boolean) => void;
  evaluateLogic: () => void;

  // Component Actions
  setPlacingType: (type: string | null) => void;
  placeComponent: (type: string, pos: Point) => void;
  selectComponent: (id: string, isShift?: boolean) => void;
  selectWire: (id: string, isShift?: boolean) => void;
  selectBox: (compIds: string[], wireIds: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  rotateSelected: (deltaDeg?: number) => void;
  setComponentRotation: (compId: string, rotDeg: number) => void;
  flipSelected: (axis?: 'x' | 'y') => void;
  nudgeSelected: (dx: number, dy: number) => void;
  moveComponents: (compIds: string[], dx: number, dy: number, commitHistory?: boolean) => void;
  updateComponentProp: (compId: string, key: string, value: any) => void;
  updateComponentLabel: (compId: string, label: string) => void;
  setPEForSelected: (enabled: boolean) => void;
  toggleAllPE: (enabled?: boolean) => void;
  copySelected: () => void;
  pasteSelected: () => void;
  duplicateSelected: () => void;
  restoreAllDamaged: () => void;
  replaceDamagedComponent: (id: string) => void;
  repairWire: (wireId: string) => void;

  // Rotation Handle
  startRotating: (compId: string, pointerAngle: number) => void;
  updateRotating: (pointerAngle: number, altKey?: boolean) => void;
  finishRotating: () => void;

  // Wiring Actions
  startWiring: (from: Endpoint, startPos: Point) => void;
  updateWiringPointer: (pos: Point) => void;
  addWiringWaypoint: (pt: Point) => void;
  undoWiringWaypoint: () => void;
  toggleWiringDirection: () => void;
  cancelWiring: () => void;
  finishWiring: (to: Endpoint, endPos: Point) => void;
  finishWiringOnExistingWire: (existingWireId: string, clickPt: Point) => void;
  startDraggingSegment: (wireId: string, segIndex: number) => void;
  updateDraggingSegment: (newCoord: number) => void;
  finishDraggingSegment: () => void;
  rerouteWireAuto: (wireId: string) => void;
  updateWireProps: (wireId: string, color: string, crossSection: number) => void;
  setWireType: (wireId: string, wireType: WireType) => void;
  resetKwh: (compId: string) => void;

  // Netlist & Linter
  setHoveredPin: (pin: { compId: string; pinId: string } | null) => void;
  setHoveredWire: (wireId: string | null) => void;
  runLint: () => LintWarning[];

  // Undo / Redo / Storage
  undo: () => void;
  redo: () => void;
  commitHistory: () => void;
  clearWorkspaceCircuit: () => Promise<void>;
  refreshStorageStats: () => Promise<void>;
}

let clipboard: { components: ComponentInstance[]; wires: Wire[] } | null = null;
let recompileTimer: any = null;
let lastUiThrottleTime = 0;

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  activeSlug: WORKSPACE_HOUSEHOLD.slug,
  config: WORKSPACE_HOUSEHOLD,
  circuit: initialCircuitState,
  isSimulating: false,
  soundEnabled: false,
  allowDiagonalWires: false,
  showGrid: true,
  showWireLabels: true,
  fullFrameMode: false,
  timeSpeed: 1,
  viewMode: 'schematic',
  showFloorPlan: true,
  wireSummaryOpen: false,
  floorPlanModalOpen: false,
  wireAuditModalOpen: false,
  colorWiresByLoad: false,
  drawingWall: false,
  selectedWallId: null,
  logicResult: null,
  truthTableModalOpen: false,

  activeTool: 'select',
  editorMode: 'idle',
  selectedComponentIds: [],
  selectedWireIds: [],
  placingType: null,
  wiringDraft: null,
  draggedSegment: null,
  rotatingComponent: null,

  hoveredNetId: null,
  hoveredPin: null,
  hoveredWireId: null,

  leftPanelOpen: true,
  rightPanelOpen: false,
  oscilloscopePanelOpen: false,

  canUndo: false,
  canRedo: false,
  lintWarnings: [],
  statusMessage: null,
  storageStats: null,
  simTime: 0,
  sourceSummaryStr: 'Nguồn: 0 V • 0 A • 0 W',
  simulationSnapshot: null,
  showMeterOverlay: true,

  loadWorkspace: async (slug: string) => {
    const config = getWorkspaceBySlug(slug) || WORKSPACE_HOUSEHOLD;
    let rawSaved: CircuitState | null = null;

    if (slug === '_thu') {
      try {
        const item = sessionStorage.getItem('circuit__thu');
        if (item) {
          rawSaved = JSON.parse(item);
        }
      } catch (e) {
        console.warn('Error reading from sessionStorage for _thu:', e);
      }
    } else {
      rawSaved = await storage.loadCircuit(slug);
    }

    history.clear();

    const baseState: CircuitState = rawSaved || {
      components: [],
      wires: [],
      junctions: [],
      viewport: { ...defaultViewport },
    };

    // Apply auto-migration to unify LEDs, poles, and TCVN standards
    const migrated = migrateCircuitState(baseState, slug);

    let initialViewMode: CircuitViewMode = 'schematic';
    if (config.installView) {
      try {
        const savedVm = localStorage.getItem('cn-dien:v1:view_mode_' + slug);
        if (savedVm === 'installation') initialViewMode = 'installation';
      } catch {}
    }

    set({
      activeSlug: slug,
      config,
      circuit: migrated,
      viewMode: initialViewMode,
      isSimulating: false,
      selectedComponentIds: [],
      selectedWireIds: [],
      wiringDraft: null,
      placingType: null,
      editorMode: 'idle',
      canUndo: false,
      canRedo: false,
      rightPanelOpen: false,
      statusMessage: null,
    });

    get().refreshStorageStats();
    get().runLint();
    get().evaluateLogic();
  },

  setCircuit: (state: CircuitState, recordHistory = true) => {
    const current = get().circuit;
    if (recordHistory) {
      history.push(current);
    }
    set({
      circuit: state,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
    if (get().activeSlug === '_thu') {
      try {
        sessionStorage.setItem('circuit__thu', JSON.stringify(state));
      } catch (e) {
        // ignore
      }
    } else {
      autoSaver.schedule(get().activeSlug, state);
    }
    const hasAc = state.components.some(c => c.type === 'ac_source');
    const isDcMode = (get().config?.mode || 'rms') === 'dc';
    if (hasAc && isDcMode) {
      get().setTimeSpeed(0.1);
    }
    const hasOsc = state.components.some(c => c.type === 'oscilloscope');
    if (hasOsc) {
      oscilloscopeService.autoScale(state.components);
    }
    get().evaluateLogic();

    // Sửa mạch khi đang chạy: tự biên dịch lại sau 100 ms debounce, giữ trạng thái động học
    if (get().isSimulating) {
      if (recompileTimer) clearTimeout(recompileTimer);
      recompileTimer = setTimeout(() => {
        simulationService.recompile(state, get().config.mode === 'rms' ? 'rms' : 'dc');
      }, 100);
    }
  },

  commitHistory: () => {
    history.push(get().circuit);
    set({
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
    if (get().activeSlug === '_thu') {
      try {
        sessionStorage.setItem('circuit__thu', JSON.stringify(get().circuit));
      } catch (e) {
        // ignore
      }
    } else {
      autoSaver.schedule(get().activeSlug, get().circuit);
    }
    get().runLint();
  },

  updateViewport: (vp: Partial<ViewportState>) => {
    set(s => ({
      circuit: {
        ...s.circuit,
        viewport: {
          ...s.circuit.viewport,
          ...vp,
        },
      },
    }));
  },

  setTool: (tool: ActiveTool) => {
    set({
      activeTool: tool,
      placingType: null,
      wiringDraft: null,
      editorMode: tool === 'pan' ? 'panning' : 'idle',
    });
  },

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
  },

  toggleSimulating: () => {
    const isNowSim = !get().isSimulating;
    if (isNowSim) {
      // 1. Kiểm tra lỗi vi phạm quy tắc mạch (lint)
      const warnings = get().runLint();
      const hasErrors = warnings.some(w => w.type === 'error');
      if (hasErrors) {
        const firstErr = warnings.find(w => w.type === 'error');
        set({
          statusMessage: firstErr ? `Mạch có lỗi: ${firstErr.message}` : 'Mạch điện có lỗi cần sửa trước khi chạy.',
          selectedComponentIds: firstErr?.targetCompId ? [firstErr.targetCompId] : [],
          selectedWireIds: firstErr?.targetWireId ? [firstErr.targetWireId] : [],
          hoveredPin: firstErr?.targetCompId && firstErr?.targetPinId ? { compId: firstErr.targetCompId, pinId: firstErr.targetPinId } : null,
        });
        return;
      }

      const { circuit, config } = get();
      simulationService.start(circuit, config.mode === 'rms' ? 'rms' : 'dc');
      const snapshot = simulationService.getSnapshot();

      if (snapshot?.solverResult?.openCircuit?.isOpen) {
        set({
          isSimulating: true,
          statusMessage: snapshot.solverResult.openCircuit.reason,
        });
      } else {
        set({
          isSimulating: true,
          statusMessage: 'Mạch kín. Dòng điện hoạt động danh định bình thường.',
        });
      }
    } else {
      simulationService.pause();
      set({ isSimulating: false, statusMessage: 'ĐÃ DỪNG MÔ PHỎNG' });
    }
  },

  stopSimulating: () => {
    simulationService.pause();
    set({ isSimulating: false, statusMessage: 'ĐÃ DỪNG MÔ PHỎNG' });
  },

  resetSimulation: () => {
    simulationService.reset();
    const { circuit } = get();
    const nextComponents = circuit.components.map(c => {
      if (c.type === 'kwh_meter') {
        return { ...c, props: { ...c.props, kwh: 0 } };
      }
      return c;
    });
    set({ circuit: { ...circuit, components: nextComponents }, isSimulating: false, simTime: 0, statusMessage: null });
  },

  toggleShowMeterOverlay: () => {
    set(s => ({ showMeterOverlay: !s.showMeterOverlay }));
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    simulationService.setAudioEnabled(next);
    set({ soundEnabled: next });
  },

  toggleDiagonalWires: () => {
    set(s => ({ allowDiagonalWires: !s.allowDiagonalWires }));
  },

  toggleShowGrid: () => {
    set(s => ({ showGrid: !s.showGrid }));
  },

  toggleWireLabels: () => {
    set(s => ({ showWireLabels: !s.showWireLabels }));
  },

  toggleFullFrame: () => {
    set(s => ({ fullFrameMode: !s.fullFrameMode }));
  },

  setTimeSpeed: (speed: number) => {
    set({ timeSpeed: speed });
  },

  toggleLeftPanel: () => {
    set(s => ({ leftPanelOpen: !s.leftPanelOpen }));
  },

  toggleRightPanel: () => {
    set(s => ({ rightPanelOpen: !s.rightPanelOpen }));
  },

  closeRightPanel: () => {
    set({ rightPanelOpen: false });
  },

  toggleOscilloscopePanel: () => {
    set(s => {
      const next = !s.oscilloscopePanelOpen;
      if (next) {
        oscilloscopeService.autoScale(s.circuit.components);
      }
      return { oscilloscopePanelOpen: next };
    });
  },

  setOscilloscopePanelOpen: (open: boolean) => {
    if (open) {
      oscilloscopeService.autoScale(get().circuit.components);
    }
    set({ oscilloscopePanelOpen: open });
  },

  setStatusMessage: (msg: string | null) => {
    set({ statusMessage: msg });
  },

  setViewMode: (mode: CircuitViewMode) => {
    const { config, activeSlug, circuit } = get();
    if (!config.installView && mode === 'installation') {
      return;
    }

    // When switching to installation mode, ensure all components have install positions initialized
    if (mode === 'installation') {
      let changed = false;
      const nextComponents = circuit.components.map(c => {
        if (!c.install) {
          changed = true;
          return {
            ...c,
            install: { x: c.x, y: c.y, rot: c.rot },
          };
        }
        return c;
      });
      if (changed) {
        set({ circuit: { ...circuit, components: nextComponents } });
      }
    }

    try {
      localStorage.setItem(`cn-dien:v1:view_mode_${activeSlug}`, mode);
    } catch {}
    set({ viewMode: mode });
  },

  toggleViewMode: () => {
    const { viewMode } = get();
    get().setViewMode(viewMode === 'installation' ? 'schematic' : 'installation');
  },

  toggleShowFloorPlan: () => {
    set(s => ({ showFloorPlan: !s.showFloorPlan }));
  },

  setWireSummaryOpen: (open: boolean) => {
    set({ wireSummaryOpen: open });
  },

  setFloorPlanModalOpen: (open: boolean) => {
    set({ floorPlanModalOpen: open });
  },

  setWireAuditModalOpen: (open: boolean) => {
    set({ wireAuditModalOpen: open });
  },

  setColorWiresByLoad: (enable: boolean) => {
    set({ colorWiresByLoad: enable });
  },

  toggleColorWiresByLoad: () => {
    set((s) => ({ colorWiresByLoad: !s.colorWiresByLoad }));
  },

  updateFloorPlan: (patch: Partial<FloorPlanData>) => {
    const { circuit, activeSlug } = get();
    const currentFp = circuit.floorPlan || defaultFloorPlan;
    const nextFp: FloorPlanData = {
      ...currentFp,
      ...patch,
      doors: patch.doors ? patch.doors : currentFp.doors,
      partitionWalls: patch.partitionWalls ? patch.partitionWalls : currentFp.partitionWalls,
    };
    const nextCircuit = {
      ...circuit,
      floorPlan: nextFp,
    };
    history.push(nextCircuit);
    autoSaver.schedule(activeSlug, nextCircuit);
    set({ circuit: nextCircuit, canUndo: history.canUndo(), canRedo: history.canRedo() });
  },

  addFloorDoor: (doorData: Omit<FloorDoor, 'id'>) => {
    const { circuit, activeSlug } = get();
    const currentFp = circuit.floorPlan || defaultFloorPlan;
    const newDoor: FloorDoor = {
      ...doorData,
      id: `door_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    const nextFp: FloorPlanData = {
      ...currentFp,
      doors: [...(currentFp.doors || []), newDoor],
    };
    const nextCircuit = { ...circuit, floorPlan: nextFp };
    history.push(nextCircuit);
    autoSaver.schedule(activeSlug, nextCircuit);
    set({ circuit: nextCircuit, canUndo: history.canUndo(), canRedo: history.canRedo() });
  },

  removeFloorDoor: (doorId: string) => {
    const { circuit, activeSlug } = get();
    if (!circuit.floorPlan) return;
    const nextFp: FloorPlanData = {
      ...circuit.floorPlan,
      doors: circuit.floorPlan.doors.filter((d) => d.id !== doorId),
    };
    const nextCircuit = { ...circuit, floorPlan: nextFp };
    history.push(nextCircuit);
    autoSaver.schedule(activeSlug, nextCircuit);
    set({ circuit: nextCircuit, canUndo: history.canUndo(), canRedo: history.canRedo() });
  },

  addFloorWall: (wallData: Omit<FloorWall, 'id'>) => {
    const { circuit, activeSlug } = get();
    const currentFp = circuit.floorPlan || defaultFloorPlan;
    const newWall: FloorWall = {
      ...wallData,
      id: `wall_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    const nextFp: FloorPlanData = {
      ...currentFp,
      partitionWalls: [...(currentFp.partitionWalls || []), newWall],
    };
    const nextCircuit = { ...circuit, floorPlan: nextFp };
    history.push(nextCircuit);
    autoSaver.schedule(activeSlug, nextCircuit);
    set({
      circuit: nextCircuit,
      selectedWallId: newWall.id,
      drawingWall: false,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  removeFloorWall: (wallId: string) => {
    const { circuit, activeSlug } = get();
    if (!circuit.floorPlan) return;
    const nextFp: FloorPlanData = {
      ...circuit.floorPlan,
      partitionWalls: (circuit.floorPlan.partitionWalls || []).filter((w) => w.id !== wallId),
    };
    const nextCircuit = { ...circuit, floorPlan: nextFp };
    history.push(nextCircuit);
    autoSaver.schedule(activeSlug, nextCircuit);
    set({
      circuit: nextCircuit,
      selectedWallId: null,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  setDrawingWall: (drawing: boolean) => {
    set({ drawingWall: drawing });
  },

  setSelectedWallId: (id: string | null) => {
    set({ selectedWallId: id });
  },

  moveJunction: (junctionId: string, x: number, y: number) => {
    const { circuit, viewMode } = get();
    const nextJunctions = circuit.junctions.map(j => {
      if (j.id !== junctionId) return j;
      if (viewMode === 'installation') {
        return {
          ...j,
          install: {
            x: Math.round(x / 10) * 10,
            y: Math.round(y / 10) * 10,
          },
        };
      }
      return {
        ...j,
        x: snapToGrid(x),
        y: snapToGrid(y),
      };
    });
    const nextState = { ...circuit, junctions: nextJunctions };
    set({ circuit: nextState });
    autoSaver.schedule(get().activeSlug, nextState);
    get().evaluateLogic();
  },

  setTruthTableModalOpen: (open: boolean) => set({ truthTableModalOpen: open }),

  evaluateLogic: () => {
    const { circuit, config } = get();
    if (config?.mode === 'logic' || circuit.components.some(c => c.type.startsWith('logic_'))) {
      const res = runLogicSimulation(circuit);
      set({ logicResult: res });
      if (res.warning) {
        get().setStatusMessage(res.warning);
      }
    }
  },

  // ---------------- COMPONENT OPERATIONS ----------------
  setPlacingType: (type: string | null) => {
    if (get().viewMode === 'installation' && type !== null) {
      get().setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    set({
      placingType: type,
      editorMode: type ? 'placing' : 'idle',
    });
  },

  placeComponent: (type: string, pos: Point) => {
    if (get().viewMode === 'installation') {
      get().setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    const { circuit } = get();
    const def = getComponentDef(type);
    if (!def) return;

    history.push(circuit);

    const count = circuit.components.filter(c => c.type === type).length + 1;
    let label = `${def.refPrefix}${count}`;
    if (type === 'logic_switch') {
      const switchCount = circuit.components.filter(c => c.type === 'logic_switch').length;
      label = String.fromCharCode(65 + (switchCount % 26));
    }

    const currentMode = get().config?.mode || 'rms';
    const initialProps = { ...(def.defaultProps || {}) };
    if (type === 'ac_source' && currentMode === 'dc') {
      initialProps.peakVoltage = 5;
      initialProps.frequency = 50;
      initialProps.dcOffset = 0;
      initialProps.phase = 0;
      delete initialProps.voltage;
      delete initialProps.hasPE;
    }

    const newComp: ComponentInstance = {
      id: `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x: snapToGrid(pos.x),
      y: snapToGrid(pos.y),
      rot: 0,
      flip: false,
      flipY: false,
      label,
      props: initialProps,
      install: {
        x: snapToGrid(pos.x),
        y: snapToGrid(pos.y),
        rot: 0,
      },
    };

    const nextState: CircuitState = {
      ...circuit,
      components: [...circuit.components, newComp],
    };

    const nextTimeSpeed = type === 'ac_source' && currentMode === 'dc' ? 0.1 : get().timeSpeed;
    if (type === 'ac_source' && currentMode === 'dc') {
      simulationService.setTimeSpeed(0.1);
    }

    set({
      circuit: nextState,
      selectedComponentIds: [newComp.id],
      selectedWireIds: [],
      rightPanelOpen: true,
      timeSpeed: nextTimeSpeed,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
    get().evaluateLogic();
  },

  selectComponent: (id: string, isShift = false) => {
    set(s => {
      const comp = s.circuit.components.find(c => c.id === id);
      const isOsc = comp?.type === 'oscilloscope';
      if (isOsc && !s.oscilloscopePanelOpen) {
        oscilloscopeService.autoScale(s.circuit.components);
      }
      if (isShift) {
        const exists = s.selectedComponentIds.includes(id);
        const nextIds = exists
          ? s.selectedComponentIds.filter(cid => cid !== id)
          : [...s.selectedComponentIds, id];
        return {
          selectedComponentIds: nextIds,
          rightPanelOpen: nextIds.length > 0,
          oscilloscopePanelOpen: isOsc ? true : s.oscilloscopePanelOpen,
        };
      }
      return {
        selectedComponentIds: [id],
        selectedWireIds: [],
        rightPanelOpen: true,
        oscilloscopePanelOpen: isOsc ? true : s.oscilloscopePanelOpen,
      };
    });
  },

  selectWire: (id: string, isShift = false) => {
    set(s => {
      if (isShift) {
        const exists = s.selectedWireIds.includes(id);
        const nextIds = exists
          ? s.selectedWireIds.filter(wid => wid !== id)
          : [...s.selectedWireIds, id];
        return {
          selectedWireIds: nextIds,
          rightPanelOpen: nextIds.length > 0,
        };
      }
      return {
        selectedWireIds: [id],
        selectedComponentIds: [],
        rightPanelOpen: true,
      };
    });
  },

  selectBox: (compIds: string[], wireIds: string[]) => {
    set({
      selectedComponentIds: compIds,
      selectedWireIds: wireIds,
      rightPanelOpen: compIds.length > 0 || wireIds.length > 0,
    });
  },

  clearSelection: () => {
    set({
      selectedComponentIds: [],
      selectedWireIds: [],
      rightPanelOpen: false,
    });
  },

  selectAll: () => {
    const s = get().circuit;
    set({
      selectedComponentIds: s.components.map(c => c.id),
      selectedWireIds: s.wires.map(w => w.id),
      rightPanelOpen: s.components.length > 0 || s.wires.length > 0,
    });
  },

  deleteSelected: () => {
    if (get().viewMode === 'installation') {
      get().setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    const { circuit, selectedComponentIds, selectedWireIds } = get();
    if (selectedComponentIds.length === 0 && selectedWireIds.length === 0) return;

    history.push(circuit);

    const deletedCompSet = new Set(selectedComponentIds);
    const deletedWireSet = new Set(selectedWireIds);

    const nextComponents = circuit.components.filter(c => !deletedCompSet.has(c.id));

    const nextWires = circuit.wires.filter(w => {
      if (deletedWireSet.has(w.id)) return false;
      if (w.from.compId && deletedCompSet.has(w.from.compId)) return false;
      if (w.to.compId && deletedCompSet.has(w.to.compId)) return false;
      return true;
    });

    const connectedJunctionIds = new Set<string>();
    for (const w of nextWires) {
      if (w.from.junctionId) connectedJunctionIds.add(w.from.junctionId);
      if (w.to.junctionId) connectedJunctionIds.add(w.to.junctionId);
    }
    const nextJunctions = circuit.junctions.filter(j => connectedJunctionIds.has(j.id));

    const nextState: CircuitState = {
      ...circuit,
      components: nextComponents,
      wires: nextWires,
      junctions: nextJunctions,
    };

    set({
      circuit: nextState,
      selectedComponentIds: [],
      selectedWireIds: [],
      rightPanelOpen: false,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
    get().evaluateLogic();
  },

  rotateSelected: (deltaDeg = 90) => {
    const { circuit, selectedComponentIds, viewMode } = get();
    if (selectedComponentIds.length === 0) return;

    history.push(circuit);

    const selSet = new Set(selectedComponentIds);

    if (viewMode === 'installation') {
      const nextComponents = circuit.components.map(c => {
        if (!selSet.has(c.id)) return c;
        const curRot = c.install?.rot ?? c.rot;
        const rawRot = (curRot + deltaDeg) % 360;
        const nextRot = Math.round(((rawRot + 360) % 360) * 10) / 10;
        return {
          ...c,
          install: {
            x: c.install?.x ?? c.x,
            y: c.install?.y ?? c.y,
            rot: nextRot,
          },
        };
      });
      const nextState = { ...circuit, components: nextComponents };
      set({
        circuit: nextState,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
      autoSaver.schedule(get().activeSlug, nextState);
      get().runLint();
      return;
    }

    const selComps = circuit.components.filter(c => selSet.has(c.id));

    const centerX = snapToGrid(selComps.reduce((acc, c) => acc + c.x, 0) / selComps.length);
    const centerY = snapToGrid(selComps.reduce((acc, c) => acc + c.y, 0) / selComps.length);

    const nextComponents = circuit.components.map(c => {
      if (!selSet.has(c.id)) return c;
      const rawRot = (c.rot + deltaDeg) % 360;
      const nextRot = Math.round(((rawRot + 360) % 360) * 10) / 10;

      if (selComps.length > 1) {
        // Multi-select collective rotation around group center
        const rad = (deltaDeg * Math.PI) / 180;
        const dx = c.x - centerX;
        const dy = c.y - centerY;
        const rx = snapToGrid(centerX + (dx * Math.cos(rad) - dy * Math.sin(rad)));
        const ry = snapToGrid(centerY + (dx * Math.sin(rad) + dy * Math.cos(rad)));
        return { ...c, x: rx, y: ry, rot: nextRot };
      }

      return { ...c, rot: nextRot };
    });

    // Update wires
    let nextWires = [...circuit.wires];
    for (const c of nextComponents) {
      if (!selSet.has(c.id)) continue;
      const def = COMPONENT_MAP.get(c.type);
      const pins = getComponentPins(c, def);

      for (const pin of pins) {
        const pPos = pinWorldPos(c, pin.id, def);
        nextWires = nextWires.map(w => {
          if (w.from.compId === c.id && w.from.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, true);
          }
          if (w.to.compId === c.id && w.to.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, false);
          }
          return w;
        });
      }
    }

    const nextState = { ...circuit, components: nextComponents, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  setComponentRotation: (compId: string, rotDeg: number) => {
    const { circuit, viewMode } = get();
    history.push(circuit);

    const normRot = Math.round(((rotDeg % 360 + 360) % 360) * 10) / 10;

    if (viewMode === 'installation') {
      const nextComponents = circuit.components.map(c => {
        if (c.id !== compId) return c;
        return {
          ...c,
          install: {
            x: c.install?.x ?? c.x,
            y: c.install?.y ?? c.y,
            rot: normRot,
          },
        };
      });
      const nextState = { ...circuit, components: nextComponents };
      set({
        circuit: nextState,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
      autoSaver.schedule(get().activeSlug, nextState);
      get().runLint();
      return;
    }

    const nextComponents = circuit.components.map(c => {
      if (c.id !== compId) return c;
      return { ...c, rot: normRot };
    });

    // Update wires
    let nextWires = [...circuit.wires];
    const targetComp = nextComponents.find(c => c.id === compId);
    if (targetComp) {
      const def = COMPONENT_MAP.get(targetComp.type);
      const pins = getComponentPins(targetComp, def);

      for (const pin of pins) {
        const pPos = pinWorldPos(targetComp, pin.id, def);
        nextWires = nextWires.map(w => {
          if (w.from.compId === compId && w.from.pinId === pin.id) {
            return updateWireOnComponentMoved(w, compId, pPos, true);
          }
          if (w.to.compId === compId && w.to.pinId === pin.id) {
            return updateWireOnComponentMoved(w, compId, pPos, false);
          }
          return w;
        });
      }
    }

    const nextState = { ...circuit, components: nextComponents, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  flipSelected: (axis: 'x' | 'y' = 'x') => {
    const { circuit, selectedComponentIds } = get();
    if (selectedComponentIds.length === 0) return;

    history.push(circuit);

    const selSet = new Set(selectedComponentIds);
    const nextComponents = circuit.components.map(c => {
      if (!selSet.has(c.id)) return c;
      if (axis === 'y') {
        return { ...c, flipY: !c.flipY };
      }
      return { ...c, flip: !c.flip };
    });

    let nextWires = [...circuit.wires];
    for (const c of nextComponents) {
      if (!selSet.has(c.id)) continue;
      const def = COMPONENT_MAP.get(c.type);
      const pins = getComponentPins(c, def);

      for (const pin of pins) {
        const pPos = pinWorldPos(c, pin.id, def);
        nextWires = nextWires.map(w => {
          if (w.from.compId === c.id && w.from.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, true);
          }
          if (w.to.compId === c.id && w.to.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, false);
          }
          return w;
        });
      }
    }

    const nextState = { ...circuit, components: nextComponents, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  startRotating: (compId: string, pointerAngle: number) => {
    const comp = get().circuit.components.find(c => c.id === compId);
    if (!comp) return;

    const initialRot = get().viewMode === 'installation'
      ? (comp.install?.rot ?? comp.rot)
      : comp.rot;

    set({
      editorMode: 'rotatingComponent',
      rotatingComponent: {
        compId,
        initialRot,
        startAngle: pointerAngle,
        currentAngle: initialRot,
      },
    });
  },

  updateRotating: (pointerAngle: number, altKey = false) => {
    const { rotatingComponent } = get();
    if (!rotatingComponent) return;

    const angleDelta = pointerAngle - rotatingComponent.startAngle;
    let rawRot = (rotatingComponent.initialRot + angleDelta) % 360;
    if (rawRot < 0) rawRot += 360;

    // Snap to 15 deg steps unless Alt key is held
    const snappedRot = altKey ? Math.round(rawRot * 10) / 10 : Math.round(rawRot / 15) * 15;

    set({
      rotatingComponent: {
        ...rotatingComponent,
        currentAngle: snappedRot,
      },
    });

    // Live rotate component & attached wires
    get().setComponentRotation(rotatingComponent.compId, snappedRot);
  },

  finishRotating: () => {
    const { rotatingComponent } = get();
    if (rotatingComponent) {
      get().commitHistory();
    }
    set({
      editorMode: 'idle',
      rotatingComponent: null,
    });
  },

  moveComponents: (compIds: string[], dx: number, dy: number, commitHistory = false) => {
    const { circuit, viewMode } = get();
    if (compIds.length === 0) return;

    if (commitHistory) {
      history.push(circuit);
    }

    const setIds = new Set(compIds);

    if (viewMode === 'installation') {
      const snapDx = Math.round(dx / 10) * 10;
      const snapDy = Math.round(dy / 10) * 10;

      const nextComponents = circuit.components.map(c => {
        if (!setIds.has(c.id)) return c;
        const curX = c.install?.x ?? c.x;
        const curY = c.install?.y ?? c.y;
        const curRot = c.install?.rot ?? c.rot;
        return {
          ...c,
          install: {
            x: curX + snapDx,
            y: curY + snapDy,
            rot: curRot,
          },
        };
      });

      const nextState: CircuitState = {
        ...circuit,
        components: nextComponents,
      };

      set({
        circuit: nextState,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });

      if (commitHistory) {
        autoSaver.schedule(get().activeSlug, nextState);
        get().runLint();
      }
      return;
    }

    const snapDx = snapToGrid(dx);
    const snapDy = snapToGrid(dy);

    const nextComponents = circuit.components.map(c => {
      if (!setIds.has(c.id)) return c;
      return {
        ...c,
        x: c.x + snapDx,
        y: c.y + snapDy,
      };
    });

    let nextWires = [...circuit.wires];
    for (const c of nextComponents) {
      if (!setIds.has(c.id)) continue;
      const def = COMPONENT_MAP.get(c.type);
      const pins = getComponentPins(c, def);

      for (const pin of pins) {
        const pPos = pinWorldPos(c, pin.id, def);
        nextWires = nextWires.map(w => {
          if (w.from.compId === c.id && w.from.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, true);
          }
          if (w.to.compId === c.id && w.to.pinId === pin.id) {
            return updateWireOnComponentMoved(w, c.id, pPos, false);
          }
          return w;
        });
      }
    }

    const nextState: CircuitState = {
      ...circuit,
      components: nextComponents,
      wires: nextWires,
    };

    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    if (commitHistory) {
      autoSaver.schedule(get().activeSlug, nextState);
      get().runLint();
      get().evaluateLogic();
    }
  },

  nudgeSelected: (dx: number, dy: number) => {
    const { selectedComponentIds } = get();
    if (selectedComponentIds.length === 0) return;
    get().moveComponents(selectedComponentIds, dx * 20, dy * 20, true);
  },

  updateComponentProp: (compId: string, key: string, value: any) => {
    const { circuit } = get();
    const targetComp = circuit.components.find(c => c.id === compId);
    if (!targetComp) return;

    history.push(circuit);

    const oldProps = { ...targetComp.props };
    const nextProps = { ...oldProps, [key]: value };

    const def = COMPONENT_MAP.get(targetComp.type);
    const oldPins = getComponentPins(targetComp, def);
    const newPins = getComponentPins({ ...targetComp, props: nextProps }, def);

    // Check if pins were removed (e.g. reducing poles from 3 to 1)
    const newPinIdSet = new Set(newPins.map(p => p.id));
    const removedPinIds = oldPins.filter(p => !newPinIdSet.has(p.id)).map(p => p.id);

    let removedWiresCount = 0;
    const nextWires = circuit.wires.filter(w => {
      const isFromTarget = w.from.compId === compId && removedPinIds.includes(w.from.pinId!);
      const isToTarget = w.to.compId === compId && removedPinIds.includes(w.to.pinId!);
      if (isFromTarget || isToTarget) {
        removedWiresCount++;
        return false;
      }
      return true;
    });

    if (removedWiresCount > 0) {
      get().setStatusMessage(`Đã xóa ${removedWiresCount} dây dẫn nối vào các cực đã bị giảm bỏ.`);
    }

    const nextComponents = circuit.components.map(c => {
      if (c.id !== compId) return c;
      return { ...c, props: nextProps };
    });

    const nextState: CircuitState = {
      ...circuit,
      components: nextComponents,
      wires: nextWires,
    };

    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    // Propagate live changes to simulationService
    simulationService.updateComponentProp(compId, key, value);
    if (removedPinIds.length > 0 && (get().isSimulating || get().simulationSnapshot !== null)) {
      simulationService.recompile(nextState, get().config.mode === 'rms' ? 'rms' : 'dc');
    }

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
    get().evaluateLogic();
  },

  updateComponentLabel: (compId: string, label: string) => {
    const { circuit } = get();
    history.push(circuit);

    const nextComponents = circuit.components.map(c => {
      if (c.id !== compId) return c;
      return { ...c, label };
    });

    const nextState = { ...circuit, components: nextComponents };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().evaluateLogic();
  },

  setPEForSelected: (enabled: boolean) => {
    const { circuit, selectedComponentIds } = get();
    if (selectedComponentIds.length === 0) return;

    history.push(circuit);

    const selSet = new Set(selectedComponentIds);
    let removedWiresCount = 0;
    const peEligibleTypes = new Set(['ac_source', 'socket', 'lamp', 'lamp_fluorescent', 'ceiling_fan', 'appliance_generic']);

    const nextComponents = circuit.components.map(c => {
      if (!selSet.has(c.id) || !peEligibleTypes.has(c.type)) return c;
      return {
        ...c,
        props: {
          ...c.props,
          hasPE: enabled,
        },
      };
    });

    let nextWires = [...circuit.wires];
    if (!enabled) {
      nextWires = circuit.wires.filter(w => {
        const isFromComp = w.from.compId && selSet.has(w.from.compId);
        const isToComp = w.to.compId && selSet.has(w.to.compId);
        const isFromPE = isFromComp && (w.from.pinId === 'PE' || w.from.pinId === 'pe' || w.from.pinId === 'in_PE' || w.from.pinId === 'out_PE');
        const isToPE = isToComp && (w.to.pinId === 'PE' || w.to.pinId === 'pe' || w.to.pinId === 'in_PE' || w.to.pinId === 'out_PE');
        if (isFromPE || isToPE) {
          removedWiresCount++;
          return false;
        }
        return true;
      });
    }

    const nextState: CircuitState = {
      ...circuit,
      components: nextComponents,
      wires: nextWires,
    };

    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    if (removedWiresCount > 0) {
      get().setStatusMessage(`Đã gỡ ${removedWiresCount} dây nối vào chân PE.`);
    } else {
      get().setStatusMessage(enabled ? 'Đã hiện chân PE cho các thiết bị đã chọn.' : 'Đã ẩn chân PE cho các thiết bị đã chọn.');
    }

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  toggleAllPE: (enabled?: boolean) => {
    const { circuit } = get();
    const peEligibleTypes = new Set(['ac_source', 'socket', 'lamp', 'lamp_fluorescent', 'ceiling_fan', 'appliance_generic']);
    const eligibleComps = circuit.components.filter(c => peEligibleTypes.has(c.type));
    if (eligibleComps.length === 0) return;

    const targetState = enabled !== undefined ? enabled : !eligibleComps.some(c => c.props.hasPE);

    history.push(circuit);

    const nextComponents = circuit.components.map(c => {
      if (!peEligibleTypes.has(c.type)) return c;
      return {
        ...c,
        props: {
          ...c.props,
          hasPE: targetState,
        },
      };
    });

    let removedWiresCount = 0;
    let nextWires = [...circuit.wires];
    if (!targetState) {
      nextWires = circuit.wires.filter(w => {
        const fromComp = circuit.components.find(c => c.id === w.from.compId);
        const toComp = circuit.components.find(c => c.id === w.to.compId);
        const isFromPE = fromComp && peEligibleTypes.has(fromComp.type) && (w.from.pinId === 'PE' || w.from.pinId === 'pe' || w.from.pinId === 'in_PE' || w.from.pinId === 'out_PE');
        const isToPE = toComp && peEligibleTypes.has(toComp.type) && (w.to.pinId === 'PE' || w.to.pinId === 'pe' || w.to.pinId === 'in_PE' || w.to.pinId === 'out_PE');
        if (isFromPE || isToPE) {
          removedWiresCount++;
          return false;
        }
        return true;
      });
    }

    const nextState: CircuitState = {
      ...circuit,
      components: nextComponents,
      wires: nextWires,
    };

    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    if (removedWiresCount > 0) {
      get().setStatusMessage(`Đã gỡ ${removedWiresCount} dây nối vào chân PE.`);
    } else {
      get().setStatusMessage(targetState ? 'Đã hiện chân PE của mọi thiết bị.' : 'Đã ẩn chân PE của mọi thiết bị.');
    }

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  copySelected: () => {
    const { circuit, selectedComponentIds } = get();
    if (selectedComponentIds.length === 0) return;

    const selSet = new Set(selectedComponentIds);
    const copiedComponents = circuit.components.filter(c => selSet.has(c.id));

    const copiedWires = circuit.wires.filter(w => {
      const fromInside = w.from.compId && selSet.has(w.from.compId);
      const toInside = w.to.compId && selSet.has(w.to.compId);
      return fromInside && toInside;
    });

    clipboard = {
      components: JSON.parse(JSON.stringify(copiedComponents)),
      wires: JSON.parse(JSON.stringify(copiedWires)),
    };
  },

  pasteSelected: () => {
    if (!clipboard || clipboard.components.length === 0) return;
    const { circuit } = get();
    history.push(circuit);

    const idMap = new Map<string, string>();
    const pastedComponents: ComponentInstance[] = clipboard.components.map(c => {
      const newId = `c_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      idMap.set(c.id, newId);
      const def = COMPONENT_MAP.get(c.type);
      const count = circuit.components.filter(item => item.type === c.type).length + 1;
      const newLabel = `${def?.refPrefix || 'C'}${count}`;

      return {
        ...c,
        id: newId,
        x: c.x + 20,
        y: c.y + 20,
        label: newLabel,
        props: { ...c.props },
      };
    });

    const pastedWires: Wire[] = clipboard.wires.map(w => {
      const newWireId = `w_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const shiftedPoints = w.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));

      return {
        ...w,
        id: newWireId,
        from: { compId: idMap.get(w.from.compId!)!, pinId: w.from.pinId! },
        to: { compId: idMap.get(w.to.compId!)!, pinId: w.to.pinId! },
        points: normalizePolyline(shiftedPoints),
      };
    });

    const nextState: CircuitState = {
      ...circuit,
      components: [...circuit.components, ...pastedComponents],
      wires: [...circuit.wires, ...pastedWires],
    };

    set({
      circuit: nextState,
      selectedComponentIds: pastedComponents.map(c => c.id),
      selectedWireIds: pastedWires.map(w => w.id),
      rightPanelOpen: true,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  duplicateSelected: () => {
    get().copySelected();
    get().pasteSelected();
  },

  restoreAllDamaged: () => {
    const { circuit } = get();
    history.push(circuit);

    const nextComponents = circuit.components.map(c => ({
      ...c,
      damaged: false,
      damageReason: undefined,
      props: {
        ...c.props,
        isBlown: false,
        isTripped: false,
        state: true,
      },
    }));

    const nextWires = circuit.wires.map(w => ({
      ...w,
      isBurnt: false,
    }));

    const nextState = { ...circuit, components: nextComponents, wires: nextWires };
    simulationService.resetAllDamaged();
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
      statusMessage: 'Đã thay mới và khôi phục toàn bộ linh kiện hỏng.',
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  replaceDamagedComponent: (compId: string) => {
    const { circuit } = get();
    history.push(circuit);
    const nextComponents = circuit.components.map(c => {
      if (c.id === compId) {
        return {
          ...c,
          damaged: false,
          damageReason: undefined,
          props: {
            ...c.props,
            isBlown: false,
            isTripped: false,
            state: true,
          },
        };
      }
      return c;
    });
    const nextState = { ...circuit, components: nextComponents };
    simulationService.replaceDamagedComponent(compId);
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
      statusMessage: `Đã thay mới / đóng lại linh kiện ${compId}.`,
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  repairWire: (wireId: string) => {
    const { circuit } = get();
    history.push(circuit);
    const nextWires = circuit.wires.map(w => {
      if (w.id === wireId) {
        return { ...w, isBurnt: false };
      }
      return w;
    });
    const nextState = { ...circuit, wires: nextWires };
    simulationService.repairWire(wireId);
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
      statusMessage: `Đã nối lại dây dẫn ${wireId}.`,
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
  },

  resetKwh: (compId: string) => {
    const { circuit } = get();
    history.push(circuit);
    const nextComponents = circuit.components.map(c => {
      if (c.id === compId) {
        return { ...c, props: { ...c.props, kwh: 0 } };
      }
      return c;
    });
    const nextState = { ...circuit, components: nextComponents };
    simulationService.resetKwh(compId);
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
      statusMessage: `Đã đặt lại số đo công tơ điện ${compId}.`,
    });
    autoSaver.schedule(get().activeSlug, nextState);
  },

  // ---------------- WIRING OPERATIONS ----------------
  startWiring: (from: Endpoint, startPos: Point) => {
    if (get().viewMode === 'installation') {
      get().setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    set({
      editorMode: 'wiring',
      wiringDraft: {
        from,
        startPos,
        waypoints: [startPos],
        currentPos: startPos,
        horizontalFirst: true,
      },
    });
  },

  updateWiringPointer: (pos: Point) => {
    const { wiringDraft } = get();
    if (!wiringDraft) return;

    set({
      wiringDraft: {
        ...wiringDraft,
        currentPos: pos,
      },
    });
  },

  addWiringWaypoint: (pt: Point) => {
    const { wiringDraft } = get();
    if (!wiringDraft) return;

    const snap = snapPointToGrid(pt);
    const last = wiringDraft.waypoints[wiringDraft.waypoints.length - 1];

    const segment = routeOrthogonal(last, snap, wiringDraft.horizontalFirst);
    const newWaypoints = normalizePolyline([...wiringDraft.waypoints, ...segment]);

    set({
      wiringDraft: {
        ...wiringDraft,
        waypoints: newWaypoints,
        startPos: snap,
        currentPos: snap,
      },
    });
  },

  undoWiringWaypoint: () => {
    const { wiringDraft } = get();
    if (!wiringDraft || wiringDraft.waypoints.length <= 1) return;

    const popped = [...wiringDraft.waypoints];
    popped.pop();
    const newStart = popped[popped.length - 1];

    set({
      wiringDraft: {
        ...wiringDraft,
        waypoints: popped,
        startPos: newStart,
      },
    });
  },

  toggleWiringDirection: () => {
    const { wiringDraft } = get();
    if (!wiringDraft) return;

    set({
      wiringDraft: {
        ...wiringDraft,
        horizontalFirst: !wiringDraft.horizontalFirst,
      },
    });
  },

  cancelWiring: () => {
    set({
      editorMode: 'idle',
      wiringDraft: null,
    });
  },

  finishWiring: (to: Endpoint, endPos: Point) => {
    const { circuit, wiringDraft, config } = get();
    if (!wiringDraft) return;

    if (
      wiringDraft.from.compId &&
      to.compId &&
      wiringDraft.from.compId === to.compId &&
      wiringDraft.from.pinId === to.pinId
    ) {
      set({ editorMode: 'idle', wiringDraft: null });
      return;
    }

    history.push(circuit);

    const finalSegment = routeOrthogonal(
      wiringDraft.startPos,
      endPos,
      wiringDraft.horizontalFirst
    );
    const fullPoints = normalizePolyline([...wiringDraft.waypoints, ...finalSegment]);

    const isHousehold = config.slug === 'mang-dien-trong-nha';
    let wireType: WireType = 'phase';
    let wireColor = '#E5322D';

    if (isHousehold && (wiringDraft.from.pinId === 'O' || to.pinId === 'O')) {
      wireType = 'neutral';
      wireColor = '#4169E1';
    } else if (wiringDraft.from.pinId === 'PE' || to.pinId === 'PE') {
      wireType = 'ground';
      wireColor = '#2DB84D';
    }

    const newWire: Wire = {
      id: `w_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      from: wiringDraft.from,
      to,
      points: fullPoints,
      wireType,
      color: wireColor,
      crossSection: 1.5,
    };

    const nextState: CircuitState = {
      ...circuit,
      wires: [...circuit.wires, newWire],
    };

    set({
      circuit: nextState,
      editorMode: 'idle',
      wiringDraft: null,
      selectedWireIds: [newWire.id],
      selectedComponentIds: [],
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
    get().evaluateLogic();
  },

  finishWiringOnExistingWire: (existingWireId: string, clickPt: Point) => {
    const { circuit, wiringDraft } = get();
    if (!wiringDraft) return;

    const targetWire = circuit.wires.find(w => w.id === existingWireId);
    if (!targetWire) {
      get().cancelWiring();
      return;
    }

    history.push(circuit);

    const snapClick = snapPointToGrid(clickPt);
    const newJunctionId = `j_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newWireId = `w_${Date.now()}_b`;

    const splitResult = splitWireAtJunction(targetWire, snapClick, newJunctionId, newWireId);
    if (!splitResult) {
      get().cancelWiring();
      return;
    }

    const branchSegment = routeOrthogonal(
      wiringDraft.startPos,
      snapClick,
      wiringDraft.horizontalFirst
    );
    const branchPoints = normalizePolyline([...wiringDraft.waypoints, ...branchSegment]);

    const branchWire: Wire = {
      id: `w_${Date.now()}_branch`,
      from: wiringDraft.from,
      to: { junctionId: newJunctionId },
      points: branchPoints,
      wireType: targetWire.wireType,
      color: targetWire.color,
      crossSection: targetWire.crossSection,
    };

    const remainingWires = circuit.wires.filter(w => w.id !== existingWireId);
    const nextWires = [...remainingWires, splitResult.wire1, splitResult.wire2, branchWire];
    const nextJunctions = [...circuit.junctions, splitResult.junction];

    const nextState: CircuitState = {
      ...circuit,
      wires: nextWires,
      junctions: nextJunctions,
    };

    set({
      circuit: nextState,
      editorMode: 'idle',
      wiringDraft: null,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
    get().runLint();
    get().evaluateLogic();
  },

  startDraggingSegment: (wireId: string, segIndex: number) => {
    if (get().viewMode === 'installation') {
      get().setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    const wire = get().circuit.wires.find(w => w.id === wireId);
    if (!wire) return;

    set({
      editorMode: 'draggingSegment',
      draggedSegment: {
        wireId,
        segIndex,
        initialPoints: [...wire.points],
      },
    });
  },

  updateDraggingSegment: (newCoord: number) => {
    const { draggedSegment, circuit, allowDiagonalWires } = get();
    if (!draggedSegment) return;

    const wire = circuit.wires.find(w => w.id === draggedSegment.wireId);
    if (!wire) return;

    const updatedWire = dragWireSegment(
      wire,
      draggedSegment.segIndex,
      newCoord,
      allowDiagonalWires
    );

    set({
      circuit: {
        ...circuit,
        wires: circuit.wires.map(w => (w.id === updatedWire.id ? updatedWire : w)),
      },
    });
  },

  finishDraggingSegment: () => {
    const { circuit, draggedSegment } = get();
    if (draggedSegment) {
      history.push(circuit);
      autoSaver.schedule(get().activeSlug, circuit);
    }
    set({
      editorMode: 'idle',
      draggedSegment: null,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  rerouteWireAuto: (wireId: string) => {
    const { circuit } = get();
    const wire = circuit.wires.find(w => w.id === wireId);
    if (!wire) return;

    history.push(circuit);

    const startPt = wire.points[0];
    const endPt = wire.points[wire.points.length - 1];
    const newPoints = routeOrthogonal(startPt, endPt, true);

    const nextWires = circuit.wires.map(w =>
      w.id === wireId ? { ...w, points: newPoints } : w
    );

    const nextState = { ...circuit, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
  },

  updateWireProps: (wireId: string, color: string, crossSection: number) => {
    const { circuit } = get();
    history.push(circuit);

    const nextWires = circuit.wires.map(w =>
      w.id === wireId ? { ...w, color, crossSection } : w
    );

    const nextState = { ...circuit, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
  },

  setWireType: (wireId: string, wireType: WireType) => {
    const { circuit } = get();
    history.push(circuit);

    let defaultColor = '#000000';
    if (wireType === 'phase') defaultColor = '#E5322D';
    else if (wireType === 'neutral') defaultColor = '#4169E1';
    else if (wireType === 'ground') defaultColor = '#2DB84D';

    const nextWires = circuit.wires.map(w =>
      w.id === wireId ? { ...w, wireType, color: defaultColor } : w
    );

    const nextState = { ...circuit, wires: nextWires };
    set({
      circuit: nextState,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });

    autoSaver.schedule(get().activeSlug, nextState);
  },

  // ---------------- NETLIST & HIGHLIGHTING ----------------
  setHoveredPin: (pin: { compId: string; pinId: string } | null) => {
    if (!pin) {
      set({ hoveredPin: null, hoveredNetId: null });
      return;
    }

    const { circuit } = get();
    const { pinToNetId } = extractNetlist(
      circuit.components,
      circuit.wires,
      circuit.junctions,
      COMPONENT_MAP
    );
    const netId = pinToNetId.get(`${pin.compId}:${pin.pinId}`) || null;

    set({
      hoveredPin: pin,
      hoveredNetId: netId,
    });
  },

  setHoveredWire: (wireId: string | null) => {
    if (!wireId) {
      set({ hoveredWireId: null, hoveredNetId: null });
      return;
    }

    const { circuit } = get();
    const { wireToNetId } = extractNetlist(
      circuit.components,
      circuit.wires,
      circuit.junctions,
      COMPONENT_MAP
    );
    const netId = wireToNetId.get(wireId) || null;

    set({
      hoveredWireId: wireId,
      hoveredNetId: netId,
    });
  },

  runLint: () => {
    const { circuit, config } = get();
    const warnings = lintCircuit(
      circuit.components,
      circuit.wires,
      circuit.junctions,
      config.mode,
      COMPONENT_MAP
    );
    set({ lintWarnings: warnings });
    return warnings;
  },

  // ---------------- UNDO / REDO / STORAGE ----------------
  undo: () => {
    const current = get().circuit;
    const prev = history.undo(current);
    if (prev) {
      set({
        circuit: prev,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
      autoSaver.schedule(get().activeSlug, prev);
      get().runLint();
      get().evaluateLogic();
    }
  },

  redo: () => {
    const current = get().circuit;
    const next = history.redo(current);
    if (next) {
      set({
        circuit: next,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
      autoSaver.schedule(get().activeSlug, next);
      get().runLint();
      get().evaluateLogic();
    }
  },

  clearWorkspaceCircuit: async () => {
    const { activeSlug } = get();
    await storage.clearWorkspace(activeSlug);
    history.clear();
    set({
      circuit: {
        components: [],
        wires: [],
        junctions: [],
        viewport: { ...defaultViewport },
      },
      selectedComponentIds: [],
      selectedWireIds: [],
      canUndo: false,
      canRedo: false,
      rightPanelOpen: false,
      lintWarnings: [],
      statusMessage: 'Đã xóa toàn bộ sơ đồ mạch của không gian này.',
    });
    get().refreshStorageStats();
  },

  refreshStorageStats: async () => {
    const stats = await storage.getStorageStats();
    set({ storageStats: stats });
  },
}));

// Subscribe to live simulation snapshot updates (throttled to <= 10 Hz for React state)
queueMicrotask(() => {
  if (typeof simulationService !== 'undefined' && simulationService?.subscribe) {
    simulationService.subscribe((snapshot) => {
      const now = performance.now();
      if (now - lastUiThrottleTime >= 100) {
        lastUiThrottleTime = now;
        useWorkspaceStore.setState({
          simTime: snapshot.simTime,
          sourceSummaryStr: snapshot.sourceStats.summaryStr,
          simulationSnapshot: snapshot,
        });
      }
    });
  }
});
