import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import AOS from 'aos'
import { ToastContainer, Zoom } from 'react-toastify'
import { RBToastContainer } from './components/ui/RBToast'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy Load Pages
const HomePage = lazy(() => import('./pages/HomePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const MembersPage = lazy(() => import('./pages/MembersPage'))
const MusicPage = lazy(() => import('./pages/MusicPage'))
const MediaPage = lazy(() => import('./pages/MediaPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const StoryPage = lazy(() => import('./pages/StoryPage'))

import { ThemeProvider } from './context/ThemeContext'
import { FlyToCartProvider } from './context/FlyToCartContext'
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

  // Jika sedang maintenance, hanya block jika BUKAN admin.
  // Jika admin login, admin diizinkan masuk untuk testing / live preview.
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
        <FlyToCartProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {/* Floating badge for logged in admin when website is in Maintenance Mode */}
          <MaintenanceAdminBadge />
          {/* RBToast — custom shop/global notifications (dual-theme, centered) */}
          <RBToastContainer />
          {/* Legacy ToastContainer — kept for admin pages */}
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
              {/* Public Routes protected by MaintenanceGuard */}
              <Route path="/" element={<MaintenanceGuard><HomePage /></MaintenanceGuard>} />
              <Route path="/members" element={<MaintenanceGuard><MembersPage /></MaintenanceGuard>} />
              <Route path="/music" element={<MaintenanceGuard><MusicPage /></MaintenanceGuard>} />
              <Route path="/media" element={<MaintenanceGuard><MediaPage /></MaintenanceGuard>} />
              <Route path="/schedule" element={<MaintenanceGuard><SchedulePage /></MaintenanceGuard>} />
              <Route path="/shop" element={<MaintenanceGuard><ShopPage /></MaintenanceGuard>} />
              <Route path="/faq" element={<MaintenanceGuard><FAQPage /></MaintenanceGuard>} />
              <Route path="/story" element={<MaintenanceGuard><StoryPage /></MaintenanceGuard>} />

              {/* Admin Portal Routes (Always Accessible) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Suspense>
        </Router>
        </FlyToCartProvider>
      </MaintenanceProvider>
    </ThemeProvider>
  )
}

export default App
