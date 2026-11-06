import React, { useState, useEffect } from 'react';
import {
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Copy,
  Sparkles,
  GitCommit,
  X,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Activity,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { COMPONENT_MAP } from '../../core/registry';
import { NeoButton } from '../common/NeoButton';
import { WireType } from '../../core/model';
import { formatMeasure } from '../../core/measureFormat';
import { solveOhmmeterResistance } from '../../core/solver';

export interface PropsPanelProps {
  isBottomSheet?: boolean;
}

export const PropsPanel: React.FC<PropsPanelProps> = ({ isBottomSheet = false }) => {
  const {
    circuit,
    isSimulating,
    simulationSnapshot,
    selectedComponentIds,
    selectedWireIds,
    rightPanelOpen,
    toggleRightPanel,
    closeRightPanel,
    updateComponentProp,
    updateComponentLabel,
    setComponentRotation,
    flipSelected,
    deleteSelected,
    duplicateSelected,
    restoreAllDamaged,
    replaceDamagedComponent,
    repairWire,
    updateWireProps,
    setWireType,
    rerouteWireAuto,
    setPEForSelected,
    resetKwh,
  } = useWorkspaceStore();

  const selectedComp =
    selectedComponentIds.length === 1
      ? circuit.components.find((c) => c.id === selectedComponentIds[0])
      : null;

  const selectedWire =
    selectedWireIds.length === 1
      ? circuit.wires.find((w) => w.id === selectedWireIds[0])
      : null;

  const def = selectedComp ? COMPONENT_MAP.get(selectedComp.type) : null;
  const kinetics = selectedComp && simulationSnapshot?.componentKinetics
    ? simulationSnapshot.componentKinetics[selectedComp.id]
    : null;

  // Local state for label and rotation input to avoid jitter
  const [localLabel, setLocalLabel] = useState('');
  const [localRot, setLocalRot] = useState('0');

  useEffect(() => {
    if (selectedComp) {
      setLocalLabel(selectedComp.label || '');
      setLocalRot(String(Math.round(selectedComp.rot * 10) / 10));
    }
  }, [selectedComp?.id, selectedComp?.rot, selectedComp?.label]);

  if (!rightPanelOpen) {
    return null;
  }

  const panelContainerClass = isBottomSheet
    ? 'w-full max-h-[50dvh] bg-white border-t-2 border-black flex flex-col z-30 shadow-[0_-3px_0_#000] select-none text-black'
    : 'w-[224px] max-w-[85vw] h-full bg-white border-l-2 border-black flex flex-col z-20 shadow-[-2px_0_0_#000] select-none shrink-0 text-black';

  return (
    <aside className={panelContainerClass}>
      {/* Header (22px high, 12px font) */}
      <div className="h-[22px] bg-[#4169E1] text-white px-2 flex items-center justify-between border-b-2 border-black shrink-0">
        <span className="font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1 truncate">
          <Sliders size={12} strokeWidth={3} />
          Thuộc tính
        </span>
        <button
          onClick={closeRightPanel}
          className="w-[18px] h-[18px] bg-white text-black border border-black flex items-center justify-center hover:bg-[#FFD84D] active:translate-y-0.5 cursor-pointer"
          title="Đóng bảng thuộc tính"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>

      {/* Body: Scrollable with 4 clean groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 font-bold text-xs">
        {/* CASE 1: COMPONENT SELECTED */}
        {selectedComp && def && (
          <div className="space-y-3">
            {/* BIG MEASUREMENT DISPLAY FOR METERS */}
            {(selectedComp.type === 'ammeter' || selectedComp.type === 'voltmeter' || selectedComp.type === 'wattmeter') && (
              <div className="border-2 border-black bg-[#FFD84D] p-2 text-center shadow-[2px_2px_0_#000]">
                <div className="text-[10px] font-black uppercase text-black tracking-wider flex items-center justify-center gap-1">
                  <Gauge size={12} strokeWidth={3} />
                  {selectedComp.type === 'ammeter' ? 'SỐ ĐO DÒNG ĐIỆN (I)' : selectedComp.type === 'voltmeter' ? 'SỐ ĐO ĐIỆN ÁP (U)' : 'SỐ ĐO CÔNG SUẤT (P)'}
                </div>
                <div className="text-[20px] font-black font-mono tracking-tight text-black my-0.5">
                  {isSimulating ? (
                    selectedComp.type === 'ammeter' ? (
                      formatMeasure(kinetics?.current ?? 0, 'current')
                    ) : selectedComp.type === 'voltmeter' ? (
                      formatMeasure(kinetics?.voltage ?? 0, 'voltage')
                    ) : (
                      formatMeasure(kinetics?.power ?? 0, 'power')
                    )
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-[9px] font-bold text-gray-800">
                  {isSimulating ? (
                    kinetics?.stateStr === 'Ngược chiều' ? (
                      <span className="text-[#E5322D] font-black">⚠ Dòng điện ngược chiều quy ước</span>
                    ) : (
                      <span>Đang đo trực tiếp</span>
                    )
                  ) : (
                    <span>Bấm CHẠY để có số đo</span>
                  )}
                </div>
              </div>
            )}

            {/* NHÓM 1: CHUNG */}
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                1. Thông tin chung
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-700">Loại:</span>
                <span className="text-[11px] font-black text-black truncate max-w-[120px]" title={def.nameVi}>
                  {def.nameVi}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <label className="text-[10px] text-gray-700">Kí hiệu:</label>
                <input
                  type="text"
                  value={localLabel}
                  onChange={(e) => setLocalLabel(e.target.value)}
                  onBlur={() => updateComponentLabel(selectedComp.id, localLabel)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateComponentLabel(selectedComp.id, localLabel);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-20 h-[22px] px-1 border border-black text-[11px] font-black bg-white outline-none focus:bg-[#FFD84D]/30"
                />
              </div>

              {(selectedComp.damaged || kinetics?.thermalStatus === 'damaged' || kinetics?.thermalStatus === 'blown' || selectedComp.props.isBlown) && (
                <div className="p-1.5 bg-[#DC2626] text-white border-2 border-black text-[11px] font-black text-center tracking-wide uppercase shadow-[2px_2px_0_#000]">
                  LINH KIỆN ĐÃ HỎNG
                </div>
              )}
            </div>

            {/* NHÓM 2: THÔNG SỐ (DYNAMIC SCHEMA) */}
            <div className="border border-black bg-white p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                2. Thông số kĩ thuật
              </div>

              {/* Special LED Color Picker */}
              {selectedComp.type === 'led' && (
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-700">Màu phát sáng:</div>
                  <div className="grid grid-cols-6 gap-1">
                    {[
                      { id: 'red', hex: '#E5322D', title: 'Đỏ' },
                      { id: 'yellow', hex: '#FFD84D', title: 'Vàng' },
                      { id: 'green', hex: '#2DB84D', title: 'Xanh lá' },
                      { id: 'blue', hex: '#4169E1', title: 'Xanh dương' },
                      { id: 'white', hex: '#FFFFFF', title: 'Trắng' },
                      { id: 'orange', hex: '#FF8C00', title: 'Cam' },
                    ].map((col) => {
                      const isCur = (selectedComp.props.color || 'red') === col.id;
                      return (
                        <button
                          key={col.id}
                          onClick={() => updateComponentProp(selectedComp.id, 'color', col.id)}
                          className={`h-5 border-2 border-black flex items-center justify-center cursor-pointer ${
                            isCur ? 'ring-2 ring-black scale-110 shadow-[1px_1px_0_#000]' : ''
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.title}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Property Schema Fields */}
              {def.propsSchema &&
                def.propsSchema.map((schema) => {
                  if (selectedComp.type === 'led' && schema.key === 'color') return null;
                  const currentVal = selectedComp.props[schema.key] ?? schema.default;

                  return (
                    <div key={schema.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-700">{schema.label}:</span>
                        {schema.unit && <span className="text-gray-500 font-mono">({schema.unit})</span>}
                      </div>

                      {schema.kind === 'select' && schema.options && (
                        <select
                          value={currentVal}
                          onChange={(e) => {
                            const val = isNaN(Number(e.target.value))
                              ? e.target.value
                              : Number(e.target.value);
                            updateComponentProp(selectedComp.id, schema.key, val);
                          }}
                          className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white outline-none cursor-pointer"
                        >
                          {schema.options.map((opt) => (
                            <option key={String(opt.value)} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {schema.kind === 'number' && (() => {
                        let minVal = schema.min;
                        let maxVal = schema.max;
                        let unit = schema.unit;
                        if (selectedComp.type === 'sensor_module') {
                          const sType = selectedComp.props.sensorType || 'light';
                          if (sType === 'temp' || sType === 'temperature') {
                            minVal = -10;
                            maxVal = 80;
                            unit = '°C';
                          } else if (sType === 'humidity') {
                            minVal = 0;
                            maxVal = 100;
                            unit = '%RH';
                          } else {
                            minVal = 0;
                            maxVal = 100;
                            unit = '%';
                          }
                        }
                        const isSlider = selectedComp.type === 'sensor_module' && (schema.key === 'envValue' || schema.key === 'threshold');

                        return (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isSlider && (
                                <input
                                  type="range"
                                  min={minVal}
                                  max={maxVal}
                                  step={schema.step || 1}
                                  value={currentVal}
                                  onChange={(e) =>
                                    updateComponentProp(
                                      selectedComp.id,
                                      schema.key,
                                      parseFloat(e.target.value) || schema.default
                                    )
                                  }
                                  className="flex-1 h-3 accent-[#4169E1] cursor-pointer"
                                />
                              )}
                              <input
                                type="number"
                                min={minVal}
                                max={maxVal}
                                step={schema.step || 1}
                                value={currentVal}
                                onChange={(e) =>
                                  updateComponentProp(
                                    selectedComp.id,
                                    schema.key,
                                    parseFloat(e.target.value) || schema.default
                                  )
                                }
                                className={`${isSlider ? 'w-16' : 'w-full'} h-[24px] px-1 border border-black text-[11px] font-black bg-white text-right`}
                              />
                              {unit && <span className="text-[10px] font-bold text-gray-500">{unit}</span>}
                            </div>
                          </div>
                        );
                      })()}

                      {schema.kind === 'text' && (
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => updateComponentProp(selectedComp.id, schema.key, e.target.value)}
                          className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white"
                        />
                      )}

                      {schema.kind === 'bool' && (
                        schema.key === 'isOn' ? (
                          <div className="space-y-0.5">
                            <div
                              className={`w-full h-[24px] border border-black text-[10px] font-black uppercase flex items-center justify-center select-none ${
                                currentVal ? 'bg-[#2DB84D] text-white' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {currentVal ? '⚡ ĐANG HOẠT ĐỘNG' : '○ CHƯA CẤP ĐIỆN'}
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold italic text-center">
                              (Tự động xác định bởi bộ giải mạch)
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => updateComponentProp(selectedComp.id, schema.key, !currentVal)}
                            className={`w-full h-[24px] border border-black text-[10px] font-black uppercase cursor-pointer transition-colors ${
                              currentVal ? 'bg-[#2DB84D] text-white' : 'bg-gray-200 text-black'
                            }`}
                          >
                            {currentVal ? 'BẬT / ĐÓNG' : 'TẮT / NGẮT'}
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
            </div>

            {/* NHÓM 3: ĐO ĐẠC & TRẠNG THÁI HOẠT ĐỘNG */}
            <div className="border border-black bg-[#F8FAFC] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Activity size={11} strokeWidth={3} />
                  3. Đo đạc & Hoạt động
                </span>
                {isSimulating && (
                  <span className="flex items-center gap-1 text-[9px] text-[#059669] font-black uppercase">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#2DB84D] animate-ping" />
                    LIVE
                  </span>
                )}
              </div>

              {/* 1. ĐO ĐẠC DỤNG CỤ ĐO (AMPE KẾ, VÔN KẾ, OÁT KẾ, ÔM KẾ, CÔNG TƠ ĐIỆN) */}
              {['ammeter', 'voltmeter', 'wattmeter', 'ohmmeter', 'kwh_meter'].includes(selectedComp.type) ? (
                <div className="space-y-2">
                  {/* CÔNG TƠ ĐIỆN: Đo điện năng tiêu thụ E (kWh) */}
                  {selectedComp.type === 'kwh_meter' && (() => {
                    const meterData = simulationSnapshot?.meters?.[selectedComp.id];
                    const kwhVal = Number(selectedComp.props.kwh ?? 0);
                    const pVal = meterData?.power ?? kinetics?.power ?? 0;
                    const uVal = meterData?.voltage ?? kinetics?.voltage ?? 0;
                    const iVal = meterData?.current ?? kinetics?.current ?? 0;

                    return (
                      <div className="space-y-1.5">
                        <div className="bg-white border-2 border-black p-2 text-center rounded">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Điện năng tích lũy (E)
                          </div>
                          <div className="text-[20px] font-mono font-black text-[#4169E1] leading-tight my-0.5">
                            Điện năng: {kwhVal.toFixed(3).replace('.', ',')} kWh
                          </div>
                          {!isSimulating && (
                            <p className="text-[9px] text-gray-500 italic mt-0.5">Bấm CHẠY để công tơ tích lũy điện năng</p>
                          )}
                        </div>

                        <div className="space-y-1 text-[10px] font-mono bg-white p-1.5 border border-black/10 rounded">
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-sans">Công suất tức thời:</span>
                            <span className="font-bold">{pVal >= 1000 ? `${(pVal / 1000).toFixed(2).replace('.', ',')} kW` : `${pVal.toFixed(1).replace('.', ',')} W`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-sans">Điện áp tải:</span>
                            <span className="font-bold">{uVal.toFixed(1).replace('.', ',')} V</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-sans">Dòng điện cực pha:</span>
                            <span className="font-bold">{iVal >= 1 ? `${iVal.toFixed(2).replace('.', ',')} A` : `${(iVal * 1000).toFixed(1).replace('.', ',')} mA`}</span>
                          </div>
                        </div>

                        {/* Nút đặt lại số đo */}
                        <button
                          onClick={() => resetKwh(selectedComp.id)}
                          className="w-full h-7 bg-white hover:bg-gray-100 text-black border border-black font-extrabold text-[10px] uppercase shadow-[1px_1px_0_#000] cursor-pointer mt-1"
                        >
                          ĐẶT LẠI SỐ ĐO
                        </button>

                        <div className="p-1 bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-[9px] rounded italic">
                          ℹ️ Chân 1 (Pha vào), Chân 2 (Pha ra tải), Chân 3 (Trung tính vào), Chân 4 (Trung tính ra tải).
                        </div>
                      </div>
                    );
                  })()}

                  {/* ÔM KẾ: Tự động đo kể cả khi chưa bấm CHẠY */}
                  {selectedComp.type === 'ohmmeter' && (() => {
                    const ohmRes = solveOhmmeterResistance(circuit.components, circuit.wires, circuit.junctions, selectedComp.id);
                    const rStr = formatMeasure(ohmRes.resistance, 'resistance');
                    return (
                      <div className="space-y-1.5">
                        <div className="bg-white border-2 border-black p-2 text-center rounded">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Điện trở đo được (R)
                          </div>
                          <div className="text-[20px] font-mono font-black text-[#4169E1] leading-tight my-0.5">
                            {rStr}
                          </div>
                        </div>

                        {ohmRes.hasLiveVoltageWarning && isSimulating && (
                          <div className="p-1.5 bg-[#FFFBEB] border border-[#F59E0B] text-[#B45309] text-[9.5px] font-bold rounded">
                            ⚠️ Mạch đang có điện — ôm kế chỉ đo đúng khi ngắt nguồn; số đo đã coi nguồn bị tắt.
                          </div>
                        )}

                        <div className="p-1 bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-[9px] rounded italic">
                          ℹ️ Hướng dẫn: Mắc hai đầu vào hai đầu của linh kiện cần đo; không cần cấp điện.
                        </div>
                      </div>
                    );
                  })()}

                  {/* OÁT KẾ: Cuộn dòng mắc nối tiếp, cuộn áp mắc song song */}
                  {selectedComp.type === 'wattmeter' && (() => {
                    const meterData = simulationSnapshot?.meters[selectedComp.id];
                    const isCoilConnected = meterData?.isVoltageCoilConnected ?? false;
                    const pVal = meterData?.power ?? 0;
                    const isRev = meterData?.isReversePolarity ?? false;

                    return (
                      <div className="space-y-1.5">
                        <div className="bg-white border-2 border-black p-2 text-center rounded">
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Công suất tiêu thụ (P)
                          </div>
                          <div className="text-[20px] font-mono font-black text-[#4169E1] leading-tight my-0.5">
                            {isSimulating ? (
                              <span>
                                {formatMeasure(pVal, 'power')}
                                {isRev && <span className="text-[11px] text-[#DC2626] ml-1">(ngược chiều)</span>}
                              </span>
                            ) : (
                              '—'
                            )}
                          </div>
                          {!isSimulating && (
                            <p className="text-[9px] text-gray-500 italic mt-0.5">Bấm CHẠY để có số đo</p>
                          )}
                        </div>

                        {isSimulating && (
                          <div className="space-y-1 text-[10px] font-mono bg-white p-1.5 border border-black/10 rounded">
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-sans">Điện áp cuộn áp (U):</span>
                              <span className="font-bold">{formatMeasure(meterData?.voltage ?? 0, 'voltage')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 font-sans">Dòng điện cuộn dòng (I):</span>
                              <span className="font-bold">{formatMeasure(meterData?.current ?? 0, 'current')}</span>
                            </div>
                            <div className="text-[9px] text-gray-500 italic pt-1 border-t border-black/10">
                              * Tải thuần trở nên cosφ = 1 (mô hình hiệu dụng).
                            </div>
                          </div>
                        )}

                        {isSimulating && !isCoilConnected && (
                          <div className="p-1.5 bg-[#FEF2F2] border border-[#EF4444] text-[#DC2626] text-[9.5px] font-bold rounded">
                            ⚠️ Chưa nối cuộn áp (U+, U-).
                          </div>
                        )}

                        <div className="p-1 bg-[#EEF2FF] border border-[#C7D2FE] text-[#3730A3] text-[9px] rounded italic">
                          ℹ️ Hướng dẫn: Cuộn dòng I+→I− mắc nối tiếp vào dây A; cuộn áp U+, U− mắc song song với tải (U+ cùng điểm với I−, U− nối vào dây O của tải).
                        </div>
                      </div>
                    );
                  })()}

                  {/* AMPE KẾ */}
                  {selectedComp.type === 'ammeter' && (
                    <div className="space-y-1.5">
                      <div className="bg-white border-2 border-black p-2 text-center rounded">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Dòng điện qua mạch (I)
                        </div>
                        <div className="text-[20px] font-mono font-black text-[#4169E1] leading-tight my-0.5">
                          {isSimulating ? formatMeasure(kinetics?.current ?? 0, 'current') : '—'}
                        </div>
                        {!isSimulating && (
                          <p className="text-[9px] text-gray-500 italic mt-0.5">Bấm CHẠY để có số đo</p>
                        )}
                      </div>
                      {isSimulating && kinetics?.stateStr === 'Ngược chiều' && (
                        <div className="text-center text-[10px] font-bold text-[#DC2626]">
                          Dòng điện chạy ngược chiều quy ước (vào cực − ra cực +)
                        </div>
                      )}
                    </div>
                  )}

                  {/* VÔN KẾ */}
                  {selectedComp.type === 'voltmeter' && (
                    <div className="space-y-1.5">
                      <div className="bg-white border-2 border-black p-2 text-center rounded">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Điện áp giữa hai đầu (U)
                        </div>
                        <div className="text-[20px] font-mono font-black text-[#4169E1] leading-tight my-0.5">
                          {isSimulating ? formatMeasure(kinetics?.voltage ?? 0, 'voltage') : '—'}
                        </div>
                        {!isSimulating && (
                          <p className="text-[9px] text-gray-500 italic mt-0.5">Bấm CHẠY để có số đo</p>
                        )}
                      </div>
                      {isSimulating && kinetics?.stateStr === 'Ngược chiều' && (
                        <div className="text-center text-[10px] font-bold text-[#DC2626]">
                          Cực tính đo ngược (V+ nhỏ hơn V−)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* 2. ĐO ĐẠC CHO PHỤ TẢI VÀ THIẾT BỊ KHÁC */
                <div className="space-y-2">
                  {isSimulating ? (
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-sans text-[10px]">Điện áp hai đầu:</span>
                        <span className="font-bold text-black">{formatMeasure(kinetics?.voltage ?? 0, 'voltage')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-sans text-[10px]">Dòng điện:</span>
                        <span className="font-bold text-black">{formatMeasure(kinetics?.current ?? 0, 'current')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-sans text-[10px]">Công suất:</span>
                        <span className="font-bold text-black">{formatMeasure(kinetics?.power ?? 0, 'power')}</span>
                      </div>

                      {selectedComp.type === 'ceiling_fan' && (
                        <div className="flex items-center justify-between pt-1 border-t border-black/10">
                          <span className="text-gray-600 font-sans text-[10px]">Công suất tải:</span>
                          <span className="font-bold text-black">{Math.round(kinetics?.power ?? 0)} / {selectedComp.props.power || 60} W</span>
                        </div>
                      )}

                      {/* Nhiệt tích lũy & Trạng thái hỏng hóc */}
                      <div className="pt-1 border-t border-black/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-sans text-[10px]">% Nhiệt tích lũy:</span>
                          <span className={`font-bold ${kinetics && kinetics.heatPercent > 50 ? 'text-[#DC2626]' : 'text-black'}`}>
                            {kinetics?.heatPercent ?? 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 font-sans text-[10px]">Trạng thái:</span>
                          <span className={`font-black text-[10px] ${
                            kinetics?.thermalStatus === 'damaged' ? 'text-[#DC2626]' :
                            kinetics?.thermalStatus === 'tripped' ? 'text-[#D97706]' :
                            kinetics?.thermalStatus === 'blown' ? 'text-[#DC2626]' :
                            kinetics?.thermalStatus === 'hot' ? 'text-[#EA580C]' :
                            kinetics?.isOperating ? 'text-[#059669]' : 'text-gray-500'
                          }`}>
                            {kinetics?.thermalStatus === 'damaged' ? 'ĐÃ HỎNG / CHÁY' :
                             kinetics?.thermalStatus === 'tripped' ? 'ĐÃ NHẢY' :
                             kinetics?.thermalStatus === 'blown' ? 'ĐÃ ĐỨT' :
                             kinetics?.thermalStatus === 'hot' ? 'NÓNG (QUÁ TẢI)' :
                             kinetics?.isOperating ? 'Đang hoạt động' : 'Đang dừng'}
                          </span>
                        </div>
                      </div>

                      {/* Cảm biến & Rơ le: Trạng thái DO, AO, HÚT/NHẢ */}
                      {selectedComp.type === 'sensor_module' && (
                        <div className="pt-1 border-t border-black/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-sans text-[10px]">Trạng thái DO:</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-black border border-black ${
                              selectedComp.props._doHigh
                                ? 'bg-[#DC2626] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {selectedComp.props._doHigh ? 'CAO (HIGH ~5V)' : 'THẤP (LOW ~0V)'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-sans text-[10px]">Điện áp AO:</span>
                            <span className="font-bold text-black font-mono">
                              {selectedComp.props._aoVoltage != null ? `${selectedComp.props._aoVoltage.toFixed(2).replace('.', ',')} V` : '—'}
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedComp.type === 'relay_module_1ch' && (
                        <div className="pt-1 border-t border-black/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 font-sans text-[10px]">Trạng thái Rơ le:</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-black border border-black ${
                              selectedComp.props._isEnergized
                                ? 'bg-[#2DB84D] text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {selectedComp.props._isEnergized ? 'HÚT (ĐÓNG COM–NO)' : 'NHẢ (ĐÓNG COM–NC)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-2 text-center space-y-1">
                      <div className="text-[14px] font-mono font-bold text-gray-400">—</div>
                      <p className="text-[9px] text-gray-500 italic">Bấm CHẠY để có số đo</p>
                    </div>
                  )}

                  {/* Nút thao tác phục hồi / đóng lại */}
                  {(kinetics?.thermalStatus === 'tripped' || selectedComp.props.isTripped) && (
                    <button
                      onClick={() => replaceDamagedComponent(selectedComp.id)}
                      className="w-full h-8 bg-[#FFD84D] text-black border-2 border-black font-black text-[11px] uppercase shadow-[2px_2px_0_#000] cursor-pointer hover:bg-[#FACC15]"
                    >
                      ĐÓNG LẠI APTOMAT
                    </button>
                  )}

                  {(kinetics?.thermalStatus === 'damaged' || kinetics?.thermalStatus === 'blown' || selectedComp.damaged || selectedComp.props.isBlown) && (
                    <div className="space-y-1.5 pt-1">
                      <div className="p-1.5 bg-[#DC2626] text-white border-2 border-black text-[11px] font-black text-center tracking-wide uppercase shadow-[2px_2px_0_#000]">
                        LINH KIỆN ĐÃ HỎNG
                      </div>
                      <button
                        onClick={() => replaceDamagedComponent(selectedComp.id)}
                        className="w-full h-8 bg-[#DC2626] text-white border-2 border-black font-black text-[11px] uppercase shadow-[2px_2px_0_#000] cursor-pointer hover:bg-[#B91C1C] transition-colors"
                      >
                        THAY LINH KIỆN MỚI
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NHÓM 4: VỊ TRÍ & HƯỚNG */}
            <div className="border border-black bg-white p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                4. Hướng xoay & Lật
              </div>

              {/* Exact angle input */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-gray-700">Góc xoay (°):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="359.9"
                    step="1"
                    value={localRot}
                    onChange={(e) => setLocalRot(e.target.value)}
                    onBlur={() => {
                      const deg = parseFloat(localRot);
                      if (!isNaN(deg)) setComponentRotation(selectedComp.id, deg);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const deg = parseFloat(localRot);
                        if (!isNaN(deg)) setComponentRotation(selectedComp.id, deg);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-16 h-[22px] px-1 border border-black text-[11px] font-black bg-white text-right"
                  />
                  <span className="text-[11px] font-black">°</span>
                </div>
              </div>

              {/* 4 quick degree buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setComponentRotation(selectedComp.id, deg)}
                    className={`h-[22px] border border-black text-[10px] font-black ${
                      Math.round(selectedComp.rot) === deg
                        ? 'bg-[#FFD84D]'
                        : 'bg-white hover:bg-[#EEF2FF]'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>

              {/* Flip X and Flip Y */}
              <div className="flex items-center gap-1 pt-1">
                <NeoButton
                  variant="secondary"
                  onClick={() => flipSelected('x')}
                  icon={<FlipHorizontal size={12} strokeWidth={3} />}
                  className={`flex-1 !h-[24px] !text-[9px] !px-1 ${
                    selectedComp.flip ? '!bg-[#FFD84D]' : ''
                  }`}
                  title="Lật theo trục ngang (F)"
                >
                  LẬT NGANG
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  onClick={() => flipSelected('y')}
                  icon={<FlipVertical size={12} strokeWidth={3} />}
                  className={`flex-1 !h-[24px] !text-[9px] !px-1 ${
                    selectedComp.flipY ? '!bg-[#FFD84D]' : ''
                  }`}
                  title="Lật theo trục dọc"
                >
                  LẬT DỌC
                </NeoButton>
              </div>
            </div>

            {/* NHÓM 4: HÀNH ĐỘNG */}
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-1.5">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                4. Thao tác
              </div>

              <div className="flex items-center gap-1">
                <NeoButton
                  variant="secondary"
                  onClick={duplicateSelected}
                  icon={<Copy size={12} strokeWidth={3} />}
                  className="flex-1 !h-[26px] !text-[10px]"
                  title="Nhân đôi linh kiện (Ctrl+D)"
                >
                  NHÂN ĐÔI
                </NeoButton>

                <NeoButton
                  variant="danger"
                  onClick={deleteSelected}
                  icon={<Trash2 size={12} strokeWidth={3} />}
                  className="!h-[26px] !text-[10px] !px-2"
                  title="Xóa linh kiện (Delete)"
                >
                  XÓA
                </NeoButton>
              </div>

              <NeoButton
                variant="secondary"
                onClick={restoreAllDamaged}
                icon={<Sparkles size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Thay thế linh kiện mới (hồi phục hỏng)"
              >
                THAY LINH KIỆN MỚI
              </NeoButton>
            </div>
          </div>
        )}

        {/* CASE 2: WIRE SELECTED */}
        {selectedWire && (
          <div className="space-y-3">
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5 flex items-center gap-1">
                <GitCommit size={12} strokeWidth={3} />
                Dây dẫn điện
              </div>

              {/* Wire Type Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-700">Loại dây:</label>
                <select
                  value={selectedWire.wireType || 'phase'}
                  onChange={(e) => setWireType(selectedWire.id, e.target.value as WireType)}
                  className="w-full h-[26px] px-1 border border-black text-[11px] font-black bg-white"
                >
                  <option value="phase">Dây pha (A) - Màu đỏ</option>
                  <option value="neutral">Dây trung tính (O) - Xanh</option>
                  <option value="ground">Dây nối đất (PE) - Vàng-Xanh</option>
                  <option value="other">Dây khác / Tùy chỉnh</option>
                </select>
              </div>

              {/* Wire Color */}
              <div className="space-y-1">
                <div className="text-[10px] text-gray-700">Màu dây:</div>
                <div className="flex items-center gap-1">
                  {[
                    { hex: '#E5322D', label: 'Đỏ (A)' },
                    { hex: '#4169E1', label: 'Xanh (O)' },
                    { hex: '#2DB84D', label: 'Lá (PE)' },
                    { hex: '#000000', label: 'Đen' },
                    { hex: '#FFD84D', label: 'Vàng' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() =>
                        updateWireProps(selectedWire.id, c.hex, selectedWire.crossSection)
                      }
                      className={`w-6 h-5 border-2 border-black ${
                        selectedWire.color === c.hex ? 'ring-2 ring-black scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Wire Cross Section */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-700">Tiết diện (mm²):</label>
                <select
                  value={selectedWire.crossSection}
                  onChange={(e) =>
                    updateWireProps(
                      selectedWire.id,
                      selectedWire.color,
                      parseFloat(e.target.value) || 2.5
                    )
                  }
                  className="w-full h-[24px] px-1 border border-black text-[11px] font-bold bg-white"
                >
                  <option value={1.5}>1.5 mm² (Đèn chiếu sáng)</option>
                  <option value={2.5}>2.5 mm² (Ổ cắm thông thường)</option>
                  <option value={4.0}>4.0 mm² (Bếp / Bình nóng lạnh)</option>
                  <option value={6.0}>6.0 mm² (Dây dẫn trục chính)</option>
                </select>
              </div>

              <div className="text-[10px] text-gray-600 pt-1">
                Số đoạn gấp khúc: {selectedWire.points.length - 1}
              </div>
            </div>

            {/* Wire Actions */}
            <div className="space-y-1.5">
              {(selectedWire.isBurnt || simulationSnapshot?.wireFlows?.[selectedWire.id]?.isMelted) && (
                <div className="p-2 bg-[#FEE2E2] border-2 border-[#B71C1C] space-y-1.5">
                  <div className="p-1 bg-[#DC2626] text-white border border-black text-[10px] font-black text-center uppercase tracking-wide">
                    DÂY DẪN ĐÃ BỊ CHÁY HỎNG
                  </div>
                  <NeoButton
                    variant="primary"
                    onClick={() => repairWire(selectedWire.id)}
                    icon={<Sparkles size={12} strokeWidth={3} />}
                    className="w-full !h-[28px] !text-[11px] !bg-[#2DB84D] !text-white !border-black"
                    title="Nối lại đoạn dây đã cháy"
                  >
                    NỐI LẠI DÂY
                  </NeoButton>
                </div>
              )}

              <NeoButton
                variant="secondary"
                onClick={() => rerouteWireAuto(selectedWire.id)}
                icon={<Zap size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Tự động vẽ lại dây theo đường vuông góc tối ưu"
              >
                ĐI LẠI TỰ ĐỘNG
              </NeoButton>

              <NeoButton
                variant="danger"
                onClick={deleteSelected}
                icon={<Trash2 size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
                title="Xóa đoạn dây này"
              >
                XÓA DÂY
              </NeoButton>
            </div>
          </div>
        )}

        {/* CASE 3: MULTIPLE COMPONENTS SELECTED */}
        {!selectedComp && selectedComponentIds.length > 1 && (
          <div className="space-y-3">
            <div className="border border-black bg-[#EEF2FF] p-2 space-y-2">
              <div className="text-[10px] font-black uppercase text-[#4169E1] tracking-wider border-b border-black/20 pb-0.5">
                Đang chọn {selectedComponentIds.length} thiết bị
              </div>
              <div className="text-[11px] text-gray-700">
                Thao tác hàng loạt trên các thiết bị đã chọn:
              </div>

              <div className="space-y-2 pt-1">
                <NeoButton
                  variant="primary"
                  onClick={() => setPEForSelected(true)}
                  icon={<ShieldCheck size={12} strokeWidth={3} />}
                  className="w-full !h-[28px] !text-[10px]"
                >
                  HIỆN CHÂN PE CHO CÁC THIẾT BỊ ĐÃ CHỌN
                </NeoButton>

                <NeoButton
                  variant="secondary"
                  onClick={() => setPEForSelected(false)}
                  className="w-full !h-[26px] !text-[10px]"
                >
                  ẨN CHÂN PE
                </NeoButton>
              </div>
            </div>

            <div className="space-y-1.5">
              <NeoButton
                variant="danger"
                onClick={deleteSelected}
                icon={<Trash2 size={12} strokeWidth={3} />}
                className="w-full !h-[26px] !text-[10px]"
              >
                XÓA CÁC ĐỐI TƯỢNG ĐÃ CHỌN
              </NeoButton>
            </div>
          </div>
        )}

        {/* CASE 4: NO SELECTION */}
        {!selectedComp && !selectedWire && selectedComponentIds.length <= 1 && (
          <div className="p-3 border-2 border-dashed border-gray-400 bg-gray-50 text-center text-gray-500 text-[11px] space-y-2 mt-4">
            <p>Bấm chọn 1 linh kiện hoặc 1 đoạn dây trên khung vẽ để xem & chỉnh sửa thuộc tính.</p>
            <p className="text-[10px] text-gray-400">
              Mẹo: Giữ Shift để chọn nhiều đối tượng; nhấn R để xoay nhanh, phím F để lật.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
