// Mobile KSMusicPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSMusicPageDesktop from '../../desktop/pages/KSMusicPageDesktop'
import '../styles/mobile.css'

export default function KSMusicPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSMusicPageDesktop {...props} />
    </div>
  )
}
