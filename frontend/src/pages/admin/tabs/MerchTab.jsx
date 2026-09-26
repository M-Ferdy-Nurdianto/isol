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
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Manajemen <span className="text-[#079108]">Merchandise</span></h2>
              <p className="text-xs text-zinc-400 font-medium mt-1">Katalog & stok merchandise.</p>
            </div>
            <button
              onClick={() => openMerchForm()}
              className="bg-[#079108] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#067a07] transition-all flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(7,145,8,0.3)] active:scale-95"
            >
              <FaPlus /> Tambah Merch
            </button>
          </div>

          <div className="bg-[#111726]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#182035] text-zinc-300 uppercase text-[11px] font-bold tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Produk</th>
                    <th className="px-4 py-3.5">Harga</th>
                    <th className="px-4 py-3.5">Stok</th>
                    <th className="px-4 py-3.5 text-center">Tersedia</th>
                    <th className="px-4 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-200">
                  {merch.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-12 text-zinc-400">Belum ada merchandise. Klik &quot;Tambah Merch&quot; untuk menambahkan.</td></tr>
                  ) : (
                    merch.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.04] transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#182032] overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10">
                              {item.gambar_url ? <img src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" /> : <FaBox className="text-zinc-500 text-xl" />}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{item.nama}</p>
                              {item.deskripsi && <p className="text-xs text-zinc-400 max-w-xs truncate whitespace-pre-line mt-0.5">{item.deskripsi}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#079108]">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold text-xs ${!item.stok ? 'text-zinc-500' : item.stok <= 5 ? 'text-amber-400' : 'text-zinc-200'}`}>
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
                            <button onClick={() => openMerchForm(item)} className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"><FaEdit className="text-base" /></button>
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
              className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Kembali"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {editingMerch ? 'Edit Merchandise' : 'Tambah Merchandise Baru'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {editingMerch ? `Mengubah produk "${editingMerch.nama}"` : 'Isi detail produk, harga, stok, ukuran, dan foto merchandise.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleMerchSubmit} className="bg-[#111726]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Nama produk *</label>
                  <input
                    required
                    value={merchForm.nama}
                    onChange={e => setMerchForm({ ...merchForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#079108]"
                    placeholder="Contoh: Kaos Kohi Sekai"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Deskripsi</label>
                  <textarea
                    value={merchForm.deskripsi}
                    onChange={e => setMerchForm({ ...merchForm, deskripsi: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#079108] resize-none"
                    placeholder="Deskripsi produk (opsional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Harga (Rp) *</label>
                    <input
                      required
                      value={merchHargaRaw}
                      onChange={e => handleHargaChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#079108]"
                      placeholder="150000"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Bisa ketik 150000, 150k, atau 1.5jt</p>
                    {merchForm.harga && merchHargaRaw && !/^\d+$/.test(merchHargaRaw) && (
                      <p className="text-xs text-[#079108] mt-1 font-semibold">= Rp {Number(merchForm.harga).toLocaleString('id-ID')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">
                      Stok <span className="text-[10px] text-zinc-500 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={merchForm.stok}
                      onChange={e => setMerchForm({ ...merchForm, stok: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#079108]"
                      placeholder="Kosongkan jika PO"
                    />
                  </div>
                </div>

                {/* Section Ukuran Tersedia & Status Tampil */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs text-zinc-400">Ukuran tersedia</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="merch-available"
                        checked={merchForm.available}
                        onChange={e => setMerchForm({ ...merchForm, available: e.target.checked })}
                        className="w-4 h-4 accent-[#079108] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-300">Tampilkan di Shop</span>
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
                              ? 'bg-[#079108] border-[#079108] text-white shadow-[0_0_10px_rgba(7,145,8,0.4)]'
                              : 'bg-[#182032] border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
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
                    className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 text-white rounded-xl placeholder-zinc-500 text-xs focus:outline-none focus:border-[#079108]"
                    placeholder="Atau ketik sendiri (dipisahkan koma)"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Pilihan ukuran di atas akan otomatis menambahkan atau menghapus dari kolom ini.</p>
                </div>
              </div>

              {/* Kolom Kanan: Upload Foto Produk & Foto Size Chart */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Foto produk</label>
                  <div
                    onClick={() => merchFileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 bg-[#182032]/50 rounded-2xl p-4 text-center cursor-pointer hover:border-[#079108] hover:bg-[#079108]/10 transition-all min-h-[170px] flex flex-col items-center justify-center gap-2"
                  >
                    {merchImagePreview ? (
                      <img src={merchImagePreview} alt="Preview" className="max-h-[170px] max-w-full object-contain rounded-xl" />
                    ) : (
                      <>
                        <FaCloudUploadAlt className="text-4xl text-zinc-500" />
                        <p className="text-xs text-zinc-300 font-medium">Klik untuk upload foto produk</p>
                        <p className="text-[10px] text-zinc-500">JPG, PNG, WebP (maks. 10MB)</p>
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
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Foto size chart <span className="text-[10px] text-zinc-500 font-normal">(opsional)</span>
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => sizeChart1InputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 bg-[#182032]/50 rounded-2xl p-3 text-center cursor-pointer hover:border-[#079108] hover:bg-[#079108]/10 transition-all min-h-[120px] flex flex-col items-center justify-center gap-1.5"
                    >
                      {merchSizeChartPreviews[0] ? (
                        <img src={merchSizeChartPreviews[0]} alt="Size Chart" className="max-h-[110px] max-w-full object-contain rounded-lg" />
                      ) : (
                        <>
                          <FaCloudUploadAlt className="text-3xl text-zinc-500" />
                          <p className="text-xs text-zinc-300 font-medium">Klik untuk upload size chart</p>
                          <p className="text-[10px] text-zinc-500">Panduan ukuran kaos / apparel</p>
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
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/10 justify-end">
              <button
                type="button"
                onClick={closeMerchForm}
                className="px-5 py-2.5 bg-white/10 text-zinc-300 rounded-xl font-bold text-xs hover:bg-white/20 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={merchSaving}
                className="px-6 py-2.5 bg-[#079108] text-white rounded-xl font-bold text-xs hover:bg-[#067a07] disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(7,145,8,0.3)] transition-all"
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
