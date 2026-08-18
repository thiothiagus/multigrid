import { LayoutItem } from './types';

export const GUTTER_PX: number;

export function computeGridDims(n: number): { cols: number; rows: number };
export function resetFractions(st?: any): void;
export function buildGridTemplates(state: { colFr: number[]; rowFr: number[]; cols: number; rows: number }): { colTemplate: string; rowTemplate: string; cols: number; rows: number };
export function calculatePaneLayout(gridEl: HTMLElement | null): LayoutItem[];