import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const AdminLoginDesktop = lazy(() => import('../desktop/pages/AdminLoginDesktop'))
const AdminLoginMobile = lazy(() => import('../mobile/pages/AdminLoginMobile'))

export default function AdminLogin(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <AdminLoginMobile {...props} /> : <AdminLoginDesktop {...props} />}
    </Suspense>
  )
}
