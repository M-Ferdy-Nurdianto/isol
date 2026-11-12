import React from 'react'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, FaImage, FaBox, FaSave, FaArrowLeft, FaTshirt, FaGem } from 'react-icons/fa'
import ImageUploadDropzone from '../../../components/ui/ImageUploadDropzone'

const MerchTab = ({
  merch,
  showMerchForm,
  editingMerch,
  merchForm,
  setMerchForm,
  merchHargaRaw,
  handleHargaChange,
  availableSizes,
  setAvailableSizes,
  merchImagePreview,
  merchFileInputRef,
  handleMerchImageChange,
  setMerchImageFile,
  setMerchImagePreview,
  merchSizeChartPreviews,
  setMerchSizeChartPreviews,
  setMerchSizeChartFiles,
  sizeChart1InputRef,
  merchSaving,
  openMerchForm,
  closeMerchForm,
  handleMerchSubmit,
  handleSizeChartChange,
  handleToggleSize,
  onToggleMerchAvailability,
  handleDeleteMerch
}) => {
  return (
    <div className="space-y-6">
      {!showMerchForm ? (
        <>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">Manajemen <span className="text-[var(--primary)]">Merchandise</span></h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Katalog & stok merchandise.</p>
            </div>
            <button
              onClick={() => openMerchForm()}
              className="bg-[var(--primary)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl font-bold hover:bg-[var(--primary)]/85 transition-all flex items-center gap-2 text-xs shadow-[0_2px_10px_rgba(232,148,74,0.25)] active:scale-95"
            >
              <FaPlus /> Tambah Merch
            </button>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--background)] text-[var(--text-secondary)] uppercase text-[11px] font-bold tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3.5">Produk</th>
                    <th className="px-4 py-3.5">Harga</th>
                    <th className="px-4 py-3.5">Stok</th>
                    <th className="px-4 py-3.5 text-center">Tersedia</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text-secondary)]">
                  {merch.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-[var(--text-secondary)]">Belum ada merchandise. Klik &quot;Tambah Merch&quot; untuk menambahkan.</td></tr>
                  ) : (
                    merch.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--primary)]/5 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[var(--background)] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--border)] p-1">
                              {item.gambar_url ? (
                                <img
                                  src={item.gambar_url}
                                  alt={item.nama}
                                  className="w-full h-full object-contain rounded-lg"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = '/images/merch/jersey.svg'
                                  }}
                                />
                              ) : (
                                <FaBox className="text-[var(--primary)] text-xl" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[var(--text-primary)] text-sm">{item.nama}</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.kategori === 'aksesoris'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                    : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/25'
                                  }`}>
                                  {item.kategori === 'aksesoris' ? 'Lanyard / Ganci / Aksesoris' : 'T-Shirt & Jersey'}
                                </span>
                              </div>
                              {item.deskripsi && <p className="text-xs text-[var(--text-secondary)] max-w-xs truncate whitespace-pre-line mt-0.5">{item.deskripsi}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[var(--primary)]">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold text-xs ${!item.stok ? 'text-[var(--text-secondary)]' : item.stok <= 5 ? 'text-amber-400' : 'text-[var(--text-secondary)]'}`}>
                            {!item.stok ? 'PO' : item.stok}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleMerchAvailability(item)}
                            className={`px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${item.available
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                              }`}
                          >
                            {item.available ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openMerchForm(item)} className="text-[var(--text-secondary)] hover:text-[var(--primary)] p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"><FaEdit className="text-base" /></button>
                            <button onClick={() => handleDeleteMerch(item.id, item.nama)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><FaTrash className="text-base" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Full-page Edit/Create Form matching EventsTab style */
        <div className="space-y-6 animate-fade-in max-w-5xl">
          <div className="flex items-center gap-3">
            <button
              onClick={closeMerchForm}
              className="text-[var(--text-secondary)] hover:text-[var(--primary)] p-2 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
              title="Kembali"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                {editingMerch ? 'Edit Merchandise' : 'Tambah Merchandise Baru'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                {editingMerch ? `Mengubah produk "${editingMerch.nama}"` : 'Isi detail produk, harga, stok, ukuran, dan foto merchandise.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleMerchSubmit} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                {/* Pilihan Kategori */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5 font-bold">Kategori Merchandise *</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMerchForm({ ...merchForm, kategori: 'baju' })}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${(merchForm.kategori || 'baju') === 'baju'
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                          : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                        }`}
                    >
                      <FaTshirt className="text-base shrink-0" />
                      <div className="text-left">
                        <p className="leading-tight font-black">T-Shirt & Jersey</p>
                        <p className={`text-[10px] font-normal leading-tight mt-0.5 ${(merchForm.kategori || 'baju') === 'baju' ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                          Kaos, jersey, hoodie, apparel
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMerchForm({ ...merchForm, kategori: 'aksesoris' })}
                      className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${merchForm.kategori === 'aksesoris'
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                          : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                        }`}
                    >
                      <FaGem className="text-base shrink-0" />
                      <div className="text-left">
                        <p className="leading-tight font-black">Lanyard, Ganci & Aksesoris</p>
                        <p className={`text-[10px] font-normal leading-tight mt-0.5 ${merchForm.kategori === 'aksesoris' ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                          Lanyard, ganci, totebag, lightstick, standee
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Nama produk *</label>
                  <input
                    required
                    value={merchForm.nama}
                    onChange={e => setMerchForm({ ...merchForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                    placeholder={(merchForm.kategori || 'baju') === 'baju' ? 'Contoh: Official Jersey Kohi Sekai 2026' : 'Contoh: Official Lanyard & Card Case / Ganci Idol'}
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Deskripsi</label>
                  <textarea
                    value={merchForm.deskripsi}
                    onChange={e => setMerchForm({ ...merchForm, deskripsi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)] resize-none"
                    placeholder="Deskripsi produk (opsional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Harga (Rp) *</label>
                    <input
                      required
                      value={merchHargaRaw}
                      onChange={e => handleHargaChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                      placeholder="150000"
                    />
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Bisa ketik 150000, 150k, atau 1.5jt</p>
                    {merchForm.harga && merchHargaRaw && !/^\d+$/.test(merchHargaRaw) && (
                      <p className="text-xs text-[var(--primary)] mt-1 font-semibold">= Rp {Number(merchForm.harga).toLocaleString('id-ID')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                      Stok <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={merchForm.stok}
                      onChange={e => setMerchForm({ ...merchForm, stok: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                      placeholder="Kosongkan jika PO"
                    />
                  </div>
                </div>

                {/* Section Ukuran Tersedia & Status Tampil */}
                <div className="pt-3 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-[var(--text-secondary)] font-bold">
                      {merchForm.kategori === 'aksesoris' ? 'Pengaturan Produk' : 'Ukuran tersedia'}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="merch-available"
                        checked={merchForm.available}
                        onChange={e => setMerchForm({ ...merchForm, available: e.target.checked })}
                        className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[var(--text-secondary)]">Tampilkan di Shop</span>
                    </label>
                  </div>

                  {merchForm.kategori === 'aksesoris' ? (
                    <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-center gap-2.5">
                      <FaGem className="text-[var(--primary)] shrink-0" />
                      <span>Produk aksesoris tidak memerlukan pilihan ukuran pakaian (All Size / Satuan).</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(sz => {
                          const isActive = availableSizes.split(',').map(s => s.trim()).includes(sz)
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleToggleSize(sz)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isActive
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm'
                                  : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:text-[var(--text-primary)]'
                                }`}
                            >
                              {sz}
                            </button>
                          )
                        })}
                      </div>

                      <input
                        value={availableSizes}
                        onChange={e => setAvailableSizes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                        placeholder="Atau ketik sendiri (dipisahkan koma, misal: All Size, Free Size)"
                      />
                      <p className="text-[10px] text-[var(--text-secondary)] italic">Pilihan ukuran di atas akan otomatis menambahkan atau menghapus dari kolom ini.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Upload Foto Produk & Foto Size Chart */}
              <div className="space-y-4">
                <div>
                  <ImageUploadDropzone
                    label="Foto produk *"
                    previewUrl={merchImagePreview}
                    onImageChange={(compressedWebpFile, blobUrl) => {
                      setMerchImageFile(compressedWebpFile)
                      setMerchImagePreview(blobUrl)
                    }}
                    onRemove={() => {
                      setMerchImageFile(null)
                      setMerchImagePreview('')
                      if (merchFileInputRef.current) merchFileInputRef.current.value = ''
                    }}
                    hint="Drag & drop foto produk ke sini. Auto-kompres WebP (1:1 thumbnail, klik untuk perbesar)."
                  />
                  <input ref={merchFileInputRef} type="file" accept="image/*" onChange={handleMerchImageChange} className="hidden" />
                </div>

                {merchForm.kategori !== 'aksesoris' && (
                  <div>
                    <ImageUploadDropzone
                      label="Foto size chart (opsional)"
                      previewUrl={merchSizeChartPreviews[0]}
                      onImageChange={(compressedWebpFile, blobUrl) => {
                        setMerchSizeChartFiles([compressedWebpFile])
                        setMerchSizeChartPreviews([blobUrl])
                      }}
                      onRemove={() => {
                        setMerchSizeChartPreviews([''])
                        setMerchSizeChartFiles([null])
                        if (sizeChart1InputRef.current) sizeChart1InputRef.current.value = ''
                      }}
                      hint="Panduan ukuran kaos / jersey. Drag & drop untuk ganti."
                      compact={true}
                    />
                    <input ref={sizeChart1InputRef} type="file" accept="image/*" onChange={(e) => handleSizeChartChange(e, 0)} className="hidden" />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--border)] justify-end">
              <button
                type="button"
                onClick={closeMerchForm}
                className="px-5 py-2.5 bg-[var(--border)] text-[var(--text-secondary)] rounded-xl font-bold text-xs hover:bg-[var(--primary)]/15 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={merchSaving}
                className="px-6 py-2.5 bg-[var(--primary)] text-[var(--text-primary)] rounded-xl font-bold text-xs hover:bg-[var(--primary)]/85 disabled:opacity-50 flex items-center gap-2 shadow-[0_2px_10px_rgba(232,148,74,0.25)] transition-all"
              >
                {merchSaving ? 'Menyimpan...' : (editingMerch ? <><FaSave /> Update Merchandise</> : <><FaPlus /> Tambah Merchandise</>)}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default MerchTab



