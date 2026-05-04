import { writeFile } from 'node:fs/promises'
import { TaygedoApi } from './taygedo/api.js'
import { runAttendance, type RunnerDependencies } from './runner.js'

interface ActionOptions {
  env?: Record<string, string | undefined>
  api?: RunnerDependencies['api']
}

export async function runAction(options: ActionOptions = {}): Promise<void> {
  const env = options.env ?? process.env
  const accountsSecret = env.TAYGEDO_ACCOUNTS
  if (!accountsSecret) {
    throw new Error('Missing required env TAYGEDO_ACCOUNTS')
  }

  const outputPath = env.TAYGEDO_UPDATED_ACCOUNTS_PATH ?? 'updated-accounts.json'
  await runAttendance({
    accountsSecret,
    api: options.api ?? new TaygedoApi(),
    notificationUrls: splitComma(env.TAYGEDO_NOTIFICATION_URLS),
    maxRetries: Number(env.TAYGEDO_MAX_RETRIES ?? '3'),
    secretWriter: payload => writeFile(outputPath, `${payload}\n`, 'utf8'),
  })

  console.log(`Updated accounts written to ${outputPath}`)
}

function splitComma(value: string | undefined): string[] {
  if (!value) {
    return []
  }
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAction().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
