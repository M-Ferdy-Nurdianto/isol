import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSProfilePageDesktop = lazy(() => import('../desktop/pages/KSProfilePageDesktop'))
const KSProfilePageMobile = lazy(() => import('../mobile/pages/KSProfilePageMobile'))

export default function KSProfilePage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSProfilePageMobile {...props} /> : <KSProfilePageDesktop {...props} />}
    </Suspense>
  )
}
