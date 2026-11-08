import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaInfoCircle, FaTicketAlt, FaArrowLeft, FaShoppingBag } from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import OTSOrderInlineForm from './admin/components/OTSOrderInlineForm'
import api from '../lib/api'
import { useFanAuth } from '../context/FanAuthContext'
import { kohiToast } from '../components/ui/KohiToast'

const KSUserOTSPage = () => {
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [merch, setMerch] = useState([])
  const [events, setEvents] = useState([])
  const [config, setConfig] = useState({
    hargaOtsPerMember: 40000,
    hargaOtsGrup: 80000,
    hargaChekiGrupOts: 150000,
    regularChekiEnabled: true,
    wideChekiEnabled: false,
    chekiGrupEnabled: false,
    paymentEnableCash: true,
    paymentEnableQris: true,
    paymentEnableTf: false,
  })

  // ── Fetch data saat mount ───────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [membersRes, eventsRes, configRes, merchRes] = await Promise.all([
          api.get('/members').catch(() => ({ data: { data: [] } })),
          api.get('/events').catch(() => ({ data: { data: [] } })),
          api.get('/config').catch(() => ({ data: { data: [] } })),
          api.get('/merchandise').catch(() => ({ data: { data: [] } })),
        ])

        const cfgList = configRes.data?.data || []
        const getCfg = (key, fallback) => {
          if (Array.isArray(cfgList)) {
            const c = cfgList.find(x => x.key === key)
            return c ? c.value : fallback
          } else if (typeof cfgList === 'object' && cfgList !== null) {
            return cfgList[key] !== undefined ? cfgList[key] : fallback
          }
          return fallback
        }

        setMembers(membersRes.data?.data || [])
        setEvents(eventsRes.data?.data || [])
        setMerch(merchRes.data?.data || [])
        setConfig({
          hargaOtsPerMember: Number(getCfg('harga_ots_per_member', '40000')) || 40000,
          hargaOtsGrup: Number(getCfg('harga_ots_grup', '80000')) || 80000,
          hargaChekiGrupOts: Number(getCfg('harga_cheki_grup_ots', '150000')) || 150000,
          regularChekiEnabled: getCfg('regular_cheki_enabled', 'true') !== 'false',
          wideChekiEnabled:    getCfg('wide_cheki_enabled', 'false') === 'true',
          chekiGrupEnabled:    getCfg('cheki_grup_enabled', 'false') === 'true',
          paymentEnableCash:   getCfg('payment_enable_cash', 'true') !== 'false',
          paymentEnableQris:   getCfg('payment_enable_qris', 'true') !== 'false',
          paymentEnableTf:     getCfg('payment_enable_tf', 'false') === 'true',
        })
      } catch (err) {
        console.error('[KSUserOTS] Gagal muat data:', err)
        kohiToast.error('Gagal memuat data, silakan refresh halaman')
      } finally {
        setLoading(false)
      }
    }

    // Delay 1 tick untuk memastikan FanAuth state hydrate
    setTimeout(loadData, 50)
  }, [])

  // ── Login check ─────────────────────────────────────────────────────────
  if (!loading && !isLoggedIn) {
    openAuthModal?.()
    setTimeout(() => navigate('/login'), 300)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] font-outfit overflow-hidden flex flex-col transition-colors duration-500 pb-20 md:pb-0">
      <KSHeader />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-7xl mx-auto w-full">
        {/* Breadcrumb / Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] transition font-semibold"
        >
          <FaArrowLeft /> Kembali
        </button>

        {/* Hero Header Page */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-xl p-5 sm:p-8 mb-6 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse shrink-0" />
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest font-mono">
                On The Spot · Venue
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase font-space">
              Pemesanan Langsung di Venue (OTS)
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Pesan tiket 2-Shot Cheki & Official Merchandise langsung di lokasi panggung. 
              Pesananmu otomatis tercatat di akun Fan ID dan siap divalidasi oleh kru di merchandise booth.
            </p>
          </div>
        </div>

        {/* 3 Panduan Cepat Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <FaTicketAlt />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Pilih Tiket & Merch</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Tersedia Cheki Regular, Wide 16:9, Cheki Grup, serta Official Merchandise resmi.
              </p>
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <FaCalendarAlt />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Datang ke Venue</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Sebutkan nama akunmu ke crew / admin Kohi Sekai untuk konfirmasi order & pembayaran.
              </p>
            </div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <FaInfoCircle />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Riwayat di Profil</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Semua order OTS kamu bisa dilihat di menu <strong>Profil → tab OTS Venue</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* OTS FORM RENDERED CLEANLY */}
        <div className="scrollable-area relative">
          <OTSOrderInlineForm
            members={members}
            merch={merch}
            events={events}
            mode="user"
            fanUser={fanUser}
            onClose={() => navigate(-1)}
            onSuccess={() => {
              kohiToast.success('Pesanan OTS berhasil dibuat! Silakan hubungi kru di venue untuk konfirmasi.')
              navigate('/profile')
            }}
            hargaOtsPerMember={config.hargaOtsPerMember}
            hargaOtsGrup={config.hargaOtsGrup}
            hargaChekiGrupOts={config.hargaChekiGrupOts}
            regularChekiEnabled={config.regularChekiEnabled}
            wideChekiEnabled={config.wideChekiEnabled}
            chekiGrupEnabled={config.chekiGrupEnabled}
            paymentEnableCash={config.paymentEnableCash}
            paymentEnableQris={config.paymentEnableQris}
            paymentEnableTf={config.paymentEnableTf}
          />
        </div>
      </main>
    </div>
  )
}

export default KSUserOTSPage
