import React, { useState, useMemo } from 'react';
import { Table, Copy, Check, Info, AlertTriangle, Play } from 'lucide-react';
import { NeoModal } from '../common/NeoModal';
import { NeoButton } from '../common/NeoButton';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { generateTruthTable, TruthTableResult, TruthTableRow } from '../../core/logicSimulator';

export const TruthTableModal: React.FC = () => {
  const {
    circuit,
    truthTableModalOpen,
    setTruthTableModalOpen,
    updateComponentProp,
  } = useWorkspaceStore() as any;

  // Identify all potential outputs in circuit (LEDs and gate Y pins)
  const availableOutputs = useMemo(() => {
    const list: { compId: string; label: string; pinId: string }[] = [];
    for (const c of circuit.components) {
      if (c.type === 'logic_led') {
        list.push({ compId: c.id, label: `LED: ${c.label || c.id}`, pinId: 'in' });
      } else if (c.type === 'logic_gate') {
        list.push({ compId: c.id, label: `Cổng ${c.props.gateType || 'AND'}: ${c.label || c.id} (Y)`, pinId: 'Y' });
      }
    }
    return list;
  }, [circuit.components]);

  const [selectedOutputCompId, setSelectedOutputCompId] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Active chosen output
  const activeOutput = useMemo(() => {
    if (selectedOutputCompId) {
      const found = availableOutputs.find((o) => o.compId === selectedOutputCompId);
      if (found) return found;
    }
    return availableOutputs[0] || null;
  }, [availableOutputs, selectedOutputCompId]);

  // Compute truth table
  const result: TruthTableResult = useMemo(() => {
    if (!activeOutput) {
      return generateTruthTable(circuit);
    }
    return generateTruthTable(circuit, undefined, {
      compId: activeOutput.compId,
      pinId: activeOutput.pinId,
    });
  }, [circuit, activeOutput]);

  // Handle clicking a row to set switches
  const handleApplyRow = (row: TruthTableRow) => {
    for (const [compId, val] of Object.entries(row.inputs)) {
      updateComponentProp(compId, 'state', val === 1);
    }
  };

  // Copy table to clipboard in tab-separated format
  const handleCopyTable = () => {
    if (result.rows.length === 0) return;

    const headers = [...result.inputComps.map((i) => i.label), result.outputComp.label || 'Y'];
    const lines = [headers.join('\t')];

    for (const r of result.rows) {
      const rowVals = [
        ...result.inputComps.map((i) => r.inputs[i.id]),
        r.output,
      ];
      lines.push(rowVals.join('\t'));
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NeoModal
      isOpen={truthTableModalOpen}
      onClose={() => setTruthTableModalOpen(false)}
      title="BẢNG CHÂN TRỊ TỰ ĐỘNG (TRUTH TABLE)"
      maxWidthClass="max-w-3xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-gray-600 font-bold italic">
            * Bấm vào bất kì hàng nào trong bảng để đặt trạng thái các công tắc tương ứng.
          </div>
          <div className="flex items-center gap-2">
            <NeoButton
              variant="secondary"
              onClick={handleCopyTable}
              icon={copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              className="!h-[32px] !px-3 font-black text-xs"
              disabled={result.rows.length === 0}
            >
              {copied ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP BẢNG'}
            </NeoButton>
            <NeoButton
              variant="primary"
              onClick={() => setTruthTableModalOpen(false)}
              icon={<Check size={14} strokeWidth={3} />}
              className="!h-[32px] !px-4 font-black"
            >
              ĐÓNG
            </NeoButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Header toolbar: output selection and expression display */}
        <div className="p-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0_#000] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-xs uppercase text-gray-800">Khảo sát đầu ra:</span>
            {availableOutputs.length > 0 ? (
              <select
                value={activeOutput?.compId || ''}
                onChange={(e) => setSelectedOutputCompId(e.target.value)}
                className="h-8 px-2 border-2 border-black font-bold text-xs bg-white focus:outline-none"
              >
                {availableOutputs.map((out) => (
                  <option key={out.compId} value={out.compId}>
                    {out.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="italic text-gray-500">Chưa có LED hoặc Cổng nào</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black bg-white border border-black px-2 py-1 shadow-[1px_1px_0_#000]">
              {result.inputComps.length} ĐẦU VÀO ({result.rows.length} TỔ HỢP)
            </span>
          </div>
        </div>

        {/* Error / Warning if any */}
        {result.error && (
          <div className="p-3 bg-amber-50 border-2 border-amber-500 text-amber-900 font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}

        {/* Logic Expression Bar (if acyclic) */}
        {result.expression && (
          <div className="p-2.5 bg-[#EEF2FF] border-2 border-black shadow-[2px_2px_0_#000] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-black text-[#4169E1] uppercase font-sans">Biểu thức logic:</span>
              <span className="font-black text-gray-900 bg-white px-2 py-0.5 border border-black">
                {result.expression}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 font-bold italic">Chưa rút gọn</span>
          </div>
        )}

        {/* Truth Table */}
        {result.rows.length > 0 ? (
          <div className="border-2 border-black bg-white shadow-[3px_3px_0_#000] overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full font-mono text-xs border-collapse">
                <thead className="bg-[#1A1A1A] text-white border-b-2 border-black text-center font-black sticky top-0">
                  <tr>
                    <th className="p-2 w-12 text-gray-400">#</th>
                    {result.inputComps.map((inp) => (
                      <th key={inp.id} className="p-2 border-r border-gray-700">
                        {inp.label}
                      </th>
                    ))}
                    <th className="p-2 bg-[#4169E1] text-white">
                      {result.outputComp.label || 'Y'}
                    </th>
                    <th className="p-2 w-28 text-gray-400 font-sans font-bold text-[10px]">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => {
                    const isHigh = row.output === 1;
                    const isLow = row.output === 0;
                    const isX = row.output === 'X';
                    const isConflict = row.output === 'CONFLICT';

                    return (
                      <tr
                        key={idx}
                        onClick={() => handleApplyRow(row)}
                        className={`border-b border-gray-200 cursor-pointer transition-colors text-center font-bold ${
                          row.isCurrent
                            ? 'bg-[#FEF08A] font-black ring-2 ring-inset ring-amber-500'
                            : idx % 2 === 1
                            ? 'bg-[#F8FAFC] hover:bg-[#EEF2FF]'
                            : 'bg-white hover:bg-[#EEF2FF]'
                        }`}
                      >
                        <td className="p-1.5 text-gray-500 text-[10px]">{idx + 1}</td>
                        {result.inputComps.map((inp) => (
                          <td
                            key={inp.id}
                            className={`p-1.5 border-r border-gray-200 ${
                              row.inputs[inp.id] === 1 ? 'text-emerald-700 font-black' : 'text-gray-500'
                            }`}
                          >
                            {row.inputs[inp.id]}
                          </td>
                        ))}
                        <td className="p-1.5 font-black">
                          {isHigh && (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-500 font-black">
                              1
                            </span>
                          )}
                          {isLow && (
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                              0
                            </span>
                          )}
                          {isX && (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-400 font-black">
                              X
                            </span>
                          )}
                          {isConflict && (
                            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 border border-red-500 font-black">
                              XUNG ĐỘT
                            </span>
                          )}
                        </td>
                        <td className="p-1.5">
                          {row.isCurrent ? (
                            <span className="text-[10px] bg-black text-[#FFD84D] px-1.5 py-0.5 font-black">
                              HIỆN TẠI
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyRow(row);
                              }}
                              className="text-[10px] text-[#4169E1] hover:underline font-black"
                            >
                              Áp dụng
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !result.error && (
            <div className="p-8 text-center text-gray-500 italic border-2 border-dashed border-gray-300">
              Không có dữ liệu đầu vào được nối vào mạch.
            </div>
          )
        )}
      </div>
    </NeoModal>
  );
};
