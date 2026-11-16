import { useHomeData } from '../../shared/hooks/useHomeData'
import KSHeader from '../../components/KSHeader'
import KSFooter from '../../components/KSFooter'
import KSHero from '../../components/home/KSHero'
import KSMemberPreview from '../../components/home/KSMemberPreview'
import KSNewsSection from '../../components/home/KSNewsSection'
import KSUpcomingEvent from '../../components/home/KSUpcomingEvent'
import KSSocialSection from '../../components/home/KSSocialSection'
import KSFAQSection from '../../components/home/KSFAQSection'
import GroupPhotoSection from '../../components/home/GroupPhotoSection'
import KSLeaderboard from '../../components/home/KSLeaderboard'

const KSHomePage = () => {
  const data = useHomeData()

  if (data.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-black tracking-widest text-text-secondary uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  const { config, events, members, faqs, news } = data

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      <KSHeader />

      <main>
        <KSHero
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

export default KSHomePage
