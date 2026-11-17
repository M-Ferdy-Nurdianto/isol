import React from 'react'
import { usePlatformLayout } from '../shared/hooks/usePlatformLayout'
import KSShopPageDesktop from '../desktop/pages/KSShopPageDesktop'
import KSShopPageMobile from '../mobile/pages/KSShopPageMobile'

export default function KSShopPage(props) {
  const { isMobile } = usePlatformLayout()
  return isMobile ? <KSShopPageMobile {...props} /> : <KSShopPageDesktop {...props} />
}
