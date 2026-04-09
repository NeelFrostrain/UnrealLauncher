# Requirements Document

## Introduction

This feature adds a UI theme customization system to the Unreal Launcher Electron + React + Tailwind CSS v4 app. Currently, all colors are hardcoded as Tailwind arbitrary values (e.g., `bg-[#242424]`, `bg-[#1a1a1a]`, `border-white/10`, `bg-blue-600`). The system will introduce CSS custom properties injected on `:root`, a ThemeContext that manages theme state, a set of built-in themes, and a theme picker UI in SettingsPage with optional per-color overrides. All changes must be backward-compatible — no existing component file needs to change its class names during the initial rollout.

## Glossary

- **Theme_System**: The complete set of components, context, utilities, and CSS responsible for managing and applying UI themes.
- **ThemeContext**: The React context that holds the active theme identifier, custom overrides, and functions to change them.
- **ThemeProvider**: The React component that wraps the app, reads persisted theme data, and injects CSS custom properties onto `:root`.
- **Built-in_Theme**: A predefined, immutable theme definition shipped with the app (e.g., Dark, Darker, Midnight Blue, Warm Dark).
- **CSS_Variable**: A CSS custom property declared on `:root` (e.g., `--color-surface`) consumed by Tailwind utility classes or inline styles.
- **Theme_Token**: A named design token (e.g., `surface`, `surface-elevated`, `accent`) that maps to a CSS variable.
- **Custom_Override**: A user-supplied hex color value that replaces a specific Theme_Token for the active theme.
- **Theme_Picker**: The UI section in SettingsPage that displays Built-in_Themes as selectable swatches and exposes Custom_Override inputs.
- **Persistence_Layer**: The localStorage mechanism that saves and restores the active theme ID and any Custom_Overrides across sessions.
- **Settings_Utility**: The existing module at `src/renderer/src/utils/settings.ts` that reads and writes app settings to localStorage.

---

## Requirements

### Requirement 1: CSS Variable Token Set

**User Story:** As a developer, I want all UI colors expressed as CSS custom properties on `:root`, so that every component inherits the active theme without per-file changes.

#### Acceptance Criteria

1. THE Theme_System SHALL define the following CSS_Variables on `:root`: `--color-surface`, `--color-surface-elevated`, `--color-surface-card`, `--color-border`, `--color-accent`, `--color-accent-hover`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`.
2. THE Theme_System SHALL set all CSS_Variables synchronously before the first paint to prevent a flash of unstyled content.
3. WHEN a theme change occurs, THE ThemeProvider SHALL update all CSS_Variables on `:root` within a single synchronous DOM write.
4. THE Theme_System SHALL expose Tailwind CSS v4 utility aliases (e.g., `bg-surface`, `text-accent`) mapped to the CSS_Variables so components can adopt them incrementally.

---

### Requirement 2: Built-in Themes

**User Story:** As a user, I want a set of curated built-in themes to choose from, so that I can change the app's look without manually picking colors.

#### Acceptance Criteria

1. THE Theme_System SHALL ship exactly four Built-in_Themes: **Dark** (current default), **Darker**, **Midnight Blue**, and **Warm Dark**.
2. THE Theme_System SHALL define each Built-in_Theme as a complete mapping of all nine Theme_Tokens to valid hex color values.
3. THE Theme_System SHALL treat the **Dark** theme as the default when no persisted selection exists.
4. THE **Dark** theme SHALL use the following token values derived from the existing hardcoded colors:
   - `surface`: `#242424`
   - `surface-elevated`: `#1f1f1f`
   - `surface-card`: `#1a1a1a`
   - `border`: `rgba(255,255,255,0.10)`
   - `accent`: `#2563eb` (blue-600)
   - `accent-hover`: `#1d4ed8` (blue-700)
   - `text-primary`: `rgba(255,255,255,0.90)`
   - `text-secondary`: `rgba(255,255,255,0.60)`
   - `text-muted`: `rgba(255,255,255,0.40)`
5. THE **Darker** theme SHALL use deeper background values (surface ≤ `#161616`) while keeping the same accent and text token structure.
6. THE **Midnight Blue** theme SHALL use dark blue-tinted background values (surface ≈ `#0d1117`) with a blue-shifted accent.
7. THE **Warm Dark** theme SHALL use warm-tinted background values (surface ≈ `#1e1a16`) with an amber or orange accent.

---

### Requirement 3: ThemeContext and ThemeProvider

**User Story:** As a developer, I want a React context that exposes the active theme and change functions, so that any component can read or update the theme.

#### Acceptance Criteria

1. THE ThemeContext SHALL expose: `activeThemeId` (string), `customOverrides` (partial token map), `setTheme(id: string): void`, `setOverride(token: string, value: string): void`, and `resetOverrides(): void`.
2. THE ThemeProvider SHALL wrap the application at the root level (inside `main.tsx`) so all child components have access to ThemeContext.
3. WHEN `setTheme` is called with a valid Built-in_Theme ID, THE ThemeProvider SHALL apply the corresponding token values to `:root` CSS_Variables and persist the selection via the Persistence_Layer.
4. WHEN `setTheme` is called with an unrecognized ID, THE ThemeProvider SHALL fall back to the **Dark** theme and log a console warning.
5. WHEN `setOverride` is called with a token name and a valid CSS color string, THE ThemeProvider SHALL update the corresponding CSS_Variable on `:root` and persist the override via the Persistence_Layer.
6. WHEN `resetOverrides` is called, THE ThemeProvider SHALL remove all Custom_Overrides, reapply the base Built-in_Theme token values, and persist the cleared state.
7. THE ThemeProvider SHALL read persisted theme data from the Persistence_Layer on mount and apply it before rendering children.

---

### Requirement 4: Theme Persistence

**User Story:** As a user, I want my theme choice and custom color overrides to persist across app restarts, so that I don't have to reconfigure the theme every time I open the launcher.

#### Acceptance Criteria

1. THE Persistence_Layer SHALL store the active theme ID and Custom_Overrides under a dedicated localStorage key separate from the existing `unrealLauncherSettings` key.
2. WHEN the app starts, THE ThemeProvider SHALL load the persisted theme ID and Custom_Overrides from localStorage before injecting CSS_Variables.
3. IF the persisted theme ID does not match any Built-in_Theme, THEN THE ThemeProvider SHALL fall back to the **Dark** theme and clear the invalid persisted value.
4. IF localStorage is unavailable or throws an error, THEN THE ThemeProvider SHALL apply the **Dark** theme defaults and continue without crashing.
5. THE Persistence_Layer SHALL persist Custom_Overrides as a JSON object mapping token names to hex color strings.

---

### Requirement 5: Theme Picker UI

**User Story:** As a user, I want a visual theme picker in the Settings page, so that I can preview and select themes by seeing their color swatches.

#### Acceptance Criteria

1. THE Theme_Picker SHALL be rendered as a new section in SettingsPage, above the existing "Launch Behavior" section.
2. THE Theme_Picker SHALL display each Built-in_Theme as a clickable card containing: the theme name, and a row of color swatches representing `surface`, `surface-elevated`, `accent`, and `text-primary` tokens.
3. WHEN a Built-in_Theme card is clicked, THE Theme_Picker SHALL call `setTheme` with the corresponding theme ID and visually mark that card as selected.
4. THE Theme_Picker SHALL indicate the currently active theme with a visible selection indicator (e.g., a colored border matching the accent token).
5. THE Theme_Picker SHALL render the theme cards in a responsive grid that shows 2 columns on narrow widths and 4 columns on wider widths.

---

### Requirement 6: Custom Color Overrides UI

**User Story:** As a user, I want to override individual colors (accent and background) using a color picker, so that I can personalize the theme beyond the built-in options.

#### Acceptance Criteria

1. THE Theme_Picker SHALL display a "Custom Colors" subsection below the Built-in_Theme cards, containing color inputs for the `accent` and `surface` tokens.
2. WHEN a color input value changes, THE Theme_Picker SHALL call `setOverride` with the corresponding token name and the new hex color value within 300ms of the change event.
3. THE Theme_Picker SHALL initialize each color input with the currently active value of the corresponding CSS_Variable (base theme value merged with any existing Custom_Override).
4. THE Theme_Picker SHALL display a "Reset to defaults" button that calls `resetOverrides` and resets the color inputs to the active Built-in_Theme's base values.
5. WHEN `resetOverrides` is called via the button, THE Theme_Picker SHALL update the color input values to reflect the reset state without requiring a page reload.
6. WHERE the user has active Custom_Overrides, THE Theme_Picker SHALL display a visible indicator (e.g., a badge or label) showing that custom colors are active.

---

### Requirement 7: No-Regression Compatibility

**User Story:** As a developer, I want the theme system to be additive, so that existing components continue to work correctly without requiring immediate refactoring.

#### Acceptance Criteria

1. THE Theme_System SHALL inject CSS_Variables with values matching the current hardcoded colors for the **Dark** theme, so existing Tailwind arbitrary-value classes (e.g., `bg-[#242424]`) continue to render identically.
2. THE Theme_System SHALL NOT modify any existing component file outside of `main.tsx`, `src/renderer/src/assets/main.css`, and the new theme-related files.
3. THE LayoutWrapper SHALL have its hardcoded `bg-[#242424]` class replaced with a CSS_Variable-backed utility class as the sole migration example demonstrating the pattern.
4. WHEN the **Dark** theme is active with no Custom_Overrides, THE Theme_System SHALL produce a visual result identical to the pre-feature baseline.
