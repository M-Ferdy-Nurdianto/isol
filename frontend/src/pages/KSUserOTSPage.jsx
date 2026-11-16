import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSUserOTSPageDesktop = lazy(() => import('../desktop/pages/KSUserOTSPageDesktop'))
const KSUserOTSPageMobile = lazy(() => import('../mobile/pages/KSUserOTSPageMobile'))

export default function KSUserOTSPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSUserOTSPageMobile {...props} /> : <KSUserOTSPageDesktop {...props} />}
    </Suspense>
  )
}
