const BASE_URL = 'http://localhost:3001'

export async function api(path: string, options: RequestInit = {}) {
	const res = await fetch(BASE_URL + path, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		...options,
	})

	const data = await res.json().catch(() => null)

	if (!res.ok) {
		throw new Error(data?.error || 'Request failed')
	}

	return data
}
