import React, { useState, useEffect, useRef } from 'react'
import { FaPlus, FaEdit, FaTrash, FaYoutube, FaSpotify, FaImage, FaArrowLeft, FaGripVertical } from 'react-icons/fa'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Swal from 'sweetalert2'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import DragDropImageUpload from '../components/DragDropImageUpload'

const extractYouTubeID = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : false
}

const SortableMusicCard = ({ item, openForm, handleDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)] group transition-all duration-300 hover:border-white/20 relative">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-3 left-3 w-8 h-8 bg-black/80 border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white cursor-grab active:cursor-grabbing z-20 shadow-lg hover:bg-white/10 transition-colors"
        title="Drag untuk mengubah urutan"
      >
        <FaGripVertical />
      </div>

      <div className="relative aspect-video bg-zinc-900 border-b border-white/10 flex items-center justify-center overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="text-zinc-600">
            <FaImage size={40} />
          </div>
        )}
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1.5 shadow-lg">
          {item.platform === 'youtube' ? <FaYoutube className="text-red-500" /> : <FaSpotify className="text-[#1DB954]" />}
          <span className="capitalize">{item.platform}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-white truncate">{item.title}</h3>
        <div className="flex gap-2 mt-5">
          <button onClick={() => openForm(item)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2 border border-white/10 transition-colors">
            <FaEdit /> Edit
          </button>
          <button onClick={() => handleDelete(item.id, item.title)} className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 flex items-center justify-center transition-colors">
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  )
}

const MusicTab = () => {
  const [music, setMusic] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  
  const [formData, setFormData] = useState({
    platform: 'youtube',
    title: '',
    link: '',
    thumbnail_url: '',
    status: 'published',
    order: 0
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let newArray = []
    setMusic((items) => {
      const itemToMove = items.find(i => i.id === active.id)
      if (!itemToMove) return items

      let spotifyList = items.filter(i => i.platform === 'spotify')
      let youtubeList = items.filter(i => i.platform === 'youtube')

      if (itemToMove.platform === 'spotify') {
        const oldIndex = spotifyList.findIndex(i => i.id === active.id)
        const newIndex = spotifyList.findIndex(i => i.id === over.id)
        if (newIndex !== -1) {
          spotifyList = arrayMove(spotifyList, oldIndex, newIndex)
        }
      } else {
        const oldIndex = youtubeList.findIndex(i => i.id === active.id)
        const newIndex = youtubeList.findIndex(i => i.id === over.id)
        if (newIndex !== -1) {
          youtubeList = arrayMove(youtubeList, oldIndex, newIndex)
        }
      }

      newArray = [...spotifyList, ...youtubeList]
      return newArray
    })

    if (newArray.length === 0) return

    try {
      const payload = newArray.map((item, idx) => ({ id: item.id, order: idx }))
      await api.patch('/music/bulk/reorder', { items: payload })
    } catch (error) {
      showToast.error('Gagal menyimpan urutan baru')
      fetchMusic()
    }
  }

  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchMusic()
  }, [])

  const fetchMusic = async () => {
    try {
      setLoading(true)
      const res = await api.get('/music?isAdmin=true')
      setMusic(res.data.data || [])
    } catch (error) {
      console.error(error)
      showToast.error('Gagal mengambil data musik')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkChange = async (e) => {
    const link = e.target.value
    setFormData(prev => ({ ...prev, link }))

    if (formData.platform === 'youtube') {
      const videoId = extractYouTubeID(link)
      if (videoId) {
        setFormData(prev => ({ ...prev, thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }))
        try {
          const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(link)}&format=json`)
          const data = await res.json()
          if (data.title) {
            setFormData(prev => ({ ...prev, title: data.title }))
          }
        } catch(err) { console.error(err) }
      } else {
        setFormData(prev => ({ ...prev, thumbnail_url: '' }))
      }
    } else if (formData.platform === 'spotify') {
      if (link.includes('spotify.com')) {
        try {
          const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`)
          const data = await res.json()
          setFormData(prev => ({ 
            ...prev, 
            title: data.title || prev.title,
            thumbnail_url: data.thumbnail_url || prev.thumbnail_url 
          }))
          if (data.thumbnail_url) {
            setCoverPreview(data.thumbnail_url)
          }
        } catch(err) { console.error(err) }
      }
    }
  }

  const handlePlatformChange = (platform) => {
    setFormData(prev => ({ ...prev, platform, thumbnail_url: '', link: '' }))
    setCoverFile(null)
    setCoverPreview('')
  }

  const openForm = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        platform: item.platform,
        title: item.title,
        link: item.link,
        thumbnail_url: item.thumbnail_url || '',
        order: item.order || 0
      })
      setCoverPreview(item.platform === 'spotify' ? (item.thumbnail_url || '') : '')
    } else {
      setEditingItem(null)
      setFormData({
        platform: 'youtube',
        title: '',
        link: '',
        thumbnail_url: '',
        order: music.length
      })
      setCoverPreview('')
    }
    setCoverFile(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleCoverChange = (file) => {
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.link) {
      return showToast.warning('Title dan Link wajib diisi')
    }

    if (formData.platform === 'youtube' && !extractYouTubeID(formData.link)) {
      return showToast.warning('Link YouTube tidak valid')
    }

    if (formData.platform === 'spotify' && !formData.link.includes('spotify.com')) {
      return showToast.warning('Link Spotify tidak valid')
    }

    setSaving(true)
    try {
      let finalThumbnailUrl = formData.thumbnail_url

      if (formData.platform === 'spotify' && coverFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', coverFile)
        const uploadRes = await api.post('/upload/music-cover', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        finalThumbnailUrl = uploadRes.data.data.url
      }

      const payload = {
        ...formData,
        thumbnail_url: finalThumbnailUrl,
        order: parseInt(formData.order) || 0
      }

      if (editingItem) {
        await api.patch(`/music/${editingItem.id}`, payload)
        showToast.success('Musik berhasil diupdate')
      } else {
        await api.post('/music', payload)
        showToast.success('Musik berhasil ditambahkan')
      }
      closeForm()
      fetchMusic()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal menyimpan musik')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: 'Hapus Musik?',
      text: `Yakin ingin menghapus ${title}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus'
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/music/${id}`)
      showToast.success('Musik dihapus')
      fetchMusic()
    } catch (error) {
      showToast.error('Gagal menghapus musik')
    }
  }

  return (
    <div className="space-y-6">
      {!showForm ? (
        <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Music CMS
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Kelola portofolio musik (YouTube & Spotify)</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(240,168,104,0.4)]"
        >
          <FaPlus /> Tambah Musik
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-primary">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={music.map(i => i.id)} strategy={rectSortingStrategy}>
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaSpotify className="text-[#1DB954]" /> Spotify Tracks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {music.filter(m => m.platform === 'spotify').map(item => (
                  <SortableMusicCard key={item.id} item={item} openForm={openForm} handleDelete={handleDelete} />
                ))}
                {music.filter(m => m.platform === 'spotify').length === 0 && (
                  <div className="col-span-full py-10 text-center text-zinc-500 rounded-2xl border border-dashed border-white/10 bg-white/5">
                    Belum ada data Spotify
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaYoutube className="text-red-500" /> YouTube Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {music.filter(m => m.platform === 'youtube').map(item => (
                  <SortableMusicCard key={item.id} item={item} openForm={openForm} handleDelete={handleDelete} />
                ))}
                {music.filter(m => m.platform === 'youtube').length === 0 && (
                  <div className="col-span-full py-10 text-center text-zinc-500 rounded-2xl border border-dashed border-white/10 bg-white/5">
                    Belum ada data YouTube
                  </div>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
      </>
      ) : (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={closeForm}
              className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Kembali"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {editingItem ? 'Edit Musik' : 'Tambah Musik Baru'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                {editingItem ? 'Ubah detail lagu / video musik.' : 'Tambahkan lagu atau video musik ke halaman Music.'}
              </p>
            </div>
          </div>
            
          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-zinc-300">Platform</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('youtube')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${
                      formData.platform === 'youtube' 
                      ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <FaYoutube size={20} /> YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformChange('spotify')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${
                      formData.platform === 'spotify' 
                      ? 'bg-[#1DB954]/10 border-[#1DB954]/50 text-[#1DB954]' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <FaSpotify size={20} /> Spotify
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-300">Judul (Title) <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="Contoh: Close Friend"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-300">Link {formData.platform === 'youtube' ? 'Video' : 'Track/Album'} <span className="text-red-400">*</span></label>
                <input
                  type="url"
                  required
                  value={formData.link}
                  onChange={handleLinkChange}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder={formData.platform === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://open.spotify.com/track/...'}
                />
              </div>

              {formData.platform === 'youtube' && formData.thumbnail_url && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-300">Preview Thumbnail</label>
                  <div className="aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {formData.platform === 'spotify' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-zinc-300">Cover Artwork (Opsional)</label>
                  <DragDropImageUpload
                    onImageChange={handleCoverChange}
                    previewUrl={coverPreview}
                    onRemove={() => { setCoverFile(null); setCoverPreview(''); setFormData(p => ({...p, thumbnail_url: ''})) }}
                  />
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={closeForm} className="px-6 py-2.5 rounded-xl font-bold text-zinc-300 hover:bg-white/5 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
        </div>
      )}
    </div>
  )
}

export default MusicTab
