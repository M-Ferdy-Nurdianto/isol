import React from 'react'
import { useHomeData } from '../../shared/hooks/useHomeData'
import KSHeader from '../../components/KSHeader'
import KSFooter from '../../components/KSFooter'
import KSHeroMobile from '../components/home/KSHeroMobile'
import GroupPhotoSection from '../../components/home/GroupPhotoSection'
import KSMemberPreview from '../../components/home/KSMemberPreview'
import KSNewsSection from '../../components/home/KSNewsSection'
import KSLeaderboard from '../../components/home/KSLeaderboard'
import KSUpcomingEvent from '../../components/home/KSUpcomingEvent'
import KSSocialSection from '../../components/home/KSSocialSection'
import KSFAQSection from '../../components/home/KSFAQSection'
import '../styles/mobile.css'

export default function KSHomePageMobile() {
  const data = useHomeData()
  const { config = {}, events = [], members = [], faqs = [], news = [], loading } = data

  if (loading && !config?.hero_settings) {
    return (
      <div className="mobile-app-root min-h-screen bg-background text-text-primary overflow-x-hidden">
        <KSHeader />
        <main className="pt-24 pb-24 px-5 flex flex-col items-center justify-center min-h-[80svh]">
          <div className="w-full max-w-[320px] flex flex-col items-center gap-4 animate-pulse">
            <div className="h-4 w-24 bg-surface rounded-full" />
            <div className="h-10 w-56 bg-surface rounded-2xl" />
            <div className="h-4 w-44 bg-surface rounded-full" />
            <div className="h-12 w-full bg-surface rounded-full mt-2" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="mobile-app-root min-h-screen bg-background text-text-primary overflow-x-hidden w-full max-w-full box-border">
      <KSHeader />

      <main className="w-full max-w-full overflow-x-hidden">
        <KSHeroMobile
          config={config.hero_settings}
          events={events}
        />

        <GroupPhotoSection config={config.group_photo} />

        <KSMemberPreview 
          members={members} 
          config={config.members_section} 
        />

        <KSNewsSection 
          config={config} 
          news={news}
        />

        <KSLeaderboard 
          members={members}
        />

        <KSUpcomingEvent 
          events={events} 
          config={config.events_section} 
        />

        <KSSocialSection 
          config={config} 
        />

        <KSFAQSection 
          config={config}
          faqs={(() => {
            if (Array.isArray(faqs) && faqs.length > 0) return faqs;
            if (!config?.faq_items) return [];
            try {
              return typeof config.faq_items === 'string' ? JSON.parse(config.faq_items) : config.faq_items;
            } catch (e) {
              return [];
            }
          })()} 
        />
      </main>

      <KSFooter config={config.footer_settings} />
    </div>
  )
}
