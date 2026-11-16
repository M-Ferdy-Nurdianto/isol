// Mobile AdminPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import AdminPageDesktop from '../../desktop/pages/AdminPageDesktop'
import '../styles/mobile.css'

export default function AdminPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <AdminPageDesktop {...props} />
    </div>
  )
}
