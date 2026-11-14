/**
 * Component Definitions Registry
 * Follows the "one component - multiple properties" principle strictly.
 */

import React from 'react';
import { ComponentDef, PinDef } from './model';
import {
  ACSourceSymbol,
  CBSymbol,
  KnifeSwitchSymbol,
  FuseSymbol,
  Switch2PSymbol,
  Switch3PSymbol,
  LampSymbol,
  FluorescentLampSymbol,
  CeilingFanSymbol,
  ElectricBellSymbol,
  SocketSymbol,
  KWhMeterSymbol,
  InstrumentSymbol,
  OscilloscopeSymbol,
  GenericApplianceSymbol,
  EarthGroundSymbol,
  BoundarySymbol,
  TextBoxSymbol,
  LEDSymbol,
  ResistorSymbol,
  DCSourceSymbol,
  GroundSymbol,
  VCCSymbol,
  PushButtonSymbol,
  PotentiometerSymbol,
  CapacitorCeramicSymbol,
  CapacitorElectrolyticSymbol,
  DiodeSymbol,
  TransistorNPNSymbol,
  TransistorPNPSymbol,
  SensorModuleSymbol,
  RelayModuleSymbol,
  TimeRelaySymbol,
  LampDCSymbol,
  OpAmpSymbol,
} from '../components/symbols/CircuitSymbols';
import {
  LogicSwitchSymbol,
  LogicPushButtonSymbol,
  LogicHighSymbol,
  LogicLowSymbol,
  LogicGateSymbol,
  LogicLEDSymbol,
  LogicFlipFlopSymbol,
  LogicClockSymbol,
  Logic7SegmentSymbol,
} from '../components/symbols/LogicSymbols';

export const COMPONENT_DEFINITIONS: ComponentDef[] = [
  // =================== WORKSPACE: MẠNG ĐIỆN TRONG NHÀ ===================
  {
    type: 'ac_source',
    nameVi: 'Nguồn điện xoay chiều',
    category: 'source',
    refPrefix: 'U',
    width: 80,
    height: 80,
    pins: (props) => {
      if (props.peakVoltage !== undefined) {
        return [
          { id: 'pos', label: '+', dx: 0, dy: -2, polarity: '+' },
          { id: 'neg', label: '−', dx: 0, dy: 2, polarity: '-' },
        ];
      }
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: 'O', label: 'O', dx: 2, dy: -1, polarity: 'O' },
            { id: 'PE', label: 'PE', dx: 2, dy: 0, polarity: 'PE' },
            { id: 'A', label: 'A', dx: 2, dy: 1, polarity: 'A' },
          ]
        : [
            { id: 'O', label: 'O', dx: 2, dy: -1, polarity: 'O' },
            { id: 'A', label: 'A', dx: 2, dy: 1, polarity: 'A' },
          ];
    },
    symbol: ACSourceSymbol,
    propsSchema: [
      { key: 'peakVoltage', label: 'Biên độ đỉnh', kind: 'number', min: 0.1, max: 100, step: 0.5, unit: 'V', default: 5 },
      { key: 'frequency', label: 'Tần số', kind: 'number', min: 0.1, max: 10000, step: 1, unit: 'Hz', default: 50 },
      { key: 'dcOffset', label: 'Độ lệch DC', kind: 'number', min: -50, max: 50, step: 0.5, unit: 'V', default: 0 },
      { key: 'phase', label: 'Pha', kind: 'number', min: -180, max: 180, step: 15, unit: '°', default: 0 },
      { key: 'voltage', label: 'Điện áp hiệu dụng', kind: 'number', min: 110, max: 250, step: 5, unit: 'V', default: 220 },
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
    ],
    defaultProps: { voltage: 220, frequency: 50, hasPE: false },
  },
  {
    type: 'cb',
    nameVi: 'Aptomat hộp (CB)',
    category: 'protection',
    refPrefix: 'MCB',
    width: 80,
    height: 80,
    pins: (props) => {
      const poles = props.poles || 1;
      if (poles === 1) {
        return [
          { id: 'in', label: '1', dx: -2, dy: 0 },
          { id: 'out', label: '1\'', dx: 2, dy: 0 },
        ];
      }
      if (poles === 2) {
        return [
          { id: 'in1', label: '1', dx: -2, dy: -1 },
          { id: 'out1', label: '1\'', dx: 2, dy: -1 },
          { id: 'in2', label: '2', dx: -2, dy: 1 },
          { id: 'out2', label: '2\'', dx: 2, dy: 1 },
        ];
      }
      return [
        { id: 'in1', label: '1', dx: -2, dy: -2 },
        { id: 'out1', label: '1\'', dx: 2, dy: -2 },
        { id: 'in2', label: '2', dx: -2, dy: 0 },
        { id: 'out2', label: '2\'', dx: 2, dy: 0 },
        { id: 'in3', label: '3', dx: -2, dy: 2 },
        { id: 'out3', label: '3\'', dx: 2, dy: 2 },
      ];
    },
    symbol: CBSymbol,
    propsSchema: [
      {
        key: 'poles',
        label: 'Số cực',
        kind: 'select',
        options: [
          { label: '1 cực (MCB-1P)', value: 1 },
          { label: '2 cực (MCB-2P)', value: 2 },
          { label: '3 cực (MCB-3P)', value: 3 },
        ],
        default: 1,
      },
      {
        key: 'ratedCurrent',
        label: 'Dòng định mức (In)',
        kind: 'select',
        options: [
          { label: '6 A', value: 6 },
          { label: '10 A', value: 10 },
          { label: '16 A', value: 16 },
          { label: '20 A', value: 20 },
          { label: '32 A', value: 32 },
          { label: '40 A', value: 40 },
        ],
        default: 16,
      },
      { key: 'state', label: 'Trạng thái đóng/ngắt', kind: 'bool', default: true },
      { key: 'isTripped', label: 'Đã nhảy do sự cố', kind: 'bool', default: false },
    ],
    defaultProps: { poles: 1, ratedCurrent: 16, state: true, isTripped: false },
  },
  {
    type: 'knife_switch',
    nameVi: 'Aptomat (MCB)',
    category: 'protection',
    refPrefix: 'MCB',
    width: 80,
    height: 80,
    pins: (props) => {
      const poles = props.poles || 2;
      return poles === 2
        ? [
            { id: 'in1', label: '1', dx: -1, dy: 2 },
            { id: 'in2', label: '2', dx: 1, dy: 2 },
            { id: 'out1', label: '1\'', dx: -1, dy: -2 },
            { id: 'out2', label: '2\'', dx: 1, dy: -2 },
          ]
        : [
            { id: 'in1', label: '1', dx: -1, dy: 2 },
            { id: 'in2', label: '2', dx: 0, dy: 2 },
            { id: 'in3', label: '3', dx: 1, dy: 2 },
            { id: 'out1', label: '1\'', dx: -1, dy: -2 },
            { id: 'out2', label: '2\'', dx: 0, dy: -2 },
            { id: 'out3', label: '3\'', dx: 1, dy: -2 },
          ];
    },
    symbol: KnifeSwitchSymbol,
    propsSchema: [
      {
        key: 'poles',
        label: 'Số cực',
        kind: 'select',
        options: [
          { label: '2 cực', value: 2 },
          { label: '3 cực', value: 3 },
        ],
        default: 2,
      },
      { key: 'state', label: 'Đang đóng', kind: 'bool', default: true },
    ],
    defaultProps: { poles: 2, state: true },
  },
  {
    type: 'fuse',
    nameVi: 'Cầu chì',
    category: 'protection',
    refPrefix: 'F',
    width: 80,
    height: 60,
    pins: (props) => {
      const poles = props.poles || 1;
      if (poles === 1) {
        return [{ id: '1', label: '', dx: -2, dy: 0 }, { id: '2', label: '', dx: 2, dy: 0 }];
      }
      if (poles === 2) {
        return [
          { id: 'in1', label: '', dx: -2, dy: -1 },
          { id: 'out1', label: '', dx: 2, dy: -1 },
          { id: 'in2', label: '', dx: -2, dy: 1 },
          { id: 'out2', label: '', dx: 2, dy: 1 },
        ];
      }
      return [
        { id: 'in1', label: '', dx: -2, dy: -2 },
        { id: 'out1', label: '', dx: 2, dy: -2 },
        { id: 'in2', label: '', dx: -2, dy: 0 },
        { id: 'out2', label: '', dx: 2, dy: 0 },
        { id: 'in3', label: '', dx: -2, dy: 2 },
        { id: 'out3', label: '', dx: 2, dy: 2 },
      ];
    },
    symbol: FuseSymbol,
    propsSchema: [
      {
        key: 'poles',
        label: 'Số cực',
        kind: 'select',
        options: [
          { label: '1 cực', value: 1 },
          { label: '2 cực', value: 2 },
          { label: '3 cực', value: 3 },
        ],
        default: 1,
      },
      {
        key: 'ratedCurrent',
        label: 'Dòng định mức',
        kind: 'select',
        options: [
          { label: '2 A', value: 2 },
          { label: '5 A', value: 5 },
          { label: '10 A', value: 10 },
          { label: '16 A', value: 16 },
        ],
        default: 10,
      },
      { key: 'isBlown', label: 'Đã đứt (cháy)', kind: 'bool', default: false },
    ],
    defaultProps: { poles: 1, ratedCurrent: 10, isBlown: false },
  },
  {
    type: 'switch_2p',
    nameVi: 'Công tắc hai cực',
    category: 'control',
    refPrefix: 'CT',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: Switch2PSymbol,
    propsSchema: [
      { key: 'state', label: 'Đang đóng', kind: 'bool', default: false },
    ],
    defaultProps: { state: false },
  },
  {
    type: 'switch_3p',
    nameVi: 'Công tắc ba cực (cầu thang)',
    category: 'control',
    refPrefix: 'CT',
    width: 80,
    height: 60,
    pins: [
      { id: 'com', label: 'com', dx: -2, dy: 0 },
      { id: 'a', label: '1', dx: 2, dy: -1 },
      { id: 'b', label: '2', dx: 2, dy: 1 },
    ],
    symbol: Switch3PSymbol,
    propsSchema: [
      { key: 'state', label: 'Vị trí công tắc (1/2)', kind: 'bool', default: true },
    ],
    defaultProps: { state: true },
  },
  {
    type: 'lamp',
    nameVi: 'Bóng đèn',
    category: 'load',
    refPrefix: 'Đ',
    width: 80,
    height: 60,
    pins: (props) => {
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: '1', label: '', dx: -2, dy: 0 },
            { id: '2', label: '', dx: 2, dy: 0 },
            { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
          ]
        : [
            { id: '1', label: '', dx: -2, dy: 0 },
            { id: '2', label: '', dx: 2, dy: 0 },
          ];
    },
    symbol: LampSymbol,
    propsSchema: [
      {
        key: 'lampType',
        label: 'Loại bóng',
        kind: 'select',
        options: [
          { label: 'Sợi đốt', value: 'incandescent' },
          { label: 'LED dân dụng', value: 'led' },
          { label: 'Compact', value: 'compact' },
        ],
        default: 'incandescent',
      },
      { key: 'power', label: 'Công suất bóng', kind: 'number', min: 5, max: 200, step: 5, unit: 'W', default: 60 },
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
      { key: 'leakToCase', label: 'Rò điện ra vỏ (10 Ω)', kind: 'bool', default: false },
      { key: 'humanTouch', label: 'Có người chạm vào vỏ (1 kΩ)', kind: 'bool', default: false },
      { key: 'isOn', label: 'Trạng thái phát sáng', kind: 'bool', default: false },
    ],
    defaultProps: { lampType: 'incandescent', power: 60, hasPE: false, leakToCase: false, humanTouch: false, isOn: false },
  },
  {
    type: 'lamp_fluorescent',
    nameVi: 'Đèn huỳnh quang',
    category: 'load',
    refPrefix: 'ĐHQ',
    width: 120,
    height: 40,
    pins: (props) => {
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: '1', label: '', dx: -3, dy: 0 },
            { id: '2', label: '', dx: 3, dy: 0 },
            { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
          ]
        : [
            { id: '1', label: '', dx: -3, dy: 0 },
            { id: '2', label: '', dx: 3, dy: 0 },
          ];
    },
    symbol: FluorescentLampSymbol,
    propsSchema: [
      { key: 'power', label: 'Công suất đèn', kind: 'number', min: 18, max: 72, step: 18, unit: 'W', default: 36 },
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
      { key: 'leakToCase', label: 'Rò điện ra vỏ (10 Ω)', kind: 'bool', default: false },
      { key: 'humanTouch', label: 'Có người chạm vào vỏ (1 kΩ)', kind: 'bool', default: false },
      { key: 'isOn', label: 'Trạng thái phát sáng', kind: 'bool', default: false },
    ],
    defaultProps: { power: 36, hasPE: false, leakToCase: false, humanTouch: false, isOn: false },
  },
  {
    type: 'ceiling_fan',
    nameVi: 'Quạt trần',
    category: 'load',
    refPrefix: 'QT',
    width: 80,
    height: 60,
    pins: (props) => {
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: '1', label: '', dx: -2, dy: 0 },
            { id: '2', label: '', dx: 2, dy: 0 },
            { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
          ]
        : [
            { id: '1', label: '', dx: -2, dy: 0 },
            { id: '2', label: '', dx: 2, dy: 0 },
          ];
    },
    symbol: CeilingFanSymbol,
    propsSchema: [
      { key: 'power', label: 'Công suất quạt', kind: 'number', min: 40, max: 150, step: 5, unit: 'W', default: 75 },
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
      { key: 'leakToCase', label: 'Rò điện ra vỏ (10 Ω)', kind: 'bool', default: false },
      { key: 'humanTouch', label: 'Có người chạm vào vỏ (1 kΩ)', kind: 'bool', default: false },
      { key: 'isOn', label: 'Trạng thái chạy', kind: 'bool', default: false },
    ],
    defaultProps: { power: 75, hasPE: false, leakToCase: false, humanTouch: false, isOn: false },
  },
  {
    type: 'electric_bell',
    nameVi: 'Chuông điện',
    category: 'load',
    refPrefix: 'CH',
    width: 60,
    height: 60,
    pins: [
      { id: '1', label: '', dx: -1, dy: 2 },
      { id: '2', label: '', dx: 1, dy: 2 },
    ],
    symbol: ElectricBellSymbol,
    propsSchema: [
      { key: 'voltage', label: 'Điện áp làm việc', kind: 'number', min: 12, max: 220, step: 12, unit: 'V', default: 220 },
    ],
    defaultProps: { voltage: 220 },
  },
  {
    type: 'socket',
    nameVi: 'Ổ cắm điện',
    category: 'connector',
    refPrefix: 'OC',
    width: 80,
    height: 60,
    pins: (props) => {
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: 'A', label: 'A', dx: -2, dy: 0 },
            { id: 'O', label: 'O', dx: 2, dy: 0 },
            { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
          ]
        : [
            { id: 'A', label: 'A', dx: -2, dy: 0 },
            { id: 'O', label: 'O', dx: 2, dy: 0 },
          ];
    },
    symbol: SocketSymbol,
    propsSchema: [
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
    ],
    defaultProps: { hasPE: false },
  },
  {
    type: 'earth_ground',
    nameVi: 'Cọc nối đất (Tiếp địa)',
    category: 'protection',
    refPrefix: 'ĐẤT',
    width: 60,
    height: 60,
    pins: [{ id: 'pe', label: 'PE', dx: 0, dy: -1, polarity: 'PE' }],
    symbol: EarthGroundSymbol,
    propsSchema: [
      { key: 'resistance', label: 'Điện trở đất (Rđất)', kind: 'number', min: 1, max: 100, step: 1, unit: 'Ω', default: 4 },
    ],
    defaultProps: { resistance: 4 },
  },
  {
    type: 'kwh_meter',
    nameVi: 'Công tơ điện',
    category: 'meter',
    refPrefix: 'CT',
    width: 80,
    height: 60,
    pins: [
      { id: '1', label: '1', dx: -2, dy: -1 },
      { id: '2', label: '2', dx: 2, dy: -1 },
      { id: '3', label: '3', dx: -2, dy: 1 },
      { id: '4', label: '4', dx: 2, dy: 1 },
    ],
    symbol: KWhMeterSymbol,
    propsSchema: [
      { key: 'kwh', label: 'Điện năng tích lũy', kind: 'number', min: 0, max: 9999, step: 0.1, unit: 'kWh', default: 0 },
    ],
    defaultProps: { kwh: 0 },
  },
  {
    type: 'appliance_generic',
    nameVi: 'Thiết bị điện khác',
    category: 'load',
    refPrefix: 'TB',
    width: 80,
    height: 60,
    pins: (props) => {
      const hasPE = Boolean(props.hasPE);
      return hasPE
        ? [
            { id: 'A', label: 'A', dx: -2, dy: -1 },
            { id: 'O', label: 'O', dx: -2, dy: 1 },
            { id: 'PE', label: 'PE', dx: 2, dy: 0, polarity: 'PE' },
          ]
        : [
            { id: 'A', label: 'A', dx: -2, dy: -1 },
            { id: 'O', label: 'O', dx: -2, dy: 1 },
          ];
    },
    symbol: GenericApplianceSymbol,
    propsSchema: [
      {
        key: 'applianceType',
        label: 'Loại thiết bị',
        kind: 'select',
        options: [
          { label: 'Điều hòa nhiệt độ (1200 W)', value: 'ac' },
          { label: 'Bếp điện từ (1500 W)', value: 'cooker' },
          { label: 'Tủ lạnh (150 W)', value: 'fridge' },
          { label: 'Nồi cơm điện (700 W)', value: 'cooker_rice' },
          { label: 'Bình nóng lạnh (2500 W)', value: 'water_heater' },
        ],
        default: 'ac',
      },
      { key: 'power', label: 'Công suất định mức', kind: 'number', min: 50, max: 3500, step: 50, unit: 'W', default: 1200 },
      { key: 'hasPE', label: 'Hiện chân nối đất (PE)', kind: 'bool', default: false },
      { key: 'leakToCase', label: 'Rò điện ra vỏ (10 Ω)', kind: 'bool', default: false },
      { key: 'humanTouch', label: 'Có người chạm vào vỏ (1 kΩ)', kind: 'bool', default: false },
    ],
    defaultProps: { applianceType: 'ac', power: 1200, hasPE: false, leakToCase: false, humanTouch: false },
  },
  {
    type: 'boundary',
    nameVi: 'Khung phân vùng (nét đứt)',
    category: 'annotation',
    refPrefix: 'VÙNG',
    width: 240,
    height: 160,
    pins: [],
    symbol: BoundarySymbol,
    propsSchema: [
      { key: 'title', label: 'Tiêu đề vùng', kind: 'text', default: 'BÊN TRONG NHÀ' },
      { key: 'width', label: 'Chiều rộng', kind: 'number', min: 80, max: 800, step: 20, unit: 'px', default: 240 },
      { key: 'height', label: 'Chiều cao', kind: 'number', min: 60, max: 600, step: 20, unit: 'px', default: 160 },
      {
        key: 'titlePos',
        label: 'Vị trí tiêu đề',
        kind: 'select',
        options: [
          { label: 'Phía trên', value: 'top' },
          { label: 'Phía dưới', value: 'bottom' },
          { label: 'Không hiện', value: 'none' },
        ],
        default: 'top',
      },
    ],
    defaultProps: { title: 'BÊN TRONG NHÀ', width: 240, height: 160, titlePos: 'top' },
  },
  {
    type: 'textbox',
    nameVi: 'Ghi chú chữ (Note)',
    category: 'annotation',
    refPrefix: 'NOTE',
    width: 120,
    height: 40,
    pins: [],
    symbol: TextBoxSymbol,
    propsSchema: [
      { key: 'text', label: 'Nội dung ghi chú', kind: 'text', default: 'Ghi chú...' },
      { key: 'fontSize', label: 'Cỡ chữ', kind: 'number', min: 9, max: 28, step: 1, unit: 'px', default: 13 },
      { key: 'showBorder', label: 'Hiện viền nét đứt', kind: 'bool', default: false },
    ],
    defaultProps: { text: 'Ghi chú...', fontSize: 13, showBorder: false },
  },

  // =================== WORKSPACE: MẠCH ĐIỆN TỬ CƠ BẢN ===================
  {
    type: 'vcc',
    nameVi: 'Dương nguồn VCC',
    category: 'source',
    refPrefix: 'VCC',
    width: 40,
    height: 40,
    pins: [{ id: 'vcc', label: '', dx: 0, dy: 1, polarity: '+' }],
    symbol: VCCSymbol,
    propsSchema: [
      { key: 'voltage', label: 'Điện áp cấp (V)', kind: 'number', min: 1.5, max: 24, step: 0.5, unit: 'V', default: 5 },
    ],
    defaultProps: { voltage: 5 },
  },
  {
    type: 'dc_source',
    nameVi: 'Nguồn một chiều DC',
    category: 'source',
    refPrefix: 'V',
    width: 60,
    height: 80,
    pins: [
      { id: 'pos', label: '+', dx: 0, dy: -2, polarity: '+' },
      { id: 'neg', label: '−', dx: 0, dy: 2, polarity: '-' },
    ],
    symbol: DCSourceSymbol,
    propsSchema: [
      { key: 'voltage', label: 'Điện áp DC', kind: 'number', min: 0, max: 100, step: 0.1, unit: 'V', default: 9 },
    ],
    defaultProps: { voltage: 9 },
  },
  {
    type: 'gnd',
    nameVi: 'Nối đất 0 V (GND)',
    category: 'connector',
    refPrefix: 'GND',
    width: 40,
    height: 40,
    pins: [{ id: 'gnd', label: '', dx: 0, dy: -1 }],
    symbol: GroundSymbol,
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'resistor',
    nameVi: 'Điện trở TCVN/IEC',
    category: 'passive',
    refPrefix: 'R',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: ResistorSymbol,
    propsSchema: [
      { key: 'resistance', label: 'Trị số điện trở (E12)', kind: 'number', min: 1, max: 10000000, step: 10, unit: 'Ω', default: 1000 },
      {
        key: 'powerRating',
        label: 'Công suất định mức',
        kind: 'select',
        options: [
          { label: '0.125 W', value: 0.125 },
          { label: '0.25 W (tiêu chuẩn)', value: 0.25 },
          { label: '0.5 W', value: 0.5 },
          { label: '1 W', value: 1.0 },
          { label: '2 W', value: 2.0 },
        ],
        default: 0.25,
      },
    ],
    defaultProps: { resistance: 1000, powerRating: 0.25 },
  },
  {
    type: 'potentiometer',
    nameVi: 'Biến trở',
    category: 'passive',
    refPrefix: 'VR',
    width: 80,
    height: 60,
    pins: [
      { id: '1', label: '1', dx: -2, dy: 0 },
      { id: '2', label: 'W', dx: 0, dy: 2 },
      { id: '3', label: '3', dx: 2, dy: 0 },
    ],
    symbol: PotentiometerSymbol,
    propsSchema: [
      { key: 'resistance', label: 'Điện trở toàn phần', kind: 'number', min: 100, max: 1000000, step: 100, unit: 'Ω', default: 10000 },
      { key: 'ratio', label: 'Tỉ lệ con chạy (0–100%)', kind: 'number', min: 0, max: 100, step: 1, unit: '%', default: 50 },
    ],
    defaultProps: { resistance: 10000, ratio: 50 },
  },
  {
    type: 'capacitor_ceramic',
    nameVi: 'Tụ điện không phân cực',
    category: 'passive',
    refPrefix: 'C',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: CapacitorCeramicSymbol,
    propsSchema: [
      { key: 'capacitance', label: 'Điện dung (nF)', kind: 'number', min: 0.1, max: 1000, step: 1, unit: 'nF', default: 100 },
      { key: 'ratedVoltage', label: 'Điện áp giới hạn', kind: 'number', min: 10, max: 100, step: 10, unit: 'V', default: 50 },
    ],
    defaultProps: { capacitance: 100, ratedVoltage: 50 },
  },
  {
    type: 'capacitor_electrolytic',
    nameVi: 'Tụ hóa (có cực)',
    category: 'passive',
    refPrefix: 'C',
    width: 80,
    height: 40,
    pins: [
      { id: 'pos', label: '+', dx: -2, dy: 0, polarity: '+' },
      { id: 'neg', label: '−', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: CapacitorElectrolyticSymbol,
    propsSchema: [
      { key: 'capacitance', label: 'Điện dung (µF)', kind: 'number', min: 1, max: 4700, step: 10, unit: 'µF', default: 100 },
      { key: 'ratedVoltage', label: 'Điện áp định mức', kind: 'select', options: [{ label: '16 V', value: 16 }, { label: '25 V', value: 25 }, { label: '50 V', value: 50 }], default: 16 },
    ],
    defaultProps: { capacitance: 100, ratedVoltage: 16 },
  },
  {
    type: 'diode',
    nameVi: 'Diode tiếp mặt',
    category: 'semiconductor',
    refPrefix: 'D',
    width: 80,
    height: 40,
    pins: [
      { id: 'A', label: 'A', dx: -2, dy: 0, polarity: '+' },
      { id: 'K', label: 'K', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: DiodeSymbol,
    propsSchema: [
      { key: 'model', label: 'Mã linh kiện', kind: 'text', default: '1N4007' },
    ],
    defaultProps: { model: '1N4007' },
  },
  {
    // UNIFIED SINGLE LED (TCVN)
    type: 'led',
    nameVi: 'LED (Điot phát quang)',
    category: 'semiconductor',
    refPrefix: 'LED',
    width: 80,
    height: 40,
    pins: [
      { id: 'A', label: 'A', dx: -2, dy: 0, polarity: '+' },
      { id: 'K', label: 'K', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: LEDSymbol,
    propsSchema: [
      {
        key: 'color',
        label: 'Màu phát quang',
        kind: 'select',
        options: [
          { label: 'Đỏ (2.0 V)', value: 'red' },
          { label: 'Vàng (2.1 V)', value: 'yellow' },
          { label: 'Xanh lá (2.2 V)', value: 'green' },
          { label: 'Xanh dương (3.0 V)', value: 'blue' },
          { label: 'Trắng (3.0 V)', value: 'white' },
          { label: 'Cam (2.0 V)', value: 'orange' },
        ],
        default: 'red',
      },
      { key: 'maxCurrent', label: 'Dòng cực đại (Imax)', kind: 'number', min: 20, max: 40, step: 5, unit: 'mA', default: 30 },
    ],
    defaultProps: { color: 'red', maxCurrent: 30 },
  },
  {
    type: 'transistor_npn',
    nameVi: 'Transistor NPN',
    category: 'semiconductor',
    refPrefix: 'Q',
    width: 80,
    height: 80,
    pins: [
      { id: 'B', label: 'B', dx: -2, dy: 0, polarity: 'B' },
      { id: 'C', label: 'C', dx: 1, dy: -2, polarity: 'C' },
      { id: 'E', label: 'E', dx: 1, dy: 2, polarity: 'E' },
    ],
    symbol: TransistorNPNSymbol,
    propsSchema: [
      { key: 'beta', label: 'Hệ số khuếch đại (β/hFE)', kind: 'number', min: 20, max: 500, step: 10, default: 100 },
      { key: 'maxCurrent', label: 'Ic max', kind: 'number', min: 50, max: 500, step: 50, unit: 'mA', default: 150 },
    ],
    defaultProps: { beta: 100, maxCurrent: 150 },
  },
  {
    type: 'transistor_pnp',
    nameVi: 'Transistor PNP',
    category: 'semiconductor',
    refPrefix: 'Q',
    width: 80,
    height: 80,
    pins: [
      { id: 'B', label: 'B', dx: -2, dy: 0, polarity: 'B' },
      { id: 'C', label: 'C', dx: 1, dy: 2, polarity: 'C' },
      { id: 'E', label: 'E', dx: 1, dy: -2, polarity: 'E' },
    ],
    symbol: TransistorPNPSymbol,
    propsSchema: [
      { key: 'beta', label: 'Hệ số khuếch đại (β/hFE)', kind: 'number', min: 20, max: 500, step: 10, default: 100 },
    ],
    defaultProps: { beta: 100, maxCurrent: 150 },
  },
  {
    type: 'opamp',
    nameVi: 'Khuếch đại thuật toán',
    category: 'semiconductor',
    refPrefix: 'OP',
    width: 120,
    height: 80,
    pins: [
      { id: 'in_neg', label: 'IN−', dx: -3, dy: -1 },
      { id: 'in_pos', label: 'IN+', dx: -3, dy: 1 },
      { id: 'out', label: 'OUT', dx: 3, dy: 0 },
      { id: 'v_pos', label: 'V+', dx: 0, dy: -2, polarity: '+' },
      { id: 'v_neg', label: 'V−', dx: 0, dy: 2, polarity: '-' },
    ],
    symbol: OpAmpSymbol,
    propsSchema: [
      {
        key: 'drop_voltage',
        label: 'Độ sụt so với nguồn (V)',
        kind: 'number',
        min: 0,
        max: 5,
        step: 0.1,
        unit: 'V',
        default: 1.0,
      },
    ],
    defaultProps: {
      drop_voltage: 1.0,
    },
  },
  {
    type: 'push_button',
    nameVi: 'Nút nhấn nhả',
    category: 'control',
    refPrefix: 'PB',
    width: 80,
    height: 40,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: PushButtonSymbol,
    propsSchema: [
      { key: 'state', label: 'Đang nhấn', kind: 'bool', default: false },
    ],
    defaultProps: { state: false },
  },
  {
    type: 'ammeter',
    nameVi: 'Ampe kế',
    category: 'meter',
    refPrefix: 'A',
    width: 80,
    height: 60,
    pins: [
      { id: 'pos', label: '', dx: -2, dy: 0, polarity: '+' },
      { id: 'neg', label: '', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: (props) => React.createElement(InstrumentSymbol, { ...props, meterKind: 'A' }),
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'voltmeter',
    nameVi: 'Vôn kế',
    category: 'meter',
    refPrefix: 'V',
    width: 80,
    height: 60,
    pins: [
      { id: 'pos', label: '', dx: -2, dy: 0, polarity: '+' },
      { id: 'neg', label: '', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: (props) => React.createElement(InstrumentSymbol, { ...props, meterKind: 'V' }),
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'wattmeter',
    nameVi: 'Oát kế',
    category: 'meter',
    refPrefix: 'W',
    width: 80,
    height: 80,
    pins: [
      { id: 'I+', label: 'I+*', dx: -2, dy: 0, polarity: '+' },
      { id: 'I-', label: 'I−', dx: 2, dy: 0, polarity: '-' },
      { id: 'U+', label: 'U+*', dx: 0, dy: -2, polarity: '+' },
      { id: 'U-', label: 'U−', dx: 0, dy: 2, polarity: '-' },
    ],
    symbol: (props) => React.createElement(InstrumentSymbol, { ...props, meterKind: 'W' }),
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'ohmmeter',
    nameVi: 'Ôm kế',
    category: 'meter',
    refPrefix: 'Ω',
    width: 80,
    height: 60,
    pins: [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ],
    symbol: (props) => React.createElement(InstrumentSymbol, { ...props, meterKind: 'Ω' }),
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'oscilloscope',
    nameVi: 'Dao động kí ảo',
    category: 'meter',
    refPrefix: 'OSC',
    width: 80,
    height: 60,
    pins: [
      { id: 'ch1', label: 'CH1', dx: -2, dy: -1 },
      { id: 'ch2', label: 'CH2', dx: -2, dy: 1 },
      { id: 'gnd', label: 'GND', dx: 2, dy: 0, polarity: '-' },
    ],
    symbol: OscilloscopeSymbol,
    propsSchema: [],
    defaultProps: {},
  },
  // =================== WORKSPACE: MẠCH ĐIỀU KHIỂN CẢM BIẾN ===================
  {
    type: 'sensor_module',
    nameVi: 'Mô-đun cảm biến',
    category: 'control',
    refPrefix: 'CB',
    width: 80,
    height: 60,
    pins: [
      { id: 'vcc', label: 'VCC', dx: -2, dy: -1, polarity: '+' },
      { id: 'gnd', label: 'GND', dx: -2, dy: 1, polarity: '-' },
      { id: 'do', label: 'DO', dx: 2, dy: -1 },
      { id: 'ao', label: 'AO', dx: 2, dy: 1 },
    ],
    symbol: SensorModuleSymbol,
    propsSchema: [
      {
        key: 'sensorType',
        label: 'Loại cảm biến',
        kind: 'select',
        options: [
          { value: 'light', label: 'Ánh sáng' },
          { value: 'temperature', label: 'Nhiệt độ' },
          { value: 'humidity', label: 'Độ ẩm' },
          { value: 'gas', label: 'Khí gas' },
          { value: 'smoke', label: 'Khói' },
          { value: 'pir', label: 'Hồng ngoại (chuyển động)' },
          { value: 'ultrasonic', label: 'Siêu âm (khoảng cách)' },
        ],
        default: 'light',
      },
      {
        key: 'motionDetected',
        label: 'Có chuyển động (PIR)',
        kind: 'bool',
        default: false,
      },
      {
        key: 'envValue',
        label: 'Giá trị môi trường',
        kind: 'number',
        min: -10,
        max: 1000,
        step: 1,
        default: 50,
      },
      {
        key: 'threshold',
        label: 'Ngưỡng so sánh',
        kind: 'number',
        min: -10,
        max: 1000,
        step: 1,
        default: 50,
      },
      {
        key: 'triggerCondition',
        label: 'DO ở mức CAO khi',
        kind: 'select',
        options: [
          { value: 'below', label: 'Giá trị < Ngưỡng (ví dụ trời tối / khoảng cách gần)' },
          { value: 'above', label: 'Giá trị > Ngưỡng (ví dụ trời nóng / gas / khói)' },
        ],
        default: 'below',
      },
    ],
    defaultProps: {
      sensorType: 'light',
      motionDetected: false,
      envValue: 50,
      threshold: 50,
      triggerCondition: 'below',
    },
  },
  {
    type: 'relay_module_1ch',
    nameVi: 'Mô-đun rơ le 1 kênh',
    category: 'control',
    refPrefix: 'RL',
    width: 100,
    height: 70,
    pins: [
      { id: 'vcc', label: 'VCC', dx: -2.5, dy: -1.2, polarity: '+' },
      { id: 'gnd', label: 'GND', dx: -2.5, dy: 0, polarity: '-' },
      { id: 'in', label: 'IN', dx: -2.5, dy: 1.2 },
      { id: 'no', label: 'NO', dx: 2.5, dy: -1.2 },
      { id: 'com', label: 'COM', dx: 2.5, dy: 0 },
      { id: 'nc', label: 'NC', dx: 2.5, dy: 1.2 },
    ],
    symbol: RelayModuleSymbol,
    propsSchema: [
      {
        key: 'ratedCurrent',
        label: 'Dòng tiếp điểm tối đa',
        kind: 'number',
        min: 1,
        max: 30,
        step: 1,
        unit: 'A',
        default: 10,
      },
    ],
    defaultProps: {
      ratedCurrent: 10,
    },
  },
  {
    type: 'time_relay',
    nameVi: 'Rơ le thời gian',
    category: 'control',
    refPrefix: 'RLT',
    width: 100,
    height: 70,
    pins: [
      { id: 'vcc', label: 'VCC', dx: -2.5, dy: -1.2, polarity: '+' },
      { id: 'gnd', label: 'GND', dx: -2.5, dy: 0, polarity: '-' },
      { id: 'in', label: 'IN', dx: -2.5, dy: 1.2 },
      { id: 'no', label: 'NO', dx: 2.5, dy: -1.2 },
      { id: 'com', label: 'COM', dx: 2.5, dy: 0 },
      { id: 'nc', label: 'NC', dx: 2.5, dy: 1.2 },
    ],
    symbol: TimeRelaySymbol,
    propsSchema: [
      {
        key: 'mode',
        label: 'Chế độ hoạt động',
        kind: 'select',
        options: [
          { value: 'on_delay', label: 'Trễ bật (On-delay)' },
          { value: 'off_delay', label: 'Trễ ngắt (Off-delay)' },
        ],
        default: 'on_delay',
      },
      {
        key: 'delayTime',
        label: 'Thời gian trễ T',
        kind: 'number',
        min: 1,
        max: 60,
        step: 1,
        unit: 's',
        default: 10,
      },
    ],
    defaultProps: {
      mode: 'on_delay',
      delayTime: 10,
    },
  },
  {
    type: 'lamp_dc',
    nameVi: 'Đèn nhỏ DC (5V)',
    category: 'load',
    refPrefix: 'Đ',
    width: 60,
    height: 60,
    pins: [
      { id: '1', label: '', dx: -1.5, dy: 0 },
      { id: '2', label: '', dx: 1.5, dy: 0 },
    ],
    symbol: LampDCSymbol,
    propsSchema: [
      {
        key: 'voltage',
        label: 'Điện áp định mức',
        kind: 'number',
        min: 1.5,
        max: 24,
        step: 0.5,
        unit: 'V',
        default: 5,
      },
      {
        key: 'power',
        label: 'Công suất',
        kind: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: 'W',
        default: 1,
      },
    ],
    defaultProps: {
      voltage: 5,
      power: 1,
    },
  },
  // =================== WORKSPACE: ĐIỆN TỬ SỐ ===================
  {
    type: 'logic_switch',
    nameVi: 'Công tắc logic',
    category: 'control',
    refPrefix: 'SW',
    width: 80,
    height: 60,
    pins: [{ id: 'Q', label: 'Q', dx: 2, dy: 0 }],
    symbol: LogicSwitchSymbol,
    propsSchema: [
      { key: 'state', label: 'Mức logic (0/1)', kind: 'bool', default: false },
      { key: 'label', label: 'Tên đầu vào', kind: 'text', default: 'A' },
    ],
    defaultProps: {
      state: false,
      label: 'A',
    },
  },
  {
    type: 'logic_push_button',
    nameVi: 'Nút nhấn logic',
    category: 'control',
    refPrefix: 'BTN',
    width: 80,
    height: 60,
    pins: [{ id: 'Q', label: 'Q', dx: 2, dy: 0 }],
    symbol: LogicPushButtonSymbol,
    propsSchema: [
      { key: 'state', label: 'Trạng thái nhấn (1 khi giữ)', kind: 'bool', default: false },
      { key: 'label', label: 'Tên nút nhấn', kind: 'text', default: 'BTN' },
    ],
    defaultProps: {
      state: false,
      label: 'BTN',
    },
  },
  {
    type: 'logic_high',
    nameVi: 'Mức 1',
    category: 'source',
    refPrefix: 'H',
    width: 80,
    height: 60,
    pins: [{ id: 'Q', label: '1', dx: 2, dy: 0 }],
    symbol: LogicHighSymbol,
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'logic_low',
    nameVi: 'Mức 0',
    category: 'source',
    refPrefix: 'L',
    width: 80,
    height: 60,
    pins: [{ id: 'Q', label: '0', dx: 2, dy: 0 }],
    symbol: LogicLowSymbol,
    propsSchema: [],
    defaultProps: {},
  },
  {
    type: 'logic_gate',
    nameVi: 'Cổng logic',
    category: 'semiconductor',
    refPrefix: 'G',
    width: 80,
    height: 80,
    pins: (props) => {
      const gateType = (props.gateType || 'AND').toUpperCase();
      if (gateType === 'NOT') {
        return [
          { id: 'A', label: 'A', dx: -2, dy: 0 },
          { id: 'Y', label: 'Y', dx: 2, dy: 0 },
        ];
      }
      const rawCount = Number(props.inputsCount || 2);
      const isXorOrXnor = gateType === 'XOR' || gateType === 'XNOR';
      const count = isXorOrXnor ? 2 : Math.min(4, Math.max(2, rawCount));

      if (count === 2) {
        return [
          { id: 'A', label: 'A', dx: -2, dy: -1 },
          { id: 'B', label: 'B', dx: -2, dy: 1 },
          { id: 'Y', label: 'Y', dx: 2, dy: 0 },
        ];
      }
      if (count === 3) {
        return [
          { id: 'A', label: 'A', dx: -2, dy: -1 },
          { id: 'B', label: 'B', dx: -2, dy: 0 },
          { id: 'C', label: 'C', dx: -2, dy: 1 },
          { id: 'Y', label: 'Y', dx: 2, dy: 0 },
        ];
      }
      return [
        { id: 'A', label: 'A', dx: -2, dy: -2 },
        { id: 'B', label: 'B', dx: -2, dy: -1 },
        { id: 'C', label: 'C', dx: -2, dy: 1 },
        { id: 'D', label: 'D', dx: -2, dy: 2 },
        { id: 'Y', label: 'Y', dx: 2, dy: 0 },
      ];
    },
    symbol: LogicGateSymbol,
    propsSchema: [
      {
        key: 'gateType',
        label: 'Loại cổng',
        kind: 'select',
        options: [
          { label: 'AND (Và)', value: 'AND' },
          { label: 'OR (Hoặc)', value: 'OR' },
          { label: 'NOT (Đảo)', value: 'NOT' },
          { label: 'NAND (Và-Đảo)', value: 'NAND' },
          { label: 'NOR (Hoặc-Đảo)', value: 'NOR' },
          { label: 'XOR (Hoặc loại trừ)', value: 'XOR' },
          { label: 'XNOR (Đồng mức)', value: 'XNOR' },
        ],
        default: 'AND',
      },
      {
        key: 'inputsCount',
        label: 'Số ngõ vào (2–4)',
        kind: 'number',
        min: 1,
        max: 4,
        step: 1,
        default: 2,
      },
    ],
    defaultProps: {
      gateType: 'AND',
      inputsCount: 2,
    },
    paletteVariants: [
      { label: 'AND', presetProps: { gateType: 'AND', inputsCount: 2 }, searchTags: ['and', 'va', 'nhan'] },
      { label: 'OR', presetProps: { gateType: 'OR', inputsCount: 2 }, searchTags: ['or', 'hoac', 'cong'] },
      { label: 'NOT', presetProps: { gateType: 'NOT', inputsCount: 1 }, searchTags: ['not', 'dao'] },
      { label: 'NAND', presetProps: { gateType: 'NAND', inputsCount: 2 }, searchTags: ['nand', 'va dao'] },
      { label: 'NOR', presetProps: { gateType: 'NOR', inputsCount: 2 }, searchTags: ['nor', 'hoac dao'] },
      { label: 'XOR', presetProps: { gateType: 'XOR', inputsCount: 2 }, searchTags: ['xor', 'loai tru'] },
      { label: 'XNOR', presetProps: { gateType: 'XNOR', inputsCount: 2 }, searchTags: ['xnor', 'dong muc'] },
    ],
  },
  {
    type: 'logic_led',
    nameVi: 'LED logic',
    category: 'load',
    refPrefix: 'LED',
    width: 80,
    height: 60,
    pins: [{ id: 'in', label: 'IN', dx: -2, dy: 0 }],
    symbol: LogicLEDSymbol,
    propsSchema: [
      {
        key: 'color',
        label: 'Màu phát quang',
        kind: 'select',
        options: [
          { label: 'Đỏ', value: '#EF4444' },
          { label: 'Xanh lá', value: '#10B981' },
          { label: 'Vàng', value: '#F59E0B' },
          { label: 'Xanh dương', value: '#3B82F6' },
        ],
        default: '#EF4444',
      },
    ],
    defaultProps: {
      color: '#EF4444',
    },
  },
  {
    type: 'logic_flip_flop',
    nameVi: 'Flip-flop',
    category: 'control',
    refPrefix: 'FF',
    width: 80,
    height: 80,
    pins: (props) => {
      const kind = (props.kind || 'D').toUpperCase();
      const hasClr = Boolean(props.hasClr);
      const pinsList: PinDef[] = [];
      if (kind === 'JK') {
        pinsList.push(
          { id: 'J', label: 'J', dx: -2, dy: -1 },
          { id: 'CLK', label: 'CLK', dx: -2, dy: 0 },
          { id: 'K', label: 'K', dx: -2, dy: 1 },
          { id: 'Q', label: 'Q', dx: 2, dy: -1 },
          { id: 'NQ', label: 'Q̅', dx: 2, dy: 1 }
        );
      } else if (kind === 'T') {
        pinsList.push(
          { id: 'T', label: 'T', dx: -2, dy: -1 },
          { id: 'CLK', label: 'CLK', dx: -2, dy: 1 },
          { id: 'Q', label: 'Q', dx: 2, dy: -1 },
          { id: 'NQ', label: 'Q̅', dx: 2, dy: 1 }
        );
      } else {
        // D
        pinsList.push(
          { id: 'D', label: 'D', dx: -2, dy: -1 },
          { id: 'CLK', label: 'CLK', dx: -2, dy: 1 },
          { id: 'Q', label: 'Q', dx: 2, dy: -1 },
          { id: 'NQ', label: 'Q̅', dx: 2, dy: 1 }
        );
      }
      if (hasClr) {
        pinsList.push({ id: 'CLR', label: 'CLR', dx: 0, dy: 2 });
      }
      return pinsList;
    },
    symbol: LogicFlipFlopSymbol,
    propsSchema: [
      {
        key: 'kind',
        label: 'Loại Flip-flop',
        kind: 'select',
        options: [
          { label: 'D (Data)', value: 'D' },
          { label: 'JK (Đa năng)', value: 'JK' },
          { label: 'T (Toggle / Chia tần)', value: 'T' },
        ],
        default: 'D',
      },
      {
        key: 'triggerEdge',
        label: 'Cạnh kích',
        kind: 'select',
        options: [
          { label: 'Cạnh lên (Rising ↑)', value: 'rising' },
          { label: 'Cạnh xuống (Falling ↓)', value: 'falling' },
        ],
        default: 'rising',
      },
      {
        key: 'hasClr',
        label: 'Chân xóa CLR (tác động mức 0)',
        kind: 'bool',
        default: false,
      },
      {
        key: 'initialState',
        label: 'Trạng thái ban đầu (Q)',
        kind: 'select',
        options: [
          { label: '0 (Mức thấp)', value: 0 },
          { label: '1 (Mức cao)', value: 1 },
        ],
        default: 0,
      },
    ],
    defaultProps: {
      kind: 'D',
      triggerEdge: 'rising',
      hasClr: false,
      initialState: 0,
      qState: 0,
      edgeCount: 0,
    },
  },
  {
    type: 'logic_clock',
    nameVi: 'Máy phát xung',
    category: 'source',
    refPrefix: 'CLK',
    width: 80,
    height: 60,
    pins: [{ id: 'Q', label: 'Q', dx: 2, dy: 0 }],
    symbol: LogicClockSymbol,
    propsSchema: [
      {
        key: 'frequency',
        label: 'Tần số xung',
        kind: 'select',
        options: [
          { label: '0,5 Hz (Chu kì 2 s)', value: 0.5 },
          { label: '1 Hz (Chu kì 1 s)', value: 1 },
          { label: '2 Hz (Chu kì 0,5 s)', value: 2 },
          { label: '5 Hz (Chu kì 0,2 s)', value: 5 },
          { label: '10 Hz (Chu kì 0,1 s)', value: 10 },
        ],
        default: 1,
      },
    ],
    defaultProps: {
      frequency: 1,
      state: false,
    },
  },
  {
    type: 'logic_7segment',
    nameVi: 'LED 7 đoạn BCD',
    category: 'load',
    refPrefix: 'DISP',
    width: 80,
    height: 100,
    pins: [
      { id: 'D3', label: 'D3', dx: -2, dy: -2 },
      { id: 'D2', label: 'D2', dx: -2, dy: -1 },
      { id: 'D1', label: 'D1', dx: -2, dy: 0 },
      { id: 'D0', label: 'D0', dx: -2, dy: 1 },
    ],
    symbol: Logic7SegmentSymbol,
    propsSchema: [
      {
        key: 'color',
        label: 'Màu phát quang',
        kind: 'select',
        options: [
          { label: 'Xanh lá', value: '#22C55E' },
          { label: 'Đỏ', value: '#EF4444' },
          { label: 'Xanh dương', value: '#3B82F6' },
          { label: 'Vàng', value: '#EAB308' },
        ],
        default: '#22C55E',
      },
    ],
    defaultProps: {
      color: '#22C55E',
      digit: '0',
    },
  },
];

export const COMPONENT_REGISTRY = COMPONENT_DEFINITIONS;

export const COMPONENT_MAP = new Map<string, ComponentDef>(
  COMPONENT_DEFINITIONS.map(def => [def.type, def])
);

export function getComponentDef(type: string): ComponentDef | undefined {
  return COMPONENT_MAP.get(type);
}

export interface PaletteCardItem {
  key: string;
  type: string;
  def: ComponentDef;
  label: string;
  presetProps?: Record<string, any>;
  groupTitle?: string;
}

export function getWorkspacePaletteItems(
  paletteIds: string[],
  searchTerm = ''
): PaletteCardItem[] {
  const q = searchTerm.trim().toLowerCase();
  const workspaceDefs = COMPONENT_DEFINITIONS.filter((def) =>
    paletteIds.includes(def.type)
  ).sort((a, b) => {
    const isAnnotationA = a.type === 'boundary' || a.type === 'textbox' || a.category === 'annotation';
    const isAnnotationB = b.type === 'boundary' || b.type === 'textbox' || b.category === 'annotation';
    if (isAnnotationA && !isAnnotationB) return 1;
    if (!isAnnotationA && isAnnotationB) return -1;
    return 0;
  });

  const items: PaletteCardItem[] = [];
  for (const def of workspaceDefs) {
    if (def.paletteVariants && def.paletteVariants.length > 0) {
      for (const variant of def.paletteVariants) {
        const matches =
          !q ||
          variant.label.toLowerCase().includes(q) ||
          (variant.nameVi ? variant.nameVi.toLowerCase().includes(q) : false) ||
          (variant.searchTags ? variant.searchTags.some((t) => t.toLowerCase().includes(q)) : false) ||
          def.nameVi.toLowerCase().includes(q);
        if (matches) {
          items.push({
            key: `${def.type}__${variant.label}`,
            type: def.type,
            def,
            label: variant.label,
            presetProps: variant.presetProps,
            groupTitle: def.nameVi,
          });
        }
      }
    } else {
      const matches =
        !q ||
        def.nameVi.toLowerCase().includes(q) ||
        def.type.toLowerCase().includes(q);
      if (matches) {
        items.push({
          key: def.type,
          type: def.type,
          def,
          label: def.nameVi,
        });
      }
    }
  }
  return items;
}

