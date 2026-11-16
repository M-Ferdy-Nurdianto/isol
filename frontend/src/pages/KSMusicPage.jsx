import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSMusicPageDesktop = lazy(() => import('../desktop/pages/KSMusicPageDesktop'))
const KSMusicPageMobile = lazy(() => import('../mobile/pages/KSMusicPageMobile'))

export default function KSMusicPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSMusicPageMobile {...props} /> : <KSMusicPageDesktop {...props} />}
    </Suspense>
  )
}
