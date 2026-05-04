import { describe, expect, it } from 'vitest'
import { parseAccountsSecret } from '../src/config/accounts.js'

describe('parseAccountsSecret', () => {
  it('parses a JSON secret into account records', () => {
    const accounts = parseAccountsSecret(
      JSON.stringify([
        {
          id: 'main',
          name: '主账号',
          uid: '123456',
          deviceId: 'abcdef1234567890',
          refreshToken: 'refresh-token',
          roleId: 'role-1',
          roleName: '角色一',
        },
      ]),
    )

    expect(accounts).toEqual([
      {
        id: 'main',
        name: '主账号',
        uid: '123456',
        deviceId: 'abcdef1234567890',
        refreshToken: 'refresh-token',
        roleId: 'role-1',
        roleName: '角色一',
      },
    ])
  })

  it('rejects an account missing required fields', () => {
    expect(() =>
      parseAccountsSecret(
        JSON.stringify([
          {
            id: 'main',
            name: '主账号',
            uid: '123456',
            deviceId: 'abcdef1234567890',
          },
        ]),
      ),
    ).toThrow('Account main is missing required field refreshToken')
  })

  it('rejects duplicate account ids', () => {
    expect(() =>
      parseAccountsSecret(
        JSON.stringify([
          {
            id: 'main',
            name: '主账号',
            uid: '123456',
            deviceId: 'device-a',
            refreshToken: 'refresh-a',
          },
          {
            id: 'main',
            name: '备用账号',
            uid: '654321',
            deviceId: 'device-b',
            refreshToken: 'refresh-b',
          },
        ]),
      ),
    ).toThrow('Duplicate account id: main')
  })
})
