import { describe, expect, it } from 'vitest'
import { buildConfigurationCatalogue, resolveConfiguration } from '../shared/contracts'
import { clockPresentationDeclarations, clockPresentationKeys, toClockPresentationPreferences } from '../examples/clock-preferences'

const catalogue = buildConfigurationCatalogue([], clockPresentationDeclarations)
const layers = { deployment: {}, platform: {} }

describe('optional host-declared Clock presentation preferences', () => {
  it('declares all six correctly typed defaults without installing Clock', () => {
    const answer = resolveConfiguration(catalogue, layers, { keys: clockPresentationKeys, visibility: 'members' })
    expect(toClockPresentationPreferences(answer.values)).toEqual({
      locale: 'en-GB', timeZone: 'UTC', hourCycle: 'h23',
      datePattern: 'dd/MM/yyyy', timePattern: 'HH:mm:ss', dateTimePattern: 'dd/MM/yyyy HH:mm:ss',
    })
    expect(Object.values(answer.provenance).every(value => value.source === 'default')).toBe(true)
  })

  it('resolves nearest group ancestor before tenant and platform', () => {
    const answer = resolveConfiguration(catalogue, {
      ...layers,
      platform: { 'clock.locale': 'fr-FR', 'clock.time-zone': 'UTC' },
      tenant: { 'clock.locale': 'en-GB' },
      lineage: [
        { groupId: 'child', values: { 'clock.date-pattern': 'yyyy-MM-dd' } },
        { groupId: 'root', values: { 'clock.locale': 'cy-GB' } },
      ],
    }, { visibility: 'members' })
    expect(answer.values['clock.locale']).toBe('cy-GB')
    expect(answer.provenance['clock.locale']).toEqual({ source: 'group', groupId: 'root' })
    expect(answer.values['clock.date-pattern']).toBe('yyyy-MM-dd')
    expect(answer.values['clock.time-zone']).toBe('UTC')
  })

  it('resolves account overrides over tenant and platform without claiming group inheritance', () => {
    const answer = resolveConfiguration(catalogue, {
      ...layers,
      platform: { 'clock.hour-cycle': 'h24' },
      tenant: { 'clock.locale': 'fr-FR' },
      account: { 'clock.locale': 'cy-GB' },
    }, { visibility: 'members' })
    expect(answer.values['clock.locale']).toBe('cy-GB')
    expect(answer.values['clock.hour-cycle']).toBe('h24')
    expect(answer.provenance['clock.locale']).toEqual({ source: 'account' })
  })

  it('uses defaults for missing values, refuses invalid typed values, and does not treat them as Clock patterns', () => {
    expect(toClockPresentationPreferences({ 'clock.locale': 'en-US' }).timePattern).toBe('HH:mm:ss')
    expect(() => toClockPresentationPreferences({ 'clock.hour-cycle': 'h25' })).toThrow()
    expect(() => toClockPresentationPreferences({ 'clock.time-zone': 'Mars/Olympus' })).toThrow()
    expect(() => toClockPresentationPreferences({ 'clock.date-pattern': '<script>' })).toThrow()
    expect(() => buildConfigurationCatalogue([], [
      { ...clockPresentationDeclarations[2], default: 'h25' },
    ])).toThrow()
  })

  it('never exposes account-capable keys at public visibility', () => {
    expect(resolveConfiguration(catalogue, {
      ...layers, account: { 'clock.locale': 'cy-GB' },
    }, { visibility: 'public' }).values).toEqual({})
  })

  it('returns a plain JSON-safe object for SSR and hydration', () => {
    const answer = resolveConfiguration(catalogue, layers, { visibility: 'members' })
    const preferences = toClockPresentationPreferences(answer.values)
    expect(JSON.parse(JSON.stringify(preferences))).toEqual(preferences)
    expect(Object.keys(preferences)).toHaveLength(6)
  })
})
