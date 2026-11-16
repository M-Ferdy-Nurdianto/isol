import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSMerchCheckoutPageDesktop = lazy(() => import('../desktop/pages/KSMerchCheckoutPageDesktop'))
const KSMerchCheckoutPageMobile = lazy(() => import('../mobile/pages/KSMerchCheckoutPageMobile'))

export default function KSMerchCheckoutPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSMerchCheckoutPageMobile {...props} /> : <KSMerchCheckoutPageDesktop {...props} />}
    </Suspense>
  )
}
