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
  const outLeadStart = isBubbleOutput ? 30 : 25;

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
            d="M -20 -28 L 5 -28 A 28 28 0 0 1 5 28 L -20 28 Z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {gateType === 'NAND' && (
            <circle cx={28} cy={0} r={4} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
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
