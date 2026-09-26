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
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: false
      })

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
