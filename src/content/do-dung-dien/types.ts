/**
 * Types & Schema for Household Electrical Appliances (GDPT 2018 - Grade 6)
 */

export interface HotspotDef {
  id: string; // matches BoPhanDef.id
  type: 'rect' | 'circle' | 'polygon';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  r?: number;
  points?: string;
  label?: string;
}

export interface BoPhanDef {
  id: string;
  ten: string;
  chucNang: string;
  hotspot: HotspotDef;
  viTri: 'ngoai' | 'trong';
}

export interface KhoiDef {
  id: string;
  ten: string;
  chucNang: string;
  x: number;
  y: number;
}

export interface MuiTenDef {
  id: string;
  tu: string; // KhoiDef.id
  den: string; // KhoiDef.id
  nhan?: string;
}

export interface BuocDef {
  tieuDe: string;
  noiDung: string;
  sangBoPhan: string[]; // BoPhanDef.id[]
  sangKhoi: string[];   // KhoiDef.id[]
  sangMuiTen: string[]; // MuiTenDef.id[]
}

export interface ThongSoDef {
  ten: string;
  giaTri: string;
  chuThich?: string;
}

export interface DoDungDienDef {
  id: string;
  ten: string;
  subType?: string;
  subTypeName?: string;
  moTaNgan: string;
  hinhSVG: {
    viewBox: string;
    ngoai: (highlightIds: string[], selectedId: string | null, onSelect: (id: string) => void) => React.ReactNode;
    trong: (highlightIds: string[], selectedId: string | null, onSelect: (id: string) => void) => React.ReactNode;
  };
  boPhan: BoPhanDef[];
  khoi: KhoiDef[];
  mui_ten: MuiTenDef[];
  buoc: BuocDef[];
  thongSo: ThongSoDef[];
  anToan: string[];
  tietKiem: string[];
  reviewStatus: 'cần GV đối chiếu';
}

export interface EnergyCalcRow {
  id: string;
  name: string;
  powerWatts: number;
  hoursPerDay: number;
  daysPerMonth: number;
}

export interface ExplainerWorkspaceState {
  selectedApplianceId: string; // 'noi-com-dien' | 'quat-dien' | 'den-dien' | 'tinh-dien-nang'
  selectedSubtypeId?: string;  // for den-dien: 'soi-dot' | 'huynh-quang' | 'led'
  activeTab: 'cautao' | 'sodokhoi' | 'nguyenli' | 'sudung';
  viewMode: 'ngoai' | 'trong';
  selectedPartId: string | null;
  stepIndex: number;
  calcRows: EnergyCalcRow[];
  unitPrice: number | null;
  compareRowAId?: string;
  compareRowBId?: string;
}
