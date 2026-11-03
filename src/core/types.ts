/**
 * Core Type Definitions for "Mạch điện – Điện tử"
 * Pure TypeScript, re-exporting from model.ts for unified type safety.
 */

export * from './model';

export interface CostItem {
  type: string;
  name: string;
  count: number;
  unitPrice: number;
  total: number;
}

export interface ValidationResult<T> {
  valid: boolean;
  error?: string;
  data?: T;
  targetSlug?: string;
}
