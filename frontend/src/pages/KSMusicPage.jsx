import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMusic, FaSpotify, FaYoutube, FaPlay, FaExternalLinkAlt, FaTimes } from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import KSFooter from '../components/KSFooter'
import api from '../lib/api'

const extractYouTubeID = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : false
}

const getSpotifyEmbedUrl = (url) => {
  return url.replace('open.spotify.com/', 'open.spotify.com/embed/')
}


const PlayerModal = ({ track, onClose }) => {
  const embedUrl = `https://www.youtube.com/embed/${extractYouTubeID(track.link)}?autoplay=1`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#0c111d] rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c111d]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <FaYoutube className="text-red-500 text-xl" />
            <h3 className="font-bold text-white line-clamp-1">{track.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <FaTimes />
          </button>
        </div>
        <div className="w-full bg-black flex items-center justify-center min-h-[50vh]">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const KSMusicPage = () => {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState(null)

  useEffect(() => {
    fetchTracks()
  }, [])

  const fetchTracks = async () => {
    try {
      setLoading(true)
      const res = await api.get('/music')
      setTracks(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch music', error)
    } finally {
      setLoading(false)
    }
  }

  const youtubeTracks = tracks.filter(t => t.platform === 'youtube')
  const spotifyTracks = tracks.filter(t => t.platform === 'spotify')

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      <KSHeader />

      <main className="pt-20 sm:pt-24">
        {/* Hero */}
        <section className="relative py-20 sm:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[140px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px]" />
          </div>

          <div className="container mx-auto max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-primary/10 mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FaMusic className="text-primary" size={36} />
                </motion.div>
              </div>
              <p className="text-xs font-black tracking-[0.5em] text-primary uppercase mb-3">Discography</p>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-text-primary leading-none mb-4">
                OUR<br /><span className="text-primary">MUSIC</span>
              </h1>
              <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
                Setiap lagu Kohi Sekai adalah cerita — hangat seperti secangkir kopi di pagi hari.
              </p>

              {/* Spotify CTA */}
              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                href="https://open.spotify.com/artist/5k89pO7XY1xNhiZWJ8IGaW"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 mt-8 bg-[#1DB954] hover:bg-[#17a349] text-white font-black text-sm uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg shadow-[#1DB954]/30 hover:-translate-y-0.5"
              >
                <FaSpotify size={18} />
                Dengarkan di Spotify
              </motion.a>
            </motion.div>
          </div>
        </section>

        {/* Music List */}
        <section className="py-12 sm:py-20 px-4 bg-surface">
          <div className="container mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <p className="text-xs font-black tracking-[0.5em] text-primary uppercase mb-2">Tracklist</p>
              <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">Katalog Musik</h2>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : spotifyTracks.length > 0 ? (
              <div className="space-y-4">
                {spotifyTracks.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  >
                    <iframe 
                      style={{ borderRadius: '12px' }} 
                      src={getSpotifyEmbedUrl(track.link)} 
                      width="100%" 
                      height="152" 
                      frameBorder="0" 
                      allowFullScreen="" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                    ></iframe>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-text-secondary bg-background/50 rounded-2xl border border-dashed border-border">
                Belum ada musik Spotify yang dirilis.
              </div>
            )}
          </div>
        </section>

        {/* YouTube section */}
        <section className="py-20 sm:py-32 px-4 bg-background relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

          <div className="container mx-auto max-w-7xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12"
            >
              <div>
                <p className="text-xs font-black tracking-[0.5em] text-accent uppercase mb-3">Video</p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary leading-none">
                  WATCH<br /><span className="text-accent">US IN YOUTUBE</span>
                </h2>
              </div>
              <a
                href="https://youtube.com/@KohiSekai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
              >
                YouTube Channel
                <FaExternalLinkAlt size={12} />
              </a>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : youtubeTracks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {youtubeTracks.map((track, i) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedTrack(track)}
                    className="group relative aspect-video rounded-2xl bg-surface border border-border hover:border-accent/40 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <img src={track.thumbnail_url} alt={track.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600/90 backdrop-blur flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <FaPlay size={20} className="ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="font-bold text-white line-clamp-1">{track.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i - 1) * 0.1 }}
                    className="group relative aspect-video rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-text-secondary/30">
                        <FaYoutube size={40} className="group-hover:text-[#FF0000]/50 transition-colors" />
                        <span className="text-xs font-black tracking-widest uppercase">Segera Hadir</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <KSFooter />

      <AnimatePresence>
        {selectedTrack && (
          <PlayerModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default KSMusicPage
