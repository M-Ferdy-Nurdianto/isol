// Mobile KSMerchCheckoutPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSMerchCheckoutPageDesktop from '../../desktop/pages/KSMerchCheckoutPageDesktop'
import '../styles/mobile.css'

export default function KSMerchCheckoutPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSMerchCheckoutPageDesktop {...props} />
    </div>
  )
}
