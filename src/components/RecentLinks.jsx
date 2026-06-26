/**
 * RecentLinks — Shows the last N played URLs from localStorage.
 * Users can replay any recent link or clear history.
 */
import React from 'react'
import { detectMediaType, getMediaLabel, MEDIA_TYPES, truncateUrl } from '../utils'

// ── Icons ────────────────────────────────────────────────────────────────────
const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
)
const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const DeleteAllIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
  </svg>
)

// ── Time ago formatter ────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

// ── RecentItem ───────────────────────────────────────────────────────────────
function RecentItem({ item, onPlay }) {
  const type = item.type || detectMediaType(item.url)
  const isAudio = type === MEDIA_TYPES.AUDIO

  return (
    <button
      className="w-full text-left group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-purple-500/8"
      onClick={() => onPlay(item.url)}
    >
      {/* Play button */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110"
        style={{
          background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <span className="text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity">
          <PlayIcon />
        </span>
      </div>

      {/* URL + time */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-purple-300/60 group-hover:text-purple-200 truncate transition-colors">
          {truncateUrl(item.url, 50)}
        </p>
        <p className="text-xs text-purple-400/30 mt-0.5 flex items-center gap-1">
          <ClockIcon />
          {timeAgo(item.addedAt)}
        </p>
      </div>

      {/* Type badge */}
      <span className={`media-tag shrink-0 hidden sm:inline-flex ${isAudio ? 'audio' : ''}`}>
        {getMediaLabel(type)}
      </span>
    </button>
  )
}

// ── RecentLinks ──────────────────────────────────────────────────────────────
export default function RecentLinks({ items, onPlay, onClear }) {
  if (!items || items.length === 0) {
    return (
      <div className="glass p-5 text-center animate-fade-in">
        <div className="text-purple-400/20 flex justify-center mb-2">
          <ClockIcon />
        </div>
        <p className="text-purple-400/40 text-sm mb-1">No recent links</p>
        <p className="text-purple-400/25 text-xs">Your played links will appear here</p>
      </div>
    )
  }

  return (
    <div className="glass p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-purple-400/50"><ClockIcon /></span>
          <h3 className="text-sm font-semibold text-purple-200">Recently Played</h3>
          <span className="text-xs text-purple-400/40 font-mono">{items.length}</span>
        </div>
        <button
          className="btn-ghost text-xs py-1 px-3 h-8 text-red-400/50 hover:text-red-400 border-red-500/15 hover:border-red-500/35 hover:bg-red-500/8"
          onClick={onClear}
          aria-label="Clear history"
        >
          <DeleteAllIcon />
          Clear
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col max-h-64 overflow-y-auto">
        {items.map((item, i) => (
          <RecentItem key={`${item.url}-${i}`} item={item} onPlay={onPlay} />
        ))}
      </div>
    </div>
  )
}
