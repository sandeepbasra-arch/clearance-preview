# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a MyGeotab custom add-in that displays security clearances and provides a visual preview of what access each clearance level grants. It's designed for the geotab_gb database.

## Development

### Local Testing

```bash
npx serve .
```

Then add the add-in in MyGeotab: Administration > System Settings > Add-Ins

## Architecture

### Add-In Lifecycle

The add-in follows a strict lifecycle managed by MyGeotab:

1. **initialize(api, state, callback)** - Called once when add-in loads
2. **focus(api, state)** - Called each time add-in becomes visible, triggers `fetchClearances()`
3. **blur()** - Called when navigating away, closes the modal

### Key Components

**Clearance Fetching** (`fetchClearances`):
- Fetches Group objects that are children of `GroupSecurityId`
- These represent security clearances in MyGeotab
- Also fetches `SecurityIdentifier` objects for feature mapping

**Preview Modal** (`openModal`):
- Displays a MyGeotab-style sidebar preview
- Shows which navigation items are accessible based on `securityFilters`
- Uses `navigationStructure` to map security IDs to menu items

### Navigation Structure

The `navigationStructure` array maps MyGeotab menu items to their security identifiers. To add more items, add entries with:
```javascript
{ name: 'Display Name', icon: 'emoji', securityId: 'SecurityIdentifierName', children: [] }
```

### Key Constraint

The page name in config.json (`items[].page: "clearancePreview"`) must match the property name registered on `geotab.addin.clearancePreview` in main.js.

### CSS Theming

Uses CSS variables in `:root` that match MyGeotab's color palette:
- `--myg-primary`: #0078d4 (Geotab blue)
- `--myg-sidebar-bg`: #2d3e50 (Dark sidebar)
