// Mobile AdminLogin - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import AdminLoginDesktop from '../../desktop/pages/AdminLoginDesktop'
import '../styles/mobile.css'

export default function AdminLoginMobile(props) {
  return (
    <div className="mobile-app-root">
      <AdminLoginDesktop {...props} />
    </div>
  )
}
