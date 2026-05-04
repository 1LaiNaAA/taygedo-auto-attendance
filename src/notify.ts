export interface NotificationPayload {
  urls: string[]
  title: string
  content: string
  fetch?: typeof fetch
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const fetchImpl = payload.fetch ?? fetch
  for (const url of payload.urls) {
    await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title,
        content: payload.content,
      }),
    })
  }
}
