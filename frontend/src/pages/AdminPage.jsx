import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import AdminPageDesktop from '../desktop/pages/AdminPageDesktop'
import AdminPageMobile from '../mobile/pages/AdminPageMobile'

export default function AdminPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <AdminPageMobile {...props} /> : <AdminPageDesktop {...props} />
}
