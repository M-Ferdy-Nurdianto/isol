// Mobile Home Page - Prepared for Fase 3 & 4 Native Mobile UI
import React from 'react'
import KSHomePageDesktop from '../../desktop/pages/KSHomePageDesktop'
import '../styles/mobile.css'

export default function KSHomePageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSHomePageDesktop {...props} />
    </div>
  )
}
