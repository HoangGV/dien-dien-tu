import { DoDungDienDef } from './types';
import { NOI_COM_DIEN } from './noi-com-dien';
import { QUAT_DIEN } from './quat-dien';
import { DEN_SOI_DOT, DEN_HUYNH_QUANG, DEN_LED, DEN_DIEN_SUBTYPES } from './den-dien';

export interface ApplianceItemEntry {
  id: string;
  name: string;
  shortName: string;
  hasSubtypes: boolean;
  subtypes?: { id: string; name: string }[];
  defaultSubtype?: string;
  def: DoDungDienDef;
}

export const APPLIANCE_REGISTRY: ApplianceItemEntry[] = [
  {
    id: 'noi-com-dien',
    name: 'Nồi cơm điện',
    shortName: 'NỒI CƠM ĐIỆN',
    hasSubtypes: false,
    def: NOI_COM_DIEN,
  },
  {
    id: 'quat-dien',
    name: 'Quạt điện',
    shortName: 'QUẠT ĐIỆN',
    hasSubtypes: false,
    def: QUAT_DIEN,
  },
  {
    id: 'den-dien',
    name: 'Đèn điện',
    shortName: 'ĐÈN ĐIỆN',
    hasSubtypes: true,
    subtypes: [
      { id: 'soi-dot', name: 'Sợi đốt' },
      { id: 'huynh-quang', name: 'Huỳnh quang' },
      { id: 'led', name: 'LED' },
    ],
    defaultSubtype: 'soi-dot',
    def: DEN_SOI_DOT,
  },
];

export function getApplianceDef(applianceId: string, subtypeId?: string): DoDungDienDef {
  if (applianceId === 'den-dien') {
    const key = subtypeId && DEN_DIEN_SUBTYPES[subtypeId] ? subtypeId : 'soi-dot';
    return DEN_DIEN_SUBTYPES[key];
  }
  const found = APPLIANCE_REGISTRY.find((a) => a.id === applianceId);
  return found ? found.def : NOI_COM_DIEN;
}

export {
  NOI_COM_DIEN,
  QUAT_DIEN,
  DEN_SOI_DOT,
  DEN_HUYNH_QUANG,
  DEN_LED,
  DEN_DIEN_SUBTYPES,
};
