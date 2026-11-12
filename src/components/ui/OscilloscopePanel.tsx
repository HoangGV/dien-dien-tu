import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Sliders, Activity, Sparkles, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useTransientStore, STANDARD_VOLT_DIVS } from '../../store/transientStore';
import { formatMeasure } from '../../core/measureFormat';
import { NeoButton } from '../common/NeoButton';

export const OscilloscopePanel: React.FC = () => {
  const { setOscilloscopePanelOpen, circuit } = useWorkspaceStore();
  const {
    scanTimeMs,
    vPerDiv1,
    vPerDiv2,
    ch1Enabled,
    ch2Enabled,
    result,
    isCalculating,
    progressPct,
    setScanTimeMs,
    setVPerDiv1,
    setVPerDiv2,
    setCh1Enabled,
    setCh2Enabled,
    autoSetScanTime,
    autoScaleVolts,
    calculateAndDraw,
  } = useTransientStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverData, setHoverData] = useState<{
    t: number;
    v1: number;
    v2: number;
    canvasX: number;
    canvasY: number;
  } | null>(null);

  // Auto-run transient analysis once when panel opens if no result yet
  useEffect(() => {
    if (!result && circuit.components.some((c) => c.type === 'oscilloscope')) {
      autoSetScanTime(circuit);
      calculateAndDraw(circuit);
    }
  }, []);

  const handleTimeStepMultiply = (factor: number) => {
    const next = Math.max(1, Math.min(60000, Math.round(scanTimeMs * factor)));
    setScanTimeMs(next);
  };

  const handleAutoTime = () => {
    autoSetScanTime(circuit);
  };

  const handleCalculate = () => {
    calculateAndDraw(circuit);
  };

  // Render Canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = 520;
    const height = 300;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // 1. Background
    ctx.fillStyle = '#0B1120'; // Deep dark navy
    ctx.fillRect(0, 0, width, height);

    // Plot area background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(padLeft, padTop, plotW, plotH);

    // 2. 10x8 Grid
    const numXDivs = 10;
    const numYDivs = 8;
    const cellW = plotW / numXDivs;
    const cellH = plotH / numYDivs;

    // Grid lines
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let i = 0; i <= numXDivs; i++) {
      const x = padLeft + i * cellW;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();
    }
    for (let j = 0; j <= numYDivs; j++) {
      const y = padTop + j * cellH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();
    }

    // Center axes (x-axis at j=4, y-axis at i=0)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    const yCenter = padTop + 4 * cellH;
    ctx.beginPath();
    ctx.moveTo(padLeft, yCenter);
    ctx.lineTo(padLeft + plotW, yCenter);
    ctx.stroke();

    // Minor ticks on center axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i < numXDivs * 5; i++) {
      const x = padLeft + (i * cellW) / 5;
      ctx.beginPath();
      ctx.moveTo(x, yCenter - 2);
      ctx.lineTo(x, yCenter + 2);
      ctx.stroke();
    }
    for (let j = 0; j < numYDivs * 5; j++) {
      const y = padTop + (j * cellH) / 5;
      ctx.beginPath();
      ctx.moveTo(padLeft + 5 * cellW - 2, y);
      ctx.lineTo(padLeft + 5 * cellW + 2, y);
      ctx.stroke();
    }

    // Border around plot area
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(padLeft, padTop, plotW, plotH);

    // 3. Grid Axis Labels
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#94A3B8';

    // Horizontal Time Labels (0, tStop/2, tStop)
    const tSpanSec = scanTimeMs / 1000;
    for (let i = 0; i <= numXDivs; i += 2) {
      const x = padLeft + i * cellW;
      const tVal = (i / numXDivs) * tSpanSec;
      const tLabel =
        tSpanSec >= 1.0
          ? `${tVal.toFixed(1)}s`
          : `${(tVal * 1000).toFixed(tSpanSec < 0.05 ? 1 : 0)}ms`;
      ctx.fillText(tLabel, x, padTop + plotH + 5);
    }

    // Vertical Voltage Labels on Left Axis (for active channel 1)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let j = 0; j <= numYDivs; j += 2) {
      const y = padTop + j * cellH;
      const divFromCenter = 4 - j;
      const vVal1 = divFromCenter * vPerDiv1;
      const vLabel = `${vVal1 >= 0 ? '+' : ''}${vVal1.toFixed(vPerDiv1 < 0.1 ? 2 : 1)}V`;
      ctx.fillStyle = ch1Enabled ? '#38BDF8' : '#94A3B8';
      ctx.fillText(vLabel, padLeft - 6, y);
    }

    // 4. Draw Waveform Traces
    if (result && result.t && result.t.length > 1) {
      const n = result.t.length;
      const tMax = result.t[n - 1] || tSpanSec;

      // Draw CH2 first (Red) so CH1 sits cleanly on top
      if (ch2Enabled && result.v[1] && result.v[1].length === n) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
          const tVal = result.t[i];
          const vVal = result.v[1][i];
          const x = padLeft + (tVal / tMax) * plotW;
          const y = yCenter - (vVal / vPerDiv2) * cellH;
          const clampedY = Math.max(padTop - 5, Math.min(padTop + plotH + 5, y));
          if (!started) {
            ctx.moveTo(x, clampedY);
            started = true;
          } else {
            ctx.lineTo(x, clampedY);
          }
        }
        ctx.stroke();
      }

      // Draw CH1 (Blue)
      if (ch1Enabled && result.v[0] && result.v[0].length === n) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
          const tVal = result.t[i];
          const vVal = result.v[0][i];
          const x = padLeft + (tVal / tMax) * plotW;
          const y = yCenter - (vVal / vPerDiv1) * cellH;
          const clampedY = Math.max(padTop - 5, Math.min(padTop + plotH + 5, y));
          if (!started) {
            ctx.moveTo(x, clampedY);
            started = true;
          } else {
            ctx.lineTo(x, clampedY);
          }
        }
        ctx.stroke();
      }
    }

    // 5. Crosshair on hover
    if (hoverData) {
      ctx.save();
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverData.canvasX, padTop);
      ctx.lineTo(hoverData.canvasX, padTop + plotH);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [result, scanTimeMs, vPerDiv1, vPerDiv2, ch1Enabled, ch2Enabled, hoverData]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!result || !result.t || result.t.length === 0) {
      setHoverData(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const padLeft = 45;
    const padRight = 15;
    const plotW = 520 - padLeft - padRight;

    if (clientX < padLeft || clientX > padLeft + plotW) {
      setHoverData(null);
      return;
    }

    const frac = Math.max(0, Math.min(1, (clientX - padLeft) / plotW));
    const n = result.t.length;
    const idx = Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))));

    const t = result.t[idx];
    const v1 = result.v[0]?.[idx] ?? 0;
    const v2 = result.v[1]?.[idx] ?? 0;

    setHoverData({
      t,
      v1,
      v2,
      canvasX: clientX,
      canvasY: clientY,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Check if trace is flat (max - min < 2% of full 8-div scale)
  let isFlatWarning = false;
  if (result && result.v) {
    if (ch1Enabled && result.v[0] && result.v[0].length > 0) {
      let min1 = Infinity, max1 = -Infinity;
      for (let i = 0; i < result.v[0].length; i++) {
        const val = result.v[0][i];
        if (val < min1) min1 = val;
        if (val > max1) max1 = val;
      }
      const scale1 = 8 * vPerDiv1;
      if (max1 - min1 < 0.02 * scale1) isFlatWarning = true;
    }
  }

  return (
    <div className="w-[540px] bg-white border-3 border-black shadow-[4px_4px_0_#000] text-black select-none overflow-hidden flex flex-col font-sans">
      {/* 1. Header (Neo-brutal style) */}
      <div className="bg-[#FFD84D] border-b-3 border-black px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} strokeWidth={3} className="text-black" />
          <span className="font-black text-sm uppercase tracking-wide">
            PHÂN TÍCH QUÁ ĐỘ (DAO ĐỘNG KÍ)
          </span>
        </div>
        <button
          onClick={() => setOscilloscopePanelOpen(false)}
          className="w-6 h-6 bg-white hover:bg-black hover:text-white border-2 border-black flex items-center justify-center font-black cursor-pointer transition-colors"
          title="Đóng bảng"
        >
          <X size={15} strokeWidth={3} />
        </button>
      </div>

      {/* 2. Top Controls: Time window & Calculate Button */}
      <div className="p-2.5 bg-[#F8FAFC] border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Scan time input */}
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-[11px] uppercase text-gray-700">
            Thời gian quét:
          </span>
          <div className="flex items-center border-2 border-black bg-white shadow-[1px_1px_0_#000]">
            <input
              type="number"
              min={1}
              max={60000}
              value={scanTimeMs}
              onChange={(e) => setScanTimeMs(Number(e.target.value) || 10)}
              className="w-16 px-1.5 py-0.5 text-center font-mono font-bold text-xs focus:outline-none"
            />
            <span className="px-1 text-[10px] font-bold text-gray-500 bg-gray-100 border-l border-black">
              ms
            </span>
          </div>
          <button
            onClick={() => handleTimeStepMultiply(0.5)}
            className="px-1.5 py-0.5 bg-white hover:bg-[#EEF2FF] border border-black font-black text-[10px] cursor-pointer shadow-[1px_1px_0_#000]"
            title="Giảm nửa thời gian quét"
          >
            ÷2
          </button>
          <button
            onClick={() => handleTimeStepMultiply(2)}
            className="px-1.5 py-0.5 bg-white hover:bg-[#EEF2FF] border border-black font-black text-[10px] cursor-pointer shadow-[1px_1px_0_#000]"
            title="Nhân đôi thời gian quét"
          >
            ×2
          </button>
          <button
            onClick={handleAutoTime}
            className="px-2 py-0.5 bg-[#EEF2FF] hover:bg-[#C7D2FE] text-[#3730A3] border border-black font-black text-[10px] uppercase cursor-pointer shadow-[1px_1px_0_#000] flex items-center gap-1"
            title="Tự động ước lượng thời gian quét phù hợp nhất"
          >
            <Sparkles size={11} strokeWidth={2.5} />
            <span>TỰ ĐẶT</span>
          </button>
        </div>

        {/* Big Calculate & Draw Button */}
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className={`px-3 py-1 border-2 border-black font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
            isCalculating ? 'bg-gray-300 text-gray-600' : 'bg-[#2DB84D] hover:bg-[#259b40] text-white'
          }`}
        >
          <Play size={13} strokeWidth={3} />
          <span>{isCalculating ? `Đang tính… ${progressPct}%` : 'TÍNH VÀ VẼ'}</span>
        </button>
      </div>

      {/* 3. Main Graphic Canvas */}
      <div className="relative bg-[#0B1120] p-1.5 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair rounded border border-[#334155]"
        />

        {/* Crosshair readout pill */}
        {hoverData && (
          <div className="absolute top-3 right-4 bg-white/95 text-black border-2 border-black px-2 py-1 text-[11px] font-mono font-bold shadow-[2px_2px_0_#000] flex items-center gap-2 pointer-events-none">
            <span>
              t = {hoverData.t < 1 ? `${(hoverData.t * 1000).toFixed(2).replace('.', ',')} ms` : `${hoverData.t.toFixed(3).replace('.', ',')} s`}
            </span>
            <span className="text-[#0284C7] border-l border-gray-300 pl-2">
              V1 = {formatMeasure(hoverData.v1, 'voltage')}
            </span>
            <span className="text-[#DC2626] border-l border-gray-300 pl-2">
              V2 = {formatMeasure(hoverData.v2, 'voltage')}
            </span>
          </div>
        )}
      </div>

      {/* 4. Channel V/div & Display Controls */}
      <div className="p-2 bg-white border-t-2 border-black grid grid-cols-2 gap-2 text-xs">
        {/* Channel 1 (Blue) */}
        <div className="p-1.5 border-2 border-[#38BDF8] bg-[#F0F9FF] rounded flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="ch1Toggle"
              checked={ch1Enabled}
              onChange={(e) => setCh1Enabled(e.target.checked)}
              className="accent-[#0284C7] cursor-pointer"
            />
            <label htmlFor="ch1Toggle" className="font-black text-[#0284C7] text-[11px] cursor-pointer">
              KÊNH 1 (CH1)
            </label>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={vPerDiv1}
              onChange={(e) => setVPerDiv1(Number(e.target.value))}
              className="border border-black bg-white px-1 py-0.5 text-[10px] font-mono font-bold focus:outline-none"
            >
              {STANDARD_VOLT_DIVS.map((v) => (
                <option key={v} value={v}>
                  {v < 1 ? `${v * 1000} mV` : `${v} V`}/ô
                </option>
              ))}
            </select>
            <button
              onClick={() => autoScaleVolts(1)}
              className="px-1.5 py-0.5 bg-white hover:bg-[#E0F2FE] border border-black font-bold text-[9px] uppercase cursor-pointer"
              title="Tự đặt Volt/ô sao cho sóng gọn trong 6 ô"
            >
              TỰ ĐẶT
            </button>
          </div>
        </div>

        {/* Channel 2 (Red) */}
        <div className="p-1.5 border-2 border-[#F87171] bg-[#FEF2F2] rounded flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="ch2Toggle"
              checked={ch2Enabled}
              onChange={(e) => setCh2Enabled(e.target.checked)}
              className="accent-[#DC2626] cursor-pointer"
            />
            <label htmlFor="ch2Toggle" className="font-black text-[#DC2626] text-[11px] cursor-pointer">
              KÊNH 2 (CH2)
            </label>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={vPerDiv2}
              onChange={(e) => setVPerDiv2(Number(e.target.value))}
              className="border border-black bg-white px-1 py-0.5 text-[10px] font-mono font-bold focus:outline-none"
            >
              {STANDARD_VOLT_DIVS.map((v) => (
                <option key={v} value={v}>
                  {v < 1 ? `${v * 1000} mV` : `${v} V`}/ô
                </option>
              ))}
            </select>
            <button
              onClick={() => autoScaleVolts(2)}
              className="px-1.5 py-0.5 bg-white hover:bg-[#FEE2E2] border border-black font-bold text-[9px] uppercase cursor-pointer"
              title="Tự đặt Volt/ô sao cho sóng gọn trong 6 ô"
            >
              TỰ ĐẶT
            </button>
          </div>
        </div>
      </div>

      {/* 5. Flat waveform warning if applicable */}
      {isFlatWarning && (
        <div className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] border-t border-black text-[11px] font-bold flex items-center gap-1.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>Đường gần phẳng: thử đổi thời gian quét hoặc bấm TỰ ĐẶT.</span>
        </div>
      )}

      {/* 6. Footer Stats Row */}
      <div className="px-3 py-1 bg-[#EEF2FF] border-t-2 border-black flex items-center justify-between text-[10px] font-mono text-gray-700">
        <div>
          <span>Cửa sổ: </span>
          <span className="font-bold text-black">{scanTimeMs} ms</span>
          <span className="mx-1 text-gray-400">|</span>
          <span>Số mẫu: </span>
          <span className="font-bold text-black">{result ? result.t.length : 0}</span>
          <span className="mx-1 text-gray-400">|</span>
          <span>dt: </span>
          <span className="font-bold text-black">
            {result
              ? result.dt * 1e6 < 1000
                ? `${(result.dt * 1e6).toFixed(1)} µs`
                : `${(result.dt * 1000).toFixed(3)} ms`
              : '---'}
          </span>
          <span className="mx-1 text-gray-400">|</span>
          <span>Hội tụ: </span>
          <span className={`font-bold ${result?.converged ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {result ? (result.converged ? 'Có' : 'Không') : '---'}
          </span>
        </div>

        <div className="text-gray-500 text-[9px] italic">
          10 MΩ/kênh • Thuần quá độ
        </div>
      </div>
    </div>
  );
};
