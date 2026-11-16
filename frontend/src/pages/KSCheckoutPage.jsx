import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSCheckoutPageDesktop = lazy(() => import('../desktop/pages/KSCheckoutPageDesktop'))
const KSCheckoutPageMobile = lazy(() => import('../mobile/pages/KSCheckoutPageMobile'))

export default function KSCheckoutPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSCheckoutPageMobile {...props} /> : <KSCheckoutPageDesktop {...props} />}
    </Suspense>
  )
}
