import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSHomePageDesktop = lazy(() => import('../desktop/pages/KSHomePageDesktop'))
const KSHomePageMobile = lazy(() => import('../mobile/pages/KSHomePageMobile'))

export default function KSHomePage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSHomePageMobile {...props} /> : <KSHomePageDesktop {...props} />}
    </Suspense>
  )
}
