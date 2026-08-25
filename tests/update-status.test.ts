import { describe, it, expect } from 'vitest';
import { mapUpdaterEventToPayload } from '../src/update-status.ts';

describe('mapUpdaterEventToPayload', () => {
  it('maps checking-for-update to a checking payload without extra fields', () => {
    expect(mapUpdaterEventToPayload('checking-for-update')).toEqual({ status: 'checking' });
  });

  it('maps update-available with version from info', () => {
    expect(mapUpdaterEventToPayload('update-available', { version: '0.2.0' })).toEqual({
      status: 'available',
      version: '0.2.0',
    });
  });

  it('maps update-not-available with version from info', () => {
    expect(mapUpdaterEventToPayload('update-not-available', { version: '0.1.0' })).toEqual({
      status: 'not-available',
      version: '0.1.0',
    });
  });

  it('maps download-progress rounding percent and clamping to 0..100', () => {
    expect(mapUpdaterEventToPayload('download-progress', undefined, { percent: 42.6 })).toEqual({
      status: 'downloading',
      progress: 43,
    });
    expect(mapUpdaterEventToPayload('download-progress', undefined, { percent: -5 })).toEqual({
      status: 'downloading',
      progress: 0,
    });
    expect(mapUpdaterEventToPayload('download-progress', undefined, { percent: 150 })).toEqual({
      status: 'downloading',
      progress: 100,
    });
    expect(mapUpdaterEventToPayload('download-progress')).toEqual({
      status: 'downloading',
      progress: 0,
    });
  });

  it('maps update-downloaded with version from info', () => {
    expect(mapUpdaterEventToPayload('update-downloaded', { version: '0.2.0' })).toEqual({
      status: 'downloaded',
      version: '0.2.0',
    });
  });

  it('maps error with optional message', () => {
    expect(mapUpdaterEventToPayload('error', undefined, { message: 'network down' })).toEqual({
      status: 'error',
      message: 'network down',
    });
    expect(mapUpdaterEventToPayload('error')).toEqual({ status: 'error' });
  });
});
