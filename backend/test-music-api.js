async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/music?isAdmin=true')
    const text = await res.text()
    console.log(res.status)
    console.log(text)
  } catch (err) {
    console.error(err)
  }
}
test()
