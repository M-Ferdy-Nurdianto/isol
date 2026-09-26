/**
 * Utility to resolve asset paths correctly regardless of deployment environment.
 * Maps /images/ paths to Supabase Storage bucket ('members') so assets load directly from cloud storage.
 * 
 * @param {string} path - The relative path starting from public root (e.g., '/images/members/cissi.webp')
 * @returns {string} - The resolved absolute or cloud storage URL
 */
export const getAssetPath = (path) => {
    if (!path) return '';

    // If it's already an external URL or base64, return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';

    // Route /images/ assets to Supabase Storage 'members' bucket
    if (path.startsWith('/images/')) {
        const subPath = path.replace(/^\/images\//, '');
        // Preserve local SVGs/icons if any, otherwise resolve from Supabase Storage
        if (!subPath.endsWith('.svg') && !subPath.startsWith('logos/')) {
            return `${supabaseUrl}/storage/v1/object/public/members/${subPath}`;
        }
    }

    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};
