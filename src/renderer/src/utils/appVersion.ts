// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

/**
 * Single source of truth for the app version in the renderer.
 * Set VITE_APP_VERSION in .env — keep it in sync with package.json "version".
 */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '2.1.2'
