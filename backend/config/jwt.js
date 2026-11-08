import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'kohisekai_secret_jwt_key_2026'

/**
 * Sign a payload with the centralized JWT secret.
 * @param {object} payload - The token claims
 * @param {object} [options={ expiresIn: '1d' }] - jwt.sign options
 * @returns {string} - Signed JWT token string
 */
export const signToken = (payload, options = { expiresIn: '1d' }) => {
  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Verify a token using the centralized JWT secret.
 * @param {string} token - The raw JWT token
 * @returns {object} - Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

export default {
  JWT_SECRET,
  signToken,
  verifyToken
}

