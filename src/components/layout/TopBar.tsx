import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Undo2,
  Redo2,
  Home,
  FileText,
  BookOpen,
  Eye,
  HelpCircle,
  Settings,
  FolderOpen,
  Download,
  Database,
  Grid,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  BookmarkCheck,
  Tag,
  MoreHorizontal,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Activity,
  Cpu,
  Info,
} from 'lucide-react';
import { NeoButton } from '../common/NeoButton';
import { NeoDropdown, DropdownItem } from '../common/NeoDropdown';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { HelpModal } from '../modals/HelpModal';
import { StandardsModal } from '../modals/StandardsModal';
import { ImportExportModal } from '../modals/ImportExportModal';
import { StorageModal } from '../modals/StorageModal';
import { PresetsModal } from '../modals/PresetsModal';
import { DiagnosticsModal } from '../modals/DiagnosticsModal';
import { CurriculumModal } from '../modals/CurriculumModal';
import { AboutModal } from '../modals/AboutModal';
import { WireSummaryModal } from '../modals/WireSummaryModal';
import { FloorPlanModal } from '../modals/FloorPlanModal';
import { WireAuditModal } from '../modals/WireAuditModal';
import { TruthTableModal } from '../modals/TruthTableModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export interface TopBarProps {
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({ svgRef }) => {
  const {
    circuit,
    config,
    isSimulating,
    soundEnabled,
    allowDiagonalWires,
    showGrid,
    showWireLabels,
    showMeterOverlay,
    fullFrameMode,
    rightPanelOpen,
    toggleRightPanel,
    canUndo,
    canRedo,
    toggleSimulating,
    stopSimulating,
    resetSimulation,
    toggleSound,
    toggleDiagonalWires,
    toggleShowGrid,
    toggleWireLabels,
    toggleShowMeterOverlay,
    toggleFullFrame,
    toggleAllPE,
    undo,
    redo,
    updateViewport,
    runLint,
    restoreAllDamaged,
    oscilloscopePanelOpen,
    toggleOscilloscopePanel,
    setCircuit,
    setStatusMessage,
    viewMode,
    setViewMode,
    showFloorPlan,
    toggleShowFloorPlan,
    wireSummaryOpen,
    setWireSummaryOpen,
    setFloorPlanModalOpen,
    setWireAuditModalOpen,
    colorWiresByLoad,
    toggleColorWiresByLoad,
    setTruthTableModalOpen,
  } = useWorkspaceStore();

  const { isInstallable, install } = usePWAInstall();

  const [helpOpen, setHelpOpen] = useState(false);
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [ioOpen, setIoOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Responsive container width tracking for dynamic dropdown overflow
  const barRef = useRef<HTMLDivElement>(null);
  const [barWidth, setBarWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    if (!barRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBarWidth(entry.contentRect.width);
      }
    });
    observer.observe(barRef.current);
    return () => observer.disconnect();
  }, []);

  const isUltraNarrow = barWidth < 420;
  const isCompact = barWidth < 760;
  const isNarrow = barWidth < 980;

  // 1. File Menu
  const fileItems: DropdownItem[] = [
    {
      id: 'import_export',
      label: 'Nhập / Xuất sơ đồ mạch...',
      icon: <FolderOpen size={14} />,
      onClick: () => setIoOpen(true),
    },
    {
      id: 'storage',
      label: 'Quản lý dữ liệu & bộ nhớ',
      icon: <Database size={14} />,
      onClick: () => setStorageOpen(true),
    },
    {
      id: 'restore',
      label: 'THAY LINH KIỆN MỚI (Hồi phục)',
      icon: <Sparkles size={14} />,
      onClick: restoreAllDamaged,
    },
    {
      id: 'home',
      label: 'Về trang chủ chọn không gian',
      icon: <Home size={14} />,
      onClick: () => {
        window.location.hash = '#/';
      },
    },
  ];

  // 2. Simulation Menu (MÔ PHỎNG)
  const simItems: DropdownItem[] = [
    {
      id: 'sim_reset',
      label: 'Đặt lại mô phỏng (t = 0)',
      icon: <RotateCcw size={14} />,
      onClick: resetSimulation,
    },
    {
      id: 'sim_restore',
      label: 'Hồi phục tất cả linh kiện hỏng',
      icon: <Sparkles size={14} />,
      onClick: restoreAllDamaged,
    },
    {
      id: 'sim_sound',
      label: soundEnabled ? 'Âm thanh: ĐANG BẬT' : 'Âm thanh: ĐANG TẮT',
      icon: soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />,
      active: soundEnabled,
      onClick: toggleSound,
    },
  ];

  // 3. Presets Menu (MẪU) - Grouped by Grade/Lesson
  const currentPresets = config.presets || [];
  const groupedPresets: Record<string, typeof currentPresets> = {};
  for (const p of currentPresets) {
    const grp = p.group || 'Mạch mẫu';
    if (!groupedPresets[grp]) groupedPresets[grp] = [];
    groupedPresets[grp].push(p);
  }

  const presetItems: DropdownItem[] = [];
  for (const [groupName, pList] of Object.entries(groupedPresets)) {
    presetItems.push({
      id: `header_${groupName}`,
      label: groupName,
      isHeader: true,
      onClick: () => {},
    });
    for (const preset of pList) {
      presetItems.push({
        id: preset.id,
        label: preset.title,
        grade: preset.grade,
        onClick: () => {
          setCircuit(preset.state, true);
          if (preset.expectation) {
            setStatusMessage(preset.expectation);
          }
        },
      });
    }
  }

  if (currentPresets.length === 0) {
    presetItems.push({
      id: 'empty_presets',
      label: 'Chưa có mạch mẫu cho không gian này',
      disabled: true,
      onClick: () => {},
    });
  }

  // 4. View Menu
  const viewItems: DropdownItem[] = [
    {
      id: 'fit_frame',
      label: 'Vừa khung nhìn (100%)',
      icon: <Maximize2 size={14} />,
      onClick: () => updateViewport({ x: 0, y: 0, zoom: 1 }),
    },
    {
      id: 'toggle_grid',
      label: showGrid ? 'Ẩn lưới tọa độ 20px' : 'Hiện lưới tọa độ 20px',
      icon: <Grid size={14} />,
      active: showGrid,
      onClick: toggleShowGrid,
    },
    {
      id: 'full_frame',
      label: fullFrameMode ? 'Thoát toàn khung (Tab)' : 'Toàn khung làm việc (Tab)',
      icon: <Maximize2 size={14} />,
      active: fullFrameMode,
      onClick: toggleFullFrame,
    },
    {
      id: 'toggle_all_pe',
      label: 'Hiện / ẩn chân PE của mọi thiết bị',
      icon: <ShieldCheck size={14} />,
      onClick: () => toggleAllPE(),
    },
    {
      id: 'toggle_scope_panel',
      label: 'Đồ thị (Dao động kí)',
      icon: <Activity size={14} />,
      active: oscilloscopePanelOpen,
      onClick: () => toggleOscilloscopePanel(),
    },
    {
      id: 'wire_audit',
      label: 'Kiểm tra dây và bảo vệ...',
      icon: <ShieldAlert size={14} />,
      onClick: () => setWireAuditModalOpen(true),
    },
    {
      id: 'color_wires_by_load',
      label: colorWiresByLoad ? 'Tô màu dây theo tải: ĐANG BẬT' : 'Tô màu dây theo tải: ĐANG TẮT',
      icon: <Sparkles size={14} />,
      active: colorWiresByLoad,
      onClick: toggleColorWiresByLoad,
    },
    ...(config.mode === 'logic'
      ? [
          {
            id: 'truth_table',
            label: 'Bảng chân trị (Truth Table)...',
            icon: <Cpu size={14} />,
            onClick: () => setTruthTableModalOpen(true),
          },
        ]
      : []),
    ...(config.installView
      ? [
          {
            id: 'floor_plan_config',
            label: 'Mặt bằng phòng...',
            icon: <Home size={14} />,
            onClick: () => setFloorPlanModalOpen(true),
          },
          {
            id: 'toggle_floor_plan',
            label: showFloorPlan ? 'Ẩn mặt bằng phòng' : 'Hiện mặt bằng phòng',
            icon: <Grid size={14} />,
            active: showFloorPlan,
            onClick: toggleShowFloorPlan,
          },
          {
            id: 'wire_summary',
            label: 'Tổng hợp dây...',
            icon: <FileText size={14} />,
            onClick: () => setWireSummaryOpen(true),
          },
        ]
      : []),
  ];

  // 5. Help Menu
  const helpItems: DropdownItem[] = [
    {
      id: 'curriculum',
      label: 'Yêu cầu cần đạt (CT 2018)',
      icon: <BookOpen size={14} />,
      onClick: () => setCurriculumOpen(true),
    },
    {
      id: 'standards',
      label: 'Bảng kí hiệu TCVN & SGK GDPT',
      icon: <BookmarkCheck size={14} />,
      onClick: () => setStandardsOpen(true),
    },
    {
      id: 'diagnostics',
      label: 'Chẩn đoán mô phỏng (Diagnostics)',
      icon: <Activity size={14} />,
      onClick: () => setDiagnosticsOpen(true),
    },
    {
      id: 'solver_test',
      label: 'Kiểm tra bộ giải (C-1 Test Suite)',
      icon: <CheckCircle2 size={14} />,
      onClick: () => {
        window.location.hash = '#/kiem-tra-bo-giai';
      },
    },
    {
      id: 'guide',
      label: `Hướng dẫn trọng tâm (${config.grades})`,
      icon: <HelpCircle size={14} />,
      onClick: () => setHelpOpen(true),
    },
    {
      id: 'lint',
      label: 'Kiểm tra lỗi mạch (Lint)',
      icon: <Sparkles size={14} />,
      onClick: () => {
        const warnings = runLint();
        if (warnings.length === 0) {
          alert('Mạch điện hoàn toàn hợp lệ!');
        }
      },
    },
    {
      id: 'about',
      label: 'Giới thiệu & Thông tin ứng dụng',
      icon: <Info size={14} />,
      onClick: () => setAboutOpen(true),
    },
  ];

  // 5. Settings Menu
  const settingsItems: DropdownItem[] = [
    {
      id: 'sound',
      label: soundEnabled ? 'Âm thanh: ĐANG BẬT' : 'Âm thanh: ĐANG TẮT',
      icon: soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />,
      active: soundEnabled,
      onClick: toggleSound,
    },
    {
      id: 'diagonal',
      label: allowDiagonalWires ? 'Dây chéo 45°: ĐANG BẬT' : 'Dây chéo 45°: ĐANG TẮT',
      active: allowDiagonalWires,
      onClick: toggleDiagonalWires,
    },
    ...(isInstallable
      ? [
          {
            id: 'pwa',
            label: 'Cài đặt ứng dụng PWA',
            icon: <Download size={14} />,
            onClick: install,
          },
        ]
      : []),
  ];

  // Overflow dropdown items for lower priority menus on narrower screens
  const overflowItems: DropdownItem[] = [
    ...(isCompact && config.mode === 'logic'
      ? [
          {
            id: 'overflow_truth_table',
            label: 'Bảng chân trị (Truth Table)...',
            icon: <Cpu size={14} />,
            onClick: () => setTruthTableModalOpen(true),
          },
        ]
      : []),
    ...(isCompact && config.installView
      ? [
          {
            id: 'overflow_view_mode',
            label: viewMode === 'schematic' ? 'Chế độ xem: [LẮP ĐẶT]' : 'Chế độ xem: [NGUYÊN LÍ]',
            icon: <Eye size={14} />,
            onClick: () => setViewMode(viewMode === 'schematic' ? 'installation' : 'schematic'),
          },
        ]
      : []),
    ...(isCompact ? presetItems : []),
    ...(isNarrow ? helpItems : []),
    ...settingsItems,
  ];

  return (
    <>
      <header
        ref={barRef}
        className="h-[32px] bg-white border-b-2 border-black px-1.5 flex items-center justify-between select-none z-30 shrink-0 text-black gap-1"
      >
        {/* Left: Continuous Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <NeoButton
            variant="secondary"
            onClick={() => {
              window.location.hash = '#/';
            }}
            icon={<Home size={13} strokeWidth={3} />}
            title="Trang chủ"
            className="!px-1.5 !h-[26px]"
          >
            {!isUltraNarrow ? 'TRANG CHỦ' : ''}
          </NeoButton>

          <span className="h-4 w-[2px] bg-black mx-0.5" />

          {config.mode === 'logic' && !isCompact && (
            <NeoButton
              variant="primary"
              onClick={() => setTruthTableModalOpen(true)}
              icon={<Cpu size={13} strokeWidth={3} />}
              className="!h-[26px] !px-2 font-black text-[11px]"
              title="Bảng chân trị tự sinh cho mạch tổ hợp"
            >
              BẢNG CHÂN TRỊ
            </NeoButton>
          )}

          {config.mode !== 'explainer' && (
            <>
              {(config.mode !== 'logic' || circuit.components.some(c => c.type === 'logic_clock')) && (
                <>
                  {/* PLAY */}
                  <NeoButton
                    variant={isSimulating ? 'success' : 'primary'}
                    onClick={toggleSimulating}
                    icon={<Play size={13} strokeWidth={3} />}
                    className={`!h-[26px] !px-2 ${
                      isSimulating ? '!bg-[#2DB84D] !text-white' : ''
                    }`}
                    title={config.mode === 'logic' ? 'Chạy phát xung nhịp tự động' : 'Mô phỏng dòng điện và linh kiện (Giải thuật MNA)'}
                  >
                    {isSimulating ? 'ĐANG CHẠY' : 'CHẠY'}
                  </NeoButton>

                  {/* STOP */}
                  <NeoButton
                    variant="danger"
                    onClick={stopSimulating}
                    disabled={!isSimulating}
                    icon={<Square size={13} strokeWidth={3} />}
                    className="!h-[26px] !px-1.5"
                    title="Dừng mô phỏng"
                  >
                    DỪNG
                  </NeoButton>
                </>
              )}

              {/* UNDO */}
              <NeoButton
                variant="secondary"
                onClick={undo}
                disabled={!canUndo}
                icon={<Undo2 size={13} strokeWidth={3} />}
                className="!h-[26px] !px-1.5"
                title="Hoàn tác (Ctrl+Z)"
              >
                {!isUltraNarrow ? 'HOÀN TÁC' : ''}
              </NeoButton>

              {/* REDO */}
              <NeoButton
                variant="secondary"
                onClick={redo}
                disabled={!canRedo}
                icon={<Redo2 size={13} strokeWidth={3} />}
                className="!h-[26px] !px-1.5"
                title="Làm lại (Ctrl+Y)"
              >
                {!isUltraNarrow ? 'LÀM LẠI' : ''}
              </NeoButton>
            </>
          )}

          {/* Mode Switcher [NGUYÊN LÍ] [LẮP ĐẶT] (Neo-brutalism, --blue background when active) */}
          {config.installView && !isCompact && (
            <>
              <span className="h-4 w-[2px] bg-black mx-0.5" />
              <div className="flex items-center border-2 border-black rounded-none overflow-hidden shrink-0 shadow-[1px_1px_0_#000]">
                <button
                  type="button"
                  onClick={() => setViewMode('schematic')}
                  className={`h-[24px] px-2 text-[11px] font-black tracking-tight uppercase transition-colors border-r border-black ${
                    viewMode === 'schematic'
                      ? 'bg-[#4169E1] text-white'
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                  title="Sơ đồ nguyên lí mạch điện"
                >
                  NGUYÊN LÍ
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('installation')}
                  className={`h-[24px] px-2 text-[11px] font-black tracking-tight uppercase transition-colors ${
                    viewMode === 'installation'
                      ? 'bg-[#4169E1] text-white'
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                  title="Sơ đồ lắp đặt trên mặt bằng"
                >
                  LẮP ĐẶT
                </button>
              </div>
              <NeoButton
                variant="secondary"
                onClick={() => setFloorPlanModalOpen(true)}
                icon={<Home size={11} strokeWidth={2.5} />}
                className="!h-[24px] !px-1.5 font-black text-[11px]"
                title="Cấu hình mặt bằng phòng (Kích thước, cửa, tường)"
              >
                MẶT BẰNG
              </NeoButton>
            </>
          )}
        </div>

        {/* Center: Workspace Badge (visible if >= 850px) */}
        {barWidth >= 850 && (
          <div className="flex items-center gap-1.5 shrink truncate mx-1">
            <span className="font-black text-[11px] uppercase tracking-tight text-black truncate max-w-[180px]">
              {config.title}
            </span>
            <span className="bg-[#FFD84D] text-black text-[9px] font-black px-1 py-0.5 border border-black shrink-0">
              {config.mode === 'rms' ? '220 V RMS' : config.mode === 'logic' ? 'LOGIC 0/1' : 'DC'}
            </span>
          </div>
        )}

        {/* Right: Dropdowns with dynamic overflow handling */}
        <div className="flex items-center gap-1 shrink-0">
          <NeoDropdown label="TỆP" icon={<FileText size={12} />} items={fileItems} align="right" />

          <NeoDropdown label="XEM" icon={<Eye size={12} />} items={viewItems} align="right" />

          <NeoDropdown label="MÔ PHỎNG" icon={<Activity size={12} />} items={simItems} align="right" />

          {!isCompact && (
            <NeoDropdown label="MẪU" icon={<BookOpen size={12} />} items={presetItems} align="right" />
          )}

          {!isNarrow && (
            <NeoDropdown label="TRỢ GIÚP" icon={<HelpCircle size={12} />} items={helpItems} align="right" />
          )}

          {!isNarrow && (
            <NeoDropdown label="CÀI ĐẶT" icon={<Settings size={12} />} items={settingsItems} align="right" />
          )}

          {/* Dedicated Thuộc tính toggle button in the top-right corner */}
          <NeoButton
            variant={rightPanelOpen ? 'primary' : 'secondary'}
            onClick={toggleRightPanel}
            icon={<Sliders size={12} strokeWidth={2.5} />}
            className="!h-[26px] !px-2"
            title={rightPanelOpen ? 'Thu gọn bảng thuộc tính' : 'Mở bảng thuộc tính'}
          >
            <span className="text-[12px] leading-none">THUỘC TÍNH</span>
          </NeoButton>

          {/* Overflow Menu for smaller screens */}
          {isNarrow && (
            <NeoDropdown
              label="THÊM"
              icon={<MoreHorizontal size={12} strokeWidth={3} />}
              items={overflowItems}
              align="right"
            />
          )}
        </div>
      </header>

      {/* Modals */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <StandardsModal isOpen={standardsOpen} onClose={() => setStandardsOpen(false)} />
      <DiagnosticsModal isOpen={diagnosticsOpen} onClose={() => setDiagnosticsOpen(false)} />
      <ImportExportModal isOpen={ioOpen} onClose={() => setIoOpen(false)} svgRef={svgRef} />
      <StorageModal isOpen={storageOpen} onClose={() => setStorageOpen(false)} />
      <PresetsModal isOpen={presetsOpen} onClose={() => setPresetsOpen(false)} />
      <CurriculumModal isOpen={curriculumOpen} onClose={() => setCurriculumOpen(false)} />
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onOpenStandards={() => setStandardsOpen(true)}
      />
      <WireSummaryModal
        isOpen={wireSummaryOpen}
        onClose={() => setWireSummaryOpen(false)}
      />
      <FloorPlanModal />
      <WireAuditModal />
      <TruthTableModal />
    </>
  );
};
