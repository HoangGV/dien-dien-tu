import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Zap, Calculator } from 'lucide-react';
import { EnergyCalcRow } from '../../content/do-dung-dien/types';

interface EnergyCalculatorProps {
  rows: EnergyCalcRow[];
  unitPrice: number | null;
  compareRowAId?: string;
  compareRowBId?: string;
  onChange: (updates: {
    calcRows: EnergyCalcRow[];
    unitPrice: number | null;
    compareRowAId?: string;
    compareRowBId?: string;
  }) => void;
}

export function formatVnNumber(num: number, decimals: number = 2): string {
  if (isNaN(num)) return '0';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  const parts = rounded.toFixed(decimals).split('.');
  // Remove trailing zeros if fractional
  let frac = parts[1] || '';
  while (frac.endsWith('0')) {
    frac = frac.slice(0, -1);
  }
  return frac.length > 0 ? `${parts[0]},${frac}` : parts[0];
}

const PRESET_APPLIANCES = [
  { name: 'Nồi cơm điện (700 W)', power: 700, hours: 1, days: 30 },
  { name: 'Quạt bàn (55 W)', power: 55, hours: 6, days: 30 },
  { name: 'Đèn sợi đốt (60 W)', power: 60, hours: 4, days: 30 },
  { name: 'Đèn huỳnh quang (36 W)', power: 36, hours: 4, days: 30 },
  { name: 'Đèn LED búp (9 W)', power: 9, hours: 4, days: 30 },
  { name: 'Tủ lạnh mini (100 W)', power: 100, hours: 12, days: 30 },
  { name: 'Tivi 43 inch (80 W)', power: 80, hours: 4, days: 30 },
];

export const EnergyCalculator: React.FC<EnergyCalculatorProps> = ({
  rows,
  unitPrice,
  compareRowAId,
  compareRowBId,
  onChange,
}) => {
  const [newRowName, setNewRowName] = useState('');
  const [newRowPower, setNewRowPower] = useState('60');
  const [newRowHours, setNewRowHours] = useState('4');
  const [newRowDays, setNewRowDays] = useState('30');

  const handleAddCustomRow = () => {
    const p = parseFloat(newRowPower) || 0;
    const h = parseFloat(newRowHours) || 0;
    const d = parseInt(newRowDays, 10) || 30;
    const name = newRowName.trim() || `Thiết bị #${rows.length + 1}`;

    const newRow: EnergyCalcRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      powerWatts: p,
      hoursPerDay: h,
      daysPerMonth: d,
    };

    const newRows = [...rows, newRow];
    onChange({
      calcRows: newRows,
      unitPrice,
      compareRowAId: compareRowAId || newRow.id,
      compareRowBId: compareRowBId || (newRows.length > 1 ? newRows[1].id : undefined),
    });

    setNewRowName('');
  };

  const handleAddPreset = (p: typeof PRESET_APPLIANCES[0]) => {
    const newRow: EnergyCalcRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: p.name,
      powerWatts: p.power,
      hoursPerDay: p.hours,
      daysPerMonth: p.days,
    };
    const newRows = [...rows, newRow];
    onChange({
      calcRows: newRows,
      unitPrice,
      compareRowAId: compareRowAId || newRows[0]?.id,
      compareRowBId: compareRowBId || (newRows.length > 1 ? newRows[1].id : undefined),
    });
  };

  const handleDeleteRow = (id: string) => {
    const newRows = rows.filter((r) => r.id !== id);
    let newA = compareRowAId === id ? newRows[0]?.id : compareRowAId;
    let newB = compareRowBId === id ? newRows[1]?.id : compareRowBId;
    onChange({
      calcRows: newRows,
      unitPrice,
      compareRowAId: newA,
      compareRowBId: newB,
    });
  };

  const handleUpdateRow = (id: string, field: keyof EnergyCalcRow, value: any) => {
    const newRows = rows.map((r) => {
      if (r.id !== id) return r;
      return { ...r, [field]: value };
    });
    onChange({
      calcRows: newRows,
      unitPrice,
      compareRowAId,
      compareRowBId,
    });
  };

  // Totals
  const totalPower = rows.reduce((acc, r) => acc + (r.powerWatts || 0), 0);
  const totalKwhPerDay = rows.reduce(
    (acc, r) => acc + ((r.powerWatts || 0) * (r.hoursPerDay || 0)) / 1000,
    0
  );
  const totalKwhPerMonth = rows.reduce(
    (acc, r) => acc + ((r.powerWatts || 0) * (r.hoursPerDay || 0) * (r.daysPerMonth || 0)) / 1000,
    0
  );

  // Comparison
  const rowA = rows.find((r) => r.id === compareRowAId) || rows[0];
  const rowB = rows.find((r) => r.id === compareRowBId) || rows[1];

  let compDiffKwh = 0;
  let compSavingsPercent = 0;
  let compKwhA = 0;
  let compKwhB = 0;

  if (rowA && rowB) {
    compKwhA = (rowA.powerWatts * rowA.hoursPerDay * rowA.daysPerMonth) / 1000;
    compKwhB = (rowB.powerWatts * rowB.hoursPerDay * rowB.daysPerMonth) / 1000;
    compDiffKwh = compKwhA - compKwhB;
    if (compKwhA > 0) {
      compSavingsPercent = (compDiffKwh / compKwhA) * 100;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Intro banner */}
      <div className="bg-[#FFFBEB] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="text-[#2563eb]" size={22} strokeWidth={2.5} />
          <h2 className="font-black text-base uppercase text-black">
            BẢNG TÍNH ĐIỆN NĂNG TIÊU THỤ TRONG GIA ĐÌNH (LỚP 6)
          </h2>
        </div>
        <p className="text-xs text-gray-800 font-bold leading-relaxed">
          • Công thức SGK: <span className="bg-[#fef08a] px-1 py-0.5 border border-black font-mono">E = P · t / 1000</span> (trong đó <span className="font-mono">P</span> là công suất định mức tính bằng Oát - W, <span className="font-mono">t</span> là thời gian sử dụng tính bằng giờ - h, <span className="font-mono">E</span> là điện năng tiêu thụ tính bằng kilôoát giờ - kWh).
        </p>
      </div>

      {/* Main Table */}
      <div className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#1e293b] text-white uppercase text-[11px] font-black border-b-[3px] border-black">
              <th className="p-2.5 border-r border-gray-600">STT</th>
              <th className="p-2.5 border-r border-gray-600">Tên đồ dùng điện</th>
              <th className="p-2.5 border-r border-gray-600 text-right">Công suất P (W)</th>
              <th className="p-2.5 border-r border-gray-600 text-right">Giờ dùng / ngày (h)</th>
              <th className="p-2.5 border-r border-gray-600 text-right">Số ngày / tháng</th>
              <th className="p-2.5 border-r border-gray-600 text-right bg-[#334155]">E ngày (kWh)</th>
              <th className="p-2.5 border-r border-gray-600 text-right bg-[#0f766e]">E tháng (kWh)</th>
              <th className="p-2.5 text-center w-12">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 font-bold italic">
                  Chưa có thiết bị nào trong danh sách. Bấm vào nút mẫu bên dưới hoặc thêm thiết bị mới.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const eDay = (row.powerWatts * row.hoursPerDay) / 1000;
                const eMonth = (row.powerWatts * row.hoursPerDay * row.daysPerMonth) / 1000;

                return (
                  <tr
                    key={row.id}
                    className="border-b-2 border-black hover:bg-yellow-50/60 font-bold transition-colors"
                  >
                    <td className="p-2.5 border-r-2 border-black text-center font-mono text-gray-600">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 border-r-2 border-black">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-dashed border-gray-400 focus:border-black focus:outline-none font-bold text-gray-900"
                      />
                    </td>
                    <td className="p-2.5 border-r-2 border-black text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.powerWatts}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'powerWatts', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-right font-mono bg-transparent border-b border-dashed border-gray-400 focus:border-black focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 border-r-2 border-black text-right">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.1"
                        value={row.hoursPerDay}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'hoursPerDay', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 text-right font-mono bg-transparent border-b border-dashed border-gray-400 focus:border-black focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 border-r-2 border-black text-right">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        step="1"
                        value={row.daysPerMonth}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'daysPerMonth', parseInt(e.target.value, 10) || 30)
                        }
                        className="w-14 text-right font-mono bg-transparent border-b border-dashed border-gray-400 focus:border-black focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 border-r-2 border-black text-right font-mono bg-slate-50 text-slate-800">
                      {formatVnNumber(eDay, 3)}
                    </td>
                    <td className="p-2.5 border-r-2 border-black text-right font-mono font-black text-teal-800 bg-teal-50">
                      {formatVnNumber(eMonth, 2)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        title="Xóa thiết bị này"
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Total Row */}
            {rows.length > 0 && (
              <tr className="bg-[#f8fafc] font-black text-black border-t-2 border-black">
                <td colSpan={2} className="p-2.5 border-r-2 border-black text-right uppercase">
                  TỔNG CỘNG:
                </td>
                <td className="p-2.5 border-r-2 border-black text-right font-mono">
                  {formatVnNumber(totalPower, 0)} W
                </td>
                <td colSpan={2} className="p-2.5 border-r-2 border-black text-center text-gray-500 font-normal">
                  —
                </td>
                <td className="p-2.5 border-r-2 border-black text-right font-mono bg-slate-100 text-slate-900">
                  {formatVnNumber(totalKwhPerDay, 2)} kWh
                </td>
                <td className="p-2.5 border-r-2 border-black text-right font-mono font-black text-teal-900 bg-teal-100 text-sm">
                  {formatVnNumber(totalKwhPerMonth, 2)} kWh
                </td>
                <td className="p-2.5"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preset Quick Add Buttons */}
      <div className="bg-white border-[3px] border-black p-3.5 shadow-[4px_4px_0px_0px_#000]">
        <div className="text-xs font-black uppercase mb-2 flex items-center gap-1.5 text-gray-800">
          <Plus size={15} strokeWidth={3} className="text-blue-600" />
          Thêm nhanh thiết bị mẫu thông dụng:
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_APPLIANCES.map((p, i) => (
            <button
              key={i}
              onClick={() => handleAddPreset(p)}
              className="text-[11px] font-bold px-2.5 py-1 bg-[#EEF2FF] border-2 border-black hover:bg-[#dbeafe] active:translate-y-0.5 transition-all text-gray-900"
            >
              + {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Add Line */}
      <div className="bg-white border-[3px] border-black p-3.5 shadow-[4px_4px_0px_0px_#000] flex flex-wrap items-center gap-3">
        <span className="text-xs font-black uppercase text-gray-800">Tự nhập:</span>
        <input
          type="text"
          placeholder="Tên thiết bị (vd: Ấm siêu tốc)"
          value={newRowName}
          onChange={(e) => setNewRowName(e.target.value)}
          className="border-2 border-black px-2 py-1 text-xs font-bold w-48 focus:outline-none"
        />
        <div className="flex items-center gap-1 text-xs font-bold">
          <span>P (W):</span>
          <input
            type="number"
            value={newRowPower}
            onChange={(e) => setNewRowPower(e.target.value)}
            className="border-2 border-black px-1.5 py-1 text-xs font-mono w-20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold">
          <span>Giờ/ngày:</span>
          <input
            type="number"
            step="0.5"
            value={newRowHours}
            onChange={(e) => setNewRowHours(e.target.value)}
            className="border-2 border-black px-1.5 py-1 text-xs font-mono w-16 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold">
          <span>Ngày/tháng:</span>
          <input
            type="number"
            value={newRowDays}
            onChange={(e) => setNewRowDays(e.target.value)}
            className="border-2 border-black px-1.5 py-1 text-xs font-mono w-14 focus:outline-none"
          />
        </div>
        <button
          onClick={handleAddCustomRow}
          className="bg-[#2DB84D] text-white px-3 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 hover:bg-[#259b40] transition-all ml-auto"
        >
          + THÊM DÒNG
        </button>
      </div>

      {/* Unit Price & Cost Estimation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-800">
              Đơn giá điện (tùy chọn):
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Trống"
                value={unitPrice !== null ? unitPrice : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : parseFloat(e.target.value);
                  onChange({
                    calcRows: rows,
                    unitPrice: val,
                    compareRowAId,
                    compareRowBId,
                  });
                }}
                className="border-2 border-black px-2 py-1 text-xs font-mono w-28 text-right focus:outline-none font-bold"
              />
              <span className="text-xs font-bold text-gray-600">VNĐ/kWh</span>
            </div>
          </div>
          {unitPrice !== null && unitPrice > 0 ? (
            <div className="pt-2 border-t-2 border-dashed border-gray-300 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Ước tính tiền điện / tháng:</span>
              <span className="text-sm font-black font-mono text-emerald-700">
                {formatVnNumber(totalKwhPerMonth * unitPrice, 0)} VNĐ
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 font-bold italic">
              Nhập giá điện (ví dụ 2.000 đ/kWh) để ước tính chi phí tiền điện hàng tháng.
            </div>
          )}
        </div>

        {/* Device Comparison Box */}
        <div className="bg-[#EFF6FF] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="flex items-center gap-1.5">
            <Zap className="text-blue-600" size={17} strokeWidth={2.5} />
            <h3 className="text-xs font-black uppercase text-blue-900 tracking-tight">
              SO SÁNH TIẾT KIỆM ĐIỆN GIỮA 2 THIẾT BỊ
            </h3>
          </div>

          {rows.length < 2 ? (
            <p className="text-xs text-gray-600 font-bold italic">
              Cần ít nhất 2 thiết bị trong bảng để thực hiện so sánh (ví dụ Đèn sợi đốt 60 W vs Đèn LED 9 W).
            </p>
          ) : (
            <div className="space-y-2 text-xs font-bold">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-gray-600 block uppercase">Thiết bị A (cũ):</span>
                  <select
                    value={rowA?.id || ''}
                    onChange={(e) =>
                      onChange({
                        calcRows: rows,
                        unitPrice,
                        compareRowAId: e.target.value,
                        compareRowBId,
                      })
                    }
                    className="w-full border-2 border-black p-1 text-xs font-bold bg-white focus:outline-none"
                  >
                    {rows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.powerWatts}W)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-gray-600 block uppercase">Thiết bị B (tiết kiệm):</span>
                  <select
                    value={rowB?.id || ''}
                    onChange={(e) =>
                      onChange({
                        calcRows: rows,
                        unitPrice,
                        compareRowAId,
                        compareRowBId: e.target.value,
                      })
                    }
                    className="w-full border-2 border-black p-1 text-xs font-bold bg-white focus:outline-none"
                  >
                    {rows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.powerWatts}W)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {rowA && rowB && (
                <div className="bg-white border-2 border-black p-2.5 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700">Tiêu thụ A:</span>
                    <span className="font-mono font-bold">{formatVnNumber(compKwhA, 2)} kWh/tháng</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-700">Tiêu thụ B:</span>
                    <span className="font-mono font-bold text-teal-700">
                      {formatVnNumber(compKwhB, 2)} kWh/tháng
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-300 flex justify-between items-center text-xs font-black">
                    <span className="text-blue-900">Chênh lệch giảm:</span>
                    <span className="font-mono text-blue-700">
                      {formatVnNumber(compDiffKwh, 2)} kWh/tháng
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-emerald-800">Tỉ lệ tiết kiệm:</span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 border border-emerald-500 font-mono">
                      {formatVnNumber(compSavingsPercent, 0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
