export async function withRetries<T>(operation: () => Promise<T>, maxAttempts: number): Promise<T> {
  let lastError: unknown
  const attempts = Math.max(1, maxAttempts)

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    }
    catch (error) {
      lastError = error
    }
  }

  throw lastError
}
