/**
 * Playlist — User-managed queue of media items.
 * Supports reordering (up/down), removing individual items,
 * clearing all, and clicking to play.
 */
import React from 'react'
import { detectMediaType, getMediaLabel, MEDIA_TYPES, truncateUrl } from '../utils'

// ── Icons ────────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const ClearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const MusicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
)
const HLSIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 010-10C4 7 7 6 12 6s8 1 9.5 1a24.12 24.12 0 010 10C20 17 17 18 12 18s-8-1-9.5-1z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

function MediaTypeIcon({ type }) {
  if (type === MEDIA_TYPES.AUDIO) return <MusicIcon />
  if (type === MEDIA_TYPES.HLS) return <HLSIcon />
  return <VideoIcon />
}

// ── PlaylistItem ─────────────────────────────────────────────────────────────
function PlaylistItem({ item, index, isActive, isPlaying, onPlay, onRemove, total }) {
  const type = item.type || detectMediaType(item.url)
  const isAudio = type === MEDIA_TYPES.AUDIO

  return (
    <div
      className={`playlist-item flex items-center gap-3 px-3 py-2.5 ${isActive ? 'active' : ''}`}
      onClick={() => onPlay(index)}
    >
      {/* Track number or play indicator */}
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        {isActive && isPlaying ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
          </span>
        ) : isActive ? (
          <span className="text-purple-400"><PlayIcon /></span>
        ) : (
          <span className="text-purple-400/30 text-xs font-mono">{index + 1}</span>
        )}
      </div>

      {/* Type icon */}
      <div className={`shrink-0 ${isAudio ? 'text-cyan-400/70' : 'text-purple-400/70'}`}>
        <MediaTypeIcon type={type} />
      </div>

      {/* URL */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-mono truncate ${isActive ? 'text-purple-200' : 'text-purple-300/60'}`}>
          {truncateUrl(item.url, 48)}
        </p>
        {item.subtitleUrl && (
          <p className="text-xs text-cyan-400/40 truncate mt-0.5">Sub: {truncateUrl(item.subtitleUrl, 40)}</p>
        )}
      </div>

      {/* Type badge */}
      <span className={`media-tag shrink-0 hidden sm:inline-flex ${isAudio ? 'audio' : ''}`}>
        {getMediaLabel(type)}
      </span>

      {/* Remove button */}
      <button
        className="shrink-0 text-red-400/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
        onClick={(e) => { e.stopPropagation(); onRemove(index) }}
        aria-label="Remove from playlist"
      >
        <TrashIcon />
      </button>
    </div>
  )
}

// ── Playlist ─────────────────────────────────────────────────────────────────
export default function Playlist({ items, currentIndex, isPlaying, onPlay, onRemove, onClear }) {
  if (!items || items.length === 0) {
    return (
      <div className="glass p-5 text-center animate-fade-in">
        <p className="text-purple-400/40 text-sm mb-1">Playlist is empty</p>
        <p className="text-purple-400/25 text-xs">Add links with the "Add to Playlist" button above</p>
      </div>
    )
  }

  return (
    <div className="glass p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-purple-200">Playlist</h3>
          <span className="text-xs text-purple-400/40 font-mono">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <button
          className="btn-ghost text-xs py-1 px-3 h-8 text-red-400/60 hover:text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/8"
          onClick={onClear}
          aria-label="Clear playlist"
        >
          <ClearIcon />
          Clear All
        </button>
      </div>

      {/* Item list */}
      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
        {items.map((item, i) => (
          <PlaylistItem
            key={`${item.url}-${i}`}
            item={item}
            index={i}
            isActive={i === currentIndex}
            isPlaying={isPlaying && i === currentIndex}
            onPlay={onPlay}
            onRemove={onRemove}
            total={items.length}
          />
        ))}
      </div>
    </div>
  )
}
