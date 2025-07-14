# Google Trends Widget Integration

This document describes the Google Trends widget integration for the ShareWizard application.

## Installation

The necessary dependencies have been installed:

```bash
npm install react-load-script
```

## Components

### 1. TypeScript Types (`src/types/google-trends.d.ts`)

Defines TypeScript interfaces for Google Trends integration:

- `GoogleTrendsOptions`: Configuration options for the widget
- `GoogleTrendsWidgetProps`: Props for the React component
- Global window interface for Google Trends API

### 2. Google Trends Widget (`src/components/inspiration/GoogleTrendsWidget.tsx`)

A React component that:

- Loads the Google Trends embed script using `react-load-script`
- Renders a placeholder div for the widget
- Handles loading states and error handling
- Supports localization through `react-i18next`
- Provides callback functions for load and error events

## Usage

### Basic Usage

```tsx
import GoogleTrendsWidget from '@/components/inspiration/GoogleTrendsWidget';

<GoogleTrendsWidget
  keywords="artificial intelligence"
  geo="US"
  timeframe="today 12-m"
  type="TIMESERIES"
  onLoad={() => console.log('Widget loaded')}
  onError={(error) => console.error('Widget error:', error)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `keywords` | `string \| string[]` | Required | Keywords to search for |
| `geo` | `string` | `undefined` | Geographic location (e.g., "US", "CA", "GB") |
| `timeframe` | `string` | `"today 12-m"` | Time range for the data |
| `type` | `'TIMESERIES' \| 'GEO_MAP' \| 'RELATED_TOPICS' \| 'RELATED_QUERIES'` | `"TIMESERIES"` | Type of widget to display |
| `hl` | `string` | `"en-US"` | Language code |
| `tz` | `number` | `-120` | Timezone offset |
| `className` | `string` | `""` | Additional CSS classes |
| `onLoad` | `() => void` | `undefined` | Callback when widget loads successfully |
| `onError` | `(error: Error) => void` | `undefined` | Callback when an error occurs |

### Timeframe Options

- `"today 1-m"`: Last 1 month
- `"today 3-m"`: Last 3 months
- `"today 12-m"`: Last 12 months
- `"today 5-y"`: Last 5 years
- `"all"`: 2004-present

### Widget Types

- `"TIMESERIES"`: Shows search interest over time
- `"GEO_MAP"`: Shows geographic distribution
- `"RELATED_TOPICS"`: Shows related topics
- `"RELATED_QUERIES"`: Shows related search queries

## Localization

The component supports localization through `react-i18next`. Translation keys are available in:

- `public/locales/en/inspiration.json`
- `public/locales/fr/inspiration.json`

### Translation Keys

```json
{
  "googleTrends": {
    "title": "Google Trends",
    "description": "Explore trending topics and search patterns",
    "loading": {
      "script": "Loading Google Trends...",
      "widget": "Rendering trends widget..."
    },
    "errors": {
      "scriptLoadFailed": "Failed to load Google Trends script",
      "widgetInitFailed": "Failed to initialize Google Trends widget",
      "widgetRenderFailed": "Failed to render Google Trends widget"
    }
  }
}
```

## Example Component

See `src/components/inspiration/GoogleTrendsExample.tsx` for a complete example with:

- Interactive configuration controls
- Preset examples
- Error handling
- Loading states

## Error Handling

The component includes comprehensive error handling:

1. **Script Load Errors**: Handles failures to load the Google Trends script
2. **Widget Initialization Errors**: Handles failures to initialize the widget
3. **Widget Render Errors**: Handles failures to render the widget
4. **User Callbacks**: Provides `onError` callback for custom error handling

## Development Features

- **Debug Information**: Shows configuration details in development mode
- **Console Logging**: Provides detailed console logs for debugging
- **Unique Container IDs**: Generates unique IDs to prevent conflicts

## Browser Compatibility

The widget requires:

- Modern browser with JavaScript enabled
- Internet connection to load Google Trends script
- Support for ES6+ features

## Security Considerations

- The widget loads external scripts from Google
- Consider Content Security Policy (CSP) implications
- Ensure HTTPS is used in production

## Troubleshooting

### Common Issues

1. **Widget not loading**: Check network connectivity and browser console
2. **Script load errors**: Verify the Google Trends script URL is accessible
3. **Widget initialization failures**: Ensure the script has loaded before rendering
4. **CSP violations**: Add Google domains to your Content Security Policy

### Debug Mode

In development mode, the component shows debug information including:
- Keywords being searched
- Geographic location
- Timeframe settings
- Widget type
- Language settings

## Future Enhancements

Potential improvements:

1. **Caching**: Implement caching for repeated searches
2. **Custom Styling**: Add more styling options
3. **Advanced Configuration**: Support for more Google Trends options
4. **Analytics Integration**: Track widget usage and interactions
5. **Accessibility**: Improve accessibility features 