import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSCheckoutPageDesktop from '../desktop/pages/KSCheckoutPageDesktop'
import KSCheckoutPageMobile from '../mobile/pages/KSCheckoutPageMobile'

export default function KSCheckoutPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSCheckoutPageMobile {...props} /> : <KSCheckoutPageDesktop {...props} />
}
