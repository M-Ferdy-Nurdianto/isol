import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import ResetPasswordPageDesktop from '../desktop/pages/ResetPasswordPageDesktop'
import ResetPasswordPageMobile from '../mobile/pages/ResetPasswordPageMobile'

export default function ResetPasswordPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <ResetPasswordPageMobile {...props} /> : <ResetPasswordPageDesktop {...props} />
}
