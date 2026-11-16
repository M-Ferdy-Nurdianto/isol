// Mobile KSProfilePage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSProfilePageDesktop from '../../desktop/pages/KSProfilePageDesktop'
import '../styles/mobile.css'

export default function KSProfilePageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSProfilePageDesktop {...props} />
    </div>
  )
}
