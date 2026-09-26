export const cachePublic = ({
  maxAge = 60,
  sMaxAge = 300,
  staleWhileRevalidate = 60
} = {}) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next()
  }

  if (req.headers.authorization) {
    res.set('Cache-Control', 'no-store')
    return next()
  }

  res.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
  next()
}
