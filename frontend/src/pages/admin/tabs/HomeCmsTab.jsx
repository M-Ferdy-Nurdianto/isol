import React, { useState, useEffect } from 'react'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import { getAssetPath } from '../../../lib/pathUtils'
import { FaSave, FaUpload, FaTrash, FaPlus, FaCrop } from 'react-icons/fa'
import ImageCropperModal from '../modals/ImageCropperModal'
import DragDropZone from '../components/DragDropZone'

const HomeCmsTab = () => {
  const [subTab, setSubTab] = useState('hero')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({})
  const [uploadingGroupPhoto, setUploadingGroupPhoto] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState(null)

  const [aboutCropModalOpen, setAboutCropModalOpen] = useState(false)
  const [aboutCropImageSrc, setAboutCropImageSrc] = useState(null)
  const [aboutCropIndex, setAboutCropIndex] = useState(null)

  const [heroSection, setHeroSection] = useState({ 
    title: '', 
    subtitle: '', 
    tagline: '', 
    cta_1_text: '', 
    cta_1_link: '', 
    cta_2_text: '', 
    cta_2_link: '',
    corner_left_1: '',
    corner_left_2: '',
    corner_right_1: '',
    corner_right_2: ''
  })
  const [membersSection, setMembersSection] = useState({ title: '', description: '' })
  const [newsTitle, setNewsTitle] = useState('News')
  const [newsItems, setNewsItems] = useState([])
  const [eventsSection, setEventsSection] = useState({ empty_text: '' })
  const [socialLinks, setSocialLinks] = useState([
    { platform: 'Instagram', url: '' },
    { platform: 'TikTok', url: '' },
    { platform: 'YouTube', url: '' },
    { platform: 'Twitter', url: '' },
    { platform: 'WhatsApp', url: '' },
    { platform: 'Spotify', url: '' }
  ])
  const [faqItems, setFaqItems] = useState([{ q: '', a: '' }])
  const [faqCp, setFaqCp] = useState({ name: '', phone: '' })
  const [footerSection, setFooterSection] = useState({ brand_description: '', copyright_text: '' })
  const [groupPhoto, setGroupPhoto] = useState({ url: '', overlay_text: '', overlay_desc: '' })
  const [aboutUs, setAboutUs] = useState({ title: '', subtitle: '', description: '', images: [] })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get('/config')
      const configData = res.data?.data || {}
      
      const parseJson = (val) => {
        if (!val) return {}
        if (typeof val === 'string') {
          try { return JSON.parse(val) } catch(e) { return {} }
        }
        return val
      }

      setHeroSection(parseJson(configData.hero_settings) || { title: '', subtitle: '', tagline: '', cta_1_text: '', cta_1_link: '', cta_2_text: '', cta_2_link: '', corner_left_1: '', corner_left_2: '', corner_right_1: '', corner_right_2: '' })
      setMembersSection(parseJson(configData.members_section) || { title: '', description: '' })
      setNewsTitle(configData.news_title || 'News')
      const parsedNews = parseJson(configData.news_items)
      setNewsItems(Array.isArray(parsedNews) ? parsedNews : [])
      setEventsSection(parseJson(configData.events_section) || { empty_text: '' })
      const parsedSocial = parseJson(configData.social_links)
      const defaultPlatforms = ['Instagram', 'TikTok', 'YouTube', 'Twitter', 'WhatsApp', 'Spotify']
      const initialSocials = defaultPlatforms.map(platform => {
        const existing = Array.isArray(parsedSocial) ? parsedSocial.find(s => s.platform === platform || (platform === 'Twitter' && (s.platform === 'Twitter / X' || s.platform === 'Twitter'))) : null;
        return { platform, url: existing ? existing.url : '' }
      })
      setSocialLinks(initialSocials)
      const parsedFaq = parseJson(configData.faq_items)
      if (Array.isArray(parsedFaq) && parsedFaq.length > 0) {
        setFaqItems(parsedFaq)
      } else {
        setFaqItems([{ q: '', a: '' }])
      }
      const parsedCp = parseJson(configData.faq_cp)
      if (parsedCp) {
        setFaqCp(parsedCp)
      }
      setFooterSection(parseJson(configData.footer_settings) || { brand_description: '', copyright_text: '' })
      setGroupPhoto(parseJson(configData.group_photo) || { url: '', overlay_text: '', overlay_desc: '' })
      setAboutUs(parseJson(configData.about_us) || { title: '', subtitle: '', description: '', images: [] })

      setConfig(configData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFaq = async () => {
    // filter out empty
    const filtered = faqItems.filter(item => item.q.trim() !== '' && item.a.trim() !== '')
    try {
      setSaving(true)
      await api.patch('/config', {
        faq_items: JSON.stringify(filtered),
        faq_cp: JSON.stringify(faqCp)
      })
      showToast.success('FAQ berhasil disimpan!')
      fetchConfig()
    } catch (err) {
      console.error(err)
      showToast.error('Gagal menyimpan FAQ')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFaqItem = () => {
    setFaqItems([...faqItems, { q: '', a: '' }])
  }

  const handleRemoveFaqItem = (index) => {
    const newItems = [...faqItems]
    newItems.splice(index, 1)
    if (newItems.length === 0) newItems.push({ q: '', a: '' })
    setFaqItems(newItems)
  }

  const handleChangeFaqItem = (index, field, value) => {
    const newItems = [...faqItems]
    newItems[index][field] = value
    setFaqItems(newItems)
  }

  const handleSaveSocial = async () => {
    try {
      setSaving(true)
      await api.patch('/config', {
        social_links: JSON.stringify(socialLinks)
      })
      showToast.success('Social Links berhasil disimpan!')
      fetchConfig()
    } catch (err) {
      showToast.error('Gagal menyimpan Social Links')
    } finally {
      setSaving(false)
    }
  }



  const updateSocialLink = (index, field, value) => {
    const newLinks = [...socialLinks]
    newLinks[index][field] = value
    setSocialLinks(newLinks)
  }

  const handleSave = async (key, value) => {
    try {
      setSaving(true)
      await api.patch('/config', {
        [key]: JSON.stringify(value)
      })
      showToast.success('Konfigurasi berhasil disimpan!')
      fetchConfig()
    } catch (error) {
      showToast.error('Gagal menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  const handleGroupPhotoFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropImageSrc(reader.result)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleGroupPhotoCropComplete = async (file) => {
    setCropModalOpen(false)
    setCropImageSrc(null)
    if (!file) return
    try {
      setUploadingGroupPhoto(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/member-image?type=hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const imageUrl = res.data?.data?.url
      if (imageUrl) {
        setGroupPhoto(prev => {
          const updated = { ...prev, url: imageUrl }
          handleSave('group_photo', updated)
          return updated
        })
      }
    } catch (err) {
      showToast.error('Gagal upload foto grup')
    } finally {
      setUploadingGroupPhoto(false)
    }
  }

  const handleNewsImageUpload = async (e, index) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/member-image?type=news', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const imageUrl = res.data?.data?.url
      if (imageUrl) {
        const newItems = [...newsItems]
        newItems[index].image_url = imageUrl
        setNewsItems(newItems)
      }
    } catch (err) {
      showToast.error('Gagal upload foto berita')
    }
  }

  const handleAboutFileSelect = (e) => {
    const file = e.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAboutCropImageSrc(reader.result)
      setAboutCropIndex(null)
      setAboutCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleEditAboutCrop = (index) => {
    const imgUrl = aboutUs.images?.[index]
    if (!imgUrl) return
    setAboutCropImageSrc(getAssetPath(imgUrl))
    setAboutCropIndex(index)
    setAboutCropModalOpen(true)
  }

  const handleAboutCropComplete = async (croppedFile) => {
    setAboutCropModalOpen(false)
    setAboutCropImageSrc(null)
    if (!croppedFile) return
    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('file', croppedFile)
      const res = await api.post('/upload/member-image?type=about', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const imageUrl = res.data?.data?.url
      if (imageUrl) {
        let updatedAboutUs = null
        setAboutUs(prev => {
          const newImages = [...(prev.images || [])]
          if (aboutCropIndex !== null && aboutCropIndex >= 0) {
            newImages[aboutCropIndex] = imageUrl
          } else {
            newImages.push(imageUrl)
          }
          updatedAboutUs = { ...prev, images: newImages.slice(0, 3) }
          return updatedAboutUs
        })

        // Auto save to DB
        setTimeout(() => {
          setAboutUs(current => {
            handleSave('about_us', current)
            return current
          })
        }, 100)

        showToast.success('Foto carousel berhasil di-crop & disimpan!')
      }
    } catch (err) {
      showToast.error('Gagal memproses & upload foto')
    } finally {
      setSaving(false)
      setAboutCropIndex(null)
    }
  }

  const removeAboutImage = (index) => {
    setAboutUs(prev => {
      const newImages = [...(prev.images || [])]
      newImages.splice(index, 1)
      const updated = { ...prev, images: newImages }
      handleSave('about_us', updated)
      return updated
    })
  }

  const addNewsItem = () => {
    if (newsItems.length >= 9) {
      showToast.error('Maksimal 9 berita')
      return
    }
    setNewsItems([...newsItems, { id: Date.now().toString(), title: '', summary: '', image_url: '', ig_link: '' }])
  }

  const removeNewsItem = (index) => {
    setNewsItems(newsItems.filter((_, i) => i !== index))
  }

  const updateNewsItem = (index, field, value) => {
    const newItems = [...newsItems]
    newItems[index][field] = value
    setNewsItems(newItems)
  }

  const handleSaveNews = async () => {
    try {
      setSaving(true)
      await api.patch('/config', {
        news_title: newsTitle,
        news_items: JSON.stringify(newsItems)
      })
      showToast.success('Berita berhasil disimpan!')
      fetchConfig()
    } catch (error) {
      showToast.error('Gagal menyimpan berita')
    } finally {
      setSaving(false)
    }
  }



  const tabs = [
    { id: 'about', label: 'About Us Page' },
    { id: 'news', label: 'News Carousel' },
    { id: 'faq', label: 'FAQ Text' },
    { id: 'social', label: 'Social Text' },
    { id: 'footer', label: 'Footer Text' },
  ]

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border p-5 rounded-2xl flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${subTab === t.id ? 'bg-primary text-white' : 'bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border">
            <h2 className="text-xl font-bold">Hero Section Settings</h2>
            <button onClick={() => handleSave('hero_settings', heroSection)} disabled={saving} className="bg-primary text-[var(--text-primary)] px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <FaSave /> Simpan
            </button>
          </div>

          {/* Main Texts Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-xl font-bold">Judul & Teks Utama</h2>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Tagline (Teks kecil di atas judul)</label>
              <input type="text" value={heroSection.tagline} onChange={e => setHeroSection({...heroSection, tagline: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: KAMI ADALAH KOHI SEKAI" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Judul Utama</label>
              <input type="text" value={heroSection.title} onChange={e => setHeroSection({...heroSection, title: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: KOHI SEKAI" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Subtitle (Deskripsi di bawah judul)</label>
              <textarea value={heroSection.subtitle} onChange={e => setHeroSection({...heroSection, subtitle: e.target.value})} className="w-full bg-background border border-border rounded-lg p-2 h-20" placeholder="Contoh: Tiga rasa, satu dunia..." />
            </div>
          </div>

          {/* Decorative Corners Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
            <h2 className="text-xl font-bold">Teks Dekorasi (Pojok Layar)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Kiri Atas 1 (Baris 1)</label>
                <input type="text" value={heroSection.corner_left_1} onChange={e => setHeroSection({...heroSection, corner_left_1: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="コーヒーの世界へ" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Kiri Atas 2 (Baris 2)</label>
                <input type="text" value={heroSection.corner_left_2} onChange={e => setHeroSection({...heroSection, corner_left_2: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Kohi Sekai 2026" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Kanan Atas 1 (Baris 1)</label>
                <input type="text" value={heroSection.corner_right_1} onChange={e => setHeroSection({...heroSection, corner_right_1: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="ラテ · マキアート" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Kanan Atas 2 (Baris 2)</label>
                <input type="text" value={heroSection.corner_right_2} onChange={e => setHeroSection({...heroSection, corner_right_2: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="アフォガート" />
              </div>
            </div>
          </div>

          {/* Hero Image Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Hero / Group Image (16:9 Landscape)</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Foto ini akan ditampilkan di bawah judul utama (di atas bagian Member).
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left: Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)]">Preview Gambar Saat Ini</label>
                <div className="w-full aspect-video bg-background border border-border border-dashed rounded-xl overflow-hidden flex items-center justify-center">
                  {groupPhoto.url ? (
                    <img src={groupPhoto.url} alt="Hero Image" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">Belum ada gambar</span>
                  )}
                </div>
              </div>

              {/* Right: Upload & Texts */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">Upload Foto Baru (Otomatis WebP & Crop 16:9)</label>
                  <DragDropZone onFileDrop={handleGroupPhotoFileSelect} className="w-full">
                    <label className="inline-flex items-center gap-2 px-4 py-3 bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary text-sm font-bold rounded-xl cursor-pointer transition-colors w-full justify-center">
                      <FaUpload /> {uploadingGroupPhoto ? 'Uploading...' : 'Pilih File / Tarik Ke Sini'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleGroupPhotoFileSelect} disabled={uploadingGroupPhoto} />
                    </label>
                  </DragDropZone>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-background border border-border rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-primary">Pengaturan Overlay Teks</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                      Teks ini akan melayang di atas foto bagian kiri bawah. Saat pengguna mengarahkan kursor (hover) ke foto, teks ini akan menghilang.
                    </p>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Judul Overlay</label>
                      <input 
                        type="text" 
                        value={groupPhoto.overlay_text || ''} 
                        onChange={e => setGroupPhoto({...groupPhoto, overlay_text: e.target.value})} 
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" 
                        placeholder="KOHI SEKAI" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Deskripsi Singkat (Opsional)</label>
                      <textarea 
                        value={groupPhoto.overlay_desc || ''} 
                        onChange={e => setGroupPhoto({...groupPhoto, overlay_desc: e.target.value})} 
                        className="w-full bg-surface border border-border rounded-lg p-2 h-16 text-sm" 
                        placeholder="Tiga rasa kopi yang berbeda, satu dunia..." 
                      />
                    </div>
                    <button 
                      onClick={() => handleSave('group_photo', groupPhoto)} 
                      disabled={saving} 
                      className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <FaSave /> Simpan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'about' && (
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">About Us Page Settings</h2>
            <button onClick={() => handleSave('about_us', aboutUs)} disabled={saving} className="bg-primary text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <FaSave /> Simpan
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Judul (Title)</label>
              <input type="text" value={aboutUs.title || ''} onChange={e => setAboutUs({...aboutUs, title: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="KOHI SEKAI" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Subtitle (Kanji/Jepang)</label>
              <input type="text" value={aboutUs.subtitle || ''} onChange={e => setAboutUs({...aboutUs, subtitle: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="コーヒーの世界へようこそ" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Deskripsi Lengkap</label>
              <textarea value={aboutUs.description || ''} onChange={e => setAboutUs({...aboutUs, description: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 h-32 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Kohi Sekai adalah..." />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Tahun Berdiri (Since)</label>
              <input type="text" value={aboutUs.since || '2026'} onChange={e => setAboutUs({...aboutUs, since: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="2026" />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">Carousel Foto Grup (Maksimal 3 Gambar)</h3>
                <span className="text-xs text-[var(--text-secondary)]">Rasio Crop: 16:9</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-3">Setiap foto dapat disesuaikan crop & zoom-nya agar posisi di carousel About Us selalu pas.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {(aboutUs.images || []).map((imgUrl, i) => (
                  <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-[var(--background)]">
                    <img src={getAssetPath(imgUrl)} alt={`Foto Grup ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button 
                        type="button"
                        onClick={() => handleEditAboutCrop(i)}
                        className="bg-primary hover:bg-primary/90 text-[var(--text-primary)] px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Atur Crop & Zoom"
                      >
                        <FaCrop size={12} /> Atur Crop
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeAboutImage(i)} 
                        className="bg-red-500 hover:bg-red-600 text-[var(--text-primary)] p-2 rounded-lg text-xs transition-colors"
                        title="Hapus Foto"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {(aboutUs.images || []).length < 3 && (
                <DragDropZone onFileDrop={handleAboutFileSelect} className="w-full">
                  <label className="inline-flex items-center gap-2 px-3 py-3 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl cursor-pointer w-full justify-center transition-colors">
                    <FaUpload /> Upload & Crop Foto Grup Baru ({(aboutUs.images || []).length}/3)
                    <input type="file" className="hidden" accept="image/*" onChange={handleAboutFileSelect} />
                  </label>
                </DragDropZone>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'news' && (
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">News Carousel Settings</h2>
            <button onClick={handleSaveNews} disabled={saving} className="bg-primary text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <FaSave /> Simpan
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Daftar Berita (Maksimal 9)</h3>
              {newsItems.length < 9 && (
                <button onClick={addNewsItem} className="text-xs bg-[var(--border)] hover:bg-[var(--border)] px-3 py-1.5 rounded-lg font-bold">
                  + Tambah Berita
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {(Array.isArray(newsItems) ? newsItems : []).map((item, index) => (
                <div key={item.id || index} className="bg-background border border-border p-4 rounded-xl relative">
                  <button onClick={() => removeNewsItem(index)} className="absolute top-4 right-4 text-xs text-red-400 hover:text-red-300 font-bold">
                    Hapus
                  </button>
                  <h4 className="text-sm font-bold mb-3 text-primary">Berita {index + 1}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Judul Berita</label>
                        <input type="text" value={item.title} onChange={e => updateNewsItem(index, 'title', e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Judul..." />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Link Instagram (Opsional)</label>
                        <input type="text" value={item.ig_link} onChange={e => updateNewsItem(index, 'ig_link', e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="https://instagram.com/..." />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Isi Singkat (Summary)</label>
                        <textarea value={item.summary} onChange={e => updateNewsItem(index, 'summary', e.target.value)} className="w-full bg-surface border border-border rounded-lg p-2 text-sm h-20" placeholder="Isi berita..." />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Gambar Banner (Landscape)</label>
                      {item.image_url ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border mb-2">
                          <img src={item.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-surface border border-dashed border-border rounded-lg flex items-center justify-center mb-2">
                          <span className="text-xs text-[var(--text-secondary)]">Belum ada gambar</span>
                        </div>
                      )}
                      <DragDropZone onFileDrop={(e) => handleNewsImageUpload(e, index)} className="w-full">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg cursor-pointer w-full justify-center">
                          <FaUpload /> Upload / Tarik Gambar
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleNewsImageUpload(e, index)} />
                        </label>
                      </DragDropZone>
                    </div>
                  </div>
                </div>
              ))}
              
              {newsItems.length === 0 && (
                <div className="text-center py-8 text-[var(--text-secondary)] text-sm">Belum ada berita. Klik tombol + Tambah Berita.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'faq' && (
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">FAQ Section Settings</h2>
            <button onClick={handleSaveFaq} disabled={saving} className="bg-primary text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <FaSave /> Simpan
            </button>
          </div>
          
          <div className="space-y-6 mt-4">
            {faqItems.map((item, i) => (
              <div key={i} className="p-4 border border-border rounded-lg bg-background space-y-4 relative">
                <button 
                  onClick={() => handleRemoveFaqItem(i)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                  title="Hapus"
                >
                  <FaTrash />
                </button>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Pertanyaan (Q)</label>
                  <input type="text" value={item.q} onChange={e => handleChangeFaqItem(i, 'q', e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: Bagaimana cara membeli tiket?" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Jawaban (A)</label>
                  <textarea value={item.a} onChange={e => handleChangeFaqItem(i, 'a', e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 h-24 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: Kamu bisa memesan di halaman shop." />
                </div>
              </div>
            ))}
            
            <button onClick={handleAddFaqItem} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-[var(--text-secondary)] hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2">
              <FaPlus /> Tambah Pertanyaan
            </button>
          </div>
          
          <div className="border-t border-border pt-6 space-y-4">
            <h3 className="font-bold text-lg">Contact Person (WhatsApp)</h3>
            <p className="text-xs text-[var(--text-secondary)]">Atur Contact Person (CP) yang ditampilkan di bawah tombol "Tanya via IG".</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Nama CP (opsional)</label>
                <input type="text" value={faqCp.name || ''} onChange={e => setFaqCp({...faqCp, name: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: Kiki" />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Nomor WhatsApp CP (opsional)</label>
                <input type="text" value={faqCp.phone || ''} onChange={e => setFaqCp({...faqCp, phone: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Contoh: 6281234567890" />
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'social' && (
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Social Media Settings</h2>
            <button onClick={handleSaveSocial} disabled={saving} className="bg-primary text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <FaSave /> Simpan
            </button>
          </div>
          
          <div className="space-y-4 mt-4">
            {socialLinks.map((link, index) => (
              <div key={index} className="bg-background border border-border p-4 rounded-xl relative flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-1/3">
                  <div className="font-bold text-text-primary pl-2">{link.platform}</div>
                </div>
                <div className="w-full sm:w-2/3">
                  <input 
                    type="text" 
                    value={link.url} 
                    onChange={e => updateSocialLink(index, 'url', e.target.value)} 
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" 
                    placeholder={`Kosongkan untuk redirect ke IG Kohi Sekai`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'footer' && (
        <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
          <h2 className="text-xl font-bold">Footer Settings</h2>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Brand Description</label>
            <textarea value={footerSection.brand_description} onChange={e => setFooterSection({...footerSection, brand_description: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 h-24 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Copyright Text</label>
            <input type="text" value={footerSection.copyright_text} onChange={e => setFooterSection({...footerSection, copyright_text: e.target.value})} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors" />
          </div>
          <button onClick={() => handleSave('footer_settings', footerSection)} disabled={saving} className="bg-primary text-[var(--text-primary)] px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <FaSave /> Simpan
          </button>
        </div>
      )}

      {/* Image Cropper Modal (Group Photo) */}
      <ImageCropperModal
        isOpen={cropModalOpen}
        onClose={() => { setCropModalOpen(false); setCropImageSrc(null); }}
        imageSrc={cropImageSrc}
        aspect={16 / 9}
        onCropComplete={handleGroupPhotoCropComplete}
      />

      {/* About Us Image Cropper Modal */}
      <ImageCropperModal
        isOpen={aboutCropModalOpen}
        onClose={() => { setAboutCropModalOpen(false); setAboutCropImageSrc(null); setAboutCropIndex(null); }}
        imageSrc={aboutCropImageSrc}
        aspect={16 / 9}
        onCropComplete={handleAboutCropComplete}
      />
    </div>
  )
}

export default HomeCmsTab



