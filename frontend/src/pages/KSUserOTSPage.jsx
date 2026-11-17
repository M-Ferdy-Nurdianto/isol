import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSUserOTSPageDesktop from '../desktop/pages/KSUserOTSPageDesktop'
import KSUserOTSPageMobile from '../mobile/pages/KSUserOTSPageMobile'

export default function KSUserOTSPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSUserOTSPageMobile {...props} /> : <KSUserOTSPageDesktop {...props} />
}
