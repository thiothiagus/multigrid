import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleRetry, cancelRetry } from '../src/retry.ts';
import { PaneEntry } from '../src/types.ts';

describe('retry module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('scheduleRetry', () => {
    it('schedules retry with exponential delay and reloads webContents', () => {
      const reloadMock = vi.fn();
      const showPaneViewMock = vi.fn();
      const sendStatusMock = vi.fn();

      const entry: PaneEntry = {
        pane: { id: 1, name: 'Pane 1', url: 'https://example.com' },
        element: {} as HTMLElement,
        view: { webContents: { reload: reloadMock } } as unknown as PaneEntry['view'],
        retryCount: 0,
        retryTimer: null,
      };

      const panes = new Map<number, PaneEntry>([[1, entry]]);

      scheduleRetry({
        panes,
        id: 1,
        fromCrash: false,
        sendStatus: sendStatusMock,
        showPaneView: showPaneViewMock,
      });

      expect(entry.retryCount).toBe(1);
      expect(sendStatusMock).toHaveBeenCalledWith(1, 'retrying', { seconds: 2 });
      expect(entry.retryTimer).not.toBeNull();

      // Fast forward timers
      vi.advanceTimersByTime(2000);

      expect(reloadMock).toHaveBeenCalledTimes(1);
      expect(entry.retryTimer).toBeNull();
    });

    it('emits error-final when max retry count (6) is exceeded', () => {
      const sendStatusMock = vi.fn();
      const entry: PaneEntry = {
        pane: { id: 1, name: 'Pane 1', url: 'https://example.com' },
        element: {} as HTMLElement,
        view: { webContents: { reload: vi.fn() } } as unknown as PaneEntry['view'],
        retryCount: 6,
        retryTimer: null,
      };

      const panes = new Map<number, PaneEntry>([[1, entry]]);

      scheduleRetry({
        panes,
        id: 1,
        fromCrash: true,
        sendStatus: sendStatusMock,
      });

      expect(entry.retryCount).toBe(7);
      expect(sendStatusMock).toHaveBeenCalledWith(1, 'error-final');
      expect(entry.retryTimer).toBeNull();
    });

    it('handles crash status and calls showPaneView on retry timeout', () => {
      const reloadMock = vi.fn();
      const showPaneViewMock = vi.fn();
      const sendStatusMock = vi.fn();

      const entry: PaneEntry = {
        pane: { id: 2, name: 'Pane 2', url: 'https://example.com' },
        element: {} as HTMLElement,
        view: { webContents: { reload: reloadMock } } as unknown as PaneEntry['view'],
        retryCount: 0,
        retryTimer: null,
      };

      const panes = new Map<number, PaneEntry>([[2, entry]]);

      scheduleRetry({
        panes,
        id: 2,
        fromCrash: true,
        sendStatus: sendStatusMock,
        showPaneView: showPaneViewMock,
      });

      expect(sendStatusMock).toHaveBeenCalledWith(2, 'crashed', { seconds: 2 });

      vi.advanceTimersByTime(2000);

      expect(showPaneViewMock).toHaveBeenCalledWith(entry);
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('cancelRetry', () => {
    it('clears active timer and resets retryTimer property', () => {
      const entry: PaneEntry = {
        pane: { id: 1, name: 'Pane 1', url: '' },
        element: {} as HTMLElement,
        view: {} as unknown as PaneEntry['view'],
        retryCount: 1,
        retryTimer: setTimeout(() => {}, 10000),
      };

      cancelRetry(entry);
      expect(entry.retryTimer).toBeNull();
    });
  });
});
