// Copyright (c) 2026 NeelFrostrain. All rights reserved.
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
  kofi: import.meta.env.VITE_KOFI_URL || '',
  website: import.meta.env.VITE_WEBSITE_URL || '',

  /** Company / Studio */
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Cyronic Studio',
  companyWebsite: import.meta.env.VITE_COMPANY_WEBSITE_URL || 'https://cyronicstudio.vercel.app',

  /** Creator */
  creatorName: import.meta.env.VITE_CREATOR_NAME || 'NeelFrostrain',
  creatorGithub: import.meta.env.VITE_CREATOR_GITHUB_URL || 'https://github.com/NeelFrostrain',
  creatorEmail: import.meta.env.VITE_CREATOR_EMAIL || 'nfrostrain@gmail.com',

  /** Unified Legal, Terms & Privacy Policy Version */
  legalVersion: import.meta.env.VITE_LEGAL_VERSION || '1.0.0'
}

export default config
