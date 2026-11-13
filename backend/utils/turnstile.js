export async function verifyTurnstileToken(token, ip) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAF_c-nTm2Qg7hufzNDMX2-lTKkc';
  
  if (!token) {
    return { success: false, error: 'Token Turnstile tidak ditemukan' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      console.error('Turnstile verification failed:', data['error-codes']);
      return { success: false, error: 'Verifikasi Turnstile gagal' };
    }
  } catch (error) {
    console.error('Turnstile error:', error);
    return { success: false, error: 'Terjadi kesalahan saat memverifikasi Turnstile' };
  }
}
