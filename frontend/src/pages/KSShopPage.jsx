import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSShopPageDesktop = lazy(() => import('../desktop/pages/KSShopPageDesktop'))
const KSShopPageMobile = lazy(() => import('../mobile/pages/KSShopPageMobile'))

export default function KSShopPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSShopPageMobile {...props} /> : <KSShopPageDesktop {...props} />}
    </Suspense>
  )
}
