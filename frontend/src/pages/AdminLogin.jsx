import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import AdminLoginDesktop from '../desktop/pages/AdminLoginDesktop'
import AdminLoginMobile from '../mobile/pages/AdminLoginMobile'

export default function AdminLogin(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <AdminLoginMobile {...props} /> : <AdminLoginDesktop {...props} />
}
