# Clearance Preview Add-In

A MyGeotab add-in that displays all security clearances from the database and provides a visual preview of each clearance's access permissions.

## Features

- Lists all security clearances from the connected MyGeotab database
- Click any clearance to open a preview modal showing:
  - MyGeotab-style navigation sidebar with access indicators
  - Visual representation of allowed/denied menu items
  - Access summary statistics
  - Full list of security features enabled

## Structure

```
Add-in/
├── config.json          # Add-in configuration (menu placement, metadata)
├── index.html           # Main HTML page with clearance list and modal
├── scripts/
│   └── main.js          # Clearance fetching and preview logic
├── styles/
│   └── main.css         # MyGeotab-themed styling
└── images/
    └── icon.svg         # Menu icon
```

## Installation

### For Development (geotab_gb database)

1. Serve the add-in locally:
   ```bash
   npx serve .
   ```

2. In MyGeotab (geotab_gb):
   - Go to **Administration > System Settings > Add-Ins**
   - Click **Add Custom Add-In**
   - Enter your local URL (e.g., `http://localhost:3000`)
   - Save and refresh

### For Production

Upload all files to a web server and configure the add-in URL in MyGeotab.

## How It Works

1. **Fetches Clearances**: Uses the MyGeotab API to get all security groups that are children of `GroupSecurityId`
2. **Displays Grid**: Shows each clearance as a clickable card
3. **Preview Modal**: When clicked, fetches the full clearance details including `securityFilters`
4. **Visual Preview**: Renders a MyGeotab-style sidebar showing which navigation items are accessible

## API Calls Used

- `Get` with `typeName: 'Group'` - Fetches security clearance groups
- `Get` with `typeName: 'SecurityIdentifier'` - Maps features to readable names

## Customization

### Adding More Navigation Items

Edit the `navigationStructure` array in `scripts/main.js` to add more menu items. Each item needs:
- `name`: Display name
- `icon`: Emoji or icon
- `securityId`: The MyGeotab SecurityIdentifier it maps to
- `children`: Sub-menu items (optional)

