import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSLoginPageDesktop from '../desktop/pages/KSLoginPageDesktop'
import KSLoginPageMobile from '../mobile/pages/KSLoginPageMobile'

export default function KSLoginPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSLoginPageMobile {...props} /> : <KSLoginPageDesktop {...props} />
}
