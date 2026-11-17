import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSProfilePageDesktop from '../desktop/pages/KSProfilePageDesktop'
import KSProfilePageMobile from '../mobile/pages/KSProfilePageMobile'

export default function KSProfilePage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSProfilePageMobile {...props} /> : <KSProfilePageDesktop {...props} />
}
