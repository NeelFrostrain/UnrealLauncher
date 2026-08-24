// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import config from '../../../config'

/**
 * Unified Global Legal, Terms & Privacy Policy Version.
 * Configured via VITE_LEGAL_VERSION in .env (e.g. "1.0.0").
 * Any change to this version triggers the legal review & agreement modal on startup.
 */
export const CURRENT_LEGAL_VERSION = config.legalVersion || '1.0.0'
export const CURRENT_LEGAL_POLICY_VERSION = CURRENT_LEGAL_VERSION
export const TERMS_VERSION = CURRENT_LEGAL_VERSION
export const PRIVACY_VERSION = CURRENT_LEGAL_VERSION
export const LEGAL_POLICY_UPDATED_DATE = 'August 19, 2026'

export const COMPANY_INFO = {
  name: config.companyName || 'Cyronic Studio',
  website: config.companyWebsite || 'https://cyronicstudio.vercel.app',
  creatorName: config.creatorName || 'Neel Frostrain',
  creatorGithub: config.creatorGithub || 'https://github.com/NeelFrostrain',
  creatorEmail: config.creatorEmail || 'nfrostrain@gmail.com',
  license: 'GNU General Public License v3.0 (GPLv3)',
  trademarkDisclaimer:
    'Unreal®, Unreal Engine®, UE4®, UE5®, Epic Games®, and Fab™ are trademarks or registered trademarks of Epic Games, Inc. This application is an independent open-source tool developed by Cyronic Studio and is NOT affiliated with, sponsored, endorsed, or approved by Epic Games, Inc.'
}

export const TERMS_HIGHLIGHTS = [
  {
    title: 'Open Source License (GPLv3)',
    desc: 'Unreal Launcher is free and open source. You are free to inspect, run, modify, and redistribute the application in compliance with the GNU General Public License v3.0.'
  },
  {
    title: 'Non-Affiliation & Trademarks',
    desc: 'Unreal Launcher is an independent open-source project by Cyronic Studio / Neel Frostrain and is not affiliated with, sponsored by, or endorsed by Epic Games, Inc.'
  },
  {
    title: 'User Backup Obligations',
    desc: 'You are solely responsible for maintaining verified external backups of your projects, source code, and assets before performing diagnostics, cache cleanups, or file edits.'
  },
  {
    title: 'System Permissions & Utilities',
    desc: 'You authorize the application to scan drives for .uproject files, read Windows Registry engine keys, monitor active editor processes, and install the Ctrl+K global hotkey hook.'
  },
  {
    title: 'Warranty & Liability Disclaimer',
    desc: 'The software is provided "AS IS", without warranty of any kind. Maintainers are not liable for any data loss, project corruption, build failures, or system downtime.'
  }
]

export const PRIVACY_HIGHLIGHTS = [
  {
    title: 'No Account Required',
    desc: 'Zero user accounts, passwords, or personal credentials are required. All core project management operates 100% locally on your computer.'
  },
  {
    title: 'Local-First Data Storage',
    desc: 'Engines, projects, custom launch configs, and appearance settings are stored locally in your OS Application Data directory (%APPDATA%\\Unreal Launcher).'
  },
  {
    title: 'Startup System Info & Active User Count (Discord Webhook)',
    desc: 'When you launch the app, basic system information (CPU/GPU model, RAM, OS build, system uptime, and public IP) is sent via HTTPS to our private Discord server to track active Unreal Launcher user count, measure version adoption, and ensure hardware compatibility.'
  },
  {
    title: 'Voluntary Feedback & Bug Reports',
    desc: 'User feedback, issue descriptions, and optional screenshot/log attachments are transmitted only when you explicitly submit a feedback form.'
  },
  {
    title: 'UE Tracer & Keyboard Hook',
    desc: 'The background UE Tracer daemon records engine runtimes locally and listens strictly for the Ctrl+K shortcut. Keystrokes are never logged, recorded, or transmitted.'
  },
  {
    title: 'Data Retention & Deletion',
    desc: 'You have complete control over your data and can wipe saved engines, projects, and tracer logs anytime via Settings → Data & Storage.'
  }
]
