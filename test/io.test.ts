import { describe, it, expect } from 'vitest';
import { validateCircuitJson } from '../src/core/io';

describe('Import / Export Validator', () => {
  it('rejects invalid JSON syntax', () => {
    const res = validateCircuitJson('not a json string');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('không phải là JSON hợp lệ');
  });

  it('rejects JSON without app signature', () => {
    const invalidApp = JSON.stringify({ app: 'other-app', schema: 1 });
    const res = validateCircuitJson(invalidApp);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('không thuộc ứng dụng Mạch điện – Điện tử');
  });

  it('rejects wire pointing to non-existent component', () => {
    const badWireJson = JSON.stringify({
      app: 'cn-dien',
      schema: 1,
      slug: 'mang-dien-trong-nha',
      title: 'Mạch thử nghiệm',
      state: {
        components: [
          { id: 'c1', type: 'resistor', x: 0, y: 0, rot: 0, flip: false, props: {} }
        ],
        wires: [
          {
            id: 'w1',
            from: { compId: 'c1', pinId: 'p1' },
            to: { compId: 'c_ghost', pinId: 'p2' }, // Ghost component
            points: [],
            color: 'red',
            crossSection: 1.5,
          }
        ],
        junctions: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });

    const res = validateCircuitJson(badWireJson);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('không tồn tại');
  });

  it('accepts valid circuit package', () => {
    const validJson = JSON.stringify({
      app: 'cn-dien',
      schema: 1,
      slug: 'mang-dien-trong-nha',
      title: 'Mạch chuẩn',
      state: {
        components: [
          { id: 'c1', type: 'resistor', x: 20, y: 40, rot: 0, flip: false, props: {} },
          { id: 'c2', type: 'lamp_incandescent', x: 100, y: 40, rot: 0, flip: false, props: {} }
        ],
        wires: [
          {
            id: 'w1',
            from: { compId: 'c1', pinId: 'p1' },
            to: { compId: 'c2', pinId: 'p1' },
            points: [],
            color: 'red',
            crossSection: 1.5,
          }
        ],
        junctions: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });

    const res = validateCircuitJson(validJson);
    expect(res.valid).toBe(true);
    expect(res.targetSlug).toBe('mang-dien-trong-nha');
  });
});
