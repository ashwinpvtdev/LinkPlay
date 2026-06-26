/**
 * MediaPlayer — Core player component.
 * Handles video/audio/HLS playback with custom controls:
 * - Play/Pause, Seek, Volume, Speed, Fullscreen
 * - Subtitle track via .vtt URL
 * - Loading and error states
 * - HLS via hls.js for .m3u8 streams
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { MEDIA_TYPES, formatTime } from '../utils'

// ── SVG Icons ────────────────────────────────────────────────────────────────
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
)
const PauseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
)
const VolumeIcon = ({ level }) => {
  if (level === 0) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none"/>
      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  )
  if (level < 0.5) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none"/>
      <path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/>
    </svg>
  )
}
const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
  </svg>
)
const SkipBackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 20L9 12l10-8v16z"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)
const SkipFwdIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 4l10 8-10 8V4z"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)
const RepeatIcon = ({ active }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
  </svg>
)

// ── Speeds ──────────────────────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

// ── Component ────────────────────────────────────────────────────────────────
export default function MediaPlayer({ media, onEnded }) {
  const mediaRef = useRef(null)
  const hlsRef = useRef(null)
  const progressRef = useRef(null)
  const containerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showControls, setShowControls] = useState(true)
  const controlsTimer = useRef(null)

  const isAudio = media?.type === MEDIA_TYPES.AUDIO

  // ── HLS / source setup ───────────────────────────────────────────────────
  useEffect(() => {
    if (!media?.url) return

    const el = mediaRef.current
    if (!el) return

    setLoading(true)
    setError(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (media.type === MEDIA_TYPES.HLS) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true })
        hlsRef.current = hls
        hls.loadSource(media.url)
        hls.attachMedia(el)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false)
          el.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError('Failed to load HLS stream. Check the URL and try again.')
            setLoading(false)
          }
        })
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        el.src = media.url
      } else {
        setError('HLS is not supported in this browser.')
        setLoading(false)
      }
    } else {
      el.src = media.url
      el.load()
    }

    // Auto-play
    el.play().catch(() => {
      // Autoplay blocked — user can press play
      setIsPlaying(false)
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [media?.url, media?.type])

  // ── Subtitle track ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = mediaRef.current
    if (!el) return

    // Remove existing tracks
    while (el.firstChild && el.firstChild.tagName === 'TRACK') {
      el.removeChild(el.firstChild)
    }

    if (media?.subtitleUrl) {
      const track = document.createElement('track')
      track.kind = 'subtitles'
      track.label = 'Subtitles'
      track.src = media.subtitleUrl
      track.default = true
      el.appendChild(track)
    }
  }, [media?.subtitleUrl])

  // ── Sync speed ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mediaRef.current
    if (el) el.playbackRate = speed
  }, [speed])

  // ── Sync loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mediaRef.current
    if (el) el.loop = loop
  }, [loop])

  // ── Sync volume / mute ───────────────────────────────────────────────────
  useEffect(() => {
    const el = mediaRef.current
    if (!el) return
    el.volume = volume
    el.muted = muted
  }, [volume, muted])

  // ── Media event handlers ─────────────────────────────────────────────────
  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])
  const handleWaiting = useCallback(() => setLoading(true), [])
  const handleCanPlay = useCallback(() => setLoading(false), [])
  const handleLoadedMetadata = useCallback(() => {
    const el = mediaRef.current
    if (el) setDuration(el.duration)
    setLoading(false)
  }, [])
  const handleTimeUpdate = useCallback(() => {
    const el = mediaRef.current
    if (el) setCurrentTime(el.currentTime)
  }, [])
  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    if (onEnded) onEnded()
  }, [onEnded])
  const handleError = useCallback(() => {
    setError('Could not load or play this media. Make sure it\'s a valid, publicly accessible direct link.')
    setLoading(false)
    setIsPlaying(false)
  }, [])

  // ── Controls ─────────────────────────────────────────────────────────────
  function togglePlay() {
    const el = mediaRef.current
    if (!el) return
    if (isPlaying) el.pause()
    else el.play().catch(() => {})
  }

  function handleSeek(e) {
    const el = mediaRef.current
    if (!el || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = ratio * duration
    setCurrentTime(el.currentTime)
  }

  function skip(seconds) {
    const el = mediaRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + seconds))
  }

  function handleVolumeChange(e) {
    const v = parseFloat(e.target.value)
    setVolume(v)
    setMuted(v === 0)
  }

  function toggleMute() {
    setMuted((m) => !m)
  }

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  // ── Auto-hide controls on video hover ───────────────────────────────────
  function resetControlsTimer() {
    if (isAudio) return
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  // ── Progress bar percentage ──────────────────────────────────────────────
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Keyboard shortcut: Space ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight') skip(10)
      if (e.code === 'ArrowLeft') skip(-10)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, duration])

  if (!media) return null

  return (
    <div className="w-full animate-slide-up">
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden ${isAudio ? '' : 'bg-black'}`}
        style={{ boxShadow: '0 0 60px rgba(124,58,237,0.2), 0 0 120px rgba(6,182,212,0.08)' }}
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => !isAudio && isPlaying && setShowControls(false)}
      >
        {/* ── Media element ── */}
        {isAudio ? (
          // Audio player: show waveform placeholder + audio element
          <div className="relative">
            <div
              className="flex items-center justify-center h-40 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.08) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              {/* Animated audio bars */}
              <div className="flex items-end gap-1 h-14">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      height: `${20 + Math.sin(i * 0.8) * 30 + Math.cos(i * 0.4) * 20}%`,
                      background: isPlaying
                        ? `linear-gradient(to top, #7c3aed, #06b6d4)`
                        : 'rgba(124,58,237,0.25)',
                      animation: isPlaying ? `audioBar 0.${(i % 4) + 6}s ease-in-out infinite alternate` : 'none',
                      animationDelay: `${i * 0.04}s`,
                    }}
                  />
                ))}
              </div>
              {/* Audio label */}
              <div className="absolute top-3 left-3">
                <span className="media-tag audio text-xs">AUDIO</span>
              </div>
            </div>
            <audio
              ref={mediaRef}
              className="hidden"
              onPlay={handlePlay}
              onPause={handlePause}
              onWaiting={handleWaiting}
              onCanPlay={handleCanPlay}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={handleError}
            />
            <style>{`
              @keyframes audioBar {
                from { transform: scaleY(0.4); }
                to { transform: scaleY(1); }
              }
            `}</style>
          </div>
        ) : (
          // Video player
          <video
            ref={mediaRef}
            className="w-full max-h-[60vh] object-contain bg-black rounded-2xl"
            onClick={togglePlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            playsInline
            crossOrigin="anonymous"
          >
            {media.subtitleUrl && (
              <track kind="subtitles" src={media.subtitleUrl} label="Subtitles" default />
            )}
          </video>
        )}

        {/* ── Loading overlay ── */}
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl pointer-events-none">
            <div className="spinner w-10 h-10" />
          </div>
        )}

        {/* ── Error overlay ── */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl p-6 text-center animate-fade-in">
            <div className="text-red-400 mb-3">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><dot cx="12" cy="16" r="1"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-red-300 text-sm font-medium mb-1">Playback Failed</p>
            <p className="text-red-400/70 text-xs leading-relaxed max-w-xs">{error}</p>
          </div>
        )}

        {/* ── Controls overlay (video) or always-visible (audio) ── */}
        {!error && (
          <div
            className={`transition-opacity duration-300 ${
              isAudio ? 'mt-3' : `absolute bottom-0 left-0 right-0 p-3 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`
            }`}
            style={isAudio ? {} : {
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
              borderRadius: '0 0 16px 16px',
            }}
          >
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="w-full h-1.5 rounded-full cursor-pointer mb-3 group relative"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                  boxShadow: '0 0 8px rgba(124,58,237,0.5)',
                }}
              />
              {/* Scrub handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPct}% - 6px)`, boxShadow: '0 0 6px rgba(124,58,237,0.8)' }}
              />
            </div>

            {/* Control buttons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Skip back */}
              <button
                className="text-white/60 hover:text-white transition-colors p-1"
                onClick={() => skip(-10)}
                data-tooltip="-10s"
                aria-label="Rewind 10 seconds"
              >
                <SkipBackIcon />
              </button>

              {/* Play/Pause */}
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>

              {/* Skip forward */}
              <button
                className="text-white/60 hover:text-white transition-colors p-1"
                onClick={() => skip(10)}
                data-tooltip="+10s"
                aria-label="Skip 10 seconds"
              >
                <SkipFwdIcon />
              </button>

              {/* Time */}
              <span className="text-white/50 text-xs font-mono ml-1 tabular-nums">
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '—:——'}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Loop */}
              <button
                className={`p-1.5 rounded-lg transition-colors ${loop ? 'text-purple-400' : 'text-white/40 hover:text-white/70'}`}
                onClick={() => setLoop((v) => !v)}
                data-tooltip={loop ? 'Loop On' : 'Loop Off'}
                aria-label="Toggle loop"
              >
                <RepeatIcon active={loop} />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  className="text-white/60 hover:text-white transition-colors p-1 shrink-0"
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  <VolumeIcon level={muted ? 0 : volume} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="range-slider w-20 hidden sm:block"
                  aria-label="Volume"
                  style={{
                    background: `linear-gradient(to right, #7c3aed ${(muted ? 0 : volume) * 100}%, rgba(124,58,237,0.2) ${(muted ? 0 : volume) * 100}%)`,
                  }}
                />
              </div>

              {/* Speed selector */}
              <select
                className="text-xs font-mono bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white/70 cursor-pointer outline-none hover:border-purple-500/40 transition-colors"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                aria-label="Playback speed"
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>{s === 1 ? '1× Speed' : `${s}×`}</option>
                ))}
              </select>

              {/* Fullscreen (video only) */}
              {!isAudio && (
                <button
                  className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  onClick={toggleFullscreen}
                  aria-label="Toggle fullscreen"
                >
                  <FullscreenIcon />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Now playing label */}
      {media.url && (
        <div className="mt-3 flex items-center gap-2">
          {/* Playing indicator dot */}
          {isPlaying && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
          )}
          <p className="text-xs text-purple-400/50 truncate font-mono">{media.url}</p>
        </div>
      )}
    </div>
  )
}
