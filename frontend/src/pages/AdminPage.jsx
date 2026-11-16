import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const AdminPageDesktop = lazy(() => import('../desktop/pages/AdminPageDesktop'))
const AdminPageMobile = lazy(() => import('../mobile/pages/AdminPageMobile'))

export default function AdminPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <AdminPageMobile {...props} /> : <AdminPageDesktop {...props} />}
    </Suspense>
  )
}
