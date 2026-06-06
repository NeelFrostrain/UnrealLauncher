// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect } from 'vitest'
import { isValidDiscordWebhookUrl } from '../discordWebhook'

describe('isValidDiscordWebhookUrl', () => {
  // ── Valid URLs ────────────────────────────────────────────────────────────

  it('accepts a well-formed Discord webhook URL', () => {
    expect(
      isValidDiscordWebhookUrl(
        'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz'
      )
    ).toBe(true)
  })

  it('accepts a canary discord.com webhook', () => {
    expect(
      isValidDiscordWebhookUrl(
        'https://canary.discord.com/api/webhooks/9876543210/token'
      )
    ).toBe(true)
  })

  // ── HTTP rejected ─────────────────────────────────────────────────────────

  it('rejects http:// (not HTTPS)', () => {
    expect(
      isValidDiscordWebhookUrl(
        'http://discord.com/api/webhooks/123/token'
      )
    ).toBe(false)
  })

  // ── Wrong domain ──────────────────────────────────────────────────────────

  it('rejects non-discord.com domain', () => {
    expect(
      isValidDiscordWebhookUrl('https://evil.com/api/webhooks/123/token')
    ).toBe(false)
  })

  it('rejects domain that merely contains discord.com as a substring', () => {
    expect(
      isValidDiscordWebhookUrl('https://not-discord.com/api/webhooks/123/token')
    ).toBe(false)
  })

  it('rejects discord.com.evil.com', () => {
    expect(
      isValidDiscordWebhookUrl('https://discord.com.evil.com/api/webhooks/123/token')
    ).toBe(false)
  })

  // ── Wrong path ────────────────────────────────────────────────────────────

  it('rejects URL without /api/webhooks/ path', () => {
    expect(
      isValidDiscordWebhookUrl('https://discord.com/channels/123/456')
    ).toBe(false)
  })

  // ── Malformed URLs ────────────────────────────────────────────────────────

  it('rejects empty string', () => {
    expect(isValidDiscordWebhookUrl('')).toBe(false)
  })

  it('rejects plain text (not a URL)', () => {
    expect(isValidDiscordWebhookUrl('not-a-url')).toBe(false)
  })

  it('rejects javascript: scheme', () => {
    expect(isValidDiscordWebhookUrl('javascript:alert(1)')).toBe(false)
  })
})
