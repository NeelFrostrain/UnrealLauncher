// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

interface DiscordPayload {
  webhookUrl: string
  embed: object
  files: Array<{ name: string; type: string; b64: string }>
}

/**
 * Sends a Discord webhook message with optional file attachments
 */
export async function sendDiscordWebhook(
  payloadJson: string
): Promise<{ ok: boolean; status: number }> {
  try {
    const https = await import('https')
    const { embed, webhookUrl, files } = JSON.parse(payloadJson) as DiscordPayload

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
    throw new Error(err instanceof Error ? err.message : 'Request failed')
  }
}
