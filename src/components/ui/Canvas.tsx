import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { COMPONENT_MAP, getComponentDef } from '../../core/registry';
import { snapToGrid, snapPointToGrid, pinWorldPos, isPointInBox, getComponentBoundingBox } from '../../core/geometry';
import { routeOrthogonal, normalizePolyline } from '../../core/wiring';
import { getWireInstallPoints, getEndpointInstallPos } from '../../core/installWiring';
import { Point, Wire, ComponentInstance, Junction, BoundingBox } from '../../core/model';
import { formatMeasure } from '../../core/measureFormat';

export interface CanvasProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const Canvas: React.FC<CanvasProps> = ({ svgRef }) => {
  const {
    circuit,
    isSimulating,
    simulationSnapshot,
    activeTool,
    editorMode,
    placingType,
    wiringDraft,
    draggedSegment,
    rotatingComponent,
    selectedComponentIds,
    selectedWireIds,
    hoveredNetId,
    hoveredPin,
    hoveredWireId,
    showGrid,
    showWireLabels,
    allowDiagonalWires,
    viewMode,
    showFloorPlan,
    updateViewport,
    selectComponent,
    selectWire,
    selectBox,
    clearSelection,
    deleteSelected,
    placeComponent,
    setPlacingType,
    moveComponents,
    updateComponentProp,
    startWiring,
    updateWiringPointer,
    addWiringWaypoint,
    undoWiringWaypoint,
    toggleWiringDirection,
    cancelWiring,
    finishWiring,
    finishWiringOnExistingWire,
    startDraggingSegment,
    updateDraggingSegment,
    finishDraggingSegment,
    startRotating,
    updateRotating,
    finishRotating,
    setHoveredPin,
    setHoveredWire,
    replaceDamagedComponent,
    setStatusMessage,
    moveJunction,
  } = useWorkspaceStore();

  const isInstallView = viewMode === 'installation';

  const containerRef = useRef<HTMLDivElement>(null);

  // Live charge particles animation via rAF directly on SVG DOM
  useEffect(() => {
    if (!isSimulating) return;

    let animId: number;
    let lastT = performance.now();
    const offsets: Record<string, number> = {};

    const animateDots = (now: number) => {
      const dt = (now - lastT) / 1000;
      lastT = now;

      const flows = simulationSnapshot?.wireFlows;
      if (flows) {
        for (const [wId, flow] of Object.entries(flows)) {
          if (flow.absCurrent >= 1e-6 && flow.direction !== 0) {
            const el = document.getElementById(`flow_${wId}`);
            if (el) {
              const currentOffset = offsets[wId] || 0;
              const newOffset = currentOffset - flow.speedPxPerSec * flow.direction * dt;
              offsets[wId] = newOffset % 1200;
              el.setAttribute('stroke-dashoffset', String(offsets[wId]));
              el.style.opacity = '0.95';
            }
          }
        }
      }

      animId = requestAnimationFrame(animateDots);
    };

    animId = requestAnimationFrame(animateDots);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, simulationSnapshot]);

  // Marquee selection box
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Point | null>(null);

  // Dragging component state
  const [dragStartMouse, setDragStartMouse] = useState<Point | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 0, y: 0 });
  const activeButtonRef = useRef<string | null>(null);

  // Floating cursor in world space
  const [worldCursor, setWorldCursor] = useState<Point>({ x: 0, y: 0 });

  // Transform screen coordinate to SVG world coordinate
  const screenToWorld = (screenX: number, screenY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (screenX - rect.left - circuit.viewport.x) / circuit.viewport.zoom;
    const rawY = (screenY - rect.top - circuit.viewport.y) / circuit.viewport.zoom;
    return { x: rawX, y: rawY };
  };

  const getPolylineMidpoint = (pts: Point[]): Point => {
    if (pts.length === 0) return { x: 0, y: 0 };
    if (pts.length === 1) return pts[0];
    if (pts.length === 2) return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    let totalLen = 0;
    const lens: number[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      lens.push(d);
      totalLen += d;
    }
    const halfLen = totalLen / 2;
    let accumulated = 0;
    for (let i = 0; i < lens.length; i++) {
      if (accumulated + lens[i] >= halfLen) {
        const segRem = halfLen - accumulated;
        const ratio = lens[i] === 0 ? 0 : segRem / lens[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * ratio,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * ratio,
        };
      }
      accumulated += lens[i];
    }
    return pts[Math.floor(pts.length / 2)];
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' || e.key === ' ') {
        if (editorMode === 'wiring') {
          e.preventDefault();
          e.stopPropagation();
          cancelWiring();
          return;
        }
        setIsSpacePressed(true);
      } else if (e.key === 'Backspace' && editorMode === 'wiring') {
        e.preventDefault();
        undoWiringWaypoint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (editorMode === 'wiring') {
          cancelWiring();
        } else if (editorMode === 'placing') {
          setPlacingType(null);
        } else {
          clearSelection();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editorMode, toggleWiringDirection, undoWiringWaypoint, cancelWiring, setPlacingType, clearSelection]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click or space or 'pan' tool -> Canvas Pan
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanOrigin({ x: e.clientX - circuit.viewport.x, y: e.clientY - circuit.viewport.y });
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
      return;
    }

    if (e.button !== 0) return; // Only left click for editing
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const snapPt = snapPointToGrid(worldPt);

    // 1. Placing Mode
    if (editorMode === 'placing' && placingType) {
      placeComponent(placingType, snapPt);
      if (!e.shiftKey) {
        setPlacingType(null);
      }
      return;
    }

    // 2. Wiring Mode in progress -> click on blank canvas adds waypoint
    if (editorMode === 'wiring' && wiringDraft) {
      addWiringWaypoint(snapPt);
      return;
    }

    // 3. Delete Tool Clicked
    if (activeTool === 'delete') {
      return;
    }

    // 4. Marquee start on blank background
    if (activeTool === 'select') {
      if (!e.shiftKey) {
        clearSelection();
      }
      setMarqueeStart(worldPt);
      setMarqueeEnd(worldPt);
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const snapPt = isInstallView
      ? { x: Math.round(worldPt.x / 10) * 10, y: Math.round(worldPt.y / 10) * 10 }
      : snapPointToGrid(worldPt);
    setWorldCursor(snapPt);

    if (isPanning) {
      updateViewport({
        x: e.clientX - panOrigin.x,
        y: e.clientY - panOrigin.y,
      });
      return;
    }

    // Rotation Dragging
    if (editorMode === 'rotatingComponent' && rotatingComponent) {
      const comp = circuit.components.find(c => c.id === rotatingComponent.compId);
      if (comp) {
        const cX = isInstallView ? (comp.install?.x ?? comp.x) : comp.x;
        const cY = isInstallView ? (comp.install?.y ?? comp.y) : comp.y;
        const pointerAngle = (Math.atan2(worldPt.y - cY, worldPt.x - cX) * 180) / Math.PI;
        updateRotating(pointerAngle, e.altKey);
      }
      return;
    }

    // Wiring preview update
    if (editorMode === 'wiring' && wiringDraft) {
      updateWiringPointer(worldPt);
      return;
    }

    // Segment Dragging
    if (editorMode === 'draggingSegment' && draggedSegment) {
      const wire = circuit.wires.find(w => w.id === draggedSegment.wireId);
      if (wire) {
        const segIdx = draggedSegment.segIndex;
        const p1 = wire.points[segIdx];
        const p2 = wire.points[segIdx + 1];
        const isHorizontal = p1.y === p2.y;
        updateDraggingSegment(isHorizontal ? snapPt.y : snapPt.x);
      }
      return;
    }

    // Component Dragging
    if (dragStartMouse && selectedComponentIds.length > 0) {
      const dx = snapPt.x - dragStartMouse.x;
      const dy = snapPt.y - dragStartMouse.y;
      if (dx !== 0 || dy !== 0) {
        moveComponents(selectedComponentIds, dx, dy, false);
        setDragStartMouse(snapPt);
      }
      return;
    }

    // Marquee updating
    if (marqueeStart) {
      setMarqueeEnd(worldPt);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Release push button if held during simulation
    if (activeButtonRef.current) {
      updateComponentProp(activeButtonRef.current, 'state', false);
      activeButtonRef.current = null;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (editorMode === 'rotatingComponent') {
      finishRotating();
      return;
    }

    if (dragStartMouse) {
      // Commit final component position to history
      moveComponents(selectedComponentIds, 0, 0, true);
      setDragStartMouse(null);
    }

    if (editorMode === 'draggingSegment') {
      finishDraggingSegment();
    }

    if (marqueeStart && marqueeEnd) {
      // Finalize marquee selection
      const box: BoundingBox = {
        minX: Math.min(marqueeStart.x, marqueeEnd.x),
        minY: Math.min(marqueeStart.y, marqueeEnd.y),
        maxX: Math.max(marqueeStart.x, marqueeEnd.x),
        maxY: Math.max(marqueeStart.y, marqueeEnd.y),
      };

      // Select enclosed/intersecting components
      const selectedComps: string[] = [];
      for (const c of circuit.components) {
        const def = COMPONENT_MAP.get(c.type);
        const effComp = isInstallView
          ? { ...c, x: c.install?.x ?? c.x, y: c.install?.y ?? c.y, rot: c.install?.rot ?? c.rot }
          : c;
        const compBox = getComponentBoundingBox(effComp, def);
        if (
          compBox.maxX >= box.minX &&
          compBox.minX <= box.maxX &&
          compBox.maxY >= box.minY &&
          compBox.minY <= box.maxY
        ) {
          selectedComps.push(c.id);
        }
      }

      // Select enclosed wires
      const selectedWires: string[] = [];
      for (const w of circuit.wires) {
        const pts = isInstallView ? getWireInstallPoints(w, circuit) : w.points;
        const allInside = pts.some(p => isPointInBox(p, box));
        if (allInside) {
          selectedWires.push(w.id);
        }
      }

      selectBox(selectedComps, selectedWires);
      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  };

  // Zoom wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(0.25, circuit.viewport.zoom * zoomFactor), 4.0);
    updateViewport({ zoom: newZoom });
  };

  // Handle Drag-and-Drop from left Palette
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isInstallView) {
      setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    const compType = e.dataTransfer.getData('text/plain');
    if (compType) {
      const worldPt = screenToWorld(e.clientX, e.clientY);
      placeComponent(compType, snapPointToGrid(worldPt));
      setPlacingType(null);
    }
  };

  // Click on a Pin
  const handlePinPointerDown = (compId: string, pinId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    if (isInstallView) {
      setStatusMessage('Thêm linh kiện và đi dây ở chế độ NGUYÊN LÍ');
      return;
    }
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const snap = snapPointToGrid(worldPt);

    if (editorMode === 'wiring' && wiringDraft) {
      // Complete wire
      finishWiring({ compId, pinId }, snap);
    } else {
      // Start wire
      startWiring({ compId, pinId }, snap);
    }
  };

  // Click on a Wire
  const handleWirePointerDown = (wireId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (editorMode === 'wiring' && wiringDraft) {
      // Complete wire at junction on existing wire!
      finishWiringOnExistingWire(wireId, worldPt);
      return;
    }

    if (activeTool === 'delete') {
      selectWire(wireId, false);
      deleteSelected();
      return;
    }

    selectWire(wireId, e.shiftKey);
  };

  // Track last click time for double-click detection outside simulation
  const lastCompClickTimeRef = useRef<Record<string, number>>({});

  // Click on a Component
  const handleComponentPointerDown = (compId: string, e: React.PointerEvent) => {
    e.stopPropagation();

    const isSimActive = isSimulating || simulationSnapshot !== null;
    const comp = circuit.components.find((c) => c.id === compId);

    // 1. Khi mô phỏng đang chạy (hoặc tạm dừng sau khi đã chạy): bấm vào kí hiệu aptomat bật/tắt trong MỌI trạng thái (kể cả sau khi NHẢY: bấm = ĐÓNG LẠI). Công tắc cũng vậy.
    if (isSimActive && comp) {
      if (comp.type === 'cb' || comp.type === 'knife_switch') {
        const kinetics = simulationSnapshot?.componentKinetics?.[compId];
        const isTripped = Boolean(comp.props.isTripped || kinetics?.thermalStatus === 'tripped');
        if (isTripped) {
          replaceDamagedComponent(compId);
        } else {
          updateComponentProp(compId, 'state', !comp.props.state);
        }
        return;
      }
      if (comp.type === 'switch_2p' || comp.type === 'switch_3p') {
        updateComponentProp(compId, 'state', !comp.props.state);
        return;
      }
      if (comp.type === 'push_button') {
        updateComponentProp(compId, 'state', true);
        activeButtonRef.current = compId;
        (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
        return;
      }
    }

    // 2. Ngoài lúc chạy: nháy đúp vào kí hiệu để đóng/ngắt
    if (!isSimActive && comp) {
      const now = Date.now();
      const lastClick = lastCompClickTimeRef.current[compId] || 0;
      lastCompClickTimeRef.current[compId] = now;
      if (now - lastClick < 350) {
        if (comp.type === 'cb' || comp.type === 'knife_switch') {
          if (comp.props.isTripped) {
            replaceDamagedComponent(compId);
          } else {
            updateComponentProp(compId, 'state', !comp.props.state);
          }
          return;
        }
        if (comp.type === 'switch_2p' || comp.type === 'switch_3p') {
          updateComponentProp(compId, 'state', !comp.props.state);
          return;
        }
      }
    }

    if (activeTool === 'delete') {
      selectComponent(compId, false);
      deleteSelected();
      return;
    }

    const isAlreadySelected = selectedComponentIds.includes(compId);
    if (!isAlreadySelected) {
      selectComponent(compId, e.shiftKey);
    }

    // Initiate dragging
    const worldPt = screenToWorld(e.clientX, e.clientY);
    setDragStartMouse(
      isInstallView
        ? { x: Math.round(worldPt.x / 10) * 10, y: Math.round(worldPt.y / 10) * 10 }
        : snapPointToGrid(worldPt)
    );
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  };

  const currentPlacingDef = placingType ? getComponentDef(placingType) : null;

  const renderComponentNode = (c: ComponentInstance) => {
    const def = COMPONENT_MAP.get(c.type);
    if (!def) return null;
    const isSelected = selectedComponentIds.includes(c.id);
    const showRotationHandle = isSelected && selectedComponentIds.length === 1;
    const kinetics = simulationSnapshot?.componentKinetics?.[c.id];
    const isDamaged = Boolean(
      (c.damaged || kinetics?.thermalStatus === 'damaged' || kinetics?.thermalStatus === 'blown' || c.props.isBlown) &&
      (c.type !== 'cb' && c.type !== 'knife_switch')
    );

    const effX = isInstallView ? (c.install?.x ?? c.x) : c.x;
    const effY = isInstallView ? (c.install?.y ?? c.y) : c.y;
    const effRot = isInstallView ? (c.install?.rot ?? c.rot) : c.rot;
    const effComp = isInstallView ? { ...c, x: effX, y: effY, rot: effRot } : c;

    return (
      <g
        key={c.id}
        transform={`translate(${effX}, ${effY}) rotate(${effRot}) scale(${c.flip ? -1 : 1}, ${c.flipY ? -1 : 1})`}
        onPointerDown={(e) => handleComponentPointerDown(c.id, e)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          const targetComp = circuit.components.find((comp) => comp.id === c.id);
          if (!targetComp) return;
          if (targetComp.type === 'cb' || targetComp.type === 'knife_switch') {
            if (targetComp.props.isTripped) {
              replaceDamagedComponent(targetComp.id);
            } else {
              updateComponentProp(targetComp.id, 'state', !targetComp.props.state);
            }
          } else if (targetComp.type === 'switch_2p' || targetComp.type === 'switch_3p') {
            updateComponentProp(targetComp.id, 'state', !targetComp.props.state);
          }
        }}
        className="cursor-move"
      >
        {/* Yellow outline box when selected */}
        {isSelected && (
          <rect
            x={-def.width / 2 - 4}
            y={-def.height / 2 - 4}
            width={def.width + 8}
            height={def.height + 8}
            fill="none"
            stroke="#FFD84D"
            strokeWidth={2.5}
            strokeDasharray="4,2"
          />
        )}

        {/* Circular Rotation Handle above selected component */}
        {showRotationHandle && (
          <g>
            {/* Stem line */}
            <line
              x1={0}
              y1={-def.height / 2 - 4}
              x2={0}
              y2={-def.height / 2 - 20}
              stroke="#000000"
              strokeWidth={2}
              strokeDasharray="2,2"
            />
            {/* Circular handle */}
            <circle
              cx={0}
              cy={-def.height / 2 - 20}
              r={6}
              fill="#FFD84D"
              stroke="#000000"
              strokeWidth={2}
              className="cursor-grab active:cursor-grabbing hover:scale-125"
              onPointerDown={(e) => {
                e.stopPropagation();
                const worldPt = screenToWorld(e.clientX, e.clientY);
                const pointerAngle = (Math.atan2(worldPt.y - effY, worldPt.x - effX) * 180) / Math.PI;
                startRotating(c.id, pointerAngle);
                (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
              }}
            />

            {/* Angle badge if currently rotating */}
            {rotatingComponent?.compId === c.id && (
              <g transform={`translate(0, ${-def.height / 2 - 38})`} pointerEvents="none">
                <rect
                  x={-22}
                  y={-10}
                  width={44}
                  height={20}
                  fill="#FFD84D"
                  stroke="#000000"
                  strokeWidth={2}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={900}
                  fill="#000000"
                  fontFamily="system-ui"
                >
                  {Math.round(effRot)}°
                </text>
              </g>
            )}
          </g>
        )}

        {/* Component Symbol */}
        <g className={isDamaged ? 'damaged-symbol' : undefined}>
          <def.symbol
            comp={effComp}
            isSelected={isSelected}
            hoveredPinId={hoveredPin?.compId === c.id ? hoveredPin.pinId : null}
            onPinPointerDown={(pinId, e) => handlePinPointerDown(c.id, pinId, e)}
            onPinHover={(pinId) =>
              setHoveredPin(pinId ? { compId: c.id, pinId } : null)
            }
          />
        </g>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full relative overflow-hidden bg-white select-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      >
        <defs>
          {/* Grid pattern 20px */}
          {showGrid && (
            <pattern
              id="circuit-grid"
              width={20 * circuit.viewport.zoom}
              height={20 * circuit.viewport.zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={10 * circuit.viewport.zoom}
                cy={10 * circuit.viewport.zoom}
                r={1.2}
                fill="#C7D2FE"
              />
            </pattern>
          )}
        </defs>

        {/* Canvas background grid */}
        {showGrid && <rect width="100%" height="100%" fill="url(#circuit-grid)" />}

        {/* World Transformed Layer */}
        <g
          transform={`translate(${circuit.viewport.x}, ${circuit.viewport.y}) scale(${circuit.viewport.zoom})`}
        >
          {/* -1. FLOOR PLAN BACKGROUND LAYER (chế độ LẮP ĐẶT) */}
          {isInstallView && showFloorPlan && (
            <g id="floor-plan-layer" pointerEvents="none">
              {/* Floor surface */}
              <rect
                x={80}
                y={80}
                width={500}
                height={400}
                fill="#F8FAFC"
                stroke="none"
              />
              {/* 1m Grid lines inside room */}
              {[180, 280, 380, 480].map((gx) => (
                <line
                  key={`floor_vx_${gx}`}
                  x1={gx}
                  y1={80}
                  x2={gx}
                  y2={480}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}
              {[180, 280, 380].map((gy) => (
                <line
                  key={`floor_hy_${gy}`}
                  x1={80}
                  y1={gy}
                  x2={580}
                  y2={gy}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}
              {/* Outer walls (5px black lines) */}
              <line x1={80} y1={80} x2={580} y2={80} stroke="#0F172A" strokeWidth={5} />
              <line x1={80} y1={80} x2={80} y2={480} stroke="#0F172A" strokeWidth={5} />
              <line x1={580} y1={80} x2={580} y2={480} stroke="#0F172A" strokeWidth={5} />
              {/* Bottom wall with 90cm doorway gap between x:180 and x:270 */}
              <line x1={80} y1={480} x2={180} y2={480} stroke="#0F172A" strokeWidth={5} />
              <line x1={270} y1={480} x2={580} y2={480} stroke="#0F172A" strokeWidth={5} />
              {/* Door swing arc & leaf */}
              <path
                d="M 180 480 A 90 90 0 0 1 270 390"
                fill="none"
                stroke="#64748B"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <line x1={180} y1={480} x2={270} y2={390} stroke="#0F172A" strokeWidth={3} />
              {/* Floor Plan Title */}
              <text
                x={100}
                y={110}
                fill="#475569"
                fontSize={13}
                fontWeight={900}
                letterSpacing="0.05em"
                fontFamily="system-ui"
              >
                MẶT BẰNG PHÒNG (4m × 5m)
              </text>
              {/* 1m Scale Bar */}
              <g transform="translate(100, 440)">
                <line x1={0} y1={0} x2={100} y2={0} stroke="#0F172A" strokeWidth={3} />
                <line x1={0} y1={-5} x2={0} y2={5} stroke="#0F172A" strokeWidth={2} />
                <line x1={100} y1={-5} x2={100} y2={5} stroke="#0F172A" strokeWidth={2} />
                <text
                  x={50}
                  y={-6}
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize={11}
                  fontWeight={800}
                  fontFamily="system-ui"
                >
                  1 m (100 px)
                </text>
              </g>
            </g>
          )}

          {/* 0. ANNOTATIONS LAYER (Khung phân vùng & Ghi chú chữ - luôn ở dưới cùng) */}
          {circuit.components
            .filter((c) => c.type === 'boundary' || c.type === 'textbox')
            .map(renderComponentNode)}

          {/* 1. WIRES LAYER */}
          {circuit.wires.map((w) => {
            const isSelected = selectedWireIds.includes(w.id);
            const isNetHighlighted = hoveredNetId !== null && false; // Wire net matching handled cleanly
            const displayPoints = isInstallView ? getWireInstallPoints(w, circuit) : w.points;
            const pointsStr = displayPoints.map((p) => `${p.x},${p.y}`).join(' ');

            const flow = simulationSnapshot?.wireFlows?.[w.id];
            const isMelted = flow?.isMelted || w.isBurnt;
            const isOverheated = flow?.isOverheated;

            return (
              <g
                key={w.id}
                onPointerDown={(e) => handleWirePointerDown(w.id, e)}
                onPointerEnter={() => setHoveredWire(w.id)}
                onPointerLeave={() => setHoveredWire(null)}
                className="cursor-pointer"
              >
                {/* Fat invisible hit area */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Overheated wire glowing halo */}
                {isOverheated && (
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth={w.crossSection * 2 + 6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.7}
                  />
                )}

                {/* Selection halo */}
                {isSelected && (
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke="#FFD84D"
                    strokeWidth={w.crossSection * 2 + 5}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                )}

                {/* Outer black stroke */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={isMelted ? 'rgba(183, 28, 28, 0.25)' : '#000000'}
                  strokeWidth={Math.max(3, w.crossSection + 2)}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />

                {/* Inner color wire line */}
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={isMelted ? '#B71C1C' : isOverheated ? '#EA580C' : w.color}
                  strokeWidth={Math.max(2, w.crossSection)}
                  strokeDasharray={isMelted ? '6 4' : undefined}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />

                {/* Animated charge carrier flow dots */}
                {!isMelted && (
                  <polyline
                    id={`flow_${w.id}`}
                    points={pointsStr}
                    fill="none"
                    stroke="#FFD84D"
                    strokeWidth={Math.max(2, w.crossSection + 1)}
                    strokeDasharray="4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0}
                    pointerEvents="none"
                  />
                )}

                {/* Midpoint segment dragging handles for selected wire (chỉ ở NGUYÊN LÍ) */}
                {isSelected && !isInstallView &&
                  w.points.slice(0, w.points.length - 1).map((pA, idx) => {
                    const pB = w.points[idx + 1];
                    const midX = (pA.x + pB.x) / 2;
                    const midY = (pA.y + pB.y) / 2;
                    const isHoriz = pA.y === pB.y;

                    return (
                      <rect
                        key={`handle_${idx}`}
                        x={midX - 5}
                        y={midY - 5}
                        width={10}
                        height={10}
                        fill="#FFD84D"
                        stroke="#000000"
                        strokeWidth={1.5}
                        className={isHoriz ? 'cursor-ns-resize' : 'cursor-ew-resize'}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDraggingSegment(w.id, idx);
                        }}
                      />
                    );
                  })}
              </g>
            );
          })}

          {/* 2. JUNCTIONS LAYER (8px filled black dots, kéo chỉnh ở LẮP ĐẶT) */}
          {circuit.junctions.map((j) => {
            const jPos = isInstallView ? (j.install ?? getEndpointInstallPos({ junctionId: j.id }, circuit) ?? j) : j;
            return (
              <circle
                key={j.id}
                cx={jPos.x}
                cy={jPos.y}
                r={4.5}
                fill="#000000"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                className={isInstallView ? 'cursor-move' : undefined}
                onPointerDown={(e) => {
                  if (isInstallView) {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const origX = jPos.x;
                    const origY = jPos.y;
                    const onMove = (moveEv: PointerEvent) => {
                      const dx = (moveEv.clientX - startX) / circuit.viewport.zoom;
                      const dy = (moveEv.clientY - startY) / circuit.viewport.zoom;
                      const nx = Math.round((origX + dx) / 10) * 10;
                      const ny = Math.round((origY + dy) / 10) * 10;
                      moveJunction(j.id, nx, ny);
                    };
                    const onUp = () => {
                      window.removeEventListener('pointermove', onMove);
                      window.removeEventListener('pointerup', onUp);
                    };
                    window.addEventListener('pointermove', onMove);
                    window.addEventListener('pointerup', onUp);
                  }
                }}
              />
            );
          })}

          {/* 3. WIRING PREVIEW DRAFT LAYER */}
          {editorMode === 'wiring' && wiringDraft && (
            <g pointerEvents="none">
              {/* Waypoints polyline */}
              {wiringDraft.waypoints.length > 1 && (
                <polyline
                  points={wiringDraft.waypoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#E5322D"
                  strokeWidth={2.5}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              )}
              {/* Active orthogonal segment from last waypoint to cursor */}
              {(() => {
                const seg = routeOrthogonal(
                  wiringDraft.startPos,
                  wiringDraft.currentPos,
                  wiringDraft.horizontalFirst
                );
                return (
                  <polyline
                    points={seg.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#E5322D"
                    strokeWidth={2.5}
                    strokeDasharray="4,2"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                );
              })()}
              {/* Target crosshair cursor */}
              <circle
                cx={wiringDraft.currentPos.x}
                cy={wiringDraft.currentPos.y}
                r={4}
                fill="#FFD84D"
                stroke="#000"
                strokeWidth={1.5}
              />
            </g>
          )}

          {/* 4. ELECTRICAL COMPONENTS LAYER */}
          {circuit.components
            .filter((c) => c.type !== 'boundary' && c.type !== 'textbox')
            .map(renderComponentNode)}

          {/* 5. PLACING GHOST PREVIEW */}
          {editorMode === 'placing' && currentPlacingDef && (
            <g
              transform={`translate(${worldCursor.x}, ${worldCursor.y})`}
              opacity={0.65}
              pointerEvents="none"
            >
              <currentPlacingDef.symbol
                comp={{
                  id: 'ghost',
                  type: currentPlacingDef.type,
                  x: worldCursor.x,
                  y: worldCursor.y,
                  rot: 0,
                  flip: false,
                  label: currentPlacingDef.refPrefix,
                  props: currentPlacingDef.defaultProps || {},
                }}
              />
            </g>
          )}

          {/* 6. MARQUEE SELECTION BOX */}
          {marqueeStart && marqueeEnd && (
            <rect
              x={Math.min(marqueeStart.x, marqueeEnd.x)}
              y={Math.min(marqueeStart.y, marqueeEnd.y)}
              width={Math.abs(marqueeEnd.x - marqueeStart.x)}
              height={Math.abs(marqueeEnd.y - marqueeStart.y)}
              fill="rgba(65, 105, 225, 0.15)"
              stroke="#4169E1"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          )}

          {/* 7. PARTICLES LAYER (Smoke & Sparks) */}
          {simulationSnapshot?.particles && simulationSnapshot.particles.length > 0 && (
            <g pointerEvents="none">
              {simulationSnapshot.particles.map((p) => (
                <circle
                  key={p.id}
                  cx={p.x}
                  cy={p.y}
                  r={p.size}
                  fill={p.color}
                  opacity={p.opacity}
                />
              ))}
            </g>
          )}
        </g>
      </svg>

      {/* Floating Zoom Controls (Bottom-Right, 28px buttons) */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center bg-white border-2 border-black shadow-[2px_2px_0_#000] p-0.5 gap-0.5 select-none">
        <button
          onClick={() => updateViewport({ zoom: Math.min(4.0, circuit.viewport.zoom * 1.2) })}
          className="w-[28px] h-[28px] bg-white border border-black flex items-center justify-center font-black text-xs hover:bg-[#EEF2FF] active:translate-y-0.5"
          title="Phóng to (+)"
        >
          <ZoomIn size={15} strokeWidth={3} />
        </button>

        <span className="w-12 text-center font-black text-[11px] text-black">
          {Math.round(circuit.viewport.zoom * 100)}%
        </span>

        <button
          onClick={() => updateViewport({ zoom: Math.max(0.25, circuit.viewport.zoom * 0.8) })}
          className="w-[28px] h-[28px] bg-white border border-black flex items-center justify-center font-black text-xs hover:bg-[#EEF2FF] active:translate-y-0.5"
          title="Thu nhỏ (-)"
        >
          <ZoomOut size={15} strokeWidth={3} />
        </button>

        <button
          onClick={() => updateViewport({ x: 0, y: 0, zoom: 1 })}
          className="h-[28px] px-2 bg-white border border-black flex items-center gap-1 font-black text-[10px] hover:bg-[#EEF2FF] active:translate-y-0.5 uppercase"
          title="Vừa khung nhìn"
        >
          <Maximize2 size={12} strokeWidth={3} />
          VỪA
        </button>
      </div>

      {/* Floating Simulation Tooltips for Wire Hover */}
      {hoveredWireId && (() => {
        const wire = circuit.wires.find((w) => w.id === hoveredWireId);
        if (!wire) return null;
        const flow = simulationSnapshot?.wireFlows?.[hoveredWireId];
        const pts = isInstallView ? getWireInstallPoints(wire, circuit) : wire.points;
        const mid = getPolylineMidpoint(pts);
        const screenX = mid.x * circuit.viewport.zoom + circuit.viewport.x;
        const screenY = mid.y * circuit.viewport.zoom + circuit.viewport.y;

        const currentVal = flow ? Math.abs(flow.current) : 0;
        const text = isSimulating
          ? currentVal >= 1e-6
            ? `Dòng: ${formatMeasure(currentVal, 'current')} ${flow?.direction ? (flow.direction > 0 ? '→' : '←') : ''}`
            : 'Dòng: 0 A'
          : `Dây điện (${wire.color})`;

        return (
          <div
            className="absolute z-30 pointer-events-none bg-black text-[#FFD84D] font-mono text-[11px] font-black px-2 py-0.5 border border-white shadow-[2px_2px_0_#000]"
            style={{ left: Math.max(10, screenX - 45), top: Math.max(10, screenY - 28) }}
          >
            {text}
          </div>
        );
      })()}

      {/* Floating Simulation Tooltips for Pin Hover */}
      {hoveredPin && (() => {
        const comp = circuit.components.find((c) => c.id === hoveredPin.compId);
        if (!comp) return null;
        const pinKey = `${hoveredPin.compId}:${hoveredPin.pinId}`;
        const volt = simulationSnapshot?.pinVoltages?.[pinKey];
        const netId = simulationSnapshot?.diagnostics?.pinNetMap?.[pinKey];
        const def = COMPONENT_MAP.get(comp.type);
        const pins = typeof def?.pins === 'function' ? def.pins(comp.props) : def?.pins || [];
        const pDef = pins.find((p) => p.id === hoveredPin.pinId);
        const effComp = isInstallView
          ? { ...comp, x: comp.install?.x ?? comp.x, y: comp.install?.y ?? comp.y, rot: comp.install?.rot ?? comp.rot }
          : comp;
        const pinPos = pinWorldPos(effComp, hoveredPin.pinId, def);
        const screenX = pinPos.x * circuit.viewport.zoom + circuit.viewport.x;
        const screenY = pinPos.y * circuit.viewport.zoom + circuit.viewport.y;

        const text = isSimulating && volt !== undefined
          ? `Nút N${netId ?? 0}: ${formatMeasure(volt, 'voltage')} (so với nút chuẩn)`
          : `Chân ${pDef?.label || hoveredPin.pinId}`;

        return (
          <div
            className="absolute z-30 pointer-events-none bg-white text-black font-mono text-[11px] font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_#000]"
            style={{ left: Math.max(10, screenX - 35), top: Math.max(10, screenY - 32) }}
          >
            {text}
          </div>
        );
      })()}
    </div>
  );
};
