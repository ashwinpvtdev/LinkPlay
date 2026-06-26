/**
 * Utility helpers for LinkPlay
 * - Media type detection
 * - URL validation
 * - localStorage wrappers
 */

// ── Media type detection ────────────────────────────────────────────────────

export const MEDIA_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  HLS: 'hls',
  UNKNOWN: 'unknown',
}

const VIDEO_EXTS = ['.mp4', '.webm', '.ogg', '.mov', '.mkv']
const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.opus', '.m4a']
const HLS_EXTS = ['.m3u8']

/**
 * Detect the media type from a URL string.
 * Returns one of MEDIA_TYPES values.
 */
export function detectMediaType(url) {
  if (!url) return MEDIA_TYPES.UNKNOWN

  try {
    // Strip query string for extension check
    const clean = url.split('?')[0].toLowerCase()

    if (HLS_EXTS.some((ext) => clean.endsWith(ext))) return MEDIA_TYPES.HLS
    if (AUDIO_EXTS.some((ext) => clean.endsWith(ext))) return MEDIA_TYPES.AUDIO
    if (VIDEO_EXTS.some((ext) => clean.endsWith(ext))) return MEDIA_TYPES.VIDEO

    // Fallback heuristic: contains "audio" in path → audio, else → video
    if (clean.includes('/audio/') || clean.includes('type=audio')) return MEDIA_TYPES.AUDIO

    // Default to video for ambiguous URLs
    return MEDIA_TYPES.VIDEO
  } catch {
    return MEDIA_TYPES.UNKNOWN
  }
}

/**
 * Get a short label for the media type badge.
 */
export function getMediaLabel(type) {
  switch (type) {
    case MEDIA_TYPES.HLS: return 'HLS'
    case MEDIA_TYPES.VIDEO: return 'VIDEO'
    case MEDIA_TYPES.AUDIO: return 'AUDIO'
    default: return 'MEDIA'
  }
}

// ── URL validation ──────────────────────────────────────────────────────────

/**
 * Validate that a string is a plausible HTTP(S) URL.
 * Does NOT guarantee the resource is reachable.
 */
export function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false
  try {
    const url = new URL(str.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// ── localStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEYS = {
  RECENT: 'linkplay:recent',
  PLAYLIST: 'linkplay:playlist',
}

const MAX_RECENT = 10

/**
 * Load recent links from localStorage.
 * Returns an array of { url, type, addedAt } objects.
 */
export function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save a URL to the recent links list (deduped, newest first).
 */
export function saveToRecent(url) {
  try {
    const existing = loadRecent().filter((r) => r.url !== url)
    const updated = [
      { url, type: detectMediaType(url), addedAt: Date.now() },
      ...existing,
    ].slice(0, MAX_RECENT)
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

/**
 * Clear all recent links.
 */
export function clearRecent() {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENT)
  } catch {}
}

/**
 * Load playlist from localStorage.
 */
export function loadPlaylist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLIST)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save playlist to localStorage.
 */
export function savePlaylist(playlist) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist))
  } catch {}
}

/**
 * Clear the playlist from localStorage.
 */
export function clearPlaylistStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYLIST)
  } catch {}
}

// ── Misc ───────────────────────────────────────────────────────────────────

/**
 * Format seconds into M:SS or H:MM:SS
 */
export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Truncate a URL for display purposes.
 */
export function truncateUrl(url, maxLen = 55) {
  if (!url) return ''
  if (url.length <= maxLen) return url
  return url.slice(0, maxLen - 3) + '…'
}

/**
 * Generate a stable ID from a URL (simple hash).
 */
export function urlId(url) {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
