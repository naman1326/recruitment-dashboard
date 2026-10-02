import LZString from 'lz-string';
import { Candidate, PanelConfig, PanelType } from '../types';

export interface SharedDataPayload {
  candidates: Candidate[];
  panelConfigs?: Record<PanelType, PanelConfig>;
  version: number;
  timestamp: string;
}

const BYTEBIN_URL = 'https://bytebin.lucko.me';

/**
 * Upload schedule state to Bytebin and return short key
 */
export async function createShareableUrl(
  candidates: Candidate[],
  panelConfigs?: Record<PanelType, PanelConfig>
): Promise<string> {
  const payload: SharedDataPayload = {
    candidates,
    panelConfigs,
    version: 1,
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(`${BYTEBIN_URL}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.key) {
        const url = new URL(window.location.href);
        url.hash = `id=${data.key}`;
        return url.toString();
      }
    }
  } catch (err) {
    console.warn('Bytebin upload failed, falling back to LZ-string hash:', err);
  }

  // Fallback: compress payload with LZString directly into hash
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL(window.location.href);
  url.hash = `data=${compressed}`;
  return url.toString();
}

/**
 * Hydrate schedule state from URL hash (#id=... or #data=...)
 */
export async function hydrateFromShareUrl(): Promise<SharedDataPayload | null> {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const id = params.get('id');
  const data = params.get('data');

  if (id) {
    try {
      const res = await fetch(`${BYTEBIN_URL}/${id}`);
      if (res.ok) {
        const payload: SharedDataPayload = await res.json();
        return payload;
      }
    } catch (err) {
      console.error('Failed to fetch from Bytebin:', err);
    }
  }

  if (data) {
    try {
      const decompressed = LZString.decompressFromEncodedURIComponent(data);
      if (decompressed) {
        return JSON.parse(decompressed);
      }
    } catch (err) {
      console.error('Failed to decompress LZ-string payload:', err);
    }
  }

  return null;
}
