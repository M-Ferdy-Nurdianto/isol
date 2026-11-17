import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSHomePageDesktop from '../desktop/pages/KSHomePageDesktop'
import KSHomePageMobile from '../mobile/pages/KSHomePageMobile'

export default function KSHomePage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSHomePageMobile {...props} /> : <KSHomePageDesktop {...props} />
}
