const TAYGEDO_BASE_URL = 'https://bbs-api.tajiduo.com'

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface TaygedoApiOptions {
  fetch?: typeof fetch
}

export interface BindRoleResponse {
  roleId?: string
  roleName?: string
}

export class TaygedoApi {
  private readonly fetchImpl: typeof fetch

  constructor(options: TaygedoApiOptions = {}) {
    this.fetchImpl = options.fetch ?? fetch
  }

  async refreshToken(refreshToken: string, deviceId: string): Promise<RefreshTokenResponse> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/usercenter/api/refreshToken`, {
      method: 'POST',
      headers: {
        authorization: refreshToken,
        deviceid: deviceId,
        appversion: '1.1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'okhttp/4.12.0',
      },
    })

    const data = await response.json() as {
      code?: number
      msg?: string
      data?: {
        accessToken?: string
        refreshToken?: string
      }
    }

    if (!response.ok || data.code !== 0 || !data.data?.accessToken || !data.data?.refreshToken) {
      throw new Error(data.msg ?? 'refreshToken request failed')
    }

    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    }
  }

  async getBindRole(accessToken: string, uid: string): Promise<BindRoleResponse> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/apihub/api/getGameBindRole?uid=${encodeURIComponent(uid)}&gameId=1256`, {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    })

    const data = await response.json() as {
      code?: number
      msg?: string
      data?: BindRoleResponse
    }

    if (!response.ok || data.code !== 0 || !data.data) {
      throw new Error(data.msg ?? 'getBindRole request failed')
    }

    return data.data
  }

  async appSignin(accessToken: string, uid: string, deviceId: string): Promise<{ exp: number, goldCoin: number }> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/apihub/api/signin`, {
      method: 'POST',
      headers: {
        authorization: accessToken,
        uid,
        deviceid: deviceId,
        appversion: '1.1.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'okhttp/4.12.0',
      },
      body: 'communityId=1',
    })

    const data = await response.json() as {
      code?: number
      msg?: string
      data?: { exp?: number, goldCoin?: number }
    }

    if (
      !response.ok
      || data.code !== 0
      || typeof data.data?.exp !== 'number'
      || typeof data.data?.goldCoin !== 'number'
    ) {
      throw new Error(data.msg ?? 'appSignin request failed')
    }

    return {
      exp: data.data.exp,
      goldCoin: data.data.goldCoin,
    }
  }

  async getSigninState(accessToken: string): Promise<{ days: number }> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/apihub/awapi/signin/state?gameId=1256`, {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    })

    const data = await response.json() as {
      code?: number
      msg?: string
      data?: { days?: number }
    }

    if (!response.ok || data.code !== 0 || typeof data.data?.days !== 'number') {
      throw new Error(data.msg ?? 'getSigninState request failed')
    }

    return {
      days: data.data.days,
    }
  }

  async getSigninRewards(accessToken: string): Promise<Array<{ name: string, num: number }>> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/apihub/awapi/sign/rewards?gameId=1256`, {
      method: 'GET',
      headers: {
        Authorization: accessToken,
      },
    })

    const data = await response.json() as {
      code?: number
      msg?: string
      data?: Array<{ name: string, num: number }>
    }

    if (!response.ok || data.code !== 0 || !Array.isArray(data.data)) {
      throw new Error(data.msg ?? 'getSigninRewards request failed')
    }

    return data.data
  }

  async gameSignin(accessToken: string, roleId: string): Promise<void> {
    const response = await this.fetchImpl(`${TAYGEDO_BASE_URL}/apihub/awapi/sign`, {
      method: 'POST',
      headers: {
        authorization: accessToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `roleId=${encodeURIComponent(roleId)}&gameId=1256`,
    })

    const data = await response.json() as {
      code?: number
      msg?: string
    }

    if (!response.ok || data.code !== 0) {
      throw new Error(data.msg ?? 'gameSignin request failed')
    }
  }
}
