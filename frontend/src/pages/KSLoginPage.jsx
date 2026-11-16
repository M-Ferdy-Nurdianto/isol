import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSLoginPageDesktop = lazy(() => import('../desktop/pages/KSLoginPageDesktop'))
const KSLoginPageMobile = lazy(() => import('../mobile/pages/KSLoginPageMobile'))

export default function KSLoginPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSLoginPageMobile {...props} /> : <KSLoginPageDesktop {...props} />}
    </Suspense>
  )
}
