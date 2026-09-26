import { supabase } from '../config/supabase.js'

/**
 * Extract filename/path from Supabase public storage URL
 * Example URL: https://[project].supabase.co/storage/v1/object/public/payment-proofs/payment_12345_abc.jpg
 * Result path: payment_12345_abc.jpg
 */
export const extractStoragePath = (url, bucket = 'payment-proofs') => {
  if (!url || typeof url !== 'string') return null
  const marker = `/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  return url.substring(index + marker.length).split('?')[0]
}

/**
 * Delete a list of payment proof images from Supabase Storage
 * @param {string[]} urls - Array of payment proof URLs
 * @param {string} bucket - Bucket name (default: 'payment-proofs')
 * @returns {Promise<{deletedCount: number, errors: any[]}>}
 */
export const deletePaymentProofFiles = async (urls = [], bucket = 'payment-proofs') => {
  if (!urls || urls.length === 0) return { deletedCount: 0, errors: [] }

  const filePaths = urls
    .map(url => extractStoragePath(url, bucket))
    .filter(path => Boolean(path))

  if (filePaths.length === 0) return { deletedCount: 0, errors: [] }

  try {
    // Supabase storage remove accepts array of paths up to 100 at a time
    const batchSize = 100
    let deletedCount = 0
    const errors = []

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize)
      const { data, error } = await supabase.storage.from(bucket).remove(batch)
      if (error) {
        console.error('[StorageCleaner] Error removing batch:', error)
        errors.push(error)
      } else {
        deletedCount += (data ? data.length : batch.length)
      }
    }

    console.log(`[StorageCleaner] Successfully removed ${deletedCount} files from bucket '${bucket}'`)
    return { deletedCount, errors }
  } catch (err) {
    console.error('[StorageCleaner] Exception while deleting storage files:', err)
    return { deletedCount: 0, errors: [err] }
  }
}
