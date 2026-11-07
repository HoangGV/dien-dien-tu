import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Play, Pause, Trash2, Sliders, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { oscilloscopeService, OscilloscopeSample } from '../../core/oscilloscopeService';
import { formatMeasure } from '../../core/measureFormat';
import { useWorkspaceStore } from '../../store/workspaceStore';

import { simulationService } from '../../core/simulationService';

export const TIME_DIV_OPTIONS = [
  { label: '1 ms', value: 0.001 },
  { label: '2 ms', value: 0.002 },
  { label: '5 ms', value: 0.005 },
  { label: '10 ms', value: 0.01 },
  { label: '20 ms', value: 0.02 },
  { label: '50 ms', value: 0.05 },
  { label: '100 ms', value: 0.1 },
  { label: '200 ms', value: 0.2 },
  { label: '500 ms', value: 0.5 },
  { label: '1 s', value: 1.0 },
];

export const VOLT_DIV_OPTIONS = [
  { label: '0.1 V', value: 0.1 },
  { label: '0.2 V', value: 0.2 },
  { label: '0.5 V', value: 0.5 },
  { label: '1 V', value: 1.0 },
  { label: '2 V', value: 2.0 },
  { label: '5 V', value: 5.0 },
  { label: '10 V', value: 10.0 },
];

export const OscilloscopePanel: React.FC = () => {
  const { setOscilloscopePanelOpen, circuit, timeSpeed } = useWorkspaceStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local control state for UI button display
  const [isHeld, setIsHeld] = useState<boolean>(oscilloscopeService.isHeld);
  const [timeDiv, setTimeDiv] = useState<number>(oscilloscopeService.timePerDiv);
  const [vDiv1, setVDiv1] = useState<number>(oscilloscopeService.vPerDiv1);
  const [vDiv2, setVDiv2] = useState<number>(oscilloscopeService.vPerDiv2);
  const [offset1, setOffset1] = useState<number>(oscilloscopeService.offset1);
  const [offset2, setOffset2] = useState<number>(oscilloscopeService.offset2);
  const [ch1On, setCh1On] = useState<boolean>(oscilloscopeService.ch1Enabled);
  const [ch2On, setCh2On] = useState<boolean>(oscilloscopeService.ch2Enabled);
  const [trigMode, setTrigMode] = useState<'auto' | 'rising'>(oscilloscopeService.triggerMode);
  const [trigLevel, setTrigLevel] = useState<number>(oscilloscopeService.triggerLevel);

  // Single-shot state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureProgress, setCaptureProgress] = useState<number>(0);

  // Stats line below canvas
  const [statusText, setStatusText] = useState<{ windowMs: number; sampleCount: number; isFlat: boolean }>({
    windowMs: 200,
    sampleCount: 0,
    isFlat: false,
  });

  // Cursor readout
  const [cursorReadout, setCursorReadout] = useState<string | null>(null);
  const cursorPointRef = useRef<{ x: number; y: number } | null>(null);

  const toggleHold = () => {
    const next = !isHeld;
    oscilloscopeService.setHeld(next);
    setIsHeld(next);
  };

  const handleClear = () => {
    oscilloscopeService.clear();
  };

  const handleAutoSet = () => {
    oscilloscopeService.autoScale(circuit.components);
    setTimeDiv(oscilloscopeService.timePerDiv);
    setVDiv1(oscilloscopeService.vPerDiv1);
    setVDiv2(oscilloscopeService.vPerDiv2);
    setOffset1(oscilloscopeService.offset1);
    setOffset2(oscilloscopeService.offset2);
  };

  const handleSingleShot = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCaptureProgress(0);
    const duration = 10 * timeDiv;
    simulationService.runSingleShotAsync(
      duration,
      (pct) => setCaptureProgress(pct),
      () => {
        setIsCapturing(false);
        oscilloscopeService.setHeld(true);
        setIsHeld(true);
      }
    );
  };

  const handleTimeDivChange = (val: number) => {
    oscilloscopeService.setTimePerDiv(val);
    setTimeDiv(val);
  };

  const handleVDiv1Change = (val: number) => {
    oscilloscopeService.setVPerDiv1(val);
    setVDiv1(val);
  };

  const handleVDiv2Change = (val: number) => {
    oscilloscopeService.setVPerDiv2(val);
    setVDiv2(val);
  };

  const adjustOffset1 = (delta: number) => {
    const next = Math.round((offset1 + delta) * 2) / 2;
    oscilloscopeService.setOffset1(next);
    setOffset1(next);
  };

  const adjustOffset2 = (delta: number) => {
    const next = Math.round((offset2 + delta) * 2) / 2;
    oscilloscopeService.setOffset2(next);
    setOffset2(next);
  };

  const toggleCh1 = () => {
    const next = !ch1On;
    oscilloscopeService.setCh1Enabled(next);
    setCh1On(next);
  };

  const toggleCh2 = () => {
    const next = !ch2On;
    oscilloscopeService.setCh2Enabled(next);
    setCh2On(next);
  };

  const handleTrigModeChange = (mode: 'auto' | 'rising') => {
    oscilloscopeService.setTriggerMode(mode);
    setTrigMode(mode);
  };

  const handleTrigLevelChange = (val: number) => {
    oscilloscopeService.setTriggerLevel(val);
    setTrigLevel(val);
  };

  // Canvas drawing loop (throttled to <= 20 FPS, paused when tab hidden)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let lastDrawTime = 0;

    const draw = (now: number) => {
      // Limit to <= 20 FPS (at least 50 ms between frames)
      if (now - lastDrawTime >= 50 && !document.hidden) {
        lastDrawTime = now;
        renderCanvas(canvas);
      }
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [timeDiv, vDiv1, vDiv2, offset1, offset2, ch1On, ch2On, trigMode, trigLevel]);

  const renderCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // 2. Grid: 10 horizontal divisions, 8 vertical divisions
    const cols = 10;
    const rows = 8;
    const dx = width / cols;
    const dy = height / rows;
    const yMid = height / 2;
    const xMid = width / 2;

    // Draw main grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1E293B';
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * dx, 0);
      ctx.lineTo(c * dx, height);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * dy);
      ctx.lineTo(width, r * dy);
      ctx.stroke();
    }

    // Center axes (slightly brighter with sub-ticks)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, yMid);
    ctx.lineTo(width, yMid);
    ctx.moveTo(xMid, 0);
    ctx.lineTo(xMid, height);
    ctx.stroke();

    // Sub-division ticks on center axes
    ctx.lineWidth = 1;
    for (let i = 0; i <= cols * 5; i++) {
      const tx = (i * dx) / 5;
      ctx.beginPath();
      ctx.moveTo(tx, yMid - 3);
      ctx.lineTo(tx, yMid + 3);
      ctx.stroke();
    }
    for (let j = 0; j <= rows * 5; j++) {
      const ty = (j * dy) / 5;
      ctx.beginPath();
      ctx.moveTo(xMid - 3, ty);
      ctx.lineTo(xMid + 3, ty);
      ctx.stroke();
    }

    // 3. Ground reference level markers on left edge
    if (ch1On) {
      const yZero1 = yMid - offset1 * dy;
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(0, yZero1);
      ctx.lineTo(8, yZero1 - 4);
      ctx.lineTo(8, yZero1 + 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 8px monospace';
      ctx.fillText('1', 10, yZero1 + 3);
    }
    if (ch2On) {
      const yZero2 = yMid - offset2 * dy;
      ctx.fillStyle = '#F87171';
      ctx.beginPath();
      ctx.moveTo(0, yZero2);
      ctx.lineTo(8, yZero2 - 4);
      ctx.lineTo(8, yZero2 + 4);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 8px monospace';
      ctx.fillText('2', 10, yZero2 + 3);
    }

    // 4. Fetch samples from Ring Buffer
    const samples = oscilloscopeService.getSamples();
    if (samples.length === 0) {
      // Empty buffer notice
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHƯA CÓ TÍN HIỆU — BẤM [CHẠY] MÔ PHỎNG ĐỂ THU SÓNG', width / 2, height / 2);
      return;
    }

    const tSpan = 10 * timeDiv;
    const tLatest = samples[samples.length - 1].t;

    let tStart = Math.max(0, tLatest - tSpan);

    // Simple Trigger (rising edge alignment on CH1 if enabled)
    if (trigMode === 'rising' && ch1On) {
      // Find latest rising edge crossing trigLevel in buffer
      let edgeIdx = -1;
      for (let i = samples.length - 1; i >= 1; i--) {
        if (samples[i - 1].v1 < trigLevel && samples[i].v1 >= trigLevel) {
          // Found rising edge
          edgeIdx = i;
          break;
        }
      }
      if (edgeIdx >= 0) {
        const tEdge = samples[edgeIdx].t;
        // Align trigger edge to middle of screen (5th div)
        tStart = tEdge - 5 * timeDiv;
      }
    }

    // Draw Channel 1 (Blue)
    if (ch1On) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        if (s.t < tStart) continue;
        if (s.t > tStart + tSpan) break;

        const x = ((s.t - tStart) / tSpan) * width;
        const y = yMid - offset1 * dy - (s.v1 / vDiv1) * dy;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw Channel 2 (Red)
    if (ch2On) {
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        if (s.t < tStart) continue;
        if (s.t > tStart + tSpan) break;

        const x = ((s.t - tStart) / tSpan) * width;
        const y = yMid - offset2 * dy - (s.v2 / vDiv2) * dy;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // 5. Cursor line & Readout
    if (cursorPointRef.current) {
      const { x, y } = cursorPointRef.current;
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical cursor line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Horizontal cursor line
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  // Cursor mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    cursorPointRef.current = { x, y };

    const samples = oscilloscopeService.getSamples();
    if (samples.length === 0) {
      setCursorReadout(null);
      return;
    }

    const tSpan = 10 * timeDiv;
    const tLatest = samples[samples.length - 1].t;
    const tStart = Math.max(0, tLatest - tSpan);
    const cursorTime = tStart + (x / canvas.width) * tSpan;

    // Find closest sample
    let best = samples[0];
    let bestDist = Math.abs(best.t - cursorTime);
    for (let i = 1; i < samples.length; i++) {
      const d = Math.abs(samples[i].t - cursorTime);
      if (d < bestDist) {
        bestDist = d;
        best = samples[i];
      }
    }

    const tStr = `${(best.t * 1000).toFixed(1)} ms`;
    const v1Str = `${best.v1.toFixed(2)} V`;
    const v2Str = `${best.v2.toFixed(2)} V`;
    setCursorReadout(`t = ${tStr}, V1 = ${v1Str}, V2 = ${v2Str}`);
  };

  const handleMouseLeave = () => {
    cursorPointRef.current = null;
    setCursorReadout(null);
  };

  return (
    <div className="bg-white border-[3px] border-black shadow-[4px_4px_0_#000] p-3 space-y-2 max-w-2xl w-full">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Activity size={18} strokeWidth={3} className="text-[#2563EB]" />
          <h3 className="font-black text-xs uppercase tracking-wider text-black">
            ĐỒ THỊ DAO ĐỘNG KÍ ẢO (OSCILLOSCOPE)
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleHold}
            className={`px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5 ${
              isHeld ? 'bg-[#EF4444] text-white' : 'bg-[#FFD84D] text-black hover:bg-[#FFE37A]'
            }`}
          >
            {isHeld ? <Play size={10} strokeWidth={3} /> : <Pause size={10} strokeWidth={3} />}
            {isHeld ? 'TIẾP TỤC' : 'DỪNG HÌNH'}
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-0.5 border-2 border-black bg-white hover:bg-gray-100 text-black text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <Trash2 size={10} strokeWidth={3} />
            XÓA
          </button>
          <button
            onClick={() => setOscilloscopePanelOpen(false)}
            className="p-1 border-2 border-black bg-white hover:bg-red-50 text-black cursor-pointer transition-transform active:translate-x-0.5 active:translate-y-0.5"
            title="Đóng panel đồ thị"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 2. Cursor Readout Banner */}
      <div className="h-6 bg-[#0F172A] border-2 border-black px-2 flex items-center justify-between text-[11px] font-mono font-bold text-white">
        <div className="flex items-center gap-4">
          <span className="text-yellow-400">
            {cursorReadout || 'Rê chuột trên đồ thị để đo điểm'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[#38BDF8]">CH1: {vDiv1} V/ô</span>
          <span className="text-[#F87171]">CH2: {vDiv2} V/ô</span>
          <span className="text-gray-300">TIME: {timeDiv * 1000} ms/ô</span>
        </div>
      </div>

      {/* 3. Main Screen Canvas (10 cols x 8 rows) */}
      <div className="border-[3px] border-black bg-black overflow-hidden flex justify-center">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-auto cursor-crosshair block"
        />
      </div>

      {/* 4. Controls Deck (Time/div, CH1, CH2, Trigger) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[10px]">
        {/* TIME / DIV */}
        <div className="border-2 border-black p-2 bg-[#F8FAFC] space-y-1">
          <span className="font-black uppercase text-black block">Thời gian / ô:</span>
          <select
            value={timeDiv}
            onChange={(e) => handleTimeDivChange(parseFloat(e.target.value))}
            className="w-full h-6 border border-black bg-white font-bold px-1 text-[11px] cursor-pointer"
          >
            {TIME_DIV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* CH1 (Blue) */}
        <div className="border-2 border-black p-2 bg-[#EFF6FF] space-y-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 font-black uppercase text-[#1D4ED8] cursor-pointer">
              <input
                type="checkbox"
                checked={ch1On}
                onChange={toggleCh1}
                className="w-3 h-3 accent-[#2563EB]"
              />
              Kênh 1 (CH1)
            </label>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => adjustOffset1(0.5)}
                className="px-1 border border-black bg-white hover:bg-gray-100 font-black"
                title="Dịch lên"
              >
                ▲
              </button>
              <button
                onClick={() => adjustOffset1(-0.5)}
                className="px-1 border border-black bg-white hover:bg-gray-100 font-black"
                title="Dịch xuống"
              >
                ▼
              </button>
            </div>
          </div>
          <select
            value={vDiv1}
            onChange={(e) => handleVDiv1Change(parseFloat(e.target.value))}
            disabled={!ch1On}
            className="w-full h-6 border border-black bg-white font-bold px-1 text-[11px] cursor-pointer disabled:opacity-50"
          >
            {VOLT_DIV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} / ô
              </option>
            ))}
          </select>
        </div>

        {/* CH2 (Red) */}
        <div className="border-2 border-black p-2 bg-[#FEF2F2] space-y-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 font-black uppercase text-[#B91C1C] cursor-pointer">
              <input
                type="checkbox"
                checked={ch2On}
                onChange={toggleCh2}
                className="w-3 h-3 accent-[#DC2626]"
              />
              Kênh 2 (CH2)
            </label>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => adjustOffset2(0.5)}
                className="px-1 border border-black bg-white hover:bg-gray-100 font-black"
                title="Dịch lên"
              >
                ▲
              </button>
              <button
                onClick={() => adjustOffset2(-0.5)}
                className="px-1 border border-black bg-white hover:bg-gray-100 font-black"
                title="Dịch xuống"
              >
                ▼
              </button>
            </div>
          </div>
          <select
            value={vDiv2}
            onChange={(e) => handleVDiv2Change(parseFloat(e.target.value))}
            disabled={!ch2On}
            className="w-full h-6 border border-black bg-white font-bold px-1 text-[11px] cursor-pointer disabled:opacity-50"
          >
            {VOLT_DIV_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} / ô
              </option>
            ))}
          </select>
        </div>

        {/* TRIGGER */}
        <div className="border-2 border-black p-2 bg-[#F8FAFC] space-y-1">
          <span className="font-black uppercase text-black block">Trigger (Kích):</span>
          <div className="flex items-center gap-1">
            <select
              value={trigMode}
              onChange={(e) => handleTrigModeChange(e.target.value as 'auto' | 'rising')}
              className="flex-1 h-6 border border-black bg-white font-bold px-1 text-[10px] cursor-pointer"
            >
              <option value="auto">Tự động</option>
              <option value="rising">Cạnh lên CH1</option>
            </select>
            {trigMode === 'rising' && (
              <input
                type="number"
                step={0.5}
                value={trigLevel}
                onChange={(e) => handleTrigLevelChange(parseFloat(e.target.value) || 0)}
                className="w-12 h-6 border border-black bg-white font-bold px-1 text-right text-[10px]"
                title="Mức điện áp kích (V)"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
