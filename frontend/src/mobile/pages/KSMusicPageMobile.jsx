import React, { useState, useEffect } from 'react'
import { FaMusic, FaPlay, FaSpotify, FaYoutube, FaTimes, FaExternalLinkAlt } from 'react-icons/fa'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'
import api from '../../lib/api'

const extractYouTubeID = (url) => {
  if (!url) return null
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

/**
 * KSMusicPageMobile (Native-Feel Discography & Track Player)
 */
const KSMusicPageMobile = () => {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTrack, setActiveTrack] = useState(null)

  useEffect(() => {
    api.get('/music')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTracks(res.data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const ytId = activeTrack ? extractYouTubeID(activeTrack.link) : null

  return (
    <MobileAppShell title="Musik & Single">
      <div className="space-y-4 pb-6">

        {/* Top Header Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest">
            Official Discography
          </span>
          <h1 className="text-base font-black text-[var(--text-primary)]">
            Daftar Lagu & Single Kohi Sekai
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Dengarkan lagu-lagu resmi kami di platform streaming favorit Anda.
          </p>
        </div>

        {/* Tracks List */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-2" />
            <span className="text-xs text-[var(--text-secondary)] font-mono">Memuat tracklist...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center text-xs text-[var(--text-secondary)]">
            Belum ada daftar musik yang dirilis.
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm tap-active"
              >
                {/* Track Artwork / Icon */}
                <div className="w-14 h-14 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 overflow-hidden">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <FaMusic size={20} />
                  )}
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-black text-[var(--text-primary)] truncate">
                    {track.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                    {track.artist || 'Kohi Sekai'}
                  </p>
                  {track.release_year && (
                    <span className="text-[10px] font-mono text-[var(--primary)] mt-1 block">
                      {track.release_year}
                    </span>
                  )}
                </div>

                {/* Play Button */}
                <button
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--background)] flex items-center justify-center tap-active shrink-0 shadow-sm"
                  aria-label="Putar Track"
                >
                  <FaPlay size={12} className="ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Music Player Bottom Sheet */}
      <MobileBottomSheet
        isOpen={Boolean(activeTrack)}
        onClose={() => setActiveTrack(null)}
        title={activeTrack?.title}
        subtitle={activeTrack?.artist || 'Kohi Sekai'}
      >
        {activeTrack && (
          <div className="space-y-4 py-2">
            {ytId ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                  title={activeTrack.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
                Pemutar internal tidak tersedia untuk track ini.
              </div>
            )}

            {/* External Links */}
            <div className="flex gap-2 pt-2">
              {activeTrack.link && (
                <a
                  href={activeTrack.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 touch-target py-3 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 tap-active"
                >
                  <FaYoutube className="text-red-500" />
                  <span>Buka di YouTube</span>
                </a>
              )}
              {activeTrack.spotify_link && (
                <a
                  href={activeTrack.spotify_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 touch-target py-3 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 tap-active"
                >
                  <FaSpotify className="text-emerald-500" />
                  <span>Buka Spotify</span>
                </a>
              )}
            </div>
          </div>
        )}
      </MobileBottomSheet>
    </MobileAppShell>
  )
}

export default KSMusicPageMobile
