import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const KSMagicLoginPageDesktop = lazy(() => import('../desktop/pages/KSMagicLoginPageDesktop'))
const KSMagicLoginPageMobile = lazy(() => import('../mobile/pages/KSMagicLoginPageMobile'))

export default function KSMagicLoginPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <KSMagicLoginPageMobile {...props} /> : <KSMagicLoginPageDesktop {...props} />}
    </Suspense>
  )
}
