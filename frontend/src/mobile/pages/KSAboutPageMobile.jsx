// Mobile KSAboutPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSAboutPageDesktop from '../../desktop/pages/KSAboutPageDesktop'
import '../styles/mobile.css'

export default function KSAboutPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSAboutPageDesktop {...props} />
    </div>
  )
}
