// Mobile KSCheckoutPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSCheckoutPageDesktop from '../../desktop/pages/KSCheckoutPageDesktop'
import '../styles/mobile.css'

export default function KSCheckoutPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSCheckoutPageDesktop {...props} />
    </div>
  )
}
