async function test() {
  const spUrl = 'https://open.spotify.com/track/2hNCEtPq3MXPKbceidrdfb'
  try {
    const spRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spUrl)}`)
    const spData = await spRes.json()
    console.log('SP Data:', spData)
  } catch(e) { console.error('SP failed', e) }
}
test()
