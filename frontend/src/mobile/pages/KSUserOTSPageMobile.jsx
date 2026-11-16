// Mobile KSUserOTSPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSUserOTSPageDesktop from '../../desktop/pages/KSUserOTSPageDesktop'
import '../styles/mobile.css'

export default function KSUserOTSPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSUserOTSPageDesktop {...props} />
    </div>
  )
}
