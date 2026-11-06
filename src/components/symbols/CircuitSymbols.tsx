import React from 'react';
import { SymbolProps, PinDef } from '../../core/model';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { formatMeasure } from '../../core/measureFormat';

// Text component that counter-transforms so text glyphs are ALWAYS upright & unmirrored
export const UprightText: React.FC<{
  x: number;
  y: number;
  rot?: number;
  flip?: boolean;
  flipY?: boolean;
  children: React.ReactNode;
  fontSize?: number | string;
  fontWeight?: string | number;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'central' | 'middle' | 'hanging';
  className?: string;
}> = ({
  x,
  y,
  rot = 0,
  flip = false,
  flipY = false,
  children,
  fontSize = 11,
  fontWeight = 'bold',
  fill = '#000000',
  textAnchor = 'middle',
  dominantBaseline = 'central',
  className = '',
}) => {
  const flipX = flip ? -1 : 1;
  const flipYVal = flipY ? -1 : 1;
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${flipX}, ${flipYVal}) rotate(${-rot})`}
      pointerEvents="none"
      className="select-none"
    >
      <text
        x={0}
        y={0}
        textAnchor={textAnchor}
        dominantBaseline={dominantBaseline}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={fill}
        className={className}
      >
        {children}
      </text>
    </g>
  );
};

// Pin dot renderer: pin position rotates/flips with component, but pin label remains upright & unmirrored
export const PinDot: React.FC<{
  pin: PinDef;
  rot?: number;
  flip?: boolean;
  flipY?: boolean;
  onPointerDown?: (pinId: string, e: React.PointerEvent) => void;
  onHover?: (pinId: string | null) => void;
  isHovered?: boolean;
}> = ({ pin, rot = 0, flip = false, flipY = false, onPointerDown, onHover, isHovered }) => {
  const cx = pin.dx * 20;
  const cy = pin.dy * 20;
  const flipX = flip ? -1 : 1;
  const flipYVal = flipY ? -1 : 1;

  // Calculate world vertical orientation relative to component center
  const rad = (rot * Math.PI) / 180;
  const worldDy = Math.sin(rad) * (cx * flipX) + Math.cos(rad) * (cy * flipYVal);
  const textOffset = Math.abs(worldDy) < 5 ? -9 : worldDy > 0 ? 11 : -11;

  return (
    <g
      className="cursor-crosshair select-none"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(pin.id, e);
      }}
      onPointerEnter={() => onHover?.(pin.id)}
      onPointerLeave={() => onHover?.(null)}
    >
      <circle cx={cx} cy={cy} r={10} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 5.5 : 4}
        fill={isHovered ? '#FFD84D' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={isHovered ? 2.5 : 2}
      />
      {pin.label && (
        <g
          transform={`translate(${cx}, ${cy}) scale(${flipX}, ${flipYVal}) rotate(${-rot})`}
          pointerEvents="none"
        >
          <text
            x={0}
            y={textOffset}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fontWeight="800"
            fill="#222222"
          >
            {pin.label}
          </text>
        </g>
      )}
    </g>
  );
};

// Label renderer that counter-transforms so text is ALWAYS horizontal and upright
// Displays the component reference symbol (e.g. Q1, R1, MCB, Đ1)
export const SymbolLabels: React.FC<{
  label: string;
  valueStr?: string;
  rot?: number;
  flip?: boolean;
  flipY?: boolean;
  yOffset?: number;
}> = ({ label, rot = 0, flip = false, flipY = false, yOffset = -22 }) => {
  if (!label) return null;
  const flipX = flip ? -1 : 1;
  const flipYVal = flipY ? -1 : 1;

  return (
    <g
      transform={`translate(0, ${yOffset}) scale(${flipX}, ${flipYVal}) rotate(${-rot})`}
      pointerEvents="none"
      className="select-none"
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="900"
        fill="#000000"
      >
        {label}
      </text>
    </g>
  );
};

// 1. NGUỒN ĐIỆN XOAY CHIỀU (TCVN / SGK: 2 cực A - Pha, O - Trung tính, tùy chọn PE nối đất)
export const ACSourceSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const pins: PinDef[] = hasPE
    ? [
        { id: 'O', label: 'O', dx: 2, dy: -1, polarity: 'O' },
        { id: 'PE', label: 'PE', dx: 2, dy: 0, polarity: 'PE' },
        { id: 'A', label: 'A', dx: 2, dy: 1, polarity: 'A' },
      ]
    : [
        { id: 'O', label: 'O', dx: 2, dy: -1, polarity: 'O' },
        { id: 'A', label: 'A', dx: 2, dy: 1, polarity: 'A' },
      ];

  return (
    <g>
      {/* Box with thin dotted line (chuẩn sơ đồ tủ điện ngoài trời / nguồn vào) */}
      <rect
        x={-28}
        y={-32}
        width={56}
        height={64}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />

      {/* Point O (Trung tính - N) */}
      <circle cx={-4} cy={-20} r={4.5} fill="#000000" />
      <UprightText
        x={-14}
        y={-20}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={12}
        fontWeight={900}
        fill="#4169E1"
      >
        O
      </UprightText>
      <line x1={-4} y1={-20} x2={40} y2={-20} stroke="#000000" strokeWidth={2} />

      {/* Point PE (Nối đất bảo vệ nguồn - khi hasPE bật) */}
      {hasPE && (
        <>
          <circle cx={-4} cy={0} r={4} fill="#10B981" />
          <UprightText
            x={-14}
            y={0}
            rot={comp.rot}
            flip={comp.flip}
            flipY={comp.flipY}
            fontSize={10}
            fontWeight={900}
            fill="#10B981"
          >
            PE
          </UprightText>
          <line x1={-4} y1={0} x2={40} y2={0} stroke="#10B981" strokeWidth={2} strokeDasharray="3 2" />
        </>
      )}

      {/* Point A (Pha - L) */}
      <circle cx={-4} cy={20} r={4.5} fill="#E5322D" />
      <UprightText
        x={-14}
        y={20}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={12}
        fontWeight={900}
        fill="#E5322D"
      >
        A
      </UprightText>
      <line x1={-4} y1={20} x2={40} y2={20} stroke="#000000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-36} />
    </g>
  );
};

// 2. APTOMAT HỘP (MCB 1, 2, 3 CỰC - DẠNG TỦ ĐIỆN NHÁNH)
// Khung chữ nhật bao ngoài, các tiếp điểm o---/---o nằm ngang nối thẳng hàng với nguồn/tải, mũi tên liên động cơ khí ở giữa
export const CBSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const poles = comp.props.poles || 1;
  const isTripped = comp.props.isTripped ?? false;
  const isClosed = (comp.props.state ?? true) && !isTripped;

  // Dynamic pins:
  // 1P: in (-2, 0), out (2, 0)
  // 2P: in1 (-2, -1), out1 (2, -1); in2 (-2, 1), out2 (2, 1) -> Khớp chuẩn thẳng hàng với kWh meter!
  // 3P: in1 (-2, -2), out1 (2, -2); in2 (-2, 0), out2 (2, 0); in3 (-2, 2), out3 (2, 2)
  const pins: PinDef[] = [];
  if (poles === 1) {
    pins.push({ id: 'in', label: '1', dx: -2, dy: 0 }, { id: 'out', label: '1\'', dx: 2, dy: 0 });
  } else if (poles === 2) {
    pins.push(
      { id: 'in1', label: '1', dx: -2, dy: -1 },
      { id: 'out1', label: '1\'', dx: 2, dy: -1 },
      { id: 'in2', label: '2', dx: -2, dy: 1 },
      { id: 'out2', label: '2\'', dx: 2, dy: 1 }
    );
  } else {
    pins.push(
      { id: 'in1', label: '1', dx: -2, dy: -2 },
      { id: 'out1', label: '1\'', dx: 2, dy: -2 },
      { id: 'in2', label: '2', dx: -2, dy: 0 },
      { id: 'out2', label: '2\'', dx: 2, dy: 0 },
      { id: 'in3', label: '3', dx: -2, dy: 2 },
      { id: 'out3', label: '3\'', dx: 2, dy: 2 }
    );
  }

  const poleYOffsets = poles === 1 ? [0] : poles === 2 ? [-20, 20] : [-40, 0, 40];
  const boxTop = poleYOffsets[0] - 12;
  const boxBottom = poleYOffsets[poleYOffsets.length - 1] + 12;
  const boxHeight = boxBottom - boxTop;

  return (
    <g>
      {/* Outer rectangular Aptomat enclosure box */}
      <rect
        x={-28}
        y={boxTop}
        width={56}
        height={boxHeight}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={2}
      />

      {/* Poles with contacts o--/--o */}
      {poleYOffsets.map((py, i) => (
        <g key={i}>
          {/* Incoming lead from left pin (-40, py) to left terminal circle (-14, py) */}
          <line x1={-40} y1={py} x2={-14} y2={py} stroke="#000" strokeWidth={2} />
          {/* Left terminal circle */}
          <circle cx={-14} cy={py} r={3.5} fill="#FFF" stroke="#000" strokeWidth={1.8} />

          {/* Right terminal circle */}
          <circle cx={14} cy={py} r={3.5} fill="#FFF" stroke="#000" strokeWidth={1.8} />
          {/* Outgoing lead from right terminal circle (14, py) to right pin (40, py) */}
          <line x1={14} y1={py} x2={40} y2={py} stroke="#000" strokeWidth={2} />

          {/* Contact blade */}
          {isClosed ? (
            <line x1={-14} y1={py} x2={14} y2={py} stroke="#000" strokeWidth={2.5} />
          ) : (
            <line x1={-14} y1={py} x2={12} y2={py - 10} stroke="#E5322D" strokeWidth={2.5} />
          )}
        </g>
      ))}

      {/* Central vertical mechanical interlock arrow line */}
      {poles > 1 && (
        <g>
          <line
            x1={0}
            y1={poleYOffsets[poleYOffsets.length - 1]}
            x2={0}
            y2={poleYOffsets[0] - 6}
            stroke="#000"
            strokeWidth={1.5}
          />
          {/* Upward pointing arrowhead */}
          <polygon
            points={`0,${poleYOffsets[0] - 8} -3.5,${poleYOffsets[0] - 1} 3.5,${poleYOffsets[0] - 1}`}
            fill="#000"
          />
        </g>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels
        label={comp.label}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        yOffset={boxTop - 8}
      />
    </g>
  );
};

// 3. APTOMAT (MCB 2, 3 CỰC - CHUẨN SGK GDPT HÌNH BẢNG KÍ HIỆU)
// Tiếp điểm thẳng đứng, 2 đường line xiên từ circle phía (1) và (2) xiên lên circle phía (1') và (2'), mũi tên ngang xuyên qua các lưỡi dao
export const KnifeSwitchSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const poles = comp.props.poles || 2;
  const isTripped = comp.props.isTripped ?? false;
  const isClosed = (comp.props.state ?? true) && !isTripped;

  // Cực (1) và (2) ở phía dưới (dy: 2); Cực (1') và (2') ở phía trên (dy: -2)
  const pins: PinDef[] = poles === 2
    ? [
        { id: 'in1', label: '1', dx: -1, dy: 2 },
        { id: 'in2', label: '2', dx: 1, dy: 2 },
        { id: 'out1', label: '1\'', dx: -1, dy: -2 },
        { id: 'out2', label: '2\'', dx: 1, dy: -2 },
      ]
    : [
        { id: 'in1', label: '1', dx: -1, dy: 2 },
        { id: 'in2', label: '2', dx: 0, dy: 2 },
        { id: 'in3', label: '3', dx: 1, dy: 2 },
        { id: 'out1', label: '1\'', dx: -1, dy: -2 },
        { id: 'out2', label: '2\'', dx: 0, dy: -2 },
        { id: 'out3', label: '3\'', dx: 1, dy: -2 },
      ];

  const poleXOffsets = poles === 2 ? [-20, 20] : [-20, 0, 20];

  return (
    <g>
      {poleXOffsets.map((px, i) => (
        <g key={i}>
          {/* Top terminal lead down to top circle (1', 2') */}
          <line x1={px} y1={-40} x2={px} y2={-17.5} stroke="#000" strokeWidth={2} />
          <circle cx={px} cy={-14} r={3.5} fill="#FFF" stroke="#000" strokeWidth={2} />

          {/* Bottom terminal lead up to bottom circle (1, 2) */}
          <line x1={px} y1={40} x2={px} y2={17.5} stroke="#000" strokeWidth={2} />
          <circle cx={px} cy={14} r={3.5} fill="#FFF" stroke="#000" strokeWidth={2} />

          {/* Contact blade: Xiên từ hướng circle phía (1) và (2) xiên lên circle phía (1') và (2') */}
          {isClosed ? (
            <line x1={px} y1={14} x2={px + 4} y2={-13} stroke="#000" strokeWidth={2.5} />
          ) : (
            <line x1={px} y1={14} x2={px + 12} y2={-10} stroke="#E5322D" strokeWidth={2.5} />
          )}
        </g>
      ))}

      {/* Horizontal interlock line with arrow pointing RIGHT across blades */}
      <line
        x1={poleXOffsets[0] - 10}
        y1={0}
        x2={poleXOffsets[poleXOffsets.length - 1] + 16}
        y2={0}
        stroke="#000"
        strokeWidth={1.8}
      />
      <polygon
        points={`${poleXOffsets[poleXOffsets.length - 1] + 18},0 ${poleXOffsets[poleXOffsets.length - 1] + 11},-4 ${poleXOffsets[poleXOffsets.length - 1] + 11},4`}
        fill="#000"
      />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-46} />
    </g>
  );
};

// 4. CẦU CHÌ (1, 2, 3 CỰC - TCVN 1623-75 & SGK)
export const FuseSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const poles = comp.props.poles || 1;
  const isBlown = comp.props.isBlown ?? false;

  const pins: PinDef[] = [];
  if (poles === 1) {
    pins.push({ id: 'in', label: '', dx: -2, dy: 0 }, { id: 'out', label: '', dx: 2, dy: 0 });
  } else if (poles === 2) {
    pins.push(
      { id: 'in1', label: '', dx: -2, dy: -1 },
      { id: 'out1', label: '', dx: 2, dy: -1 },
      { id: 'in2', label: '', dx: -2, dy: 1 },
      { id: 'out2', label: '', dx: 2, dy: 1 }
    );
  } else {
    pins.push(
      { id: 'in1', label: '', dx: -2, dy: -2 },
      { id: 'out1', label: '', dx: 2, dy: -2 },
      { id: 'in2', label: '', dx: -2, dy: 0 },
      { id: 'out2', label: '', dx: 2, dy: 0 },
      { id: 'in3', label: '', dx: -2, dy: 2 },
      { id: 'out3', label: '', dx: 2, dy: 2 }
    );
  }

  const poleYOffsets = poles === 1 ? [0] : poles === 2 ? [-20, 20] : [-40, 0, 40];

  return (
    <g>
      {poleYOffsets.map((py, i) => (
        <g key={i} transform={`translate(0, ${py})`}>
          <rect x={-20} y={-7} width={40} height={14} fill={isBlown || comp.damaged ? 'rgba(220, 38, 38, 0.3)' : '#FFFFFF'} stroke={isBlown || comp.damaged ? '#B71C1C' : '#000000'} strokeWidth={2} />
          {isBlown ? (
            <path d="M -40 0 L -8 0 M 8 0 L 40 0" stroke="#000" strokeWidth={2} />
          ) : (
            <line x1={-40} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
          )}
        </g>
      ))}

      {/* Dashed interlock if multi-pole */}
      {poles > 1 && (
        <line
          x1={0}
          y1={poleYOffsets[0]}
          x2={0}
          y2={poleYOffsets[poleYOffsets.length - 1]}
          stroke="#000"
          strokeWidth={1.5}
          strokeDasharray="3,2"
        />
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels
        label={comp.label}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        yOffset={-14 - (poles > 1 ? (poles - 1) * 20 : 0)}
      />
    </g>
  );
};

// 5. CÔNG TẮC 2 CỰC (TCVN 1615-75 & SGK: Vòng tròn có tiếp điểm nghiêng)
export const Switch2PSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];
  const isClosed = comp.props.state ?? false;

  return (
    <g>
      <circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <circle cx={-10} cy={0} r={2.5} fill="#FFF" stroke="#000" strokeWidth={2} />
      <circle cx={10} cy={0} r={2.5} fill="#FFF" stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={0} x2={-12.5} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={12.5} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* Contact lever inside circle */}
      {isClosed ? (
        <line x1={-10} y1={0} x2={10} y2={0} stroke="#000" strokeWidth={2.5} />
      ) : (
        <line x1={-10} y1={0} x2={8} y2={-10} stroke="#000" strokeWidth={2.5} />
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr={isClosed ? 'ĐÓNG' : 'MỞ'} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 6. CÔNG TẮC 3 CỰC (CÔNG TẮC CẦU THANG - TCVN 1615-75 & SGK)
export const Switch3PSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'com', label: 'com', dx: -2, dy: 0 },
    { id: 'a', label: '1', dx: 2, dy: -1 },
    { id: 'b', label: '2', dx: 2, dy: 1 },
  ];
  const posA = comp.props.state ?? true;

  return (
    <g>
      <circle cx={0} cy={0} r={20} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <circle cx={-12} cy={0} r={2.5} fill="#FFF" stroke="#000" strokeWidth={2} />
      <circle cx={12} cy={-10} r={2.5} fill="#FFF" stroke="#000" strokeWidth={2} />
      <circle cx={12} cy={10} r={2.5} fill="#FFF" stroke="#000" strokeWidth={2} />

      <line x1={-40} y1={0} x2={-14.5} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={14.5} y1={-10} x2={40} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={14.5} y1={10} x2={40} y2={20} stroke="#000" strokeWidth={2} />

      {posA ? (
        <line x1={-12} y1={0} x2={12} y2={-10} stroke="#000" strokeWidth={2.5} />
      ) : (
        <line x1={-12} y1={0} x2={12} y2={10} stroke="#000" strokeWidth={2.5} />
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr="3 CỰC" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-26} />
    </g>
  );
};

// 7. BÓNG ĐÈN CHIẾU SÁNG (TCVN 1622-75 & SGK: Vòng tròn dấu ×)
// 7. BÓNG ĐÈN CHIẾU SÁNG (TCVN 1622-75 & SGK: Vòng tròn dấu ×, tùy chọn chân nối đất PE)
export const LampSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const isSimulating = useWorkspaceStore(s => s.isSimulating);
  const kinetics = useWorkspaceStore(s => s.simulationSnapshot?.componentKinetics[comp.id]);
  const brightness = isSimulating && kinetics ? (kinetics.brightness ?? 0) : (comp.props.isOn ? 1.0 : 0);
  const isGlowing = brightness > 0;
  const glowRadius = Math.max(4, Math.round(brightness * 14));

  const pins: PinDef[] = hasPE
    ? [
        { id: '1', label: '', dx: -2, dy: 0 },
        { id: '2', label: '', dx: 2, dy: 0 },
        { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
      ]
    : [
        { id: '1', label: '', dx: -2, dy: 0 },
        { id: '2', label: '', dx: 2, dy: 0 },
      ];
  const leakToCase = Boolean(comp.props.leakToCase);

  return (
    <g>
      <circle
        cx={0}
        cy={0}
        r={18}
        fill={isGlowing ? '#FFD84D' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isGlowing ? { filter: `drop-shadow(0 0 ${glowRadius}px #FFD84D)` } : undefined}
      />
      {/* TCVN cross × */}
      <line x1={-12.7} y1={-12.7} x2={12.7} y2={12.7} stroke="#000" strokeWidth={2.5} />
      <line x1={-12.7} y1={12.7} x2={12.7} y2={-12.7} stroke="#000" strokeWidth={2.5} />

      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* PE stem if PE active */}
      {hasPE && (
        <line x1={0} y1={18} x2={0} y2={20} stroke="#10B981" strokeWidth={2} strokeDasharray="2 2" />
      )}

      {/* Case leakage warning badge */}
      {leakToCase && (
        <g transform="translate(0, -22)">
          <rect x={-24} y={-7} width={48} height={14} rx={3} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1.5} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="900" fill="#DC2626">
            RÒ VỎ !
          </text>
        </g>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 8. ĐÈN HUỲNH QUANG (SGK Công nghệ 9, 12: Hình chữ nhật bo tròn có dấu × ở giữa, tùy chọn PE)
export const FluorescentLampSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const isSimulating = useWorkspaceStore(s => s.isSimulating);
  const kinetics = useWorkspaceStore(s => s.simulationSnapshot?.componentKinetics[comp.id]);
  const brightness = isSimulating && kinetics ? (kinetics.brightness ?? 0) : (comp.props.isOn ? 1.0 : 0);
  const isGlowing = brightness > 0;
  const glowRadius = Math.max(4, Math.round(brightness * 16));

  const pins: PinDef[] = hasPE
    ? [
        { id: '1', label: '', dx: -3, dy: 0 },
        { id: '2', label: '', dx: 3, dy: 0 },
        { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
      ]
    : [
        { id: '1', label: '', dx: -3, dy: 0 },
        { id: '2', label: '', dx: 3, dy: 0 },
      ];
  const leakToCase = Boolean(comp.props.leakToCase);

  return (
    <g>
      {/* Elongated tube with rounded ends */}
      <rect
        x={-40}
        y={-10}
        width={80}
        height={20}
        rx={10}
        fill={isGlowing ? '#A5F3FC' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isGlowing ? { filter: `drop-shadow(0 0 ${glowRadius}px #22D3EE)` } : undefined}
      />
      {/* Center cross mark */}
      <line x1={-8} y1={-8} x2={8} y2={8} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={8} x2={8} y2={-8} stroke="#000" strokeWidth={2} />

      <line x1={-60} y1={0} x2={-40} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={40} y1={0} x2={60} y2={0} stroke="#000" strokeWidth={2} />

      {/* PE stem if active */}
      {hasPE && (
        <line x1={0} y1={10} x2={0} y2={20} stroke="#10B981" strokeWidth={2} strokeDasharray="2 2" />
      )}

      {/* Case leakage warning badge */}
      {leakToCase && (
        <g transform="translate(0, -18)">
          <rect x={-24} y={-7} width={48} height={14} rx={3} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1.5} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="900" fill="#DC2626">
            RÒ VỎ !
          </text>
        </g>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-16} />
    </g>
  );
};

// 9. QUẠT TRẦN (TCVN 1619-75 & SGK: Hình cánh quạt 2 tam giác đối đỉnh có tâm tròn, tùy chọn PE và rò vỏ)
export const CeilingFanSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const isSimulating = useWorkspaceStore(s => s.isSimulating);
  const kinetics = useWorkspaceStore(s => s.simulationSnapshot?.componentKinetics[comp.id]);
  const isOperating = isSimulating && kinetics ? kinetics.isOperating : Boolean(comp.props.isOn || comp.props.state);
  const greenOpacity = kinetics?.greenIntensity ?? 0.6;
  const thermalStatus = kinetics?.thermalStatus || 'normal';
  const leakToCase = Boolean(comp.props.leakToCase);
  const caseStatus = useWorkspaceStore(s => s.simulationSnapshot?.solverResult.caseStatuses[comp.id]);
  const replaceDamaged = useWorkspaceStore(s => s.replaceDamagedComponent);

  const pins: PinDef[] = hasPE
    ? [
        { id: '1', label: '', dx: -2, dy: 0 },
        { id: '2', label: '', dx: 2, dy: 0 },
        { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
      ]
    : [
        { id: '1', label: '', dx: -2, dy: 0 },
        { id: '2', label: '', dx: 2, dy: 0 },
      ];

  let bladeFill = '#FFFFFF';
  let bladeStroke = '#000000';
  let bladeOpacity = 1.0;

  if (thermalStatus === 'damaged' || comp.damaged) {
    bladeFill = 'rgba(220, 38, 38, 0.3)';
    bladeStroke = '#B71C1C';
  } else if (thermalStatus === 'hot') {
    bladeFill = '#FED7AA';
    bladeStroke = '#EA580C';
  } else if (isOperating) {
    bladeFill = '#10B981';
    bladeStroke = '#047857';
    bladeOpacity = greenOpacity;
  }

  return (
    <g>
      {/* 2 bow-tie fan blades stationary */}
      <g>
        <polygon
          points="-30,-12 0,0 -30,12"
          fill={bladeFill}
          fillOpacity={bladeOpacity}
          stroke={bladeStroke}
          strokeWidth={2}
          style={isOperating && thermalStatus === 'normal' ? { filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))' } : undefined}
        />
        <polygon
          points="30,-12 0,0 30,12"
          fill={bladeFill}
          fillOpacity={bladeOpacity}
          stroke={bladeStroke}
          strokeWidth={2}
          style={isOperating && thermalStatus === 'normal' ? { filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))' } : undefined}
        />
      </g>

      {/* Center stationary rotor dot */}
      <circle
        cx={0}
        cy={0}
        r={4.5}
        fill={thermalStatus === 'damaged' ? '#DC2626' : isOperating ? '#059669' : '#4169E1'}
        stroke="#000"
        strokeWidth={1.5}
      />

      <line x1={-40} y1={0} x2={-30} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={30} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* PE stem if active */}
      {hasPE && (
        <line x1={0} y1={0} x2={0} y2={20} stroke="#10B981" strokeWidth={2} strokeDasharray="2 2" />
      )}

      {/* Damaged mark ✕ */}
      {thermalStatus === 'damaged' && (
        <g
          transform="translate(0, 0) scale(1.2)"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            replaceDamaged(comp.id);
          }}
        >
          <line x1={-12} y1={-12} x2={12} y2={12} stroke="#DC2626" strokeWidth={3} />
          <line x1={12} y1={-12} x2={-12} y2={12} stroke="#DC2626" strokeWidth={3} />
        </g>
      )}

      {/* Hot warning badge */}
      {thermalStatus === 'hot' && (
        <g transform="translate(0, -26)">
          <rect x={-26} y={-8} width={52} height={16} rx={4} fill="#FFF7ED" stroke="#EA580C" strokeWidth={1.5} />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="900" fill="#EA580C">
            🔥 NÓNG !
          </text>
        </g>
      )}

      {/* Case leakage warning badge */}
      {leakToCase && (
        <g transform="translate(0, -22)">
          <rect
            x={-34}
            y={-8}
            width={68}
            height={16}
            rx={4}
            fill={caseStatus && caseStatus.humanCurrent > 30 ? '#FEE2E2' : caseStatus && caseStatus.humanCurrent > 10 ? '#FFEDD5' : '#FEF3C7'}
            stroke={caseStatus && caseStatus.humanCurrent > 30 ? '#DC2626' : caseStatus && caseStatus.humanCurrent > 10 ? '#EA580C' : '#D97706'}
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="900"
            fill={caseStatus && caseStatus.humanCurrent > 30 ? '#B91C1C' : caseStatus && caseStatus.humanCurrent > 10 ? '#C2410C' : '#92400E'}
          >
            {caseStatus ? `VỎ: ${caseStatus.caseVoltage}V` : 'RÒ VỎ !'}
          </text>
        </g>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-18} />
    </g>
  );
};

// 10. CHUÔNG ĐIỆN (SGK: Vòm chuông úp, đáy phẳng có 2 chân)
export const ElectricBellSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const isSimulating = useWorkspaceStore(s => s.isSimulating);
  const kinetics = useWorkspaceStore(s => s.simulationSnapshot?.componentKinetics[comp.id]);
  const isRinging = isSimulating && kinetics ? Boolean(kinetics.isOperating) : false;

  const pins: PinDef[] = [
    { id: '1', label: '', dx: -1, dy: 2 },
    { id: '2', label: '', dx: 1, dy: 2 },
  ];

  return (
    <g>
      {/* Sound waves emitted when ringing */}
      {isRinging && (
        <g stroke="#4169E1" strokeWidth={1.5} fill="none" opacity={0.85}>
          <path d="M -24 4 A 26 26 0 0 1 24 4" strokeDasharray="3 2" />
          <path d="M -28 0 A 30 30 0 0 1 28 0" strokeDasharray="4 2" />
        </g>
      )}

      {/* Bell dome */}
      <path
        d="M -18 10 A 18 18 0 0 1 18 10 Z"
        fill={isRinging ? '#FEF08A' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isRinging ? { filter: 'drop-shadow(0 0 6px #FACC15)' } : undefined}
      />
      {/* Top hanger handle */}
      <path d="M -6 -8 L -6 -14 L 6 -14 L 6 -8" fill="none" stroke="#000" strokeWidth={2} />

      {/* Leads from bottom */}
      <line x1={-20} y1={10} x2={-20} y2={40} stroke="#000" strokeWidth={2} />
      <line x1={20} y1={10} x2={20} y2={40} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr={isRinging ? 'ĐANG REO' : 'Chuông'} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-20} />
    </g>
  );
};

// 11. Ổ LẤY ĐIỆN (Ổ CẮM - TCVN & SGK: Vòng tròn có 2 lỗ cắm, tùy chọn chân nối đất PE)
export const SocketSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const pins: PinDef[] = hasPE
    ? [
        { id: 'A', label: 'A', dx: -2, dy: 0 },
        { id: 'O', label: 'O', dx: 2, dy: 0 },
        { id: 'PE', label: 'PE', dx: 0, dy: 1, polarity: 'PE' },
      ]
    : [
        { id: 'A', label: 'A', dx: -2, dy: 0 },
        { id: 'O', label: 'O', dx: 2, dy: 0 },
      ];

  return (
    <g>
      <circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      {/* 2 main socket holes arranged horizontally, collinear with A and O pins */}
      <circle cx={-7} cy={0} r={3} fill="#000000" />
      <circle cx={7} cy={0} r={3} fill="#000000" />
      {/* Ground socket hole if hasPE */}
      {hasPE && (
        <circle cx={0} cy={-7} r={2.5} fill="#10B981" stroke="#000000" strokeWidth={1} />
      )}

      {/* Horizontal leads from circle to pins A and O */}
      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000000" strokeWidth={2} />

      {/* PE lead down to pin PE if active */}
      {hasPE && (
        <line x1={0} y1={18} x2={0} y2={20} stroke="#10B981" strokeWidth={2} strokeDasharray="3 2" />
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr={hasPE ? '3 chấu' : undefined} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 12. CÔNG TƠ ĐIỆN (TCVN & SGK: Hình chữ nhật kWh)
export const KWhMeterSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '1', dx: -2, dy: -1 },
    { id: '2', label: '2', dx: 2, dy: -1 },
    { id: '3', label: '3', dx: -2, dy: 1 },
    { id: '4', label: '4', dx: 2, dy: 1 },
  ];

  return (
    <g>
      <rect x={-26} y={-18} width={52} height={36} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <UprightText
        x={0}
        y={0}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={13}
        fontWeight={900}
        fill="#000"
      >
        kWh
      </UprightText>

      <line x1={-40} y1={-20} x2={-26} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={26} y1={-20} x2={40} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-26} y2={20} stroke="#000" strokeWidth={2} />
      <line x1={26} y1={20} x2={40} y2={20} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 13. DỤNG CỤ ĐO (AMPE KẾ, VÔN KẾ, OÁT KẾ, ÔM KẾ)
export const InstrumentSymbol: React.FC<SymbolProps & { meterKind: 'A' | 'V' | 'W' | 'Ω' }> = ({
  comp,
  meterKind,
  onPinPointerDown,
  onPinHover,
  hoveredPinId,
}) => {
  let pins: PinDef[] = [];

  if (meterKind === 'W') {
    // 4 pins: Current coil I+, I- (horizontal) and Voltage coil U+, U- (vertical)
    pins = [
      { id: 'I+', label: 'I+*', dx: -2, dy: 0, polarity: '+' },
      { id: 'I-', label: 'I−', dx: 2, dy: 0, polarity: '-' },
      { id: 'U+', label: 'U+*', dx: 0, dy: -2, polarity: '+' },
      { id: 'U-', label: 'U−', dx: 0, dy: 2, polarity: '-' },
    ];
  } else if (meterKind === 'Ω') {
    // 2 pins: 1 and 2 without pin labels
    pins = [
      { id: '1', label: '', dx: -2, dy: 0 },
      { id: '2', label: '', dx: 2, dy: 0 },
    ];
  } else {
    // A and V: pos and neg without pin labels at the terminals
    pins = [
      { id: 'pos', label: '', dx: -2, dy: 0, polarity: '+' },
      { id: 'neg', label: '', dx: 2, dy: 0, polarity: '-' },
    ];
  }

  return (
    <g>
      <circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <UprightText
        x={0}
        y={0}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={16}
        fontWeight={900}
        fill="#4169E1"
      >
        {meterKind}
      </UprightText>

      {/* Horizontal leads (All meters) */}
      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* Vertical leads for Wattmeter U+, U- */}
      {meterKind === 'W' && (
        <>
          <line x1={0} y1={-40} x2={0} y2={-18} stroke="#000" strokeWidth={2} />
          <line x1={0} y1={18} x2={0} y2={40} stroke="#000" strokeWidth={2} />

          {/* Asterisks (*) on I+ and U+ terminals */}
          <UprightText x={-26} y={-8} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} fontSize={14} fontWeight={900} fill="#E5322D">
            *
          </UprightText>
          <UprightText x={8} y={-26} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} fontSize={14} fontWeight={900} fill="#E5322D">
            *
          </UprightText>
        </>
      )}

      {/* Explicit Polarity signs '+' and '−' for A and V */}
      {(meterKind === 'A' || meterKind === 'V') && (
        <>
          <UprightText x={-26} y={-8} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} fontSize={11} fontWeight={900} fill="#E5322D">
            +
          </UprightText>
          <UprightText x={26} y={-8} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} fontSize={12} fontWeight={900} fill="#000000">
            −
          </UprightText>
        </>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={24} />
    </g>
  );
};

// 14. THIẾT BỊ ĐIỆN KHÁC (BẾP, ĐIỀU HÒA, TỦ LẠNH, NỒI CƠM... - 2 chân A và O, tùy chọn chân PE)
export const GenericApplianceSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const hasPE = Boolean(comp.props.hasPE);
  const leakToCase = Boolean(comp.props.leakToCase);
  const pins: PinDef[] = hasPE
    ? [
        { id: 'A', label: 'A', dx: -2, dy: -1 },
        { id: 'O', label: 'O', dx: -2, dy: 1 },
        { id: 'PE', label: 'PE', dx: 2, dy: 0, polarity: 'PE' },
      ]
    : [
        { id: 'A', label: 'A', dx: -2, dy: -1 },
        { id: 'O', label: 'O', dx: -2, dy: 1 },
      ];

  const appLabel = comp.props.applianceType === 'ac' ? 'ĐH' : comp.props.applianceType === 'cooker' ? 'BẾP' : comp.props.applianceType === 'water_heater' ? 'NL' : 'M';

  return (
    <g>
      <rect x={-26} y={-24} width={52} height={48} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <circle cx={0} cy={0} r={14} fill="#EEF2FF" stroke="#000" strokeWidth={1.5} />
      <UprightText
        x={0}
        y={0}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={10}
        fontWeight={900}
        fill="#4169E1"
      >
        {appLabel}
      </UprightText>

      <line x1={-40} y1={-20} x2={-26} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-26} y2={20} stroke="#000" strokeWidth={2} />

      {/* PE lead on right side if hasPE */}
      {hasPE && (
        <line x1={26} y1={0} x2={40} y2={0} stroke="#10B981" strokeWidth={2} strokeDasharray="3 2" />
      )}

      {/* Case leakage warning badge */}
      {leakToCase && (
        <g transform="translate(0, -32)">
          <rect x={-24} y={-7} width={48} height={14} rx={3} fill="#FEF2F2" stroke="#EF4444" strokeWidth={1.5} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="900" fill="#DC2626">
            RÒ VỎ !
          </text>
        </g>
      )}

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-30} />
    </g>
  );
};

// 15. CỌC TIẾP ĐỊA (NỐI ĐẤT - 1 nét thẳng đứng đi xuống, 3 nét ngang giảm dần độ dài)
export const EarthGroundSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [{ id: 'pe', label: 'PE', dx: 0, dy: -1, polarity: 'PE' }];
  const rDat = comp.props.resistance ?? 4;

  return (
    <g>
      {/* Vertical connection line down from pin (0, -20) to ground surface (0, 0) */}
      <line x1={0} y1={-20} x2={0} y2={0} stroke="#10B981" strokeWidth={2.5} />
      {/* 3 horizontal plates of decreasing width */}
      <line x1={-16} y1={0} x2={16} y2={0} stroke="#059669" strokeWidth={2.5} />
      <line x1={-10} y1={6} x2={10} y2={6} stroke="#059669" strokeWidth={2.5} />
      <line x1={-4} y1={12} x2={4} y2={12} stroke="#059669" strokeWidth={2.5} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label="" valueStr={`${rDat} Ω`} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-26} />
    </g>
  );
};


// 15. LED DUY NHẤT (TCVN: DIODE + 2 MŨI TÊN + TÔ MÀU THEO THUỘC TÍNH)
export const LEDSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const isSimulating = useWorkspaceStore(s => s.isSimulating);
  const kinetics = useWorkspaceStore(s => s.simulationSnapshot?.componentKinetics[comp.id]);

  const pins: PinDef[] = [
    { id: 'A', label: 'A', dx: -2, dy: 0, polarity: '+' },
    { id: 'K', label: 'K', dx: 2, dy: 0, polarity: '-' },
  ];

  const colorHexMap: Record<string, string> = {
    red: '#E5322D',
    yellow: '#FFD84D',
    green: '#2DB84D',
    blue: '#4169E1',
    white: '#FFFFFF',
    orange: '#FF8800',
  };
  const baseColor = colorHexMap[comp.props.color || 'red'] || '#E5322D';
  const brightness = isSimulating && kinetics ? (kinetics.brightness ?? 0) : (comp.props.isOn ? 1.0 : 0);
  const isLit = brightness > 0;
  const fillColor = comp.damaged ? 'rgba(220, 38, 38, 0.3)' : isLit ? baseColor : '#F3F4F6';
  const strokeColor = comp.damaged ? '#B71C1C' : '#000000';
  const glowBlur = Math.round(brightness * 12);

  return (
    <g>
      <polygon
        points="-8,-12 -8,12 8,0"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        style={isLit && !comp.damaged ? { filter: `drop-shadow(0 0 ${glowBlur}px ${baseColor})` } : undefined}
      />
      <line x1={8} y1={-12} x2={8} y2={12} stroke="#000000" strokeWidth={2.5} />
      <line x1={-40} y1={0} x2={-8} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={8} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* TCVN Emission arrows */}
      <line x1={-2} y1={-12} x2={6} y2={-22} stroke={isLit ? baseColor : '#000'} strokeWidth={isLit ? 2 : 1.5} />
      <polygon points="6,-22 2,-20 4,-16" fill={isLit ? baseColor : '#000'} />
      <line x1={6} y1={-8} x2={14} y2={-18} stroke={isLit ? baseColor : '#000'} strokeWidth={isLit ? 2 : 1.5} />
      <polygon points="14,-18 10,-16 12,-12" fill={isLit ? baseColor : '#000'} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels
        label={comp.label}
        valueStr={comp.damaged ? 'ĐÃ CHÁY' : isLit ? `Sáng ${(brightness * 100).toFixed(0)}%` : `LED ${comp.props.color || 'đỏ'}`}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        yOffset={-26}
      />
    </g>
  );
};

// 16. ĐIỆN TRỞ TCVN (HÌNH CHỮ NHẬT)
export const ResistorSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];

  return (
    <g>
      <rect x={-20} y={-8} width={40} height={16} fill={comp.damaged ? 'rgba(220, 38, 38, 0.3)' : '#FFFFFF'} stroke={comp.damaged ? '#B71C1C' : '#000000'} strokeWidth={2} />
      <line x1={-40} y1={0} x2={-20} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels
        label={comp.label}
        valueStr={comp.props.resistance >= 1000 ? `${(comp.props.resistance / 1000).toFixed(1)}kΩ` : `${comp.props.resistance || 100}Ω`}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        yOffset={-14}
      />
    </g>
  );
};

// 17. NGUỒN DC, GND, TRANSISTOR, BIẾN TRỞ, TỤ ĐIỆN, NÚT NHẤN (giữ nguyên chuẩn)
export const DCSourceSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'pos', label: '+', dx: 0, dy: -2, polarity: '+' },
    { id: 'neg', label: '−', dx: 0, dy: 2, polarity: '-' },
  ];
  return (
    <g>
      <line x1={-18} y1={-8} x2={18} y2={-8} stroke="#000000" strokeWidth={2.5} />
      <line x1={-10} y1={8} x2={10} y2={8} stroke="#000000" strokeWidth={4} />
      <line x1={0} y1={-8} x2={0} y2={-40} stroke="#000" strokeWidth={2} />
      <line x1={0} y1={8} x2={0} y2={40} stroke="#000" strokeWidth={2} />
      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr={`${comp.props.voltage || 9}V DC`} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-46} />
    </g>
  );
};

export const GroundSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [{ id: 'gnd', label: '', dx: 0, dy: -1 }];
  return (
    <g>
      <line x1={0} y1={-20} x2={0} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={-16} y1={0} x2={16} y2={0} stroke="#000" strokeWidth={2.5} />
      <line x1={-10} y1={6} x2={10} y2={6} stroke="#000" strokeWidth={2.5} />
      <line x1={-4} y1={12} x2={4} y2={12} stroke="#000" strokeWidth={2.5} />
      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label || 'GND'} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-26} />
    </g>
  );
};

export const PushButtonSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];
  const isPressed = comp.props.state ?? false;
  return (
    <g>
      <circle cx={-16} cy={0} r={3} fill="#FFF" stroke="#000" strokeWidth={2} />
      <circle cx={16} cy={0} r={3} fill="#FFF" stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={0} x2={-19} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={19} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={-18} y1={isPressed ? 0 : -8} x2={18} y2={isPressed ? 0 : -8} stroke="#000" strokeWidth={3} />
      <line x1={0} y1={isPressed ? 0 : -8} x2={0} y2={isPressed ? -10 : -18} stroke="#000" strokeWidth={2} />
      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
      <SymbolLabels label={comp.label} valueStr={isPressed ? 'ĐANG NHẤN' : 'NHẤN NHẢ'} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 18. NGUỒN DƯƠNG VCC (CHO MẠCH ĐIỆN TỬ CƠ BẢN)
export const VCCSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [{ id: 'vcc', label: '', dx: 0, dy: 1, polarity: '+' }];
  return (
    <g>
      {/* Downward connecting line to pin (0, 20) */}
      <line x1={0} y1={20} x2={0} y2={-2} stroke="#000000" strokeWidth={2} />
      {/* Upward pointing triangle arrow */}
      <polygon points="0,-16 -7,-4 7,-4" fill="#E5322D" stroke="#000000" strokeWidth={1.5} />
      <UprightText
        x={0}
        y={-22}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={11}
        fontWeight={900}
        fill="#E5322D"
      >
        {comp.props.voltage ? `+${comp.props.voltage}V` : '+VCC'}
      </UprightText>
      {pins.map(p => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
    </g>
  );
};

// 19. KHUNG BAO VÙNG (ĐƯỜNG NÉT ĐỨT MẢNH - PHÂN CHIA VÙNG BÊN TRONG NHÀ / TỦ ĐIỆN)
// Cả border và title đều có thể xoay, và khi lật không bị lộn chữ ngược
export const BoundarySymbol: React.FC<SymbolProps> = ({ comp, isSelected }) => {
  const w = comp.props.width || 240;
  const h = comp.props.height || 160;
  const title = comp.props.title || 'BÊN TRONG NHÀ';
  const titlePos = comp.props.titlePos || 'top'; // 'top' | 'bottom' | 'none'
  const titleY = titlePos === 'bottom' ? h / 2 + 14 : -h / 2 - 8;

  return (
    <g className="select-none">
      {/* Dashed thin boundary rectangle enclosing the components */}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        fill="rgba(65, 105, 225, 0.02)"
        stroke="#000000"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        style={isSelected ? { stroke: '#4169E1', strokeWidth: 2 } : undefined}
      />
      {/* Boundary Title Text (keeps upright & readable) */}
      {titlePos !== 'none' && title && (
        <UprightText
          x={0}
          y={titleY}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          fontSize={12}
          fontWeight={900}
          fill="#1E293B"
        >
          {title}
        </UprightText>
      )}
    </g>
  );
};

// 20. GHI CHÚ CHỮ (TEXT NOTE / TEXTBOX - XOAY ĐƯỢC, KHÔNG BỊ LẬT NGƯỢC CHỮ)
export const TextBoxSymbol: React.FC<SymbolProps> = ({ comp, isSelected }) => {
  const text = comp.props.text || 'Ghi chú...';
  const fontSize = comp.props.fontSize || 13;
  const showBorder = comp.props.showBorder ?? false;
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.35;
  const totalH = lines.length * lineHeight;
  const maxLineLen = Math.max(...lines.map((l: string) => l.length), 4);
  const approxW = maxLineLen * (fontSize * 0.6) + 16;
  const boxH = Math.max(totalH + 12, 28);
  const flipX = comp.flip ? -1 : 1;
  const flipYVal = comp.flipY ? -1 : 1;

  return (
    <g
      className="select-none"
      transform={`scale(${flipX}, ${flipYVal})`}
    >
      {/* Optional dashed outline around note box */}
      {(showBorder || isSelected) && (
        <rect
          x={-approxW / 2}
          y={-boxH / 2}
          width={approxW}
          height={boxH}
          fill="rgba(255, 255, 255, 0.85)"
          stroke="#000000"
          strokeWidth={1}
          strokeDasharray={showBorder ? '3 2' : '2 2'}
        />
      )}
      {/* Note Text: Multiple lines supported */}
      <text
        x={0}
        y={-(lines.length - 1) * lineHeight * 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="800"
        fill="#111827"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      >
        {lines.map((line: string, idx: number) => (
          <tspan key={idx} x={0} dy={idx === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// ----------------------------------------------------
// MÔ-ĐUN CẢM BIẾN (sensor_module)
// Chân: VCC, GND (trái), DO, AO (phải)
// ----------------------------------------------------
export const SensorModuleSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const { simulationSnapshot } = useWorkspaceStore();
  const kinetics = simulationSnapshot?.componentKinetics?.[comp.id];
  const isDoHigh = Boolean(kinetics?.isOperating ?? comp.props._doHigh);

  const sensorType = comp.props.sensorType || 'light';
  const labelText =
    sensorType === 'temperature' ? 'NHIỆT ĐỘ' : sensorType === 'humidity' ? 'ĐỘ ẨM' : 'ÁNH SÁNG';

  const pins: PinDef[] = [
    { id: 'vcc', label: 'VCC', dx: -2, dy: -1, polarity: '+' },
    { id: 'gnd', label: 'GND', dx: -2, dy: 1, polarity: '-' },
    { id: 'do', label: 'DO', dx: 2, dy: -1 },
    { id: 'ao', label: 'AO', dx: 2, dy: 1 },
  ];

  return (
    <g>
      {/* Thân mô-đun chữ nhật */}
      <rect
        x={-28}
        y={-24}
        width={56}
        height={48}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={2}
        rx={2}
      />

      {/* Header bar */}
      <rect
        x={-28}
        y={-24}
        width={56}
        height={11}
        fill="#EEF2FF"
        stroke="#000000"
        strokeWidth={1}
      />
      <UprightText
        x={0}
        y={-18.5}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={7.5}
        fontWeight={900}
        fill="#4F46E5"
      >
        MÔ-ĐUN CẢM BIẾN
      </UprightText>

      {/* Tên loại cảm biến ở giữa */}
      <UprightText
        x={0}
        y={-2}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={10}
        fontWeight={900}
        fill="#000000"
      >
        {labelText}
      </UprightText>

      {/* Đèn LED chỉ báo mức logic DO */}
      <circle
        cx={18}
        cy={-14}
        r={3}
        fill={isDoHigh ? '#EF4444' : '#D1D5DB'}
        stroke="#000000"
        strokeWidth={1}
      />
      {isDoHigh && (
        <circle cx={18} cy={-14} r={5} fill="none" stroke="#EF4444" strokeWidth={1} opacity={0.6} />
      )}

      {/* Lines nối chân ra mép */}
      <line x1={-40} y1={-20} x2={-28} y2={-20} stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-28} y2={20} stroke="#000000" strokeWidth={2} />
      <line x1={28} y1={-20} x2={40} y2={-20} stroke="#000000" strokeWidth={2} />
      <line x1={28} y1={20} x2={40} y2={20} stroke="#000000" strokeWidth={2} />

      {pins.map((p) => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
    </g>
  );
};

// ----------------------------------------------------
// MÔ-ĐUN RƠ LE 1 KÊNH (relay_module_1ch)
// Chân: VCC, GND, IN (trái), NO, COM, NC (phải)
// ----------------------------------------------------
export const RelayModuleSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const { simulationSnapshot } = useWorkspaceStore();
  const kinetics = simulationSnapshot?.componentKinetics?.[comp.id];
  const isEnergized = Boolean(kinetics?.isOperating ?? comp.props._isEnergized);

  const pins: PinDef[] = [
    { id: 'vcc', label: 'VCC', dx: -2.5, dy: -1.2, polarity: '+' },
    { id: 'gnd', label: 'GND', dx: -2.5, dy: 0, polarity: '-' },
    { id: 'in', label: 'IN', dx: -2.5, dy: 1.2 },
    { id: 'no', label: 'NO', dx: 2.5, dy: -1.2 },
    { id: 'com', label: 'COM', dx: 2.5, dy: 0 },
    { id: 'nc', label: 'NC', dx: 2.5, dy: 1.2 },
  ];

  return (
    <g>
      {/* Khung rơ le chữ nhật */}
      <rect
        x={-34}
        y={-28}
        width={68}
        height={56}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={2}
        rx={3}
      />

      {/* Header bar */}
      <rect
        x={-34}
        y={-28}
        width={68}
        height={11}
        fill="#FEF3C7"
        stroke="#000000"
        strokeWidth={1}
      />
      <UprightText
        x={0}
        y={-22.5}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={7.5}
        fontWeight={900}
        fill="#B45309"
      >
        MÔ-ĐUN RƠ LE 1 KÊNH
      </UprightText>

      {/* Đèn LED trạng thái hút (Xanh khi hút, xám khi nhả) */}
      <circle
        cx={-18}
        cy={-14}
        r={3}
        fill={isEnergized ? '#10B981' : '#D1D5DB'}
        stroke="#000000"
        strokeWidth={1}
      />
      {isEnergized && (
        <circle cx={-18} cy={-14} r={5} fill="none" stroke="#10B981" strokeWidth={1} opacity={0.6} />
      )}
      <UprightText
        x={-8}
        y={-14}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={7}
        fontWeight={800}
        fill={isEnergized ? '#059669' : '#6B7280'}
      >
        {isEnergized ? 'HÚT' : 'NHẢ'}
      </UprightText>

      {/* Sơ đồ tiếp điểm giữa COM, NO, NC */}
      {/* Điểm COM */}
      <circle cx={14} cy={0} r={2} fill="#000" />
      {/* Điểm NO */}
      <circle cx={22} cy={-16} r={2} fill="#000" />
      {/* Điểm NC */}
      <circle cx={22} cy={16} r={2} fill="#000" />
      {/* Lưỡi dao tiếp điểm: từ COM (14, 0) sang NO (22, -14) nếu hút, sang NC (22, 14) nếu nhả */}
      <line
        x1={14}
        y1={0}
        x2={isEnergized ? 21 : 21}
        y2={isEnergized ? -14 : 14}
        stroke={isEnergized ? '#059669' : '#000000'}
        strokeWidth={2}
      />

      {/* Cuộn dây rơ le kí hiệu hộp nhỏ bên trái */}
      <rect x={-18} y={-4} width={12} height={16} fill="#F3F4F6" stroke="#000" strokeWidth={1} />
      <line x1={-18} y1={-4} x2={-6} y2={12} stroke="#000" strokeWidth={1} />

      {/* Dây nối chân ra mép */}
      {/* Trái: VCC (-50, -24), GND (-50, 0), IN (-50, 24) */}
      <line x1={-50} y1={-24} x2={-34} y2={-24} stroke="#000000" strokeWidth={2} />
      <line x1={-50} y1={0} x2={-34} y2={0} stroke="#000000" strokeWidth={2} />
      <line x1={-50} y1={24} x2={-34} y2={24} stroke="#000000" strokeWidth={2} />
      {/* Phải: NO (50, -24), COM (50, 0), NC (50, 24) */}
      <line x1={34} y1={-24} x2={50} y2={-24} stroke="#000000" strokeWidth={2} />
      <line x1={34} y1={0} x2={50} y2={0} stroke="#000000" strokeWidth={2} />
      <line x1={34} y1={24} x2={50} y2={24} stroke="#000000" strokeWidth={2} />

      {pins.map((p) => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
    </g>
  );
};

// ----------------------------------------------------
// ĐÈN NHỎ DC (lamp_dc)
// 2 chân: 1 và 2 (dx: -1.5, dy: 0; dx: 1.5, dy: 0)
// ----------------------------------------------------
export const LampDCSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const { simulationSnapshot } = useWorkspaceStore();
  const kinetics = simulationSnapshot?.componentKinetics?.[comp.id];
  const isOperating = kinetics?.isOperating ?? false;
  const brightness = kinetics?.brightness ?? (isOperating ? 1 : 0);

  const pins: PinDef[] = [
    { id: '1', label: '', dx: -1.5, dy: 0 },
    { id: '2', label: '', dx: 1.5, dy: 0 },
  ];

  const bulbFill = isOperating
    ? `rgba(251, 191, 36, ${0.4 + 0.6 * brightness})`
    : '#FFFFFF';
  const glowRadius = isOperating ? 18 + brightness * 6 : 0;

  return (
    <g>
      {/* Glow effect when lit */}
      {isOperating && (
        <circle cx={0} cy={0} r={glowRadius} fill="rgba(253, 224, 71, 0.35)" pointerEvents="none" />
      )}

      {/* Bóng đèn tròn */}
      <circle
        cx={0}
        cy={0}
        r={14}
        fill={bulbFill}
        stroke="#000000"
        strokeWidth={2}
      />

      {/* Dây tóc chữ X */}
      <line x1={-9} y1={-9} x2={9} y2={9} stroke="#000000" strokeWidth={2} />
      <line x1={-9} y1={9} x2={9} y2={-9} stroke="#000000" strokeWidth={2} />

      {/* Text 5V */}
      <UprightText
        x={0}
        y={-19}
        rot={comp.rot}
        flip={comp.flip}
        flipY={comp.flipY}
        fontSize={8}
        fontWeight={800}
        fill="#4B5563"
      >
        5V
      </UprightText>

      {/* Dây ra 2 chân */}
      <line x1={-30} y1={0} x2={-14} y2={0} stroke="#000000" strokeWidth={2} />
      <line x1={14} y1={0} x2={30} y2={0} stroke="#000000" strokeWidth={2} />

      {pins.map((p) => (
        <PinDot
          key={p.id}
          pin={p}
          rot={comp.rot}
          flip={comp.flip}
          flipY={comp.flipY}
          onPointerDown={onPinPointerDown}
          onHover={onPinHover}
          isHovered={hoveredPinId === p.id}
        />
      ))}
    </g>
  );
};

export {
  PotentiometerSymbol,
  CapacitorCeramicSymbol,
  CapacitorElectrolyticSymbol,
  DiodeSymbol,
  TransistorNPNSymbol,
  TransistorPNPSymbol,
} from './CircuitSymbolsLegacy';

