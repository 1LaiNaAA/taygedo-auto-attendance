import { describe, expect, it, vi } from 'vitest'
import { runAttendance } from '../src/runner.js'

describe('runAttendance', () => {
  it('keeps failed account refresh tokens unchanged in the updated secret payload', async () => {
    const secretWriter = vi.fn()
    const api = {
      refreshToken: vi.fn()
        .mockResolvedValueOnce({ accessToken: 'access-main', refreshToken: 'new-main' })
        .mockRejectedValueOnce(new Error('expired')),
      getBindRole: vi.fn().mockResolvedValue({ roleId: 'role-1', roleName: '角色一' }),
      appSignin: vi.fn().mockResolvedValue({ exp: 10, goldCoin: 20 }),
      getSigninState: vi.fn().mockResolvedValue({ days: 1 }),
      getSigninRewards: vi.fn().mockResolvedValue([{ name: '奖励一', num: 1 }]),
      gameSignin: vi.fn().mockResolvedValue(undefined),
    }

    const result = await runAttendance({
      accountsSecret: JSON.stringify([
        {
          id: 'main',
          name: '主账号',
          uid: '1',
          deviceId: 'device-1',
          refreshToken: 'old-main',
        },
        {
          id: 'alt',
          name: '备用账号',
          uid: '2',
          deviceId: 'device-2',
          refreshToken: 'old-alt',
        },
      ]),
      api,
      notificationUrls: [],
      maxRetries: 1,
      secretWriter,
    })

    expect(result.updatedAccounts).toEqual([
      {
        id: 'main',
        name: '主账号',
        uid: '1',
        deviceId: 'device-1',
        refreshToken: 'new-main',
        roleId: 'role-1',
        roleName: '角色一',
      },
      {
        id: 'alt',
        name: '备用账号',
        uid: '2',
        deviceId: 'device-2',
        refreshToken: 'old-alt',
      },
    ])
    expect(secretWriter).toHaveBeenCalledWith(JSON.stringify(result.updatedAccounts, null, 2))
  })

  it('does not write the secret when every account fails before refresh completes', async () => {
    const secretWriter = vi.fn()
    const api = {
      refreshToken: vi.fn().mockRejectedValue(new Error('expired')),
      getBindRole: vi.fn(),
      appSignin: vi.fn(),
      getSigninState: vi.fn(),
      getSigninRewards: vi.fn(),
      gameSignin: vi.fn(),
    }

    await runAttendance({
      accountsSecret: JSON.stringify([
        {
          id: 'main',
          name: '主账号',
          uid: '1',
          deviceId: 'device-1',
          refreshToken: 'old-main',
        },
      ]),
      api,
      secretWriter,
    })

    expect(secretWriter).not.toHaveBeenCalled()
  })

  it('retries transient account failures before marking an account failed', async () => {
    const api = {
      refreshToken: vi.fn()
        .mockRejectedValueOnce(new Error('temporary'))
        .mockResolvedValueOnce({ accessToken: 'access-main', refreshToken: 'new-main' }),
      getBindRole: vi.fn().mockResolvedValue({ roleId: 'role-1', roleName: '角色一' }),
      appSignin: vi.fn().mockResolvedValue({ exp: 10, goldCoin: 20 }),
      getSigninState: vi.fn().mockResolvedValue({ days: 1 }),
      getSigninRewards: vi.fn().mockResolvedValue([{ name: '奖励一', num: 1 }]),
      gameSignin: vi.fn().mockResolvedValue(undefined),
    }

    const result = await runAttendance({
      accountsSecret: JSON.stringify([
        {
          id: 'main',
          name: '主账号',
          uid: '1',
          deviceId: 'device-1',
          refreshToken: 'old-main',
        },
      ]),
      api,
      maxRetries: 2,
    })

    expect(api.refreshToken).toHaveBeenCalledTimes(2)
    expect(result.updatedAccounts[0]?.refreshToken).toBe('new-main')
  })
})
