export class TelemetryError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_DATA' | 'UNKNOWN_MODEL' | 'PARSE_ERROR' | 'UNAVAILABLE' = 'INVALID_DATA',
    public readonly details?: Record<string, any>
  ) {
    super(message)
    this.name = 'TelemetryError'
  }
}
