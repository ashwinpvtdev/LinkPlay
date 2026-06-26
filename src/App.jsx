/**
 * LinkPlay — App.jsx
 * Root component. Manages:
 * - Active media state
 * - Playlist (with localStorage persistence)
 * - Recent links (with localStorage persistence)
 * - Routing between sections
 */
import React, { useState, useEffect, useCallback } from 'react'
import UrlInput from './components/UrlInput'
import MediaPlayer from './components/MediaPlayer'
import Playlist from './components/Playlist'
import RecentLinks from './components/RecentLinks'
import {
  detectMediaType,
  loadRecent, saveToRecent, clearRecent,
  loadPlaylist, savePlaylist, clearPlaylistStorage,
} from './utils'

// ── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          boxShadow: '0 0 20px rgba(124,58,237,0.5)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <polygon points="6,3 20,12 6,21" />
        </svg>
      </div>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ background: 'linear-gradient(90deg, #c4b5fd, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        LinkPlay
      </span>
    </div>
  )
}

// ── Nav tabs ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'player', label: 'Player' },
  { id: 'playlist', label: 'Playlist' },
  { id: 'recent', label: 'Recent' },
]

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // Active media being played
  const [currentMedia, setCurrentMedia] = useState(null)
  // Playlist array of { url, subtitleUrl, type }
  const [playlist, setPlaylist] = useState(() => loadPlaylist())
  // Index of the currently playing playlist item (-1 if not from playlist)
  const [playlistIndex, setPlaylistIndex] = useState(-1)
  // Recent played links
  const [recent, setRecent] = useState(() => loadRecent())
  // Active tab (mobile/bottom-nav style on small screens)
  const [activeTab, setActiveTab] = useState('player')
  // Whether the player section is playing (passed down for UI feedback)
  const [isPlaying, setIsPlaying] = useState(false)

  // ── Play a media object { url, subtitleUrl? } ─────────────────────────────
  const playMedia = useCallback((mediaObj, fromPlaylistIndex = -1) => {
    const { url, subtitleUrl = null } = mediaObj
    const type = detectMediaType(url)
    setCurrentMedia({ url, subtitleUrl, type })
    setPlaylistIndex(fromPlaylistIndex)
    setActiveTab('player')

    // Save to recent
    const updated = saveToRecent(url)
    setRecent(updated)
  }, [])

  // ── Play from URL input ───────────────────────────────────────────────────
  function handlePlay(mediaObj) {
    playMedia(mediaObj, -1)
  }

  // ── Add to playlist ───────────────────────────────────────────────────────
  function handleAddToPlaylist(mediaObj) {
    const { url, subtitleUrl = null } = mediaObj
    const type = detectMediaType(url)
    const newItem = { url, subtitleUrl, type }
    setPlaylist((prev) => {
      const updated = [...prev, newItem]
      savePlaylist(updated)
      return updated
    })
    // Switch to playlist tab to confirm
    setActiveTab('playlist')
  }

  // ── Play from playlist ────────────────────────────────────────────────────
  function handlePlaylistPlay(index) {
    const item = playlist[index]
    if (!item) return
    playMedia(item, index)
  }

  // ── When current track ends, advance playlist ─────────────────────────────
  function handleMediaEnded() {
    setIsPlaying(false)
    if (playlistIndex >= 0 && playlistIndex < playlist.length - 1) {
      const nextIndex = playlistIndex + 1
      playMedia(playlist[nextIndex], nextIndex)
    }
  }

  // ── Remove from playlist ──────────────────────────────────────────────────
  function handleRemoveFromPlaylist(index) {
    setPlaylist((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      savePlaylist(updated)
      return updated
    })
    // Adjust active index if needed
    if (index === playlistIndex) {
      setPlaylistIndex(-1)
    } else if (index < playlistIndex) {
      setPlaylistIndex((p) => p - 1)
    }
  }

  // ── Clear playlist ────────────────────────────────────────────────────────
  function handleClearPlaylist() {
    setPlaylist([])
    clearPlaylistStorage()
    setPlaylistIndex(-1)
  }

  // ── Play from recent ──────────────────────────────────────────────────────
  function handleRecentPlay(url) {
    playMedia({ url }, -1)
  }

  // ── Clear recent ──────────────────────────────────────────────────────────
  function handleClearRecent() {
    setRecent([])
    clearRecent()
  }

  // ── Sample media URLs for first-time users ────────────────────────────────
  const SAMPLES = [
    { label: 'Big Buck Bunny (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { label: 'Sintel Trailer (MP4)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
    { label: 'HLS Stream (m3u8)', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: '#0d0d14' }}>
      {/* ── Ambient glow blobs ── */}
      <div
        className="ambient-blob w-[500px] h-[500px] opacity-20"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', top: '-100px', left: '-150px' }}
        aria-hidden="true"
      />
      <div
        className="ambient-blob w-[400px] h-[400px] opacity-10"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', top: '40%', right: '-100px', animationDelay: '4s' }}
        aria-hidden="true"
      />
      <div
        className="ambient-blob w-[300px] h-[300px] opacity-10"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', bottom: '10%', left: '30%', animationDelay: '8s' }}
        aria-hidden="true"
      />

      {/* ── Page content ── */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16 pt-10">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-10">
          <Logo />
          <div className="flex items-center gap-2 text-xs text-purple-400/40">
            <span className="hidden sm:inline">Paste · Play · Done</span>
          </div>
        </header>

        {/* ── Hero section ── */}
        <section className="mb-10 animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight"
            style={{ background: 'linear-gradient(135deg, #e2e2f0 0%, #c4b5fd 60%, #67e8f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Paste a link.<br />Press play.
          </h1>
          <p className="text-purple-300/50 text-base mb-8 max-w-lg leading-relaxed">
            Instant streaming for MP4, MP3, WebM, HLS, and more — right in your browser. No installs, no accounts.
          </p>

          {/* URL Input */}
          <div className="glass p-5 sm:p-6">
            <UrlInput onPlay={handlePlay} onAddToPlaylist={handleAddToPlaylist} />
          </div>
        </section>

        {/* ── Sample links (shown only when no media loaded) ── */}
        {!currentMedia && (
          <section className="mb-10 animate-fade-in">
            <p className="text-xs text-purple-400/40 mb-3 uppercase tracking-widest font-medium">Try a sample</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.url}
                  className="btn-ghost text-xs h-8 px-3"
                  onClick={() => playMedia({ url: s.url })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Tabs (Player / Playlist / Recent) ── */}
        <div className="mb-5">
          <div className="flex items-center gap-1 glass-light p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-purple-400/50 hover:text-purple-300'
                }`}
                style={activeTab === tab.id ? {
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(92,33,182,0.4))',
                  boxShadow: '0 0 12px rgba(124,58,237,0.3)',
                } : {}}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {/* Badge for playlist count */}
                {tab.id === 'playlist' && playlist.length > 0 && (
                  <span className="ml-1.5 text-xs text-purple-400/60 font-mono">{playlist.length}</span>
                )}
                {tab.id === 'recent' && recent.length > 0 && (
                  <span className="ml-1.5 text-xs text-purple-400/60 font-mono">{recent.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div>
          {/* Player tab */}
          {activeTab === 'player' && (
            <div>
              {currentMedia ? (
                <MediaPlayer
                  media={currentMedia}
                  onEnded={handleMediaEnded}
                />
              ) : (
                <div className="glass p-10 text-center animate-fade-in">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                  <p className="text-purple-300/50 text-sm mb-1">Nothing playing yet</p>
                  <p className="text-purple-400/30 text-xs">Paste a media URL above to start</p>
                </div>
              )}
            </div>
          )}

          {/* Playlist tab */}
          {activeTab === 'playlist' && (
            <Playlist
              items={playlist}
              currentIndex={playlistIndex}
              isPlaying={isPlaying}
              onPlay={handlePlaylistPlay}
              onRemove={handleRemoveFromPlaylist}
              onClear={handleClearPlaylist}
            />
          )}

          {/* Recent tab */}
          {activeTab === 'recent' && (
            <RecentLinks
              items={recent}
              onPlay={handleRecentPlay}
              onClear={handleClearRecent}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-purple-900/20 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-400/30">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <span>MP4 · MP3 · WebM · OGG · WAV · M3U8</span>
          </div>
          <span>Direct public URLs only</span>
        </div>
      </footer>
    </div>
  )
}
