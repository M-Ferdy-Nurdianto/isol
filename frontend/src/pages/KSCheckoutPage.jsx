import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import { CheckoutProvider } from '../shared/context/CheckoutContext'
import KSCheckoutPageDesktop from '../desktop/pages/KSCheckoutPageDesktop'
import KSCheckoutPageMobile from '../mobile/pages/KSCheckoutPageMobile'

function CheckoutContent(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSCheckoutPageMobile {...props} /> : <KSCheckoutPageDesktop {...props} />
}

export default function KSCheckoutPage(props) {
  return (
    <CheckoutProvider>
      <CheckoutContent {...props} />
    </CheckoutProvider>
  )
}
