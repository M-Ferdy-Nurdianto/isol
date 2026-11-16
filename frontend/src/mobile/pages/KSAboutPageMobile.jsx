import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaTicketAlt, FaHeart, FaChevronRight, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'
import api from '../../lib/api'

/**
 * KSAboutPageMobile (Native-Feel About Us & Member Lineup)
 */
const KSAboutPageMobile = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    api.get('/members')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setMembers(res.data.data.filter(m => m.member_id !== 'group'))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <MobileAppShell title="Tentang Kohi Sekai" showBack={true}>
      <div className="space-y-5 pb-6">

        {/* Hero Philosophy Card */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-sm space-y-3">
          <span className="text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest">
            Filosofi & Cerita Kami
          </span>
          <h1 className="text-lg font-black text-[var(--text-primary)] leading-tight">
            Kohi Sekai (コーヒーの世界)
          </h1>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Kohi Sekai adalah idol group bertema kopi asal Yogyakarta yang memadukan kehangatan espresso dan semangat panggung ala idol Jepang.
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Setiap member merepresentasikan karakter rasa kopi yang unik—dari manisnya Latte hingga ketegasan Espresso—membawakan energi ceria untuk para penikmat musik dan kopi di seluruh Indonesia.
          </p>
        </section>

        {/* Member Lineup Cards */}
        <section className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Member Lineup ({members.length})
          </span>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 flex items-center gap-3.5 shadow-sm cursor-pointer tap-active"
              >
                <img
                  src={member.image_url || '/images/members/placeholder.svg'}
                  alt={member.nama}
                  className="w-16 h-16 rounded-xl object-cover object-top border border-[var(--border)] bg-[var(--background)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase">
                    {member.member_id || 'IDOL'}
                  </span>
                  <h3 className="text-sm font-black text-[var(--text-primary)] leading-tight truncate">
                    {member.nama}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                    {member.catchphrase || 'Kohi Sekai Idol Member'}
                  </p>
                </div>
                <FaChevronRight size={12} className="text-[var(--text-secondary)] shrink-0" />
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Member Detail Bottom Sheet */}
      <MobileBottomSheet
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.nama}
        subtitle={selectedMember?.catchphrase}
        footer={
          <Link
            to={`/shop`}
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md"
          >
            <FaTicketAlt size={13} />
            <span>Pesan Cheki dengan {selectedMember?.nama}</span>
          </Link>
        }
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="w-full h-56 rounded-2xl overflow-hidden bg-[var(--background)] border border-[var(--border)]">
              <img
                src={selectedMember.image_url || '/images/members/placeholder.svg'}
                alt={selectedMember.nama}
                className="w-full h-full object-cover object-top"
              />
            </div>
            {selectedMember.salam && (
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)] italic">
                "{selectedMember.salam}"
              </div>
            )}
          </div>
        )}
      </MobileBottomSheet>
    </MobileAppShell>
  )
}

export default KSAboutPageMobile
