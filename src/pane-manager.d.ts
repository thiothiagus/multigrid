import { BrowserView } from 'electron';
import { Logger, PaneEntry } from './types';

export function hidePaneView(entry?: PaneEntry | null): void;
export function showPaneView(entry?: PaneEntry | null): void;

export interface CreatePaneOpts {
  win: any;
  panes: Map<number, PaneEntry>;
  id: number;
  partition: string;
  url: string;
  logger?: Logger;
  sendStatus: (id: number, status: string, extra?: any) => void;
  scheduleRetry: (paneId: number, fromCrash: boolean) => void;
}

export function createPaneView(opts: CreatePaneOpts): boolean;
export function removePaneView({ win, panes, id, logger }: { win: any; panes: Map<number, PaneEntry>; id: number; logger?: Logger }): boolean;
export function reloadPaneView({ panes, id, logger }: { panes: Map<number, PaneEntry>; id: number; logger?: Logger }): boolean;
export function backPaneView({ panes, id }: { panes: Map<number, PaneEntry>; id: number }): boolean;
export async function clearPaneDataView({ panes, id, logger }: { panes: Map<number, PaneEntry>; id: number; logger?: Logger }): Promise<boolean>;