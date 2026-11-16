import React, { lazy, Suspense } from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import LoadingSpinner from '../components/LoadingSpinner'

const ResetPasswordPageDesktop = lazy(() => import('../desktop/pages/ResetPasswordPageDesktop'))
const ResetPasswordPageMobile = lazy(() => import('../mobile/pages/ResetPasswordPageMobile'))

export default function ResetPasswordPage(props) {
  const { isMobile } = usePlatformLayout()

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isMobile ? <ResetPasswordPageMobile {...props} /> : <ResetPasswordPageDesktop {...props} />}
    </Suspense>
  )
}
