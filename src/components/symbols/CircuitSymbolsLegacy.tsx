import React from 'react';
import { SymbolProps, PinDef } from '../../core/model';
import { PinDot, SymbolLabels } from './CircuitSymbols';

export const PotentiometerSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '1', dx: -2, dy: 0 },
    { id: '2', label: 'W', dx: 0, dy: 2 },
    { id: '3', label: '3', dx: 2, dy: 0 },
  ];
  return (
    <g>
      <rect x={-20} y={-8} width={40} height={16} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <line x1={-40} y1={0} x2={-20} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={20} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={0} y1={40} x2={0} y2={12} stroke="#000" strokeWidth={2} />
      <polygon points="0,8 -5,14 5,14" fill="#000000" />
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr={`${(comp.props.resistance || 10000) / 1000}kΩ`} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-14} />
    </g>
  );
};

export const CapacitorCeramicSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: '1', label: '', dx: -2, dy: 0 },
    { id: '2', label: '', dx: 2, dy: 0 },
  ];
  return (
    <g>
      <line x1={-5} y1={-16} x2={-5} y2={16} stroke="#000000" strokeWidth={2.5} />
      <line x1={5} y1={-16} x2={5} y2={16} stroke="#000000" strokeWidth={2.5} />
      <line x1={-40} y1={0} x2={-5} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={5} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr={`${comp.props.capacitance || 100}nF`} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-22} />
    </g>
  );
};

export const CapacitorElectrolyticSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'pos', label: '+', dx: -2, dy: 0, polarity: '+' },
    { id: 'neg', label: '−', dx: 2, dy: 0, polarity: '-' },
  ];
  return (
    <g>
      {/* Flat positive plate on left */}
      <line x1={-6} y1={-16} x2={-6} y2={16} stroke="#000000" strokeWidth={3} />
      {/* Curved negative plate with concave side reversed */}
      <path d="M 10 -16 Q 4 0 10 16" fill="none" stroke="#000000" strokeWidth={2.5} />
      <line x1={-40} y1={0} x2={-6} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={4} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      <text x={-16} y={-10} fontSize="12" fontWeight="900" fill="#E5322D">+</text>
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-22} />
    </g>
  );
};

export const DiodeSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'A', label: 'A', dx: -2, dy: 0, polarity: '+' },
    { id: 'K', label: 'K', dx: 2, dy: 0, polarity: '-' },
  ];
  return (
    <g>
      <polygon points="-8,-12 -8,12 8,0" fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <line x1={8} y1={-12} x2={8} y2={12} stroke="#000000" strokeWidth={2.5} />
      <line x1={-40} y1={0} x2={-8} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={8} y1={0} x2={40} y2={0} stroke="#000" strokeWidth={2} />
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="1N4007" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-18} />
    </g>
  );
};

export const TransistorNPNSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'B', label: 'B', dx: -2, dy: 0, polarity: 'B' },
    { id: 'C', label: 'C', dx: 1, dy: -2, polarity: 'C' },
    { id: 'E', label: 'E', dx: 1, dy: 2, polarity: 'E' },
  ];
  return (
    <g>
      <circle cx={0} cy={0} r={22} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <line x1={-8} y1={-14} x2={-8} y2={14} stroke="#000000" strokeWidth={3} />
      <line x1={-40} y1={0} x2={-8} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={-7} x2={12} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={12} y1={-20} x2={20} y2={-40} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={7} x2={12} y2={20} stroke="#000" strokeWidth={2} />
      <line x1={12} y1={20} x2={20} y2={40} stroke="#000" strokeWidth={2} />
      <polygon points="12,20 4,16 6,11" fill="#000000" />
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="NPN" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-28} />
    </g>
  );
};

export const TransistorPNPSymbol: React.FC<SymbolProps> = ({ comp, onPinPointerDown, onPinHover, hoveredPinId }) => {
  const pins: PinDef[] = [
    { id: 'B', label: 'B', dx: -2, dy: 0, polarity: 'B' },
    { id: 'C', label: 'C', dx: 1, dy: 2, polarity: 'C' },
    { id: 'E', label: 'E', dx: 1, dy: -2, polarity: 'E' },
  ];
  return (
    <g>
      <circle cx={0} cy={0} r={22} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
      <line x1={-8} y1={-14} x2={-8} y2={14} stroke="#000000" strokeWidth={3} />
      <line x1={-40} y1={0} x2={-8} y2={0} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={7} x2={12} y2={20} stroke="#000" strokeWidth={2} />
      <line x1={12} y1={20} x2={20} y2={40} stroke="#000" strokeWidth={2} />
      <line x1={-8} y1={-7} x2={12} y2={-20} stroke="#000" strokeWidth={2} />
      <line x1={12} y1={-20} x2={20} y2={-40} stroke="#000" strokeWidth={2} />
      <polygon points="-8,-7 -1,-4 1,-9" fill="#000000" />
      {pins.map(p => (
        <PinDot key={p.id} pin={p} onPointerDown={onPinPointerDown} onHover={onPinHover} isHovered={hoveredPinId === p.id} />
      ))}
      <SymbolLabels label={comp.label} valueStr="PNP" rot={comp.rot} flip={comp.flip} flipY={comp.flipY} yOffset={-28} />
    </g>
  );
};
