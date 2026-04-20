// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Configuration loaded from environment variables.
 * Copy .env.example to .env and fill in your values.
 * Variables must be prefixed with VITE_ to be exposed to the renderer process.
 */

const config = {
  /** Discord webhook URL for feedback/bug reports */
  discordWebhook: import.meta.env.VITE_DISCORD_WEBHOOK_URL || '',

  /** Discord server invite link */
  discordInvite: import.meta.env.VITE_DISCORD_INVITE_URL || '',

  /** GitHub repository base URL */
  githubRepo: import.meta.env.VITE_GITHUB_REPO_URL || '',

  /** Ko-fi donation link */
  kofi: import.meta.env.VITE_KOFI_URL || ''
}

export default config
