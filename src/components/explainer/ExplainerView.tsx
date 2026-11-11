import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Cpu,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle,
  HelpCircle,
  Eye,
  Sliders,
  Calculator,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { APPLIANCE_REGISTRY, getApplianceDef } from '../../content/do-dung-dien/registry';
import { DoDungDienDef, ExplainerWorkspaceState } from '../../content/do-dung-dien/types';
import { EnergyCalculator } from './EnergyCalculator';

export const ExplainerView: React.FC = () => {
  const { circuit, updateExplainerState } = useWorkspaceStore();

  const state: ExplainerWorkspaceState = circuit.explainerState || {
    selectedApplianceId: 'noi-com-dien',
    selectedSubtypeId: 'soi-dot',
    activeTab: 'cautao',
    viewMode: 'ngoai',
    selectedPartId: null,
    stepIndex: 0,
    calcRows: [
      { id: '1', name: 'Đèn sợi đốt (60 W)', powerWatts: 60, hoursPerDay: 4, daysPerMonth: 30 },
      { id: '2', name: 'Đèn LED búp (9 W)', powerWatts: 9, hoursPerDay: 4, daysPerMonth: 30 },
      { id: '3', name: 'Nồi cơm điện (700 W)', powerWatts: 700, hoursPerDay: 1, daysPerMonth: 30 },
      { id: '4', name: 'Quạt bàn (55 W)', powerWatts: 55, hoursPerDay: 6, daysPerMonth: 30 },
    ],
    unitPrice: null,
    compareRowAId: '1',
    compareRowBId: '2',
  };

  const isCalcMode = state.selectedApplianceId === 'tinh-dien-nang';
  const currentDef: DoDungDienDef = getApplianceDef(
    state.selectedApplianceId,
    state.selectedSubtypeId
  );

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer for Nguyên lí
  useEffect(() => {
    if (isPlaying && !isCalcMode && state.activeTab === 'nguyenli') {
      timerRef.current = setInterval(() => {
        const nextStep = (state.stepIndex + 1) % currentDef.buoc.length;
        updateExplainerState({ stepIndex: nextStep });
      }, 3000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isCalcMode, state.activeTab, state.stepIndex, currentDef.buoc.length]);

  const handleSelectAppliance = (appId: string) => {
    setIsPlaying(false);
    updateExplainerState({
      selectedApplianceId: appId,
      selectedPartId: null,
      stepIndex: 0,
    });
  };

  const handleSelectSubtype = (subId: string) => {
    setIsPlaying(false);
    updateExplainerState({
      selectedSubtypeId: subId,
      selectedPartId: null,
      stepIndex: 0,
    });
  };

  const handleSelectTab = (tab: ExplainerWorkspaceState['activeTab']) => {
    setIsPlaying(false);
    updateExplainerState({
      activeTab: tab,
      selectedPartId: null,
    });
  };

  const handlePrevStep = () => {
    setIsPlaying(false);
    const count = currentDef.buoc.length;
    const prev = (state.stepIndex - 1 + count) % count;
    updateExplainerState({ stepIndex: prev });
  };

  const handleNextStep = () => {
    setIsPlaying(false);
    const count = currentDef.buoc.length;
    const next = (state.stepIndex + 1) % count;
    updateExplainerState({ stepIndex: next });
  };

  const selectedPart = currentDef.boPhan.find((p) => p.id === state.selectedPartId);
  const currentStep = currentDef.buoc[state.stepIndex] || currentDef.buoc[0];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      {/* 1. TOP SWITCHER BAR */}
      <div className="bg-white border-b-[3px] border-black px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Main Category Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {APPLIANCE_REGISTRY.map((app) => {
            const isSelected = state.selectedApplianceId === app.id;
            return (
              <button
                key={app.id}
                onClick={() => handleSelectAppliance(app.id)}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#4169E1] text-white shadow-none translate-x-0.5 translate-y-0.5'
                    : 'bg-white hover:bg-yellow-100 text-black'
                }`}
              >
                {app.shortName}
              </button>
            );
          })}

          {/* Calculator Tab */}
          <button
            onClick={() => handleSelectAppliance('tinh-dien-nang')}
            className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5 ${
              isCalcMode
                ? 'bg-[#2DB84D] text-white shadow-none translate-x-0.5 translate-y-0.5'
                : 'bg-white hover:bg-emerald-50 text-black'
            }`}
          >
            <Calculator size={14} strokeWidth={2.5} />
            TÍNH ĐIỆN NĂNG
          </button>
        </div>

        {/* Subtype selector when 'den-dien' is active */}
        {!isCalcMode && state.selectedApplianceId === 'den-dien' && (
          <div className="flex items-center gap-1 bg-[#EEF2FF] border-2 border-black px-2 py-1">
            <span className="text-[11px] font-black uppercase text-gray-700 mr-1">Loại đèn:</span>
            {[
              { id: 'soi-dot', label: 'Sợi đốt' },
              { id: 'huynh-quang', label: 'Huỳnh quang' },
              { id: 'led', label: 'LED' },
            ].map((st) => {
              const active = (state.selectedSubtypeId || 'soi-dot') === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => handleSelectSubtype(st.id)}
                  className={`px-2 py-0.5 text-xs font-black border border-black transition-all ${
                    active ? 'bg-[#FFD84D] text-black shadow-[1px_1px_0px_0px_#000]' : 'bg-white hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Review Status Tag */}
        <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 flex items-center gap-1">
          <Info size={12} />
          {currentDef.reviewStatus}
        </div>
      </div>

      {/* 2. MODE BODY */}
      {isCalcMode ? (
        <EnergyCalculator
          rows={state.calcRows || []}
          unitPrice={state.unitPrice !== undefined ? state.unitPrice : null}
          compareRowAId={state.compareRowAId}
          compareRowBId={state.compareRowBId}
          onChange={(updates) => updateExplainerState(updates)}
        />
      ) : (
        <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
          {/* Header Title & Short Description */}
          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FFD84D] text-black text-[11px] font-black px-2 py-0.5 border border-black uppercase">
                  Công nghệ Lớp 6
                </span>
                <h1 className="text-lg sm:text-xl font-black uppercase text-gray-900 tracking-tight">
                  {currentDef.ten}
                </h1>
              </div>
              <p className="text-xs text-gray-700 font-bold mt-1 max-w-3xl leading-relaxed">
                {currentDef.moTaNgan}
              </p>
            </div>

            {/* 4 Tabs Navigation */}
            <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
              {[
                { id: 'cautao', label: 'CẤU TẠO', icon: Layers },
                { id: 'sodokhoi', label: 'SƠ ĐỒ KHỐI', icon: Cpu },
                { id: 'nguyenli', label: 'NGUYÊN LÍ', icon: Play },
                { id: 'sudung', label: 'SỬ DỤNG', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabActive = state.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all ${
                      isTabActive
                        ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_0px_#4169E1]'
                        : 'bg-white hover:bg-slate-100 text-gray-800'
                    }`}
                  >
                    <Icon size={14} strokeWidth={2.5} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: CẤU TẠO */}
          {state.activeTab === 'cautao' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Left Column: Visual SVG viewer */}
              <div className="lg:col-span-8 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-3">
                  <div className="flex items-center gap-2">
                    <Eye size={17} strokeWidth={2.5} className="text-[#4169E1]" />
                    <span className="text-xs font-black uppercase tracking-tight text-gray-900">
                      Hình minh họa trực quan (Bấm vào bộ phận để xem chi tiết)
                    </span>
                  </div>

                  {/* Inside / Outside Toggle */}
                  <div className="inline-flex border-2 border-black">
                    <button
                      onClick={() => updateExplainerState({ viewMode: 'ngoai' })}
                      className={`px-3 py-1 text-xs font-black transition-colors ${
                        state.viewMode === 'ngoai'
                          ? 'bg-[#4169E1] text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      BÊN NGOÀI
                    </button>
                    <button
                      onClick={() => updateExplainerState({ viewMode: 'trong' })}
                      className={`px-3 py-1 text-xs font-black border-l-2 border-black transition-colors ${
                        state.viewMode === 'trong'
                          ? 'bg-[#4169E1] text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      CẮT LỚP (BÊN TRONG)
                    </button>
                  </div>
                </div>

                {/* SVG Render Container */}
                <div className="flex-1 min-h-[300px] flex items-center justify-center bg-[#FAFAFA] border-2 border-dashed border-gray-300 p-2 relative">
                  <svg
                    viewBox={currentDef.hinhSVG.viewBox}
                    className="w-full h-auto max-h-[360px] drop-shadow-sm"
                  >
                    {state.viewMode === 'ngoai'
                      ? currentDef.hinhSVG.ngoai(
                          [],
                          state.selectedPartId,
                          (id) => updateExplainerState({ selectedPartId: id })
                        )
                      : currentDef.hinhSVG.trong(
                          [],
                          state.selectedPartId,
                          (id) => updateExplainerState({ selectedPartId: id })
                        )}
                  </svg>
                </div>

                <div className="mt-3 text-[11px] font-bold text-gray-500 italic text-center">
                  Gợi ý: Nhấp trực tiếp vào hình hoặc chọn tên bộ phận từ danh sách bên phải.
                </div>
              </div>

              {/* Right Column: Parts List & Details Card */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Active selected card */}
                <div className="bg-[#FFFBEB] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
                  <div className="flex items-center gap-1.5 mb-2 text-[#b45309]">
                    <Info size={16} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-tight">
                      Chi tiết bộ phận đang chọn:
                    </span>
                  </div>

                  {selectedPart ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                        <span className="font-black text-sm text-gray-900">{selectedPart.ten}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-white border border-black">
                          {selectedPart.viTri === 'ngoai' ? 'Bên ngoài' : 'Bên trong'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 font-bold leading-relaxed">
                        {selectedPart.chucNang}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 font-bold italic py-2">
                      Chưa chọn bộ phận nào. Hãy bấm vào một bộ phận bất kì trong danh sách bên dưới hoặc trên hình vẽ.
                    </div>
                  )}
                </div>

                {/* Parts Directory */}
                <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex-1">
                  <div className="text-xs font-black uppercase text-gray-900 mb-2.5 pb-1 border-b-2 border-black">
                    Danh mục bộ phận cấu tạo:
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {currentDef.boPhan.map((part) => {
                      const isSelected = state.selectedPartId === part.id;
                      return (
                        <button
                          key={part.id}
                          onClick={() => {
                            updateExplainerState({
                              selectedPartId: part.id,
                              viewMode: part.viTri,
                            });
                          }}
                          className={`w-full text-left p-2 border-2 border-black text-xs font-bold transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#FFD84D] shadow-[2px_2px_0px_0px_#000] translate-x-0.5'
                              : 'bg-white hover:bg-yellow-50'
                          }`}
                        >
                          <span className="truncate pr-1">{part.ten}</span>
                          <span className="text-[10px] text-gray-500 font-normal shrink-0">
                            {part.viTri === 'ngoai' ? 'Ngoài' : 'Trong'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SƠ ĐỒ KHỐI */}
          {state.activeTab === 'sodokhoi' && (
            <div className="bg-white border-[3px] border-black p-4 sm:p-6 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <Cpu size={18} strokeWidth={2.5} className="text-[#4169E1]" />
                  <h3 className="font-black text-xs sm:text-sm uppercase text-gray-900">
                    SƠ ĐỒ KHỐI NGUYÊN LÍ HOẠT ĐỘNG
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-gray-600 italic">
                  Bấm vào từng khối chức năng để xem mô tả
                </span>
              </div>

              {/* Block Diagram Rendering */}
              <div className="overflow-x-auto p-4 bg-[#f8fafc] border-2 border-black">
                <svg viewBox="0 0 600 160" className="w-full max-w-4xl mx-auto h-auto">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
                    </marker>
                  </defs>

                  {/* Connectors / Arrows */}
                  {currentDef.mui_ten.map((mt) => {
                    const fromK = currentDef.khoi.find((k) => k.id === mt.tu);
                    const toK = currentDef.khoi.find((k) => k.id === mt.den);
                    if (!fromK || !toK) return null;

                    const startX = fromK.x + 100;
                    const startY = fromK.y + 25;
                    const endX = toK.x;
                    const endY = toK.y + 25;

                    return (
                      <g key={mt.id}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#0f172a"
                          strokeWidth="2.5"
                          markerEnd="url(#arrowhead)"
                        />
                        {mt.nhan && (
                          <text
                            x={(startX + endX) / 2}
                            y={startY - 8}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#2563eb"
                          >
                            {mt.nhan}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Rectangular Blocks */}
                  {currentDef.khoi.map((k) => {
                    const isSelected = state.selectedPartId === k.id;
                    return (
                      <g
                        key={k.id}
                        className="cursor-pointer transition-all"
                        onClick={() => updateExplainerState({ selectedPartId: k.id })}
                      >
                        <rect
                          x={k.x}
                          y={k.y}
                          width="100"
                          height="50"
                          rx="4"
                          fill={isSelected ? '#fde047' : '#ffffff'}
                          stroke="#0f172a"
                          strokeWidth={isSelected ? '3' : '2'}
                          filter="drop-shadow(2px 2px 0px #000)"
                        />
                        <text
                          x={k.x + 50}
                          y={k.y + 28}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill="#0f172a"
                        >
                          {k.ten}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Block Info Card */}
              {(() => {
                const k = currentDef.khoi.find((item) => item.id === state.selectedPartId);
                return (
                  <div className="bg-[#EEF2FF] border-2 border-black p-3.5 flex items-start gap-3">
                    <Info size={18} strokeWidth={2.5} className="text-[#4169E1] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-black uppercase text-gray-900 mb-0.5">
                        {k ? `Khối: ${k.ten}` : 'Khối chức năng:'}
                      </div>
                      <p className="text-xs text-gray-800 font-bold leading-relaxed">
                        {k
                          ? k.chucNang
                          : 'Nhấp chuột vào một khối chữ nhật trong sơ đồ để xem vai trò và chức năng của khối đó.'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: NGUYÊN LÍ (BƯỚC ĐIỀU HƯỚNG TƯƠNG TÁC) */}
          {state.activeTab === 'nguyenli' && (
            <div className="space-y-4">
              {/* Stepper Toolbar */}
              <div className="bg-white border-[3px] border-black p-3.5 shadow-[4px_4px_0px_0px_#000] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1e293b] text-white text-xs font-mono font-black px-2.5 py-1 border border-black">
                    Bước {state.stepIndex + 1}/{currentDef.buoc.length}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-gray-900">
                    {currentStep.tieuDe}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevStep}
                    className="p-1.5 bg-white border-2 border-black hover:bg-gray-100 shadow-[1px_1px_0px_0px_#000] active:translate-y-0.5"
                    title="Bước trước"
                  >
                    <ChevronLeft size={16} strokeWidth={3} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-3 py-1 text-xs font-black border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 transition-all ${
                      isPlaying ? 'bg-[#ef4444] text-white' : 'bg-[#2DB84D] text-white'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause size={14} /> DỪNG
                      </>
                    ) : (
                      <>
                        <Play size={14} /> TỰ CHẠY
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="p-1.5 bg-white border-2 border-black hover:bg-gray-100 shadow-[1px_1px_0px_0px_#000] active:translate-y-0.5"
                    title="Bước sau"
                  >
                    <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Step Explanation Card */}
              <div className="bg-[#FFFBEB] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
                <div className="text-xs font-black uppercase text-[#b45309] mb-1">
                  Mô tả diễn biến:
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-relaxed">
                  {currentStep.noiDung}
                </p>
              </div>

              {/* Responsive 2-Column Highlighting Visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual SVG with dynamic highlighting */}
                <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col items-center">
                  <div className="w-full text-xs font-black uppercase text-gray-800 pb-2 border-b-2 border-black mb-2 flex justify-between items-center">
                    <span>Mô hình thiết bị</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 border border-blue-300">
                      Đang sáng: {currentStep.sangBoPhan.join(', ')}
                    </span>
                  </div>
                  <div className="w-full min-h-[220px] flex items-center justify-center bg-[#FAFAFA] border-2 border-dashed border-gray-300 p-2">
                    <svg viewBox={currentDef.hinhSVG.viewBox} className="w-full max-h-[260px]">
                      {currentDef.hinhSVG.trong(currentStep.sangBoPhan, null, () => {})}
                    </svg>
                  </div>
                </div>

                {/* Block Diagram highlighting */}
                <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col">
                  <div className="w-full text-xs font-black uppercase text-gray-800 pb-2 border-b-2 border-black mb-2 flex justify-between items-center">
                    <span>Dòng truyền tín hiệu</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                      Đang kích hoạt: {currentStep.sangKhoi.join(', ')}
                    </span>
                  </div>
                  <div className="w-full min-h-[220px] flex items-center justify-center bg-[#FAFAFA] border-2 border-dashed border-gray-300 p-2 overflow-x-auto">
                    <svg viewBox="0 0 600 160" className="w-full max-w-lg h-auto">
                      <defs>
                        <marker
                          id="arrowhead-step"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
                        </marker>
                      </defs>

                      {/* Arrows */}
                      {currentDef.mui_ten.map((mt) => {
                        const fromK = currentDef.khoi.find((k) => k.id === mt.tu);
                        const toK = currentDef.khoi.find((k) => k.id === mt.den);
                        if (!fromK || !toK) return null;

                        const isHighlighted = currentStep.sangMuiTen.includes(mt.id);
                        const startX = fromK.x + 100;
                        const startY = fromK.y + 25;
                        const endX = toK.x;
                        const endY = toK.y + 25;

                        return (
                          <line
                            key={mt.id}
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke={isHighlighted ? '#ef4444' : '#cbd5e1'}
                            strokeWidth={isHighlighted ? '4' : '2'}
                            markerEnd="url(#arrowhead-step)"
                          />
                        );
                      })}

                      {/* Blocks */}
                      {currentDef.khoi.map((k) => {
                        const isHighlighted = currentStep.sangKhoi.includes(k.id);
                        return (
                          <g key={k.id}>
                            <rect
                              x={k.x}
                              y={k.y}
                              width="100"
                              height="50"
                              rx="4"
                              fill={isHighlighted ? '#fde047' : '#f1f5f9'}
                              stroke={isHighlighted ? '#0f172a' : '#94a3b8'}
                              strokeWidth={isHighlighted ? '3' : '1.5'}
                              filter={isHighlighted ? 'drop-shadow(2px 2px 0px #000)' : 'none'}
                            />
                            <text
                              x={k.x + 50}
                              y={k.y + 28}
                              textAnchor="middle"
                              fontSize="11"
                              fontWeight="bold"
                              fill={isHighlighted ? '#0f172a' : '#64748b'}
                            >
                              {k.ten}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SỬ DỤNG AN TOÀN & TIẾT KIỆM */}
          {state.activeTab === 'sudung' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Technical Specifications */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] md:col-span-2">
                <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-3">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} strokeWidth={2.5} className="text-[#4169E1]" />
                    <h3 className="font-black text-xs uppercase text-gray-900">
                      THÔNG SỐ KĨ THUẬT QUY CHUẨN (GIÁ TRỊ THAM KHẢO)
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold italic">
                    Theo chương trình GDPT 2018
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentDef.thongSo.map((ts, idx) => (
                    <div key={idx} className="bg-[#f8fafc] border-2 border-black p-3 space-y-1">
                      <div className="text-[11px] text-gray-600 font-bold uppercase">{ts.ten}</div>
                      <div className="text-base font-black font-mono text-gray-900">{ts.giaTri}</div>
                      {ts.chuThich && (
                        <div className="text-[10px] text-gray-500 font-bold italic">{ts.chuThich}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Rules */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black text-[#dc2626]">
                  <ShieldCheck size={20} strokeWidth={2.5} />
                  <h3 className="font-black text-xs uppercase tracking-tight">
                    AN TOÀN KHI SỬ DỤNG
                  </h3>
                </div>

                <ul className="space-y-2 text-xs font-bold text-gray-800">
                  {currentDef.anToan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-red-50/60 border border-red-200 p-2">
                      <span className="text-red-600 font-black">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Energy Saving Tips */}
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-black text-[#15803d]">
                  <Zap size={20} strokeWidth={2.5} />
                  <h3 className="font-black text-xs uppercase tracking-tight">
                    MẸO SỬ DỤNG TIẾT KIỆM ĐIỆN NĂNG
                  </h3>
                </div>

                <ul className="space-y-2 text-xs font-bold text-gray-800">
                  {currentDef.tietKiem.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-emerald-50/60 border border-emerald-200 p-2">
                      <span className="text-emerald-600 font-black">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
