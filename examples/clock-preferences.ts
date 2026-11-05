import { z } from 'zod'
import { defineConfigurationSetting, localeSchema } from '../shared/contracts'

/**
 * OPTIONAL host-owned declarations, not built-in Configuration keys.
 * Clock alone determines whether a pattern is semantically valid.
 * The host integrates with Profile before making account-level preferences authoritative.
 */
const SCOPES = ['platform', 'tenant', 'group', 'account'] as const
const hourCycleSchema = z.enum(['h11', 'h12', 'h23', 'h24'])
const timeZoneSchema = z.string().min(1).max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  }
  catch {
    return false
  }
}, 'invalid-time-zone')

// Configuration enforces only input shape and bounds; Clock validates token grammar.
const patternSchema = z.string().min(1).max(120).regex(/^[A-Za-z0-9 /:.'-]+$/, 'invalid-pattern-characters')

function declaration(key: string, schema: z.ZodType<string>, defaultValue: string) {
  return defineConfigurationSetting({
    key,
    schema,
    scopes: SCOPES,
    visibility: 'members',
    sensitivity: 'organisational',
    risk: 'low',
    default: defaultValue,
  })
}

export const clockPresentationDeclarations = [
  declaration('clock.locale', localeSchema, 'en-GB'),
  declaration('clock.time-zone', timeZoneSchema, 'UTC'),
  declaration('clock.hour-cycle', hourCycleSchema, 'h23'),
  declaration('clock.date-pattern', patternSchema, 'dd/MM/yyyy'),
  declaration('clock.time-pattern', patternSchema, 'HH:mm:ss'),
  declaration('clock.date-time-pattern', patternSchema, 'dd/MM/yyyy HH:mm:ss'),
] as const

export const clockPresentationKeys = clockPresentationDeclarations.map(setting => setting.key)

export type ClockPresentationPreferences = {
  locale: string
  timeZone: string
  hourCycle: 'h11' | 'h12' | 'h23' | 'h24'
  datePattern: string
  timePattern: string
  dateTimePattern: string
}

/**
 * Shape a result from Configuration's existing server API for the composition host.
 * The catalogue defaults are expected to resolve; refuse a missing/invalid shape
 * rather than quietly passing corrupt preferences to a consuming capability.
 */
export function toClockPresentationPreferences(values: Record<string, unknown>): ClockPresentationPreferences {
  const result = Object.fromEntries(clockPresentationDeclarations.map(setting => {
    const value = values[setting.key] ?? setting.default
    return [setting.key, setting.schema.parse(value)]
  }))
  return {
    locale: result['clock.locale'] as string,
    timeZone: result['clock.time-zone'] as string,
    hourCycle: result['clock.hour-cycle'] as ClockPresentationPreferences['hourCycle'],
    datePattern: result['clock.date-pattern'] as string,
    timePattern: result['clock.time-pattern'] as string,
    dateTimePattern: result['clock.date-time-pattern'] as string,
  }
}
