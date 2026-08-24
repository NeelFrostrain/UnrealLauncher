// Copyright (c) 2026 NeelFrostrain. All rights reserved.

/**
 * Single source of truth for the app version in the renderer.
 * Set VITE_APP_VERSION in .env — keep it in sync with package.json "version".
 */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '2.1.2'
