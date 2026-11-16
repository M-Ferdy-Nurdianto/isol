// Mobile KSMagicLoginPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSMagicLoginPageDesktop from '../../desktop/pages/KSMagicLoginPageDesktop'
import '../styles/mobile.css'

export default function KSMagicLoginPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSMagicLoginPageDesktop {...props} />
    </div>
  )
}
