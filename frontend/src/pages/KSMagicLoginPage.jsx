import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSMagicLoginPageDesktop from '../desktop/pages/KSMagicLoginPageDesktop'
import KSMagicLoginPageMobile from '../mobile/pages/KSMagicLoginPageMobile'

export default function KSMagicLoginPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSMagicLoginPageMobile {...props} /> : <KSMagicLoginPageDesktop {...props} />
}
