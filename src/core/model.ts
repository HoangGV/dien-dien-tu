/**
 * Pure TypeScript Data Model for Schematic Editor
 */

import React from 'react';

export type WorkspaceMode = 'rms' | 'dc' | 'logic';
export type CircuitViewMode = 'schematic' | 'installation';
export type WireType = 'phase' | 'neutral' | 'ground' | 'other';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PinDef {
  id: string;
  label: string;
  dx: number; // In grid units (1 unit = 20px) from component origin
  dy: number;
  polarity?: '+' | '-' | 'A' | 'O' | 'PE' | 'L' | 'N' | 'B' | 'C' | 'E' | 'com' | 'a' | 'b' | '1' | '2' | '3';
}

export interface PropOption {
  label: string;
  value: any;
}

export interface PropSchemaItem {
  key: string;
  label: string;
  kind: 'number' | 'select' | 'bool' | 'text';
  options?: PropOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: any;
}

export interface SymbolProps {
  comp: ComponentInstance;
  isSelected?: boolean;
  isHovered?: boolean;
  highlightNet?: boolean;
  damaged?: boolean;
  onPinPointerDown?: (pinId: string, e: React.PointerEvent) => void;
  onPinHover?: (pinId: string | null) => void;
  hoveredPinId?: string | null;
}

export interface ComponentDef {
  type: string;
  nameVi: string;
  category: 'source' | 'protection' | 'control' | 'load' | 'semiconductor' | 'passive' | 'meter' | 'connector' | 'annotation';
  pins: PinDef[] | ((props: Record<string, any>) => PinDef[]);
  symbol: React.ComponentType<SymbolProps>;
  propsSchema: PropSchemaItem[];
  refPrefix: string;
  width: number;
  height: number;
  defaultProps?: Record<string, any>;
}

export interface ComponentInstance {
  id: string;
  type: string;
  x: number; // World x
  y: number; // World y
  rot: number; // Continuous rotation in degrees (0 <= rot < 360, rounded to 0.1 deg)
  flip: boolean; // Horizontal flip (flipX)
  flipY?: boolean; // Vertical flip
  label: string; // Designator e.g. R1, LED1, CB1
  notes?: string;
  props: Record<string, any>;
  damaged?: boolean;
  damageReason?: string;
  install?: {
    x: number;
    y: number;
    rot?: number;
  };
}

export type Endpoint =
  | { compId: string; pinId: string; junctionId?: never }
  | { junctionId: string; compId?: never; pinId?: never };

export interface Wire {
  id: string;
  from: Endpoint;
  to: Endpoint;
  points: Point[]; // Ordered polyline points
  wireType?: WireType; // 'phase' (A), 'neutral' (O), 'ground' (PE), 'other'
  color: string;
  crossSection: number; // mm2
  isBurnt?: boolean;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
  install?: {
    x: number;
    y: number;
  };
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface FloorDoor {
  id: string;
  wall: 'top' | 'bottom' | 'left' | 'right';
  offset: number; // in meters along wall
  width: number;  // in meters, default 0.9
}

export interface FloorWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface FloorPlanData {
  name: string;      // Room name / label, e.g. "MẶT BẰNG PHÒNG"
  widthM: number;    // Width in meters (X axis, 1..20, step 0.1)
  lengthM: number;   // Length in meters (Y axis, 1..20, step 0.1)
  x?: number;        // Canvas X origin, default 80
  y?: number;        // Canvas Y origin, default 80
  doors: FloorDoor[];
  partitionWalls?: FloorWall[];
}

export interface CircuitState {
  version?: number;
  components: ComponentInstance[];
  wires: Wire[];
  junctions: Junction[];
  viewport: ViewportState;
  floorPlan?: FloorPlanData;
}

export interface Net {
  id: string;
  pinKeys: string[];
  junctionIds: string[];
  wireIds: string[];
}

export interface CaseStatus {
  caseVoltage: number; // V
  humanCurrent: number; // mA
  dangerLevel: 'none' | 'mild' | 'warning' | 'danger';
  dangerMessage?: string;
}

export interface SimulationReport {
  isRunning: boolean;
  nodeVoltages: Record<string, number>;
  componentCurrents: Record<string, number>;
  caseStatuses: Record<string, CaseStatus>;
  earthCurrents: Record<string, number>;
  trippedComponents: string[];
  statusMessages: string[];
}

export interface LintWarning {
  id: string;
  type: 'error' | 'warning';
  message: string;
  targetCompId?: string;
  targetWireId?: string;
  targetPinId?: string;
  position?: Point;
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  state: CircuitState;
  expectation?: string;
  group?: string;
  grade?: string;
}

export interface WorkspaceConfig {
  slug: string;
  title: string;
  grades: string;
  description: string;
  mode: WorkspaceMode;
  paletteIds: string[];
  presets: Preset[];
  helpText: string;
  defaultSpecs?: Record<string, any>;
  installView?: boolean;
}

export interface ExportPackage {
  app: 'cn-dien';
  schema: 1;
  slug: string;
  title: string;
  exportedAt: string;
  state: CircuitState;
}

export interface BulkExportPackage {
  app: 'cn-dien';
  schema: 1;
  isBulk: true;
  exportedAt: string;
  workspaces: Record<string, CircuitState>;
}
