// Mobile KSShopPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import KSShopPageDesktop from '../../desktop/pages/KSShopPageDesktop'
import '../styles/mobile.css'

export default function KSShopPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <KSShopPageDesktop {...props} />
    </div>
  )
}
