import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import AOS from 'aos'
import { ToastContainer, Zoom } from 'react-toastify'
import { RBToastContainer } from './components/ui/RBToast'
import LoadingSpinner from './components/LoadingSpinner'

// Kohi Sekai Public Pages
const KSHomePage = lazy(() => import('./pages/KSHomePage'))
const KSAboutPage = lazy(() => import('./pages/KSAboutPage'))
const KSShopPage = lazy(() => import('./pages/KSShopPage'))
const KSCheckoutPage = lazy(() => import('./pages/KSCheckoutPage'))
const KSMusicPage = lazy(() => import('./pages/KSMusicPage'))
const KSLoginPage = lazy(() => import('./pages/KSLoginPage'))
const KSProfilePage = lazy(() => import('./pages/KSProfilePage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

// Admin Pages
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))

import { ThemeProvider } from './context/ThemeContext'
import { FlyToCartProvider } from './context/FlyToCartContext'
import { FanAuthProvider } from './context/FanAuthContext'
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext'
import MaintenanceScreen from './components/MaintenanceScreen'
import MaintenanceAdminBadge from './components/MaintenanceAdminBadge'
import { getValidAdminToken } from './lib/authSession'

function MaintenanceGuard({ children }) {
  const { isMaintenance, maintenanceMessage, maintenanceEstimatedEnd, loading } = useMaintenance()
  const isAdmin = Boolean(getValidAdminToken())

  if (loading) {
    return <LoadingSpinner />
  }

  if (isMaintenance && !isAdmin) {
    return <MaintenanceScreen message={maintenanceMessage} estimatedEnd={maintenanceEstimatedEnd} />
  }

  return children
}

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-out-cubic',
      offset: 100,
    })
  }, [])

  return (
    <ThemeProvider>
      <MaintenanceProvider>
        <FanAuthProvider>
          <FlyToCartProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <MaintenanceAdminBadge />
              <RBToastContainer />
              <ToastContainer
                position="bottom-center"
                autoClose={1500}
                hideProgressBar={true}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Zoom}
                toastStyle={{ backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}
              />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Kohi Sekai Public Routes */}
                  <Route path="/" element={<MaintenanceGuard><KSHomePage /></MaintenanceGuard>} />
                  <Route path="/about" element={<MaintenanceGuard><KSAboutPage /></MaintenanceGuard>} />
                  <Route path="/shop" element={<MaintenanceGuard><KSShopPage /></MaintenanceGuard>} />
                  <Route path="/checkout/:eventId" element={<MaintenanceGuard><KSCheckoutPage /></MaintenanceGuard>} />
                  <Route path="/music" element={<MaintenanceGuard><KSMusicPage /></MaintenanceGuard>} />
                  <Route path="/login" element={<KSLoginPage />} />
                  <Route path="/profile" element={<MaintenanceGuard><KSProfilePage /></MaintenanceGuard>} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Admin Portal Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </Suspense>
            </Router>
          </FlyToCartProvider>
        </FanAuthProvider>
      </MaintenanceProvider>
    </ThemeProvider>
  )
}

export default App