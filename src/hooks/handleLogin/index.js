export async function handleLogin (body) {
  const response = await fetch(`${process.env.URL_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include'
  })

  return response.json()
}
