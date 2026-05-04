import { parseAccountsSecret, type TaygedoAccount } from './config/accounts.js'
import { TaygedoApi } from './taygedo/api.js'
import { sendNotification } from './notify.js'
import { withRetries } from './utils/retry.js'

export interface RunnerDependencies {
  accountsSecret: string
  api?: Pick<TaygedoApi, 'refreshToken' | 'getBindRole' | 'appSignin' | 'getSigninState' | 'getSigninRewards' | 'gameSignin'>
  notificationUrls?: string[]
  maxRetries?: number
  secretWriter?: (payload: string) => Promise<void>
}

export interface RunAttendanceResult {
  updatedAccounts: TaygedoAccount[]
  summary: string
}

export async function runAttendance(deps: RunnerDependencies): Promise<RunAttendanceResult> {
  const accounts = parseAccountsSecret(deps.accountsSecret)
  const api = deps.api ?? new TaygedoApi()
  const updatedAccounts: TaygedoAccount[] = []
  let refreshedCount = 0
  const failedAccounts: string[] = []

  for (const account of accounts) {
    try {
      const updatedAccount = await withRetries(async () => {
        const refreshed = await api.refreshToken(account.refreshToken, account.deviceId)
        const role = await api.getBindRole(refreshed.accessToken, account.uid)
        const roleId = role.roleId ?? account.roleId
        if (!roleId) {
          throw new Error('No bound role found')
        }

        await api.appSignin(refreshed.accessToken, account.uid, account.deviceId)
        await api.getSigninState(refreshed.accessToken)
        await api.getSigninRewards(refreshed.accessToken)
        await api.gameSignin(refreshed.accessToken, roleId)

        const updated: TaygedoAccount = {
          ...account,
          refreshToken: refreshed.refreshToken,
          roleId,
        }
        if (role.roleName ?? account.roleName) {
          updated.roleName = role.roleName ?? account.roleName
        }
        return updated
      }, deps.maxRetries ?? 3)

      refreshedCount++
      updatedAccounts.push(updatedAccount)
    }
    catch {
      updatedAccounts.push({ ...account })
      failedAccounts.push(account.id)
    }
  }

  if (refreshedCount > 0 && deps.secretWriter) {
    await deps.secretWriter(JSON.stringify(updatedAccounts, null, 2))
  }

  if (deps.notificationUrls?.length) {
    await sendNotification({
      urls: deps.notificationUrls,
      title: '塔吉多每日签到',
      content: buildSummary(updatedAccounts, failedAccounts),
    })
  }

  return {
    updatedAccounts,
    summary: buildSummary(updatedAccounts, failedAccounts),
  }
}

function buildSummary(updatedAccounts: TaygedoAccount[], failedAccounts: string[]): string {
  return JSON.stringify({
    total: updatedAccounts.length,
    failedAccounts,
  }, null, 2)
}
