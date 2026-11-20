import { supabase } from './supabase.js'

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @returns {Promise<{fileId: string, url: string}>}
 */
export const uploadToSupabaseStorage = async (fileBuffer, fileName, mimeType, bucketName = 'payment-proofs') => {
  try {
    // Upload file to Supabase Storage
    let { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      })

    // If bucket doesn't exist, automatically create public bucket and retry upload
    if (error && (error.statusCode === '404' || error.message?.includes('Bucket not found') || error.code === 'NoSuchBucket')) {
      console.warn(`[Storage] Bucket '${bucketName}' not found. Automatically creating public bucket...`)
      await supabase.storage.createBucket(bucketName, { public: true })
      const retryResult = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: mimeType,
          upsert: true
        })
      data = retryResult.data
      error = retryResult.error
    }

    if (error) {
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return {
      fileId: data.path,
      url: publicUrlData.publicUrl
    }
  } catch (error) {
    console.error('Error uploading to Supabase Storage:', error)
    throw error
  }
}
