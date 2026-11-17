import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSAboutPageDesktop from '../desktop/pages/KSAboutPageDesktop'
import KSAboutPageMobile from '../mobile/pages/KSAboutPageMobile'

export default function KSAboutPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSAboutPageMobile {...props} /> : <KSAboutPageDesktop {...props} />
}
