import React from 'react'
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, FaImage, FaBox, FaSave, FaArrowLeft } from 'react-icons/fa'

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
                            <div className="w-12 h-12 rounded-xl bg-[var(--background)] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--border)]">
                              {item.gambar_url ? <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" /> : <FaBox className="text-[var(--text-secondary)] text-xl" />}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-primary)] text-sm">{item.nama}</p>
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
                            className={`px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
                              item.available
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
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Nama produk *</label>
                  <input
                    required
                    value={merchForm.nama}
                    onChange={e => setMerchForm({ ...merchForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 text-xs focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Contoh: Kaos Kohi Sekai"
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
                    <label className="block text-xs text-[var(--text-secondary)]">Ukuran tersedia</label>
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

                  <div className="flex flex-wrap gap-2">
                    {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(sz => {
                      const isActive = availableSizes.split(',').map(s => s.trim()).includes(sz)
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(232,148,74,0.3)]'
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
                    placeholder="Atau ketik sendiri (dipisahkan koma)"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] italic">Pilihan ukuran di atas akan otomatis menambahkan atau menghapus dari kolom ini.</p>
                </div>
              </div>

              {/* Kolom Kanan: Upload Foto Produk & Foto Size Chart */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Foto produk</label>
                  <div
                    onClick={() => merchFileInputRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border)] bg-[var(--background)] rounded-2xl p-4 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all min-h-[170px] flex flex-col items-center justify-center gap-2"
                  >
                    {merchImagePreview ? (
                      <img src={merchImagePreview} alt="Preview" className="max-h-[170px] max-w-full object-contain rounded-xl" />
                    ) : (
                      <>
                        <FaCloudUploadAlt className="text-4xl text-[var(--text-secondary)]" />
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Klik untuk upload foto produk</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">JPG, PNG, WebP (maks. 10MB)</p>
                      </>
                    )}
                  </div>
                  <input ref={merchFileInputRef} type="file" accept="image/*" onChange={handleMerchImageChange} className="hidden" />
                  {merchImagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setMerchImageFile(null)
                        setMerchImagePreview('')
                        if (merchFileInputRef.current) merchFileInputRef.current.value = ''
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold mt-2"
                    >
                      <FaTimes /> Hapus Foto
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                    Foto size chart <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional)</span>
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => sizeChart1InputRef.current?.click()}
                      className="border-2 border-dashed border-[var(--border)] bg-[var(--background)] rounded-2xl p-3 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all min-h-[120px] flex flex-col items-center justify-center gap-1.5"
                    >
                      {merchSizeChartPreviews[0] ? (
                        <img src={merchSizeChartPreviews[0]} alt="Size Chart" className="max-h-[110px] max-w-full object-contain rounded-lg" />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-3xl text-[var(--text-secondary)]" />
                          <p className="text-xs text-[var(--text-secondary)] font-medium">Klik untuk upload size chart</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">Panduan ukuran kaos / apparel</p>
                        </>
                      )}
                    </div>
                    {merchSizeChartPreviews[0] && (
                      <button
                        type="button"
                        onClick={() => {
                          setMerchSizeChartPreviews([''])
                          setMerchSizeChartFiles([null])
                          if (sizeChart1InputRef.current) sizeChart1InputRef.current.value = ''
                        }}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold w-full justify-center mt-1"
                      >
                        <FaTimes /> Hapus Size Chart
                      </button>
                    )}
                  </div>
                  <input ref={sizeChart1InputRef} type="file" accept="image/*" onChange={(e) => handleSizeChartChange(e, 0)} className="hidden" />
                </div>
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



