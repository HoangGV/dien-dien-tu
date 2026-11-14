import React from 'react';
import { SymbolProps, PinDef } from '../../core/model';
import { UprightText, PinDot } from './CircuitSymbols';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { COMPONENT_MAP } from '../../core/registry';

/**
 * 1. Logic Switch (Công tắc logic)
 * 1 output pin Q (dx: 2, dy: 0)
 * Click to toggle 0/1. Bold 0/1 label beside symbol.
 */
export const LogicSwitchSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const isHigh = Boolean(comp.props.state);
  const pinQ: PinDef = { id: 'Q', label: 'Q', dx: 2, dy: 0 };

  return (
    <g>
      {/* Lead wire to pin Q */}
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      {/* Switch Body Box (Neo-brutalism) */}
      <rect
        x={-28}
        y={-18}
        width={48}
        height={36}
        fill={isHigh ? '#DCFCE7' : '#F1F5F9'}
        stroke="#000000"
        strokeWidth={2}
        className="cursor-pointer"
      />

      {/* Toggle slider lever */}
      <rect
        x={isHigh ? -2 : -24}
        y={-14}
        width={22}
        height={28}
        fill={isHigh ? '#16A34A' : '#64748B'}
        stroke="#000000"
        strokeWidth={1.5}
      />

      {/* Large 0 or 1 indicator on the switch button */}
      <UprightText
        x={isHigh ? 9 : -13}
        y={0}
        rot={comp.rot}
        fontSize={14}
        fontWeight={900}
        fill="#FFFFFF"
      >
        {isHigh ? '1' : '0'}
      </UprightText>

      {/* External Label (A, B, C...) */}
      <UprightText
        x={-4}
        y={-28}
        rot={comp.rot}
        fontSize={12}
        fontWeight={900}
        fill="#0F172A"
      >
        {comp.label || 'SW'}
      </UprightText>

      {/* Output Pin Q */}
      <PinDot
        pin={pinQ}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'Q'}
      />
    </g>
  );
};

/**
 * 2. Logic Push Button (Nút nhấn logic)
 * Q = 1 when held, 0 when released
 */
export const LogicPushButtonSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const isPressed = Boolean(comp.props.state);
  const pinQ: PinDef = { id: 'Q', label: 'Q', dx: 2, dy: 0 };

  return (
    <g>
      {/* Lead wire to pin Q */}
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      {/* Button casing */}
      <rect
        x={-26}
        y={-18}
        width={46}
        height={36}
        fill="#F8FAFC"
        stroke="#000000"
        strokeWidth={2}
        className="cursor-pointer"
      />

      {/* Button plunger */}
      <circle
        cx={-3}
        cy={0}
        r={12}
        fill={isPressed ? '#16A34A' : '#94A3B8'}
        stroke="#000000"
        strokeWidth={2}
      />

      <UprightText
        x={-3}
        y={0}
        rot={comp.rot}
        fontSize={13}
        fontWeight={900}
        fill="#FFFFFF"
      >
        {isPressed ? '1' : '0'}
      </UprightText>

      <UprightText
        x={-3}
        y={-28}
        rot={comp.rot}
        fontSize={12}
        fontWeight={900}
        fill="#0F172A"
      >
        {comp.label || 'BTN'}
      </UprightText>

      {/* Output Pin Q */}
      <PinDot
        pin={pinQ}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'Q'}
      />
    </g>
  );
};

/**
 * 3. Logic High (Mức 1 cố định)
 */
export const LogicHighSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const pinQ: PinDef = { id: 'Q', label: '1', dx: 2, dy: 0 };

  return (
    <g>
      <line x1={15} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      <polygon
        points="-25,-18 15,-18 15,18 -25,18"
        fill="#FEF08A"
        stroke="#000000"
        strokeWidth={2}
      />

      <UprightText
        x={-5}
        y={0}
        rot={comp.rot}
        fontSize={15}
        fontWeight={900}
        fill="#15803D"
      >
        MỨC 1
      </UprightText>

      <PinDot
        pin={pinQ}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'Q'}
      />
    </g>
  );
};

/**
 * 4. Logic Low (Mức 0 cố định)
 */
export const LogicLowSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const pinQ: PinDef = { id: 'Q', label: '0', dx: 2, dy: 0 };

  return (
    <g>
      <line x1={15} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      <polygon
        points="-25,-18 15,-18 15,18 -25,18"
        fill="#E2E8F0"
        stroke="#000000"
        strokeWidth={2}
      />

      <UprightText
        x={-5}
        y={0}
        rot={comp.rot}
        fontSize={15}
        fontWeight={900}
        fill="#334155"
      >
        MỨC 0
      </UprightText>

      <PinDot
        pin={pinQ}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'Q'}
      />
    </g>
  );
};

/**
 * 5. Logic Gate (Cổng logic đa năng)
 * Types: AND, OR, NOT, NAND, NOR, XOR, XNOR
 * 2px strokes, pins exactly on 20px grid
 */
export const LogicGateSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const gateType = (comp.props.gateType || 'AND').toUpperCase();
  const inputsCount = comp.props.inputsCount || (gateType === 'NOT' ? 1 : 2);

  // Compute pins
  const def = COMPONENT_MAP.get(comp.type);
  const pins = def?.pins
    ? typeof def.pins === 'function'
      ? def.pins(comp.props)
      : def.pins
    : [];

  // Y lead wire from gate body to pin Y (x: 40, y: 0)
  const isBubbleOutput = gateType === 'NOT' || gateType === 'NAND' || gateType === 'NOR' || gateType === 'XNOR';
  const outLeadStart = gateType === 'NOT' ? 28 : isBubbleOutput ? 33 : 25;

  return (
    <g>
      {/* Input lead wires connecting grid pin dots (x: -40) to gate body */}
      {pins
        .filter((p) => p.id !== 'Y')
        .map((p) => {
          const py = p.dy * 20;
          // Body intersection X for input leads:
          // For OR/NOR/XOR/XNOR: back arc is curved around x = -15 to -20
          let bodyX = -20;
          if (gateType === 'OR' || gateType === 'NOR') {
            bodyX = -12 + (py * py) / 60; // parabolic intersection approx
          } else if (gateType === 'XOR' || gateType === 'XNOR') {
            bodyX = -18 + (py * py) / 60;
          }
          return (
            <line
              key={`in_lead_${p.id}`}
              x1={-40}
              y1={py}
              x2={Math.min(-14, bodyX)}
              y2={py}
              stroke="#000000"
              strokeWidth={2}
            />
          );
        })}

      {/* Output lead wire from gate front to Y (x: 40, y: 0) */}
      <line x1={outLeadStart} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      {/* Gate Shape Body */}
      {gateType === 'NOT' && (
        <g>
          {/* Triangle body */}
          <polygon
            points="-20,-22 18,0 -20,22"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Inversion Bubble */}
          <circle cx={24} cy={0} r={4} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
        </g>
      )}

      {(gateType === 'AND' || gateType === 'NAND') && (
        <g>
          {/* AND D-shape */}
          <path
            d="M -20 -28 L 5 -28 A 20 28 0 0 1 5 28 L -20 28 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {gateType === 'NAND' && (
            <circle cx={29} cy={0} r={4} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
          )}
        </g>
      )}

      {(gateType === 'OR' || gateType === 'NOR') && (
        <g>
          {/* OR curved shield with sharp nose at (25, 0) */}
          <path
            d="M -20 -28 Q 2 -28 25 0 Q 2 28 -20 28 Q -8 0 -20 -28 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {gateType === 'NOR' && (
            <circle cx={29} cy={0} r={4} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
          )}
        </g>
      )}

      {(gateType === 'XOR' || gateType === 'XNOR') && (
        <g>
          {/* Input secondary curved arc */}
          <path
            d="M -26 -28 Q -14 0 -26 28"
            fill="none"
            stroke="#000000"
            strokeWidth={2}
          />
          {/* Main OR body */}
          <path
            d="M -20 -28 Q 2 -28 25 0 Q 2 28 -20 28 Q -8 0 -20 -28 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {gateType === 'XNOR' && (
            <circle cx={29} cy={0} r={4} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
          )}
        </g>
      )}

      {/* Gate Type text label */}
      <UprightText
        x={-2}
        y={0}
        rot={comp.rot}
        fontSize={10}
        fontWeight={900}
        fill="#64748B"
      >
        {gateType}
      </UprightText>

      {/* Component Reference / User Label */}
      {comp.label && (
        <UprightText
          x={0}
          y={-36}
          rot={comp.rot}
          fontSize={11}
          fontWeight={900}
          fill="#0F172A"
        >
          {comp.label}
        </UprightText>
      )}

      {/* Render all pin dots */}
      {pins.map((p) => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
    </g>
  );
};

/**
 * 6. Logic LED (Đèn LED logic)
 * 1 input pin "in" (dx: -2, dy: 0 at x: -40, y: 0)
 * Level 1: Glows brightly with color.
 * Level 0: Dim / dark gray.
 * Level X: Dashed border with bold "?" mark.
 * Level CONFLICT: Red flashing/outline with "!".
 */
export const LogicLEDSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const { logicResult } = useWorkspaceStore() as any;
  const pinIn: PinDef = { id: 'in', label: 'IN', dx: -2, dy: 0 };

  const ledState = logicResult?.componentStates?.[comp.id];
  const level = ledState?.level ?? 'X';
  const color = comp.props.color || '#EF4444';

  const isOne = level === 1;
  const isZero = level === 0;
  const isX = level === 'X' || level === undefined;
  const isConflict = level === 'CONFLICT';

  return (
    <g>
      {/* Lead wire from pin in (-40, 0) to LED rim (-18, 0) */}
      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000000" strokeWidth={2} />

      {/* Glowing halo when ON */}
      {isOne && (
        <circle cx={0} cy={0} r={24} fill={color} opacity={0.35} filter="blur(2px)" />
      )}

      {/* Outer LED circular housing */}
      <circle
        cx={0}
        cy={0}
        r={18}
        fill={
          isOne
            ? color
            : isZero
            ? '#1E293B'
            : isConflict
            ? '#FEE2E2'
            : '#FEF08A'
        }
        stroke={isConflict ? '#EF4444' : '#000000'}
        strokeWidth={isConflict ? 3 : 2}
        strokeDasharray={isX ? '4 3' : undefined}
      />

      {/* Inner reflection cap */}
      {isOne && (
        <circle cx={-5} cy={-5} r={5} fill="#FFFFFF" opacity={0.6} />
      )}

      {/* Middle glyph: "?" for X, "!" for CONFLICT, or 1 / 0 */}
      {isX && (
        <UprightText
          x={0}
          y={0}
          rot={comp.rot}
          fontSize={16}
          fontWeight={900}
          fill="#854D0E"
        >
          ?
        </UprightText>
      )}

      {isConflict && (
        <UprightText
          x={0}
          y={0}
          rot={comp.rot}
          fontSize={16}
          fontWeight={900}
          fill="#DC2626"
        >
          !
        </UprightText>
      )}

      {isZero && (
        <UprightText
          x={0}
          y={0}
          rot={comp.rot}
          fontSize={12}
          fontWeight={900}
          fill="#94A3B8"
        >
          0
        </UprightText>
      )}

      {isOne && (
        <UprightText
          x={0}
          y={0}
          rot={comp.rot}
          fontSize={12}
          fontWeight={900}
          fill="#FFFFFF"
        >
          1
        </UprightText>
      )}

      {/* External Label */}
      <UprightText
        x={0}
        y={-28}
        rot={comp.rot}
        fontSize={11}
        fontWeight={900}
        fill="#0F172A"
      >
        {comp.label || 'LED'}
      </UprightText>

      {/* Input Pin */}
      <PinDot
        pin={pinIn}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'in'}
      />
    </g>
  );
};

/**
 * 6. Logic Flip-Flop (D / JK / T)
 * Synchronous edge-triggered storage element with optional active-low CLR
 */
export const LogicFlipFlopSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const { logicResult } = useWorkspaceStore();
  const kind = (comp.props.kind || 'D').toUpperCase();
  const isFalling = comp.props.triggerEdge === 'falling';
  const hasClr = Boolean(comp.props.hasClr);

  // State from simulation result or saved props
  const stateVal = logicResult?.componentStates?.[comp.id]?.q ?? comp.props.qState ?? comp.props.initialState ?? 0;
  const isOne = stateVal === 1;
  const isZero = stateVal === 0;
  const isX = stateVal === 'X';

  const clkY = kind === 'JK' ? 0 : 20;
  const in1Y = -20;
  const in2Y = 20;

  // Pin definitions
  const pinQ: PinDef = { id: 'Q', label: 'Q', dx: 2, dy: -1 };
  const pinNQ: PinDef = { id: 'NQ', label: 'Q̅', dx: 2, dy: 1 };
  const pinCLK: PinDef = { id: 'CLK', label: 'CLK', dx: -2, dy: kind === 'JK' ? 0 : 1 };
  const pinClr: PinDef = { id: 'CLR', label: 'CLR', dx: 0, dy: 2 };

  let pinIn1: PinDef;
  let pinIn2: PinDef | null = null;
  if (kind === 'JK') {
    pinIn1 = { id: 'J', label: 'J', dx: -2, dy: -1 };
    pinIn2 = { id: 'K', label: 'K', dx: -2, dy: 1 };
  } else if (kind === 'T') {
    pinIn1 = { id: 'T', label: 'T', dx: -2, dy: -1 };
  } else {
    pinIn1 = { id: 'D', label: 'D', dx: -2, dy: -1 };
  }

  const boxTop = -36;
  const boxHeight = hasClr ? 76 : 72;

  return (
    <g>
      {/* Input leads */}
      <line x1={-40} y1={in1Y} x2={-24} y2={in1Y} stroke="#000000" strokeWidth={2} />
      {pinIn2 && <line x1={-40} y1={in2Y} x2={-24} y2={in2Y} stroke="#000000" strokeWidth={2} />}
      <line x1={-40} y1={clkY} x2={isFalling ? -27 : -24} y2={clkY} stroke="#000000" strokeWidth={2} />

      {/* Output leads */}
      <line x1={24} y1={-20} x2={40} y2={-20} stroke="#000000" strokeWidth={2} />
      <line x1={27} y1={20} x2={40} y2={20} stroke="#000000" strokeWidth={2} />

      {/* Optional CLR lead at bottom */}
      {hasClr && (
        <>
          <line x1={0} y1={boxTop + boxHeight + 3} x2={0} y2={40} stroke="#000000" strokeWidth={2} />
          {/* Active-low inversion circle on CLR */}
          <circle cx={0} cy={boxTop + boxHeight + 3} r={3} fill="#FFFFFF" stroke="#000000" strokeWidth={1.5} />
          <UprightText x={0} y={boxTop + boxHeight - 8} rot={comp.rot} fontSize={9} fontWeight={900} fill="#EF4444">
            CLR
          </UprightText>
        </>
      )}

      {/* Inversion circle for NQ (Q̅) output */}
      <circle cx={25.5} cy={20} r={2.5} fill="#FFFFFF" stroke="#000000" strokeWidth={1.5} />

      {/* Falling-edge inversion circle on CLK */}
      {isFalling && (
        <circle cx={-25.5} cy={clkY} r={2.5} fill="#FFFFFF" stroke="#000000" strokeWidth={1.5} />
      )}

      {/* Flip-Flop Main Body Box (Neo-brutalism) */}
      <rect
        x={-24}
        y={boxTop}
        width={48}
        height={boxHeight}
        fill={isOne ? '#F0FDF4' : isZero ? '#F8FAFC' : '#FEFCE8'}
        stroke="#000000"
        strokeWidth={2}
        className="cursor-pointer"
      />

      {/* Dynamic Triangle at CLK input */}
      <polygon
        points={`-24,${clkY - 6} -14,${clkY} -24,${clkY + 6}`}
        fill="none"
        stroke="#000000"
        strokeWidth={1.8}
      />

      {/* Internal Pin Labels */}
      <UprightText x={-15} y={in1Y} rot={comp.rot} fontSize={10} fontWeight={900} fill="#0F172A">
        {pinIn1.label}
      </UprightText>
      {pinIn2 && (
        <UprightText x={-15} y={in2Y} rot={comp.rot} fontSize={10} fontWeight={900} fill="#0F172A">
          {pinIn2.label}
        </UprightText>
      )}
      <UprightText x={14} y={-20} rot={comp.rot} fontSize={10} fontWeight={900} fill="#0F172A">
        Q
      </UprightText>
      <UprightText x={14} y={20} rot={comp.rot} fontSize={10} fontWeight={900} fill="#0F172A">
        Q̅
      </UprightText>

      {/* Header Kind */}
      <UprightText x={0} y={boxTop + 10} rot={comp.rot} fontSize={10} fontWeight={900} fill="#3B82F6">
        {kind}
      </UprightText>

      {/* Current Q State Badge */}
      <rect
        x={-8}
        y={-7}
        width={16}
        height={16}
        fill={isOne ? '#10B981' : isZero ? '#334155' : '#EAB308'}
        stroke="#000000"
        strokeWidth={1.5}
      />
      <UprightText x={0} y={0} rot={comp.rot} fontSize={11} fontWeight={900} fill="#FFFFFF">
        {isOne ? '1' : isZero ? '0' : '?'}
      </UprightText>

      {/* External Component Label */}
      <UprightText x={0} y={boxTop - 10} rot={comp.rot} fontSize={11} fontWeight={900} fill="#0F172A">
        {comp.label || 'FF'}
      </UprightText>

      {/* Pins */}
      <PinDot pin={pinIn1} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === pinIn1.id} />
      {pinIn2 && <PinDot pin={pinIn2} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === pinIn2.id} />}
      <PinDot pin={pinCLK} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'CLK'} />
      <PinDot pin={pinQ} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'Q'} />
      <PinDot pin={pinNQ} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'NQ'} />
      {hasClr && <PinDot pin={pinClr} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'CLR'} />}
    </g>
  );
};

/**
 * 7. Logic Clock (Máy phát xung vuông)
 * Outputs periodic 50% square wave at specified frequency (0.5, 1, 2, 5, 10 Hz)
 */
export const LogicClockSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const isHigh = Boolean(comp.props.state);
  const freq = comp.props.frequency || 1;
  const pinQ: PinDef = { id: 'Q', label: 'Q', dx: 2, dy: 0 };

  return (
    <g>
      {/* Lead wire to pin Q */}
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      {/* Clock Generator Body Box */}
      <rect
        x={-24}
        y={-20}
        width={44}
        height={40}
        fill={isHigh ? '#ECFDF5' : '#F8FAFC'}
        stroke="#000000"
        strokeWidth={2}
      />

      {/* Square pulse wave symbol */}
      <path
        d="M -16,4 L -8,4 L -8,-6 L 0,-6 L 0,4 L 8,4 L 8,-6 L 16,-6"
        fill="none"
        stroke={isHigh ? '#10B981' : '#0F172A'}
        strokeWidth={2}
      />

      {/* Frequency text */}
      <UprightText x={-2} y={12} rot={comp.rot} fontSize={9} fontWeight={900} fill="#475569">
        {`${freq}Hz`}
      </UprightText>

      {/* Pulse indicator dot */}
      <circle cx={14} cy={-12} r={3} fill={isHigh ? '#10B981' : '#94A3B8'} stroke="#000000" strokeWidth={1} />

      {/* External Label */}
      <UprightText x={-2} y={-28} rot={comp.rot} fontSize={11} fontWeight={900} fill="#0F172A">
        {comp.label || 'CLK'}
      </UprightText>

      {/* Output Pin Q */}
      <PinDot
        pin={pinQ}
        rot={comp.rot}
        onPointerDown={onPinPointerDown}
        onHover={onPinHover}
        isHovered={hoveredPinId === 'Q'}
      />
    </g>
  );
};

/**
 * 8. Logic 7-Segment Display (LED 7 đoạn BCD)
 * Decodes 4 inputs D0..D3 to display 0..9, '-' for 10..15, '?' for X
 */
export const Logic7SegmentSymbol: React.FC<SymbolProps> = ({
  comp,
  isSelected,
  hoveredPinId,
  onPinPointerDown,
  onPinHover,
}) => {
  const { logicResult } = useWorkspaceStore();
  const digit = logicResult?.componentStates?.[comp.id]?.digit ?? comp.props.digit ?? '0';
  const color = comp.props.color || '#22C55E';

  const pinD3: PinDef = { id: 'D3', label: 'D3', dx: -2, dy: -2 };
  const pinD2: PinDef = { id: 'D2', label: 'D2', dx: -2, dy: -1 };
  const pinD1: PinDef = { id: 'D1', label: 'D1', dx: -2, dy: 0 };
  const pinD0: PinDef = { id: 'D0', label: 'D0', dx: -2, dy: 1 };

  return (
    <g>
      {/* Input leads from grid to display */}
      <line x1={-40} y1={-40} x2={-16} y2={-40} stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={-20} x2={-16} y2={-20} stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={0} x2={-16} y2={0} stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-16} y2={20} stroke="#000000" strokeWidth={2} />

      {/* Main Display Box (Dark screen) */}
      <rect
        x={-16}
        y={-50}
        width={52}
        height={82}
        fill="#0F172A"
        stroke="#000000"
        strokeWidth={2}
        rx={2}
      />

      {/* Inner display bezel */}
      <rect
        x={-12}
        y={-46}
        width={44}
        height={74}
        fill="#020617"
        stroke="#1E293B"
        strokeWidth={1}
      />

      {/* Large 7-segment digit display */}
      <UprightText
        x={10}
        y={-9}
        rot={comp.rot}
        fontSize={40}
        fontWeight={900}
        fill={color}
        className="font-mono"
      >
        {digit}
      </UprightText>

      {/* Pin labels */}
      <UprightText x={-26} y={-45} rot={comp.rot} fontSize={8} fontWeight={900} fill="#475569">
        D3
      </UprightText>
      <UprightText x={-26} y={-25} rot={comp.rot} fontSize={8} fontWeight={900} fill="#475569">
        D2
      </UprightText>
      <UprightText x={-26} y={-5} rot={comp.rot} fontSize={8} fontWeight={900} fill="#475569">
        D1
      </UprightText>
      <UprightText x={-26} y={15} rot={comp.rot} fontSize={8} fontWeight={900} fill="#475569">
        D0
      </UprightText>

      {/* External Label */}
      <UprightText x={10} y={-58} rot={comp.rot} fontSize={11} fontWeight={900} fill="#0F172A">
        {comp.label || 'DISP'}
      </UprightText>

      {/* Pins */}
      <PinDot pin={pinD3} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'D3'} />
      <PinDot pin={pinD2} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'D2'} />
      <PinDot pin={pinD1} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'D1'} />
      <PinDot pin={pinD0} rot={comp.rot} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === 'D0'} />
    </g>
  );
};
