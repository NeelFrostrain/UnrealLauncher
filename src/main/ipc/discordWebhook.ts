// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { logger } from '../logger'

interface DiscordPayload {
  embed: object
  files: Array<{ name: string; type: string; b64: string }>
}

/**
 * Validates that a URL is a valid Discord webhook URL
 * @param webhookUrl - The URL to validate
 * @returns true if valid Discord webhook URL
 */
export function isValidDiscordWebhookUrl(webhookUrl: string): boolean {
  try {
    const url = new URL(webhookUrl)

    // Must be HTTPS
    if (url.protocol !== 'https:') {
      logger.warn('discord', 'Webhook URL must use HTTPS', { url: webhookUrl })
      return false
    }

    // Must be discord.com domain (exact match or *.discord.com subdomain only)
    const host = url.hostname.toLowerCase()
    if (host !== 'discord.com' && !host.endsWith('.discord.com')) {
      logger.warn('discord', 'Webhook URL must be from discord.com', { hostname: url.hostname })
      return false
    }

    // Must have /api/webhooks/ path
    if (!url.pathname.includes('/api/webhooks/')) {
      logger.warn('discord', 'Webhook URL must have /api/webhooks/ path', {
        pathname: url.pathname
      })
      return false
    }

    return true
  } catch (error) {
    logger.warn('discord', 'Invalid webhook URL format', { url: webhookUrl, error })
    return false
  }
}

/**
 * Sends a Discord webhook message with optional file attachments
 * SECURITY: Webhook URL is injected server-side from environment, not from renderer
 */
export async function sendDiscordWebhook(
  payloadJson: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const https = await import('https')
    const { embed, files } = JSON.parse(payloadJson) as Omit<DiscordPayload, 'webhookUrl'>

    // SECURITY: Get webhook URL from environment only, ignore any URL in the payload
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.VITE_DISCORD_WEBHOOK_URL
    
    if (!webhookUrl) {
      logger.warn('discord', 'No Discord webhook URL configured in environment')
      return { ok: false, status: 400 }
    }

    // SECURITY: Validate webhook URL before making request
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      logger.error('discord', 'Invalid or malicious webhook URL blocked', { url: webhookUrl })
      return { ok: false, status: 400 }
    }

    const url = new URL(webhookUrl)
    const hasFiles = files && files.length > 0

    let body: Buffer
    let contentType: string

    if (!hasFiles) {
      // Simple JSON — no multipart needed
      body = Buffer.from(JSON.stringify({ embeds: [embed] }), 'utf8')
      contentType = 'application/json'
    } else {
      // Multipart form-data with files
      const boundary = `boundary${Date.now().toString(16)}`
      const CRLF = '\r\n'
      const parts: Buffer[] = []

      // payload_json part
      parts.push(
        Buffer.from(
          `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="payload_json"${CRLF}` +
            `Content-Type: application/json${CRLF}${CRLF}` +
            JSON.stringify({ embeds: [embed] }) +
            CRLF
        )
      )

      // File parts
      files.forEach((f, i) => {
        const fileHeader = Buffer.from(
          `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="files[${i}]"; filename="${f.name}"${CRLF}` +
            `Content-Type: ${f.type || 'application/octet-stream'}${CRLF}${CRLF}`
        )
        const fileData = Buffer.from(f.b64, 'base64')
        parts.push(fileHeader, fileData, Buffer.from(CRLF))
      })

      parts.push(Buffer.from(`--${boundary}--${CRLF}`))
      body = Buffer.concat(parts)
      contentType = `multipart/form-data; boundary=${boundary}`
    }

    return await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': contentType,
            'Content-Length': body.length
          }
        },
        (res) => {
          res.resume()
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0
          })
        }
      )
      req.on('error', reject)
      req.write(body)
      req.end()
    })
  } catch (err) {
    logger.error('discord', 'Webhook request failed', { error: err })
    throw new Error(err instanceof Error ? err.message : 'Request failed')
  }
}
