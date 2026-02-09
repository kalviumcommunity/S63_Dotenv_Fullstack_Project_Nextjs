# AI-Assisted UI Components

This directory contains real AI-powered UI components that use the Gemini API for intelligent form assistance.

## Components

### AiFormAssistant

Provides real-time AI suggestions for form inputs:
- Category suggestions based on text analysis
- Department recommendations
- Confidence indicators
- Explainable AI behavior

**Usage:**
```typescript
import AiFormAssistant from "@/components/ai/AiFormAssistant";

<AiFormAssistant
  text={description}
  locationName={location}
  onCategorySuggest={(category, confidence) => {
    setCategory(category);
  }}
  onDepartmentSuggest={(dept, confidence) => {
    setDepartment(dept);
  }}
  onQualityHint={(hints) => {
    setQualityHints(hints);
  }}
/>
```

### InputQualityIndicator

Shows real-time input quality feedback:
- Missing information detection
- Clarity suggestions
- Visual feedback with color coding

**Usage:**
```typescript
import InputQualityIndicator from "@/components/ai/InputQualityIndicator";

<InputQualityIndicator
  text={description}
  minLength={20}
  hints={qualityHints}
/>
```

## AI Design Principles

1. **Assists, never overrides** – User always has final control
2. **Transparent** – Shows confidence and reasoning
3. **Graceful degradation** – Works without AI
4. **Explainable** – Users understand AI behavior
5. **No hardcoded logic** – Uses real AI analysis

## API Integration

These components use the existing `/api/ai/nlp` endpoint which:
- Uses Google Gemini API
- Analyzes text for entities, sentiment, urgency
- Suggests categories and departments
- Provides quality hints

## Accessibility

- Screen reader announcements for AI suggestions
- Confidence levels announced via aria-label
- Clear explanations for all suggestions
- Keyboard accessible
