import { describe, expect, it, vi } from 'vitest'
import { sendNotification } from '../src/notify.js'

describe('sendNotification', () => {
  it('posts title and content to every notification url', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    await sendNotification({
      urls: ['https://example.com/a', 'https://example.com/b'],
      title: '塔吉多每日签到',
      content: '签到完成',
      fetch: fetchMock,
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com/a',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: '塔吉多每日签到', content: '签到完成' }),
      }),
    )
  })
})
