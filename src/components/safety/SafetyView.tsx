import React, { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Wrench,
  HeartPulse,
  FileCheck2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  SafetyTab,
  SafetySceneId,
  SafetyWorkspaceState,
} from '../../content/an-toan-dien/types';
import { ALL_SAFETY_HAZARDS, SAFETY_SCENES } from '../../content/an-toan-dien/scenes';
import { ALL_SAFETY_MEASURES } from '../../content/an-toan-dien/measures';
import { ALL_SAFETY_TOOLS } from '../../content/an-toan-dien/tools';
import {
  FIRST_AID_HEADER_WARNING,
  CORRECT_FIRST_AID_STEPS,
  SHOULD_OR_NOT_QUESTIONS,
} from '../../content/an-toan-dien/firstAid';
import { ALL_SAFETY_QUIZ_QUESTIONS } from '../../content/an-toan-dien/quiz';

export const SafetyView: React.FC = () => {
  const { circuit, updateSafetyState, openPresetInWorkspace } = useWorkspaceStore();

  const state: SafetyWorkspaceState = circuit.safetyState || {
    activeTab: 'moinguy',
    activeSceneId: 'phong-khach',
    selectedHazardId: null,
    discoveredHazardIds: [],
    firstAidStepIds: [
      'step_3_check_consciousness',
      'step_1_disconnect',
      'step_5_warm_hospital',
      'step_2_call_115',
      'step_4_cpr',
    ],
    firstAidChecked: false,
    firstAidShouldAnswers: {},
    quizAnswers: {},
    quizScore: null,
    quizSubmitted: false,
  };

  const [hintHazardId, setHintHazardId] = useState<string | null>(null);
  const [expandedMeasureIds, setExpandedMeasureIds] = useState<string[]>([ALL_SAFETY_MEASURES[0].id]);

  const activeScene = SAFETY_SCENES.find((s) => s.id === state.activeSceneId) || SAFETY_SCENES[0];
  const selectedHazard = ALL_SAFETY_HAZARDS.find((h) => h.id === state.selectedHazardId);

  // Tab switching
  const handleSelectTab = (tab: SafetyTab) => {
    updateSafetyState({ activeTab: tab });
  };

  // Scene switching
  const handleSelectScene = (sceneId: SafetySceneId) => {
    setHintHazardId(null);
    updateSafetyState({
      activeSceneId: sceneId,
      selectedHazardId: null,
    });
  };

  // Hazard selection
  const handleSelectHazard = (hazardId: string) => {
    setHintHazardId(null);
    const discovered = new Set(state.discoveredHazardIds);
    discovered.add(hazardId);
    updateSafetyState({
      selectedHazardId: hazardId,
      discoveredHazardIds: Array.from(discovered),
    });
  };

  // Hint button: pick an undiscovered hazard in current scene
  const handleHint = () => {
    const sceneHazards = ALL_SAFETY_HAZARDS.filter((h) => h.sceneId === state.activeSceneId);
    const undiscovered = sceneHazards.filter((h) => !state.discoveredHazardIds.includes(h.id));
    if (undiscovered.length > 0) {
      const picked = undiscovered[0];
      setHintHazardId(picked.id);
      setTimeout(() => setHintHazardId(null), 4000);
    } else {
      // All discovered in this scene, blink first one
      const picked = sceneHazards[0];
      if (picked) {
        setHintHazardId(picked.id);
        setTimeout(() => setHintHazardId(null), 3000);
      }
    }
  };

  // First Aid Step reordering
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...state.firstAidStepIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    updateSafetyState({
      firstAidStepIds: newSteps,
      firstAidChecked: false,
    });
  };

  const handleShuffleFirstAid = () => {
    const shuffled = [...CORRECT_FIRST_AID_STEPS.map((s) => s.id)].sort(() => Math.random() - 0.5);
    // ensure not identical to correct sequence
    if (shuffled.every((id, idx) => id === CORRECT_FIRST_AID_STEPS[idx].id)) {
      const temp = shuffled[0];
      shuffled[0] = shuffled[1];
      shuffled[1] = temp;
    }
    updateSafetyState({
      firstAidStepIds: shuffled,
      firstAidChecked: false,
    });
  };

  const handleCheckFirstAid = () => {
    updateSafetyState({ firstAidChecked: true });
  };

  const handleShouldAnswer = (questionId: string, answer: 'nen' | 'khong-nen') => {
    updateSafetyState({
      firstAidShouldAnswers: {
        ...state.firstAidShouldAnswers,
        [questionId]: answer,
      },
    });
  };

  // Measure toggle
  const toggleMeasure = (id: string) => {
    setExpandedMeasureIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Cross link from Measure to Hazard
  const handleLinkToHazard = (hazardId: string) => {
    const targetHazard = ALL_SAFETY_HAZARDS.find((h) => h.id === hazardId);
    if (targetHazard) {
      updateSafetyState({
        activeTab: 'moinguy',
        activeSceneId: targetHazard.sceneId,
        selectedHazardId: targetHazard.id,
        discoveredHazardIds: Array.from(new Set([...state.discoveredHazardIds, targetHazard.id])),
      });
    }
  };

  // Quiz answering
  const handleSelectQuizOption = (questionId: string, optionIndex: number) => {
    const newAnswers = { ...state.quizAnswers, [questionId]: optionIndex };
    // calculate score
    let correctCount = 0;
    ALL_SAFETY_QUIZ_QUESTIONS.forEach((q) => {
      if (newAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    updateSafetyState({
      quizAnswers: newAnswers,
      quizScore: correctCount,
    });
  };

  const handleResetQuiz = () => {
    updateSafetyState({
      quizAnswers: {},
      quizScore: null,
      quizSubmitted: false,
    });
  };

  const totalDiscovered = state.discoveredHazardIds.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto">
      {/* 1. TOP BAR: 5 TABS NAVIGATION */}
      <div className="bg-white border-b-[3px] border-black px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-sm sticky top-0 z-20">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'moinguy', label: 'MỐI NGUY', icon: AlertTriangle },
            { id: 'bienphap', label: 'BIỆN PHÁP', icon: Shield },
            { id: 'dungcu', label: 'DỤNG CỤ', icon: Wrench },
            { id: 'socuu', label: 'SƠ CỨU', icon: HeartPulse },
            { id: 'kiemtra', label: 'KIỂM TRA', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = state.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id as SafetyTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-black transition-all shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                  isActive
                    ? 'bg-[#1E293B] text-white shadow-none translate-x-0.5 translate-y-0.5'
                    : 'bg-white hover:bg-yellow-100 text-black'
                }`}
              >
                <Icon size={14} strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Review status tag */}
        <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 flex items-center gap-1">
          <Info size={12} />
          cần GV đối chiếu
        </div>
      </div>

      {/* 2. BODY CONTENT BY TAB */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        {/* TAB 1: MỐI NGUY */}
        {state.activeTab === 'moinguy' && (
          <div className="space-y-4">
            {/* Header info & Scene switcher */}
            <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#EF4444] text-white text-[11px] font-black px-2 py-0.5 border border-black uppercase">
                    TÌM MỐI NGUY TRONG TÌNH HUỐNG
                  </span>
                  <span className="text-xs font-black text-gray-700">
                    Đã tìm <span className="text-emerald-700 font-mono text-sm">{totalDiscovered}/12</span> mối nguy
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-bold mt-1">
                  Quan sát cảnh sinh hoạt dưới đây, nhấp vào các điểm nghi ngờ mất an toàn điện để nhận diện mối nguy và xem cách phòng tránh.
                </p>
              </div>

              {/* Scene Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SAFETY_SCENES.map((sc, idx) => {
                  const isSceneActive = state.activeSceneId === sc.id;
                  const sceneHazardCount = ALL_SAFETY_HAZARDS.filter((h) => h.sceneId === sc.id && state.discoveredHazardIds.includes(h.id)).length;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => handleSelectScene(sc.id)}
                      className={`px-2.5 py-1 text-xs font-black uppercase border-2 border-black transition-all ${
                        isSceneActive
                          ? 'bg-[#4169E1] text-white shadow-[2px_2px_0_#000]'
                          : 'bg-white hover:bg-slate-100 text-gray-800'
                      }`}
                    >
                      ({String.fromCharCode(97 + idx)}) {sc.name.split(' ')[0]} ({sceneHazardCount}/4)
                    </button>
                  );
                })}

                {/* Hint Button */}
                <button
                  onClick={handleHint}
                  className="px-2.5 py-1 text-xs font-black border-2 border-black bg-[#FFD84D] hover:bg-[#FACC15] text-black shadow-[2px_2px_0_#000] active:translate-y-0.5 flex items-center gap-1"
                  title="Nhấp nháy một điểm chưa tìm thấy"
                >
                  <Lightbulb size={13} strokeWidth={3} />
                  GỢI Ý
                </button>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Interactive Scene SVG */}
              <div className="lg:col-span-7 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-2">
                  <div className="text-xs font-black uppercase text-gray-900">
                    Cảnh: {activeScene.name}
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 italic">
                    Nhấp vào dấu (!) để khám phá
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] border-2 border-dashed border-gray-300 p-2">
                  {activeScene.renderSVG(
                    ALL_SAFETY_HAZARDS,
                    state.selectedHazardId,
                    state.discoveredHazardIds,
                    hintHazardId,
                    handleSelectHazard
                  )}
                </div>
              </div>

              {/* Right Column: Selected Hazard Details Panel */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                {selectedHazard ? (
                  <div className="bg-[#FFFBEB] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between flex-1 space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2">
                        <div>
                          <span className="text-[10px] font-black uppercase bg-[#DC2626] text-white px-1.5 py-0.5 border border-black">
                            MỐI NGUY HIỂM
                          </span>
                          <h3 className="font-black text-sm text-gray-900 mt-1">
                            {selectedHazard.name}
                          </h3>
                        </div>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 shrink-0">
                          ✓ Đã khám phá
                        </span>
                      </div>

                      {/* Nguyên nhân */}
                      <div>
                        <div className="text-[11px] font-black uppercase text-amber-900 mb-0.5">
                          1. Nguyên nhân gây nguy hiểm:
                        </div>
                        <p className="text-xs font-bold text-gray-800 leading-relaxed bg-white/70 p-2 border border-amber-300">
                          {selectedHazard.nguyenNhan}
                        </p>
                      </div>

                      {/* Hậu quả */}
                      <div>
                        <div className="text-[11px] font-black uppercase text-red-900 mb-0.5">
                          2. Hậu quả có thể xảy ra:
                        </div>
                        <p className="text-xs font-bold text-red-950 leading-relaxed bg-red-50 p-2 border border-red-300">
                          {selectedHazard.hauQua}
                        </p>
                      </div>

                      {/* Cách phòng tránh */}
                      <div>
                        <div className="text-[11px] font-black uppercase text-emerald-900 mb-0.5">
                          3. Cách phòng tránh an toàn:
                        </div>
                        <p className="text-xs font-bold text-emerald-950 leading-relaxed bg-emerald-50 p-2 border border-emerald-300">
                          {selectedHazard.phongTranh}
                        </p>
                      </div>
                    </div>

                    {/* Simulation link button if present */}
                    {selectedHazard.simulationPresetId && (
                      <div className="pt-2 border-t-2 border-black">
                        <button
                          onClick={() =>
                            openPresetInWorkspace(
                              'mang-dien-trong-nha',
                              selectedHazard.simulationPresetId!,
                              'an-toan-dien'
                            )
                          }
                          className="w-full py-2 px-3 bg-[#4169E1] hover:bg-[#3154b3] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ExternalLink size={14} strokeWidth={2.5} />
                          XEM TRONG MÔ PHỎNG ▶ ({selectedHazard.simulationTitle || 'Mạng điện trong nhà'})
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_#000] flex-1 flex flex-col items-center justify-center text-center space-y-2">
                    <AlertTriangle size={36} className="text-amber-500 animate-bounce" strokeWidth={2.5} />
                    <h4 className="font-black text-sm uppercase text-gray-900">
                      Chưa chọn mối nguy nào
                    </h4>
                    <p className="text-xs text-gray-600 font-bold max-w-xs">
                      Hãy nhấp vào các điểm đánh dấu (!) trên hình minh họa bên trái hoặc bấm nút <span className="bg-[#FFD84D] px-1 border border-black font-black">GỢI Ý</span> để bắt đầu khám phá.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BIỆN PHÁP AN TOÀN */}
        {state.activeTab === 'bienphap' && (
          <div className="space-y-4">
            <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={20} className="text-[#2DB84D]" strokeWidth={3} />
                <h2 className="font-black text-base uppercase text-gray-900">
                  CÁC NGUYÊN TẮC VÀ BIỆN PHÁP AN TOÀN ĐIỆN SỐNG CÒN
                </h2>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                Nhấp vào từng thẻ biện pháp dưới đây để xem nguyên lí bảo vệ, các mối nguy tương ứng và chuyển sang mạch mô phỏng thực hành.
              </p>
            </div>

            <div className="space-y-2.5">
              {ALL_SAFETY_MEASURES.map((measure, idx) => {
                const isExpanded = expandedMeasureIds.includes(measure.id);
                return (
                  <div
                    key={measure.id}
                    className="bg-white border-[3px] border-black shadow-[3px_3px_0_#000] transition-all"
                  >
                    <button
                      onClick={() => toggleMeasure(measure.id)}
                      className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-black text-xs sm:text-sm uppercase text-gray-900">
                          {measure.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-500 font-bold hidden sm:inline">
                          {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                        </span>
                        {isExpanded ? <ChevronUp size={16} strokeWidth={3} /> : <ChevronDown size={16} strokeWidth={3} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-1 border-t-2 border-black bg-[#FAFAFA] space-y-3">
                        <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                          {measure.description}
                        </p>

                        {/* Associated hazards */}
                        {measure.hazardIds.length > 0 && (
                          <div className="bg-white border-2 border-black p-2.5 space-y-1.5">
                            <span className="text-[11px] font-black uppercase text-amber-900 block">
                              Phòng được mối nguy nào trong thực tế:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {measure.hazardIds.map((hId) => {
                                const h = ALL_SAFETY_HAZARDS.find((item) => item.id === hId);
                                if (!h) return null;
                                return (
                                  <button
                                    key={h.id}
                                    onClick={() => handleLinkToHazard(h.id)}
                                    className="text-[11px] font-bold px-2 py-0.5 bg-[#FEF3C7] border border-black hover:bg-[#FDE047] transition-colors flex items-center gap-1"
                                    title="Xem tình huống trong Tab MỐI NGUY"
                                  >
                                    <span>⚠️ {h.name}</span>
                                    <ArrowRight size={10} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Simulation Preset Link */}
                        {measure.simulationPresetId && (
                          <div>
                            <button
                              onClick={() =>
                                openPresetInWorkspace(
                                  'mang-dien-trong-nha',
                                  measure.simulationPresetId!,
                                  'an-toan-dien'
                                )
                              }
                              className="px-3 py-1.5 bg-[#4169E1] hover:bg-[#3154b3] text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 flex items-center gap-1.5 transition-all"
                            >
                              <ExternalLink size={13} strokeWidth={2.5} />
                              XEM TRONG MÔ PHỎNG ▶ ({measure.simulationTitle || 'Mạng điện trong nhà'})
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DỤNG CỤ BẢO VỆ */}
        {state.activeTab === 'dungcu' && (
          <div className="space-y-4">
            <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2 mb-1">
                <Wrench size={20} className="text-[#3B82F6]" strokeWidth={3} />
                <h2 className="font-black text-base uppercase text-gray-900">
                  DỤNG CỤ VÀ TRANG BỊ BẢO VỆ AN TOÀN ĐIỆN
                </h2>
              </div>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                Mỗi dụng cụ cách điện được chế tạo để bảo vệ tính mạng con người. Nắm vững tác dụng, cách sử dụng đúng và quy trình kiểm tra trước khi dùng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_SAFETY_TOOLS.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between"
                >
                  <div className="p-3 border-b-2 border-black bg-[#EEF2FF] flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase text-gray-900 tracking-tight">
                      {tool.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold bg-white px-1.5 py-0.5 border border-black">
                      Trang bị cách điện
                    </span>
                  </div>

                  {/* SVG Illustration Container */}
                  <div className="p-4 flex items-center justify-center bg-[#FAFAFA] border-b-2 border-black min-h-[140px]">
                    <div className="w-32 h-auto max-h-[130px]">
                      {tool.renderSVG()}
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-900 block">
                          Tác dụng bảo vệ:
                        </span>
                        <p className="text-xs font-bold text-gray-800 leading-relaxed">
                          {tool.tacDung}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-900 block">
                          Cách sử dụng đúng:
                        </span>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">
                          {tool.cachDung}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#FFFBEB] border-2 border-black p-2 mt-2">
                      <span className="text-[10px] font-black uppercase text-amber-900 block flex items-center gap-1">
                        <CheckCircle size={11} className="text-amber-700" />
                        Kiểm tra trước khi dùng:
                      </span>
                      <p className="text-[11px] font-bold text-amber-950 leading-relaxed mt-0.5">
                        {tool.kiemTra}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SƠ CỨU NGƯỜI BỊ ĐIỆN GIẬT */}
        {state.activeTab === 'socuu' && (
          <div className="space-y-4">
            {/* Warning note */}
            <div className="bg-[#FEF2F2] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-start gap-2.5">
                <HeartPulse size={24} className="text-[#DC2626] shrink-0 mt-0.5" strokeWidth={3} />
                <div>
                  <h3 className="font-black text-xs sm:text-sm uppercase text-[#991B1B]">
                    LƯU Ý ĐẶC BIỆT QUAN TRỌNG:
                  </h3>
                  <p className="text-xs sm:text-sm font-black text-gray-900 mt-0.5 leading-relaxed">
                    {FIRST_AID_HEADER_WARNING}
                  </p>
                </div>
              </div>
            </div>

            {/* Part 1: Sắp xếp 5 bước */}
            <div className="bg-white border-[3px] border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-black">
                <div>
                  <h3 className="font-black text-xs sm:text-sm uppercase text-gray-900">
                    BÀI TẬP: SẮP XẾP THỨ TỰ 5 BƯỚC SƠ CỨU NGƯỜI BỊ ĐIỆN GIẬT
                  </h3>
                  <p className="text-xs text-gray-600 font-bold mt-0.5">
                    Dùng hai nút [▲] và [▼] để di chuyển từng bước về đúng vị trí trình tự chuẩn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShuffleFirstAid}
                    className="px-2.5 py-1 text-xs font-black uppercase border-2 border-black bg-white hover:bg-slate-100 flex items-center gap-1 shadow-[1px_1px_0_#000] active:translate-y-0.5"
                  >
                    <RotateCcw size={13} strokeWidth={2.5} />
                    XÁO LẠI
                  </button>
                  <button
                    onClick={handleCheckFirstAid}
                    className="px-3 py-1 text-xs font-black uppercase border-2 border-black bg-[#2DB84D] hover:bg-[#259b40] text-white shadow-[2px_2px_0_#000] active:translate-y-0.5"
                  >
                    KIỂM TRA THỨ TỰ
                  </button>
                </div>
              </div>

              {/* Step list */}
              <div className="space-y-2.5">
                {state.firstAidStepIds.map((stepId, index) => {
                  const step = CORRECT_FIRST_AID_STEPS.find((s) => s.id === stepId)!;
                  const isCorrectPos = step.stepNumber === index + 1;

                  return (
                    <div
                      key={step.id}
                      className={`border-[2.5px] border-black p-3 transition-colors ${
                        state.firstAidChecked
                          ? isCorrectPos
                            ? 'bg-[#DCFCE7] border-emerald-600'
                            : 'bg-[#FEE2E2] border-red-600'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Number badge and title */}
                        <div className="flex items-start gap-2.5 flex-1">
                          <span
                            className={`w-7 h-7 rounded-none border-2 border-black flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                              state.firstAidChecked
                                ? isCorrectPos
                                  ? 'bg-[#16A34A] text-white'
                                  : 'bg-[#DC2626] text-white'
                                : 'bg-[#FFD84D] text-black'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="space-y-1">
                            <h4 className="font-black text-xs sm:text-sm text-gray-900 leading-snug">
                              {step.title}
                            </h4>
                            <p className="text-xs font-bold text-gray-700 leading-relaxed">
                              {step.content}
                            </p>
                            {state.firstAidChecked && (
                              <div className="pt-1 text-[11px] font-bold">
                                {isCorrectPos ? (
                                  <span className="text-emerald-800">
                                    ✓ Chính xác: {step.explanation}
                                  </span>
                                ) : (
                                  <span className="text-red-800">
                                    ✗ Chưa đúng vị trí: Đây thực tế là bước số {step.stepNumber}. {step.explanation}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Up / Down Reorder buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveStep(index, 'up')}
                            disabled={index === 0}
                            className="p-1 border-2 border-black bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0_#000] active:translate-y-0.5"
                            title="Di chuyển lên trên"
                          >
                            <ChevronUp size={16} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleMoveStep(index, 'down')}
                            disabled={index === state.firstAidStepIds.length - 1}
                            className="p-1 border-2 border-black bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-[1px_1px_0_#000] active:translate-y-0.5"
                            title="Di chuyển xuống dưới"
                          >
                            <ChevronDown size={16} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Part 2: 3 câu Nên hay Không nên */}
            <div className="bg-white border-[3px] border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] space-y-3">
              <div className="pb-2 border-b-2 border-black">
                <h3 className="font-black text-xs sm:text-sm uppercase text-gray-900">
                  XỬ LÍ TÌNH HUỐNG: NÊN HAY KHÔNG NÊN?
                </h3>
                <p className="text-xs text-gray-600 font-bold mt-0.5">
                  Chọn [NÊN] hoặc [KHÔNG NÊN] cho từng hành động dưới đây:
                </p>
              </div>

              <div className="space-y-3">
                {SHOULD_OR_NOT_QUESTIONS.map((q, idx) => {
                  const userAnswer = state.firstAidShouldAnswers[q.id];
                  const hasAnswered = Boolean(userAnswer);
                  const isCorrect = userAnswer === q.correctAction;

                  return (
                    <div key={q.id} className="border-2 border-black p-3 bg-[#FAFAFA] space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 flex-1">
                          <span className="font-black text-blue-700 mr-1.5">{idx + 1}.</span>
                          {q.situation}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleShouldAnswer(q.id, 'nen')}
                            className={`px-3 py-1 text-xs font-black border-2 border-black transition-all ${
                              userAnswer === 'nen'
                                ? 'bg-[#2DB84D] text-white shadow-[2px_2px_0_#000]'
                                : 'bg-white hover:bg-emerald-50 text-black'
                            }`}
                          >
                            NÊN
                          </button>
                          <button
                            onClick={() => handleShouldAnswer(q.id, 'khong-nen')}
                            className={`px-3 py-1 text-xs font-black border-2 border-black transition-all ${
                              userAnswer === 'khong-nen'
                                ? 'bg-[#EF4444] text-white shadow-[2px_2px_0_#000]'
                                : 'bg-white hover:bg-red-50 text-black'
                            }`}
                          >
                            KHÔNG NÊN
                          </button>
                        </div>
                      </div>

                      {hasAnswered && (
                        <div
                          className={`text-xs font-bold p-2 border ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-red-50 text-red-900 border-red-300'
                          }`}
                        >
                          {isCorrect ? '✓ CHÍNH XÁC: ' : '✗ CHƯA ĐÚNG: '}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KIỂM TRA ĐÁNH GIÁ (10 CÂU) */}
        {state.activeTab === 'kiemtra' && (
          <div className="space-y-4">
            {/* Header with Score */}
            <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCheck2 size={20} className="text-[#4169E1]" strokeWidth={3} />
                  <h2 className="font-black text-base uppercase text-gray-900">
                    BÀI KIỂM TRA NHẬN THỨC AN TOÀN ĐIỆN (10 CÂU)
                  </h2>
                </div>
                <p className="text-xs text-gray-600 font-bold mt-0.5">
                  Bao quát toàn bộ kiến thức về Mối nguy, Biện pháp phòng tránh, Dụng cụ cách điện và Quy trình sơ cứu.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {state.quizScore !== null && (
                  <div className="bg-[#FFD84D] border-2 border-black px-3 py-1 text-xs font-black">
                    Điểm: <span className="font-mono text-sm">{state.quizScore}/10</span> ({state.quizScore * 10}%)
                  </div>
                )}
                <button
                  onClick={handleResetQuiz}
                  className="px-2.5 py-1 text-xs font-black border-2 border-black bg-white hover:bg-slate-100 flex items-center gap-1 shadow-[1px_1px_0_#000] active:translate-y-0.5"
                >
                  <RotateCcw size={13} strokeWidth={2.5} />
                  LÀM LẠI
                </button>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-3.5">
              {ALL_SAFETY_QUIZ_QUESTIONS.map((q, qIdx) => {
                const userChoice = state.quizAnswers[q.id];
                const hasAnswered = userChoice !== undefined;
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className="bg-white border-[3px] border-black p-4 shadow-[3px_3px_0_#000] space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-none bg-[#1E293B] text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="font-black text-xs sm:text-sm text-gray-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    {/* 4 Choices */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        const isRealCorrect = q.correctIndex === optIdx;

                        let btnBg = 'bg-white hover:bg-slate-50 text-gray-800';
                        if (hasAnswered) {
                          if (isRealCorrect) {
                            btnBg = 'bg-[#DCFCE7] text-emerald-950 border-emerald-600 font-black';
                          } else if (isSelected) {
                            btnBg = 'bg-[#FEE2E2] text-red-950 border-red-600 font-black';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(q.id, optIdx)}
                            className={`p-2.5 text-xs font-bold text-left border-2 border-black transition-all flex items-start gap-2 ${btnBg}`}
                          >
                            <span className="font-mono font-black text-gray-600">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="leading-relaxed flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation if answered */}
                    {hasAnswered && (
                      <div
                        className={`text-xs font-bold p-2.5 border-2 ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                            : 'bg-amber-50 text-amber-950 border-amber-300'
                        }`}
                      >
                        <span className="font-black block uppercase mb-0.5">
                          {isCorrect ? '✓ Trả lời chính xác!' : '✗ Giải thích đáp án:'}
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
