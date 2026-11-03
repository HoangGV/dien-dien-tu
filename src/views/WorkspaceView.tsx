import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TopBar } from '../components/layout/TopBar';
import { Palette } from '../components/ui/Palette';
import { PropsPanel } from '../components/ui/PropsPanel';
import { ToolStrip } from '../components/ui/ToolStrip';
import { Canvas } from '../components/ui/Canvas';
import { LintModal } from '../components/modals/LintModal';

export interface WorkspaceViewProps {
  slug: string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ slug }) => {
  const {
    circuit,
    loadWorkspace,
    lintWarnings,
    fullFrameMode,
    toggleFullFrame,
    undo,
    redo,
    selectAll,
    clearSelection,
    deleteSelected,
    rotateSelected,
    flipSelected,
    copySelected,
    pasteSelected,
    duplicateSelected,
    nudgeSelected,
    selectedComponentIds,
    selectedWireIds,
    rightPanelOpen,
    toggleRightPanel,
  } = useWorkspaceStore();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [lintModalOpen, setLintModalOpen] = useState(false);

  // Viewport width measurement for 3 layout tiers
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check ?layout=debug in URL
  const isDebugLayout =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('layout') === 'debug';

  useEffect(() => {
    loadWorkspace(slug);
  }, [slug]);

  // Auto-open PropsPanel when an element is selected (if closed)
  const hasSelection = selectedComponentIds.length > 0 || selectedWireIds.length > 0;
  const prevSelectionRef = useRef(false);

  useEffect(() => {
    if (hasSelection && !prevSelectionRef.current && !rightPanelOpen) {
      toggleRightPanel();
    }
    prevSelectionRef.current = hasSelection;
  }, [hasSelection, rightPanelOpen, toggleRightPanel]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Tab') {
        e.preventDefault();
        toggleFullFrame();
      } else if (cmdOrCtrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        undo();
      } else if (
        (cmdOrCtrl && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        (cmdOrCtrl && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        redo();
      } else if (cmdOrCtrl && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAll();
      } else if (cmdOrCtrl && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copySelected();
      } else if (cmdOrCtrl && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        pasteSelected();
      } else if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateSelected();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        flipSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nudgeSelected(0, -1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeSelected(0, 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nudgeSelected(-1, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nudgeSelected(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleFullFrame,
    undo,
    redo,
    selectAll,
    copySelected,
    pasteSelected,
    duplicateSelected,
    deleteSelected,
    rotateSelected,
    flipSelected,
    clearSelection,
    nudgeSelected,
  ]);

  const isTier1 = windowWidth >= 1100; // Docked
  const isTier2 = windowWidth >= 700 && windowWidth < 1100; // Overlay
  const isTier3 = windowWidth < 700; // Bottom Sheet

  return (
    <div
      className={`h-[100dvh] w-screen flex flex-col overflow-hidden bg-[#EEF2FF] select-none ${
        isDebugLayout ? 'outline outline-2 outline-red-500' : ''
      }`}
    >
      {/* 1. Top Bar (32px) */}
      <TopBar svgRef={svgRef} />

      {/* 2. Main Workspace Frame (1fr) */}
      <div
        className={`flex-1 flex overflow-hidden relative ${
          isDebugLayout ? 'outline outline-2 outline-blue-500' : ''
        }`}
      >
        {/* Tier 1 & Tier 2: Left Palette & ToolStrip */}
        {!fullFrameMode && !isTier3 && (
          <div
            className={`flex shrink-0 z-20 ${
              isTier2 ? 'absolute left-0 top-0 bottom-0 pointer-events-auto' : ''
            }`}
          >
            <Palette />
            <ToolStrip />
          </div>
        )}

        {/* Tier 3: ToolStrip only on side, Palette in bottom drawer if opened */}
        {!fullFrameMode && isTier3 && (
          <div className="flex shrink-0 z-20">
            <ToolStrip />
          </div>
        )}

        {/* Central SVG Schematic Canvas */}
        <main
          className={`flex-1 relative h-full w-full overflow-hidden ${
            isDebugLayout ? 'outline outline-2 outline-green-500' : ''
          }`}
        >
          <Canvas svgRef={svgRef} />
        </main>

        {/* Tier 1: Docked Right Properties Panel */}
        {!fullFrameMode && isTier1 && <PropsPanel />}

        {/* Tier 2: Overlay Right Properties Panel */}
        {!fullFrameMode && isTier2 && (
          <div className="absolute right-0 top-0 bottom-0 z-20 pointer-events-auto">
            <PropsPanel />
          </div>
        )}

        {/* Tier 3: Bottom Sheet (< 700px) */}
        {!fullFrameMode && isTier3 && rightPanelOpen && (
          <div className="absolute left-0 right-0 bottom-0 z-30 pointer-events-auto">
            <PropsPanel isBottomSheet={true} />
          </div>
        )}
      </div>

      {/* 3. Bottom Status Bar (22px) */}
      <footer
        className={`h-[22px] bg-[#EEF2FF] border-t-2 border-black px-2 flex items-center justify-between text-[11px] font-black text-black select-none z-30 shrink-0 ${
          isDebugLayout ? 'outline outline-2 outline-yellow-500' : ''
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {lintWarnings.length > 0 ? (
            <div className="flex items-center gap-1 text-[#E5322D]">
              <AlertTriangle size={12} strokeWidth={3} />
              <span>{lintWarnings.length} CẢNH BÁO MẠCH</span>
              <button
                onClick={() => setLintModalOpen(true)}
                className="ml-1 px-1 py-0 bg-[#E5322D] text-white border border-black text-[10px] hover:bg-black font-extrabold uppercase cursor-pointer"
              >
                [XEM LỖI]
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#2DB84D]">
              <CheckCircle size={12} strokeWidth={3} />
              <span>MẠCH HỢP LỆ</span>
              <button
                onClick={() => setLintModalOpen(true)}
                className="ml-1 px-1 py-0 bg-white text-black border border-black text-[10px] hover:bg-[#FFD84D] font-extrabold uppercase cursor-pointer"
              >
                [XEM LỖI]
              </button>
            </div>
          )}

          {/* Quick Toggle Button for PropsPanel */}
          <button
            onClick={toggleRightPanel}
            className={`px-1.5 py-0 border border-black text-[10px] font-extrabold uppercase cursor-pointer ${
              rightPanelOpen ? 'bg-[#FFD84D] text-black' : 'bg-white text-black hover:bg-[#EEF2FF]'
            }`}
            title="Bật / tắt bảng thuộc tính"
          >
            {rightPanelOpen ? '✕ THUỘC TÍNH' : '⚙ THUỘC TÍNH'}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[10px] text-gray-700">
          <span>Linh kiện: {circuit.components.length} | Dây: {circuit.wires.length}</span>
          <span className="border-l border-black pl-2">
            Thu phóng: {Math.round(circuit.viewport.zoom * 100)}%
          </span>
        </div>
      </footer>

      {/* Lint Warning Modal */}
      <LintModal isOpen={lintModalOpen} onClose={() => setLintModalOpen(false)} />
    </div>
  );
};
