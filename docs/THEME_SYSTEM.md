# Theme System Documentation

This document explains the comprehensive theme system implemented for the Procare Software clinic dashboard.

## Overview

The theme system provides multiple visual themes that clinics can choose from to customize their dashboard appearance. It includes light/dark modes and specialty-specific themes designed for different medical practices.

## Features

- **6 Built-in Themes**: Light, Dark, Medical Blue, Natural Green, Ocean Blue, and Warm Sunset
- **Real-time Theme Switching**: Changes apply instantly without page refresh
- **Persistent Storage**: Theme selection is saved in localStorage
- **Theme Previews**: Visual previews for each theme option
- **Professional Color Palettes**: Carefully selected colors for medical environments
- **Accessibility Support**: High contrast and color-blind friendly options

## Available Themes

### 1. Light Mode
- **Primary**: Nepal Blue (#0ea5e9)
- **Use Case**: Standard bright interface, ideal for well-lit environments
- **Best For**: General medical practices, daytime use

### 2. Dark Mode
- **Primary**: Light Nepal Blue (#38bdf8)
- **Use Case**: Reduced eye strain for long sessions
- **Best For**: Night shifts, extended computer use

### 3. Medical Blue
- **Primary**: Professional Blue (#2563eb)
- **Use Case**: Traditional medical aesthetic
- **Best For**: Hospitals, clinical environments

### 4. Natural Green
- **Primary**: Health Green (#16a34a)
- **Use Case**: Calming, therapeutic environment
- **Best For**: Mental health, wellness clinics

### 5. Ocean Blue
- **Primary**: Cyan Blue (#0891b2)
- **Use Case**: Calm and serene interface
- **Best For**: Therapy centers, rehabilitation clinics

### 6. Warm Sunset
- **Primary**: Orange (#ea580c)
- **Use Case**: Warm and welcoming atmosphere
- **Best For**: Pediatric clinics, family practices

## Implementation

### Core Components

#### 1. ThemeContext (`src/context/ThemeContext.tsx`)
- Manages theme state and provides theme switching functionality
- Stores theme configuration for all available themes
- Handles localStorage persistence
- Applies theme classes to document root

#### 2. ThemeSelector (`src/components/theme-selector.tsx`)
- Main theme selection component with visual previews
- Compact version for headers/navbars
- Shows current theme status and information

#### 3. ThemeSwitch (`src/components/theme-switch.tsx`)
- Simple toggle between light and dark modes
- Integrated with theme context
- Shows sun/moon icons

#### 4. Theme Settings Page (`src/pages/dashboard/settings/theme.tsx`)
- Complete theme management interface
- Theme information and tips
- Visual theme selector with descriptions

### Integration Points

#### 1. Provider Setup
```tsx
// src/provider.tsx
<ThemeProvider>
  <AuthProvider>
    {/* Other providers */}
  </AuthProvider>
</ThemeProvider>
```

#### 2. Dashboard Header
```tsx
// src/components/dashboard-header.tsx
<ThemeSwitch /> // Simple light/dark toggle
```

#### 3. Settings Navigation
Theme settings accessible via: `/dashboard/settings/theme`

### CSS Integration

#### Theme Variables
```css
/* src/styles/globals.css */
.theme-light {
  --background: 255 255 255;
  --foreground: 15 23 42;
  --primary: 14 165 233;
}

.theme-dark {
  --background: 15 23 42;
  --foreground: 248 250 252;
  --primary: 56 189 248;
}
```

#### HeroUI Integration
```js
// tailwind.config.js
plugins: [heroui({
  themes: {
    light: { /* light theme config */ },
    dark: { /* dark theme config */ }
  }
})]
```

## Usage

### For Users

1. **Quick Theme Toggle**:
   - Use the sun/moon icon in the dashboard header for light/dark toggle

2. **Full Theme Selection**:
   - Go to Dashboard → Settings → Theme & Appearance
   - Choose from 6 available themes with visual previews
   - See instant preview of changes

3. **Theme Information**:
   - View current theme details in settings
   - Read theme descriptions and use case recommendations

### For Developers

#### Using Theme Context
```tsx
import { useTheme } from '@/context/ThemeContext';

function MyComponent() {
  const { currentTheme, themeConfig, setTheme, isDark } = useTheme();
  
  return (
    <div className={`bg-${themeConfig.colors.primary}`}>
      Current theme: {themeConfig.name}
    </div>
  );
}
```

#### Adding Theme Selector
```tsx
import { ThemeSelector } from '@/components/theme-selector';

// Full selector with labels
<ThemeSelector size="lg" showLabels={true} />

// Compact version for headers
<CompactThemeSelector />
```

#### Creating Theme-Aware Components
```tsx
import { useTheme } from '@/context/ThemeContext';

function ThemedButton() {
  const { themeConfig } = useTheme();
  
  return (
    <button className={`bg-${themeConfig.colors.primary} text-white`}>
      Themed Button
    </button>
  );
}
```

## Customization

### Adding New Themes

1. **Define Theme Config**:
```tsx
// In ThemeContext.tsx
const newTheme: ThemeConfig = {
  id: 'purple',
  name: 'Purple Medical',
  description: 'Professional purple theme',
  colors: {
    primary: 'purple-600',
    secondary: 'purple-400',
    // ... other colors
  },
  preview: {
    background: 'bg-purple-50',
    card: 'bg-white',
    primary: 'bg-purple-600',
  },
};
```

2. **Add CSS Variables**:
```css
/* In globals.css */
.theme-purple {
  --background: 250 245 255;
  --foreground: 88 28 135;
  --primary: 147 51 234;
}
```

3. **Update Tailwind Config**:
Add the new theme colors to the HeroUI theme configuration.

### Custom Color Schemes

Modify the `colors` object in theme configurations to use custom color palettes:

```tsx
colors: {
  primary: 'custom-blue-600',
  secondary: 'custom-green-500',
  accent: 'custom-orange-400',
  // ...
}
```

## Best Practices

### For Clinic Administrators

1. **Choose Appropriate Themes**:
   - **Bright environments**: Light themes
   - **Dim environments**: Dark themes
   - **Specialized practices**: Theme matching specialty (green for wellness, blue for medical)

2. **Consider Staff Preferences**:
   - Survey staff for preferred themes
   - Consider different themes for different shifts
   - Provide training on theme switching

3. **Accessibility**:
   - Test themes with visually impaired staff
   - Ensure sufficient contrast in chosen themes
   - Consider color-blind accessibility

### For Developers

1. **Theme-Aware Styling**:
   - Use theme context colors instead of hardcoded values
   - Test components across all themes
   - Ensure readability in both light and dark modes

2. **Performance**:
   - Theme switching should be instant
   - Avoid layout shifts during theme changes
   - Optimize theme-related CSS

3. **Consistency**:
   - Follow established color patterns
   - Use semantic color names (primary, secondary, etc.)
   - Maintain consistent spacing and typography

## Troubleshooting

### Common Issues

1. **Theme Not Persisting**:
   - Check localStorage permissions
   - Verify ThemeProvider is at root level

2. **Colors Not Updating**:
   - Ensure CSS variables are properly defined
   - Check Tailwind safelist configuration
   - Verify theme classes are applied to document root

3. **Performance Issues**:
   - Minimize theme-dependent re-renders
   - Use CSS variables instead of JavaScript for color updates

### Browser Support

- **Modern Browsers**: Full support (Chrome 88+, Firefox 85+, Safari 14+)
- **Older Browsers**: Graceful degradation to light theme
- **Mobile**: Full support on modern mobile browsers

## Future Enhancements

1. **Custom Theme Builder**: Allow clinics to create custom themes
2. **Automatic Theme Switching**: Based on time of day or ambient light
3. **Brand Integration**: Upload clinic logos and match theme colors
4. **Theme Templates**: Pre-designed themes for specific medical specialties
5. **Accessibility Enhancements**: High contrast modes, font size scaling

## Support

For theme-related issues or questions:
1. Check this documentation first
2. Review the theme settings page for built-in help
3. Contact technical support with specific theme reproduction steps

---

**Note**: The theme system is designed to be extensible and maintainable. When adding new features, ensure they follow the established patterns and maintain consistency across all themes. 