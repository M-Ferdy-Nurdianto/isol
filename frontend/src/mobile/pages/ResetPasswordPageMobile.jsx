// Mobile ResetPasswordPage - Initialized in Fase 2, ready for Fase 3 & 4 Native UI
import React from 'react'
import ResetPasswordPageDesktop from '../../desktop/pages/ResetPasswordPageDesktop'
import '../styles/mobile.css'

export default function ResetPasswordPageMobile(props) {
  return (
    <div className="mobile-app-root">
      <ResetPasswordPageDesktop {...props} />
    </div>
  )
}
