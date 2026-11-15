/**
 * Utility untuk menentukan URL frontend resmi yang valid secara dinamis dan aman.
 * Menghindari domain usang/rusak seperti 'kohisekai.vercel.app' atau 'localhost:3000' di environment produksi.
 */
export const getFrontendBaseUrl = (req) => {
  // 1. Cek header Origin (dikirim oleh browser saat request POST/PATCH)
  const origin = req?.headers?.origin
  if (origin && typeof origin === 'string') {
    const cleanOrigin = origin.trim().replace(/\/$/, '')
    if (!cleanOrigin.includes('kohisekai.vercel.app') && !cleanOrigin.includes('localhost:3000') && !cleanOrigin.includes('127.0.0.1')) {
      return cleanOrigin
    }
  }

  // 2. Cek header Referer (halaman asal request)
  const referer = req?.headers?.referer
  if (referer && typeof referer === 'string') {
    try {
      const u = new URL(referer)
      const cleanOrigin = u.origin.replace(/\/$/, '')
      if (!cleanOrigin.includes('kohisekai.vercel.app') && !cleanOrigin.includes('localhost:3000') && !cleanOrigin.includes('127.0.0.1')) {
        return cleanOrigin
      }
    } catch {}
  }

  // 3. Cek Host header (Reverse proxy / Cloudflare)
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host
  if (host && typeof host === 'string') {
    const cleanHost = host.split(',')[0].trim()
    if (!cleanHost.includes('kohisekai.vercel.app') && !cleanHost.includes('localhost') && !cleanHost.includes('127.0.0.1')) {
      const proto = req.headers?.['x-forwarded-proto'] || 'https'
      return `${proto}://${cleanHost}`.replace(/\/$/, '')
    }
  }

  // 4. Cek Environment Variable FRONTEND_URL
  const envUrl = process.env.FRONTEND_URL
  if (envUrl && typeof envUrl === 'string') {
    const cleanEnv = envUrl.trim().replace(/\/$/, '')
    if (!cleanEnv.includes('kohisekai.vercel.app') && !cleanEnv.includes('localhost:3000') && !cleanEnv.includes('127.0.0.1')) {
      return cleanEnv
    }
  }

  // 5. Default Fallback Resmi Kohi Sekai
  return 'https://kohiprototype.ferdy.web.id'
}
