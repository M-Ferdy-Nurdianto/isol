// Mobile KSLoginPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSLoginPageDesktop from '../../desktop/pages/KSLoginPageDesktop'
import '../styles/mobile.css'

export default function KSLoginPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSLoginPageDesktop {...props} />
    </div>
  )
}
