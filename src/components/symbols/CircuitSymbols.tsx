import React from 'react';
import { SymbolProps, PinDef } from '../../core/model';

// Pin dot renderer
export const PinDot: React.FC<{
  pin: PinDef;
  onPointerDown?: (pinId: string, e: React.PointerEvent) => void;
  onHover?: (pinId: string | null) => void;
  isHovered?: boolean;
}> = ({ pin, onPointerDown, onHover, isHovered }) => {
  const cx = pin.dx * 20;
  const cy = pin.dy * 20;

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
        <text
          x={cx}
          y={cy > 0 ? cy + 12 : cy - 6}
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#333333"
          pointerEvents="none"
        >
          {pin.label}
        </text>
      )}
    </g>
  );
};

// Label renderer that counter-rotates so text is ALWAYS horizontal
// Displays ONLY the component reference symbol (e.g. Q1, R1, MCB, Đ1) without distracting verbose value labels
export const SymbolLabels: React.FC<{
  label: string;
  valueStr?: string;
  rot?: number;
  flip?: boolean;
  flipY?: boolean;
  yOffset?: number;
}> = ({ label, rot = 0, flip = false, flipY = false, yOffset = -22 }) => {
  if (!label) return null;
  const counterTransform = `scale(${flip ? -1 : 1}, ${flipY ? -1 : 1}) rotate(${-rot})`;

  return (
    <g transform={counterTransform} pointerEvents="none" className="select-none">
      <text
        x={0}
        y={yOffset}
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#000000"
      >
        {label}
      </text>
    </g>
  );
};

// 1. NGUỒN ĐIỆN XOAY CHIỀU (TCVN / SGK: 2 cực A - Pha, O - Trung tính trong khung nét chấm mảnh)
export const ACSourceSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
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
      <text x={-12} y={-16} textAnchor="end" fontSize="12" fontWeight="900" fill="#4169E1">
        O
      </text>
      <line x1={-4} y1={-20} x2={40} y2={-20} stroke="#000000" strokeWidth={2} />

      {/* Point A (Pha - L) */}
      <circle cx={-4} cy={20} r={4.5} fill="#E5322D" />
      <text x={-12} y={24} textAnchor="end" fontSize="12" fontWeight="900" fill="#E5322D">
        A
      </text>
      <line x1={-4} y1={20} x2={40} y2={20} stroke="#000000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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

  return (
    <g>
      {poleYOffsets.map((py, i) => (
        <g key={i} transform={`translate(0, ${py})`}>
          <rect x={-20} y={-7} width={40} height={14} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="3 CỰC" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-26} />
    </g>
  );
};

// 7. BÓNG ĐÈN CHIẾU SÁNG (TCVN 1622-75 & SGK: Vòng tròn dấu ×)
// 7. BÓNG ĐÈN CHIẾU SÁNG (TCVN 1622-75 & SGK: Vòng tròn dấu ×, sáng vàng rực khi hoạt động)
export const LampSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];
  const isActive = Boolean(comp.props.isOn || comp.props.state);

  return (
    <g>
      <circle
        cx={0}
        cy={0}
        r={18}
        fill={isActive ? '#FFD84D' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isActive ? { filter: 'drop-shadow(0 0 8px #FFD84D)' } : undefined}
      />
      {/* TCVN cross × */}
      <line x1={-12.7} y1={-12.7} x2={12.7} y2={12.7} stroke="#000" strokeWidth={2.5} />
      <line x1={-12.7} y1={12.7} x2={12.7} y2={-12.7} stroke="#000" strokeWidth={2.5} />

      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 8. ĐÈN HUỲNH QUANG (SGK Công nghệ 9, 12: Hình chữ nhật bo tròn có dấu × ở giữa, sáng xanh neon ngọc khi hoạt động)
export const FluorescentLampSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -3, dy: 0 },
    { id: '2', label: '', dx: 3, dy: 0 },
  ];
  const isActive = Boolean(comp.props.isOn || comp.props.state);

  return (
    <g>
      {/* Elongated tube with rounded ends */}
      <rect
        x={-40}
        y={-10}
        width={80}
        height={20}
        rx={10}
        fill={isActive ? '#A5F3FC' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isActive ? { filter: 'drop-shadow(0 0 10px #22D3EE)' } : undefined}
      />
      {/* Center cross mark */}
      <line x1={-8} y1={-8} x2={8} y2={8} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={8} x2={8} y2={-8} stroke="#000" strokeWidth={2} />

      <line x1={-60} y1={0} x2={-40} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={40} y1={0} x2={60} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-16} />
    </g>
  );
};

// 9. QUẠT TRẦN (TCVN 1619-75 & SGK: Hình cánh quạt 2 tam giác đối đỉnh có tâm tròn, 2 chân không phân cực, sáng màu xanh khi quay)
export const CeilingFanSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];
  const isActive = Boolean(comp.props.isOn || comp.props.state);

  return (
    <g>
      {/* 2 bow-tie triangles touching at center */}
      <polygon
        points="-30,-12 0,0 -30,12"
        fill={isActive ? '#34D399' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isActive ? { filter: 'drop-shadow(0 0 8px #10B981)' } : undefined}
      />
      <polygon
        points="30,-12 0,0 30,12"
        fill={isActive ? '#34D399' : '#FFFFFF'}
        stroke="#000000"
        strokeWidth={2}
        style={isActive ? { filter: 'drop-shadow(0 0 8px #10B981)' } : undefined}
      />
      {/* Center rotor dot */}
      <circle
        cx={0}
        cy={0}
        r={4.5}
        fill={isActive ? '#E5322D' : '#4169E1'}
        stroke="#000"
        strokeWidth={1.5}
      />

      <line x1={-40} y1={0} x2={-30} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={30} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-18} />
    </g>
  );
};

// 10. CHUÔNG ĐIỆN (SGK: Vòm chuông úp, đáy phẳng có 2 chân)
export const ElectricBellSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -1, dy: 2 },
    { id: '2', label: '', dx: 1, dy: 2 },
  ];

  return (
    <g>
      {/* Bell dome */}
      <path d="M -18 10 A 18 18 0 0 1 18 10 Z" fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      {/* Top hanger handle */}
      <path d="M -6 -8 L -6 -14 L 6 -14 L 6 -8" fill="none" stroke="#000" strokeWidth={2} />

      {/* Leads from bottom */}
      <line x1={-20} y1={10} x2={-20} y2={40} stroke="#000" strokeWidth={2} />
      <line x1={20} y1={10} x2={20} y2={40} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="Chuông 220V" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-20} />
    </g>
  );
};

// 11. Ổ LẤY ĐIỆN (Ổ CẮM - TCVN & SGK: Vòng tròn có 2 lỗ cắm)
export const SocketSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'A', label: 'A', dx: -2, dy: 0 },
    { id: 'O', label: 'O', dx: 2, dy: 0 },
    { id: 'PE', label: 'PE', dx: 0, dy: 2 },
  ];

  return (
    <g>
      <circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <circle cx={-6} cy={0} r={2.5} fill="#000" />
      <circle cx={6} cy={0} r={2.5} fill="#000" />

      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={0} y1={18} x2={0} y2={40} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="Ổ cắm" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
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
      <text x={0} y={5} textAnchor="middle" fontSize="13" fontWeight="900" fill="#000">
        kWh
      </text>

      <line x1={-40} y1={-20} x2={-26} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={26} y1={-20} x2={40} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-26} y2={20} stroke="#000" strokeWidth={2} />
      <line x1={26} y1={20} x2={40} y2={20} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
  const pins: PinDef[] = [
    { id: 'pos', label: '+', dx: -2, dy: 0, polarity: '+' },
    { id: 'neg', label: '−', dx: 2, dy: 0, polarity: '-' },
  ];

  return (
    <g>
      <circle cx={0} cy={0} r={18} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <text x={0} y={6} textAnchor="middle" fontSize="16" fontWeight="900" fill="#4169E1">
        {meterKind}
      </text>
      <line x1={-40} y1={0} x2={-18} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={18} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-24} />
    </g>
  );
};

// 14. THIẾT BỊ ĐIỆN KHÁC (BẾP, ĐIỀU HÒA, TỦ LẠNH, NỒI CƠM... - 2 chân A và O)
export const GenericApplianceSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'A', label: 'A', dx: -2, dy: -1 },
    { id: 'O', label: 'O', dx: -2, dy: 1 },
  ];

  return (
    <g>
      <rect x={-26} y={-24} width={52} height={48} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <circle cx={0} cy={0} r={14} fill="#EEF2FF" stroke="#000" strokeWidth={1.5} />
      <text x={0} y={4} textAnchor="middle" fontSize="10" fontWeight="900" fill="#4169E1">
        {comp.props.applianceType === 'ac' ? 'ĐH' : comp.props.applianceType === 'cooker' ? 'BẾP' : 'M'}
      </text>

      <line x1={-40} y1={-20} x2={-26} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={-40} y1={20} x2={-26} y2={20} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-30} />
    </g>
  );
};

// 15. LED DUY NHẤT (TCVN: DIODE + 2 MŨI TÊN + TÔ MÀU THEO THUỘC TÍNH)
export const LEDSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
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
  const fillColor = comp.damaged ? '#333333' : (colorHexMap[comp.props.color || 'red'] || '#E5322D');

  return (
    <g>
      <polygon points="-8,-12 -8,12 8,0" fill={fillColor} stroke="#000000" strokeWidth={2} />
      <line x1={8} y1={-12} x2={8} y2={12} stroke="#000000" strokeWidth={2.5} />
      <line x1={-40} y1={0} x2={-8} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={8} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {/* TCVN Emission arrows */}
      <line x1={-2} y1={-12} x2={6} y2={-22} stroke="#000" strokeWidth={1.5} />
      <polygon points="6,-22 2,-20 4,-16" fill="#000" />
      <line x1={6} y1={-8} x2={14} y2={-18} stroke="#000" strokeWidth={1.5} />
      <polygon points="14,-18 10,-16 12,-12" fill="#000" />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr={comp.damaged ? 'ĐÃ CHÁY' : `LED ${comp.props.color || 'đỏ'}`} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-26} />
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
      <rect x={-20} y={-8} width={40} height={16} fill={comp.damaged ? '#333333' : '#FFFFFF'} stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={0} x2={-20} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />

      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
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
      <text x={0} y={-22} textAnchor="middle" fontSize="11" fontWeight="900" fill="#E5322D">
        {comp.props.voltage ? `+${comp.props.voltage}V` : '+VCC'}
      </text>
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label || 'VCC'} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={14} />
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

