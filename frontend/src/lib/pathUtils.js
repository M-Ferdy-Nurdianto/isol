/**
 * Utility to resolve asset paths correctly regardless of deployment environment.
 * Local assets in /images/ are served directly from the Vite/public directory.
 * Remote Cloud Storage URLs (https://) are returned as is.
 * Any legacy localhost / 127.0.0.1 URLs are cleanly mapped to local bundled assets.
 */
export const getAssetPath = (path) => {
    if (!path) return '/images/members/placeholder.svg';

    // If it's a localhost / 127.0.0.1 URL from legacy local dev, map to clean local asset
    if (typeof path === 'string' && (path.includes('127.0.0.1') || path.includes('localhost'))) {
        const lower = path.toLowerCase();
        if (lower.includes('latte')) return '/images/members/latte.webp';
        if (lower.includes('macchiato')) return '/images/members/macchiato.webp';
        if (lower.includes('affogato')) return '/images/members/affogato.webp';
        if (lower.includes('group') || lower.includes('banner')) return '/images/members/group.webp';
        return '/images/members/placeholder.svg';
    }

    // Remote URLs (https://, data:, blob:)
    if (path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    // Local static assets from /images/...
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};
