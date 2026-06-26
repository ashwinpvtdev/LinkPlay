/**
 * UrlInput — Hero URL entry component.
 * Handles single URL input + subtitle URL input + Add to Playlist action.
 */
import React, { useState, useRef } from 'react'
import { isValidUrl, detectMediaType, getMediaLabel, MEDIA_TYPES } from '../utils'

// ── Icons (inline SVG for zero deps) ────────────────────────────────────────
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const LinkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
)
const SubtitleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </svg>
)

// ── Component ────────────────────────────────────────────────────────────────
export default function UrlInput({ onPlay, onAddToPlaylist }) {
  const [url, setUrl] = useState('')
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [urlError, setUrlError] = useState('')
  const inputRef = useRef(null)

  // Derived state
  const trimmedUrl = url.trim()
  const urlIsValid = trimmedUrl && isValidUrl(trimmedUrl)
  const detectedType = urlIsValid ? detectMediaType(trimmedUrl) : null

  function handleUrlChange(e) {
    setUrl(e.target.value)
    setUrlError('')
  }

  function validate() {
    if (!trimmedUrl) {
      setUrlError('Paste a media URL to get started.')
      return false
    }
    if (!isValidUrl(trimmedUrl)) {
      setUrlError('That doesn\'t look like a valid URL. Make sure it starts with http:// or https://.')
      return false
    }
    return true
  }

  function handlePlay() {
    if (!validate()) return
    onPlay({ url: trimmedUrl, subtitleUrl: subtitleUrl.trim() || null })
  }

  function handleAdd() {
    if (!validate()) return
    onAddToPlaylist({ url: trimmedUrl, subtitleUrl: subtitleUrl.trim() || null })
    setUrl('')
    setSubtitleUrl('')
    setUrlError('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handlePlay()
  }

  function handlePaste(e) {
    // Auto-play on paste if the field was empty
    const pasted = e.clipboardData.getData('text').trim()
    if (!url && isValidUrl(pasted)) {
      // Small delay so the state updates first
      setTimeout(() => {
        onPlay({ url: pasted, subtitleUrl: subtitleUrl.trim() || null })
      }, 60)
    }
  }

  return (
    <div className="w-full animate-slide-up">
      {/* Main URL input */}
      <div className="relative flex items-center gap-2">
        {/* Link icon prefix */}
        <div className="absolute left-4 text-purple-400/60 pointer-events-none z-10">
          <LinkIcon />
        </div>

        <input
          ref={inputRef}
          type="url"
          className="input-field pl-10 pr-4 h-14 text-base flex-1"
          placeholder="Paste a direct media URL — .mp4 · .mp3 · .webm · .m3u8 · .wav …"
          value={url}
          onChange={handleUrlChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          autoComplete="off"
          spellCheck={false}
          aria-label="Media URL"
        />

        {/* Type badge — appears when URL is valid */}
        {detectedType && (
          <span className={`media-tag hidden sm:inline-flex shrink-0 ${detectedType === MEDIA_TYPES.AUDIO ? 'audio' : ''}`}>
            {getMediaLabel(detectedType)}
          </span>
        )}
      </div>

      {/* Error message */}
      {urlError && (
        <p className="mt-2 text-xs text-red-400 pl-1 animate-fade-in">{urlError}</p>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {/* Play Now */}
        <button
          className="btn-primary h-10 px-6"
          onClick={handlePlay}
          aria-label="Play media"
        >
          <PlayIcon />
          Play Now
        </button>

        {/* Add to Playlist */}
        <button
          className="btn-ghost h-10"
          onClick={handleAdd}
          aria-label="Add to playlist"
        >
          <PlusIcon />
          Add to Playlist
        </button>

        {/* Toggle subtitle row */}
        <button
          className={`btn-ghost h-10 ${showSubtitle ? 'border-purple-500/50' : ''}`}
          onClick={() => setShowSubtitle((v) => !v)}
          aria-label="Toggle subtitle input"
        >
          <SubtitleIcon />
          Subtitles
        </button>
      </div>

      {/* Subtitle URL input (collapsible) */}
      {showSubtitle && (
        <div className="mt-3 animate-fade-in">
          <div className="relative flex items-center gap-2">
            <div className="absolute left-4 text-cyan-400/50 pointer-events-none z-10">
              <SubtitleIcon />
            </div>
            <input
              type="url"
              className="input-field pl-10 h-11 text-sm"
              placeholder="Subtitle track URL (.vtt format)"
              value={subtitleUrl}
              onChange={(e) => setSubtitleUrl(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-label="Subtitle VTT URL"
            />
          </div>
          <p className="mt-1.5 text-xs text-purple-400/50 pl-1">
            Only WebVTT (.vtt) subtitle files are supported via direct URL.
          </p>
        </div>
      )}

      {/* DRM disclaimer */}
      <p className="mt-4 text-xs text-purple-400/40 leading-relaxed">
        <span className="text-purple-400/60">ⓘ</span>{' '}
        Only direct public media source URLs are supported. DRM/protected platform links (YouTube, Netflix, Spotify, etc.) may not work.
      </p>
    </div>
  )
}
