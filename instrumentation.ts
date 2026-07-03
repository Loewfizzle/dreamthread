import type { Instrumentation } from 'next'

/**
 * Structured server-error logging. Vercel (and most log drains) index
 * JSON lines, which makes these errors searchable/alertable. Swap the
 * console call for a provider SDK (e.g. Sentry) to upgrade later.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const error = err instanceof Error ? err : new Error(String(err))
  console.error(
    JSON.stringify({
      level: 'error',
      source: 'onRequestError',
      message: error.message,
      stack: error.stack,
      digest: 'digest' in error ? (error as { digest?: string }).digest : undefined,
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    })
  )
}
