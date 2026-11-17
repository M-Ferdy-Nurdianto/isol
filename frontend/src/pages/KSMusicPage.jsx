import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSMusicPageDesktop from '../desktop/pages/KSMusicPageDesktop'
import KSMusicPageMobile from '../mobile/pages/KSMusicPageMobile'

export default function KSMusicPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSMusicPageMobile {...props} /> : <KSMusicPageDesktop {...props} />
}
