/**
 * Import, Export and Validation Subsystem
 * Pure TypeScript, handles JSON export/import with schema checking and SVG to PNG rendering.
 */

import { CircuitState, ExportPackage, BulkExportPackage, ValidationResult } from './types';

/**
 * Validates a single circuit JSON package
 */
export function validateCircuitJson(
  rawText: string,
  currentSlug?: string
): ValidationResult<ExportPackage | BulkExportPackage> {
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      valid: false,
      error: 'Tập tin không phải là JSON hợp lệ hoặc đã bị lỗi định dạng.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      error: 'Cấu trúc dữ liệu JSON không đúng định dạng đối tượng.',
    };
  }

  // Check Bulk package
  if (parsed.app === 'cn-dien' && parsed.schema === 1 && parsed.isBulk === true) {
    if (!parsed.workspaces || typeof parsed.workspaces !== 'object') {
      return {
        valid: false,
        error: 'Gói sao lưu tất cả thiếu dữ liệu không gian làm việc (workspaces).',
      };
    }
    return {
      valid: true,
      data: parsed as BulkExportPackage,
    };
  }

  // Check Single Workspace package
  if (parsed.app !== 'cn-dien') {
    return {
      valid: false,
      error: 'Tệp tin không thuộc ứng dụng Mạch điện – Điện tử (thiếu chữ ký "app": "cn-dien").',
    };
  }

  if (parsed.schema !== 1) {
    return {
      valid: false,
      error: `Phiên bản schema ${parsed.schema} không được hỗ trợ (yêu cầu schema: 1).`,
    };
  }

  if (!parsed.slug || typeof parsed.slug !== 'string') {
    return {
      valid: false,
      error: 'Tập tin thiếu định danh không gian làm việc ("slug").',
    };
  }

  const state = parsed.state;
  if (!state || typeof state !== 'object') {
    return {
      valid: false,
      error: 'Tập tin thiếu cấu trúc trạng thái mạch ("state").',
    };
  }

  if (!Array.isArray(state.components)) {
    return {
      valid: false,
      error: 'Danh sách linh kiện ("components") phải là một mảng.',
    };
  }

  if (!Array.isArray(state.wires)) {
    return {
      valid: false,
      error: 'Danh sách dây dẫn ("wires") phải là một mảng.',
    };
  }

  // Validate components integrity
  const compIdSet = new Set<string>();
  for (let i = 0; i < state.components.length; i++) {
    const c = state.components[i];
    if (!c.id || typeof c.id !== 'string') {
      return {
        valid: false,
        error: `Linh kiện ở vị trí ${i + 1} bị thiếu mã định danh (id).`,
      };
    }
    if (!c.type || typeof c.type !== 'string') {
      return {
        valid: false,
        error: `Linh kiện "${c.id}" bị thiếu kiểu linh kiện (type).`,
      };
    }
    if (typeof c.x !== 'number' || typeof c.y !== 'number') {
      return {
        valid: false,
        error: `Linh kiện "${c.id}" có tọa độ không hợp lệ (x, y phải là số).`,
      };
    }
    compIdSet.add(c.id);
  }

  // Validate junctions
  const junctionIdSet = new Set<string>();
  if (Array.isArray(state.junctions)) {
    for (const j of state.junctions) {
      if (j && j.id) {
        junctionIdSet.add(j.id);
      }
    }
  }

  // Validate wires endpoints
  for (let i = 0; i < state.wires.length; i++) {
    const w = state.wires[i];
    if (!w.id) {
      return {
        valid: false,
        error: `Dây nối ở dòng ${i + 1} bị thiếu mã định danh id.`,
      };
    }
    if (!w.from || !w.to) {
      return {
        valid: false,
        error: `Dây nối "${w.id}" bị thiếu điểm đầu (from) hoặc điểm cuối (to).`,
      };
    }

    const checkEndpoint = (ep: any, label: string) => {
      if (ep.compId) {
        if (!compIdSet.has(ep.compId)) {
          return `Điểm ${label} của dây "${w.id}" trỏ tới linh kiện "${ep.compId}" không tồn tại trong mạch.`;
        }
      } else if (ep.junctionId) {
        if (!junctionIdSet.has(ep.junctionId)) {
          return `Điểm ${label} của dây "${w.id}" trỏ tới mối nối "${ep.junctionId}" không tồn tại.`;
        }
      } else {
        return `Điểm ${label} của dây "${w.id}" không xác định được đích đến (cần compId hoặc junctionId).`;
      }
      return null;
    };

    const errFrom = checkEndpoint(w.from, 'đầu');
    if (errFrom) return { valid: false, error: errFrom };

    const errTo = checkEndpoint(w.to, 'cuối');
    if (errTo) return { valid: false, error: errTo };
  }

  return {
    valid: true,
    data: parsed as ExportPackage,
    targetSlug: parsed.slug,
  };
}

/**
 * Triggers a browser download of a text/JSON file
 */
export function downloadJsonFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Creates export package for current workspace
 */
export function createWorkspaceExportPackage(
  slug: string,
  title: string,
  state: CircuitState
): ExportPackage {
  return {
    app: 'cn-dien',
    schema: 1,
    slug,
    title,
    exportedAt: new Date().toISOString(),
    state,
  };
}

/**
 * Creates bulk export package for all workspaces
 */
export function createBulkExportPackage(
  workspacesData: Record<string, CircuitState>
): BulkExportPackage {
  return {
    app: 'cn-dien',
    schema: 1,
    isBulk: true,
    exportedAt: new Date().toISOString(),
    workspaces: workspacesData,
  };
}

/**
 * Exports SVG schematic to PNG image
 */
export async function exportSvgToPng(svgElement: SVGSVGElement, filename: string): Promise<boolean> {
  try {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const bbox = svgElement.getBoundingClientRect();
    const width = Math.max(800, bbox.width || 1200);
    const height = Math.max(600, bbox.height || 800);

    canvas.width = width * 2; // high-dpi
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.scale(2, 2);
    // Fill background with light neo-brutalism paper
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            resolve(false);
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
          resolve(true);
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    });
  } catch (err) {
    console.error('Error exporting SVG to PNG:', err);
    return false;
  }
}
