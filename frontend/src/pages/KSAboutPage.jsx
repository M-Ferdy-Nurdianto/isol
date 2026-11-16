import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSAboutPageDesktop = lazy(() => import('../desktop/pages/KSAboutPageDesktop'))
const KSAboutPageMobile = lazy(() => import('../mobile/pages/KSAboutPageMobile'))

export default function KSAboutPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSAboutPageMobile {...props} /> : <KSAboutPageDesktop {...props} />}
    </Suspense>
  )
}
