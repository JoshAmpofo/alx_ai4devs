# Accessibility Improvements

This document outlines the accessibility (a11y) improvements made to the ALX Polly application.

## Get Suggestions Button Accessibility

### ARIA Attributes Added:
- `aria-busy={isFetchingSuggestions}` - Indicates when the button is performing an operation
- `aria-disabled={isFetchingSuggestions || !title.trim()}` - Clearly indicates disabled state to screen readers
- `aria-label` - Dynamic label that provides context about the button's current state:
  - **Loading**: "Getting AI suggestions for your poll question"
  - **Disabled**: "Get AI suggestions (enter a question first)"  
  - **Ready**: "Get AI suggestions to improve your poll question"

### Screen Reader Status Updates:
- Added visually hidden `<span role="status" aria-live="polite">` element
- Only appears when `isFetchingSuggestions` is true
- Announces "Getting AI suggestions for your poll question, please wait..." to assistive technology
- Uses `sr-only` CSS class to hide from visual users while keeping accessible to screen readers

## Suggestions Display Accessibility

### ARIA Roles and Labels:
- `role="region"` - Identifies the suggestions area as a distinct page region
- `aria-labelledby="suggestions-heading"` - Associates the region with its heading
- `aria-live="polite"` - Announces when suggestions appear without interrupting user flow
- `role="list"` and `role="listitem"` - Proper semantic structure for suggestion lists

### Button Improvements:
- Each "Use this" button has descriptive `aria-label` with the actual suggestion text
- Clear labeling for both question and option suggestion buttons

## CSS Accessibility Utilities

### Screen Reader Only Class:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

This class hides content visually while keeping it accessible to screen readers.

## Benefits

### For Screen Reader Users:
- Clear understanding of button states and functionality
- Real-time updates about loading states
- Descriptive labels for all interactive elements
- Proper semantic structure for navigation

### For Keyboard Users:
- All interactive elements remain fully keyboard accessible
- Focus management is preserved
- Visual focus indicators work properly

### For Users with Cognitive Disabilities:
- Clear, descriptive labels reduce confusion
- Consistent interaction patterns
- Status updates provide feedback about system state

## Testing Recommendations

1. **Screen Reader Testing**: Test with NVDA, JAWS, or VoiceOver
2. **Keyboard Navigation**: Ensure all functionality works with Tab/Enter/Space
3. **High Contrast Mode**: Verify visibility in Windows High Contrast mode
4. **Color Blindness**: Ensure information isn't conveyed by color alone

## Standards Compliance

These improvements help meet:
- **WCAG 2.1 AA** guidelines
- **Section 508** requirements  
- **ARIA 1.1** best practices
