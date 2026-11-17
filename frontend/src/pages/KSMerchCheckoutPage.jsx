import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSMerchCheckoutPageDesktop from '../desktop/pages/KSMerchCheckoutPageDesktop'
import KSMerchCheckoutPageMobile from '../mobile/pages/KSMerchCheckoutPageMobile'

export default function KSMerchCheckoutPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSMerchCheckoutPageMobile {...props} /> : <KSMerchCheckoutPageDesktop {...props} />
}
