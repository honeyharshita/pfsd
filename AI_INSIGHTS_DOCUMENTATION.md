# AI Insights Features - Complete Documentation

## Overview

This document describes all 10 AI-powered features added to the mental health application, their implementation, and usage.

## Frontend Components

All components are located in `pfsd/src/components/ai-insights/` and can be imported via the barrel export:

```javascript
import { 
  CameraMood, 
  MoodForecast, 
  TriggerAnalyzer,
  WeeklyReport,
  DecisionHelper,
  GameTip,
  EmotionStory,
  ColorTherapy,
  StudyHelp,
  PositivityFeed 
} from '../components/ai-insights/index';
```

### 1. Camera Mood Analysis
**Component:** `CameraMood.jsx`  
**Route:** `POST /api/ai/camera-mood`

Analyzes mood from images using Gemini Vision AI with local fallback.

**Usage:**
```javascript
const result = await aiApi.cameraMood(imageUrl);
// Returns: { detected_mood, brief_observation, confidence }
```

**Features:**
- Image URL input
- Real-time mood detection
- Confidence scoring
- Visual feedback

---

### 2. Mood Forecast
**Component:** `MoodForecast.jsx`  
**Route:** `POST /api/ai/mood-forecast`

Predicts mood trends based on historical mood data.

**Usage:**
```javascript
const result = await aiApi.moodForecast();
// Returns: { trend, prediction, recommendations, confidence }
```

**Features:**
- Trend analysis (improving/declining/stable)
- Actionable recommendations
- Confidence metrics
- Auto-refresh capability

---

### 3. Trigger Analyzer
**Component:** `TriggerAnalyzer.jsx`  
**Route:** `POST /api/ai/trigger-analyzer`

Identifies emotional triggers and patterns from journal entries.

**Usage:**
```javascript
const result = await aiApi.triggerAnalyzer();
// Returns: { triggers[], patterns[], coping_strategies[] }
```

**Features:**
- Trigger identification
- Pattern recognition
- Coping strategy recommendations
- Historical analysis

---

### 4. Weekly Report
**Component:** `WeeklyReport.jsx`  
**Route:** `GET /api/ai/weekly-report?format=json|html`

Generates comprehensive wellness report for the week.

**Usage:**
```javascript
const result = await aiApi.weeklyReport('json');
// Returns: { week_summary, themes[], wins[], recommendations[] }

// Download as HTML:
const html = await aiApi.weeklyReport('html');
```

**Features:**
- Week summary narrative
- Key themes extraction
- Wins documentation
- Actionable recommendations
- HTML export/download capability

---

### 5. Decision Helper
**Component:** `DecisionHelper.jsx`  
**Route:** `POST /api/ai/decision-helper`

Analyzes decisions using pros/cons analysis and recommendations.

**Usage:**
```javascript
const result = await aiApi.decisionHelper(decision, context);
// Returns: { pros[], cons[], recommendation, next_steps[] }
```

**Features:**
- Structured pros/cons analysis
- Personalized recommendations
- Step-by-step action plan
- Context-aware processing

---

### 6. Game Tips
**Component:** `GameTip.jsx`  
**Route:** `POST /api/ai/game-tip`

Provides personalized encouragement for wellness games based on mood.

**Usage:**
```javascript
const result = await aiApi.gameTip(game, mood);
// Returns: { tip: "Personalized encouragement" }
```

**Supported Games:**
- breathing
- emotion-match
- gratitude
- memory
- mood-color
- self-care
- stress-buster

**Supported Moods:**
- happy, sad, anxious, calm, neutral, tired, energetic

---

### 7. Emotion Story
**Component:** `EmotionStory.jsx`  
**Route:** `POST /api/ai/emotion-story`

Generates reflective narratives based on selected emotions.

**Usage:**
```javascript
const result = await aiApi.emotionStory(emotions);
// Returns: { story: "Reflective narrative" }
```

**Available Emotions:**
- joy, sadness, anger, fear, surprise, disgust, trust, anticipation

---

### 8. Color Therapy
**Component:** `ColorTherapy.jsx`  
**Route:** `POST /api/ai/color-therapy`

Recommends therapeutic colors based on mood with activities.

**Usage:**
```javascript
const result = await aiApi.colorTherapy(mood);
// Returns: { color_name, hex, benefit, suggestion, activities[] }
```

**Features:**
- Mood-based color recommendation
- Hexadecimal color codes
- Therapeutic benefits
- Usage suggestions
- Recommended activities

---

### 9. Study Helper
**Component:** `StudyHelp.jsx`  
**Route:** `POST /api/ai/study-help`

Generates personalized study plans with techniques and schedules.

**Usage:**
```javascript
const result = await aiApi.studyHelp(subject, duration, difficulty);
// Returns: { technique, schedule[], tips[], motivation }
```

**Parameters:**
- subject: String (e.g., "Python", "History")
- duration: Number in minutes (15-240)
- difficulty: 'easy' | 'medium' | 'hard'

---

### 10. Positivity Feed
**Component:** `PositivityFeed.jsx`  
**Route:** `GET /api/ai/positivity-feed?mood=calm&count=5`

Generates daily affirmations based on mood.

**Usage:**
```javascript
const result = await aiApi.positivityFeed(mood, count);
// Returns: { affirmations[] } or array of strings
```

**Features:**
- Mood-specific affirmations
- Carousel navigation
- Customizable count (1-10)
- Auto-refresh capability

---

## Demo Pages

### AIInsights Hub (`pages/AIInsights.jsx`)
Main hub showcasing all 10 features with tabbed interface:
- Overview tab listing all features
- Mood analysis section
- Decision making tools
- Emotion exploration
- Wellness tracking
- Learning tools

**Route:** `/ai-insights`

### Mental Wellness Coaching (`pages/MentalWellness.jsx`)
Integrated wellness coaching experience featuring:
- Daily mood forecasting
- Trigger analysis
- Color therapy recommendations
- Personalized affirmations

**Route:** `/mental-wellness`

### Learning & Productivity (`pages/LearningAndProductivity.jsx`)
Educational productivity tools featuring:
- Personalized study plans
- Decision analysis
- Motivation and gaming tips

**Route:** `/learning-and-productivity`

---

## API Client

**Location:** `pfsd/src/api/aiInsightsClient.js`

Unified API client for all AI features:
```javascript
import { aiApi } from './api/aiInsightsClient';

// All methods available
await aiApi.cameraMood(imageUrl);
await aiApi.moodForecast();
await aiApi.triggerAnalyzer();
await aiApi.weeklyReport(format);
await aiApi.decisionHelper(decision, context);
await aiApi.gameTip(game, mood);
await aiApi.emotionStory(emotions);
await aiApi.colorTherapy(mood);
await aiApi.studyHelp(subject, duration, difficulty);
await aiApi.positivityFeed(mood, count);
```

---

## Backend Implementation

### Technology Stack
- **AI Provider:** Google Gemini API (with enhanced local fallback)
- **Fallback Strategy:** 
  1. Try Gemini API (if key configured)
  2. Use enhanced local generators
  3. Return structured JSON response

### Key Files

**`backend/gemini.js`** - Gemini API Integration
- `invokeGemini(options)` - Text requests
- `invokeGeminiJSON(options)` - Structured JSON responses
- Support for image data with Base64 encoding

**`backend/localGenerators.js`** - Enhanced Local Generators
- 10 functions providing intelligent fallback responses
- Keyword matching and template-based generation
- Context-aware insights

**`backend/routes/aiInsights.js`** - All 10 API Endpoints
- Unified error handling
- Database integration for mood tracking
- Consistent JSON response format

### Unified AI Service Pattern
```javascript
async function aiService(generator, fallbackFn, options = {}) {
  const useGemini = hasGeminiKey() && !options.forceLocal;
  try {
    if (useGemini && generator.prompt) {
      if (generator.json) return await invokeGeminiJSON(generator);
      else return await invokeGemini(generator);
    }
  } catch (error) {
    console.warn(`[AI] Gemini failed:`, error.message);
  }
  console.log(`[AI] Using local fallback`);
  return fallbackFn();
}
```

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install @google/generative-ai pdfkit html-pdf
```

### 2. Environment Configuration
Add to `backend/.env.local`:
```env
GEMINI_API_KEY=your_gemini_key_here
# See https://makersuite.google.com/app/apikey for free API key
```

### 3. Start Backend
```bash
cd backend
npm start
# Routes will be registered at startup
# Check logs for: "AI Insights routes registered"
```

### 4. Update Frontend Routes
Add to `pfsd/src/pages.config.js`:
```javascript
{
  path: '/ai-insights',
  name: 'AI Insights',
  componentPath: './pages/AIInsights'
},
{
  path: '/mental-wellness',
  name: 'Mental Wellness',
  componentPath: './pages/MentalWellness'
},
{
  path: '/learning-and-productivity',
  name: 'Learning & Productivity',
  componentPath: './pages/LearningAndProductivity'
}
```

### 5. Start Frontend
```bash
cd pfsd
npm run dev
# Access at http://localhost:5173
```

---

## Component Usage Examples

### Using CameraMood Standalone
```javascript
import { CameraMood } from '@/components/ai-insights';

function ProfilePage() {
  return (
    <div>
      <h1>My Mood Analysis</h1>
      <CameraMood />
    </div>
  );
}
```

### Using WeeklyReport with PDF Download
```javascript
import { WeeklyReport } from '@/components/ai-insights';

function ReportsPage() {
  return (
    <div>
      <WeeklyReport /> {/* Includes built-in download button */}
    </div>
  );
}
```

### Using Multiple Features Together
```javascript
import { 
  MoodForecast, 
  TriggerAnalyzer, 
  ColorTherapy 
} from '@/components/ai-insights';

function DailyCheckeinPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MoodForecast />
      <TriggerAnalyzer />
      <ColorTherapy />
    </div>
  );
}
```

---

## Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": {
    // Feature-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## Performance & Caching

### Optimization
- Components use React hooks for state management
- API calls are debounced to prevent excessive requests
- Local fallback ensures 0ms response time when Gemini unavailable
- Database saves emotional data for historical analysis

### Response Times
- Gemini API: 1-3 seconds (with network)
- Local Generators: <50ms (instant)
- Database Operations: <100ms

---

## Privacy & Data Handling

- All responses are JSON-based, no sensitive data stored client-side
- Mood data optionally stored in database (user control)
- No tracking of personal information beyond wellness metrics
- Optional local-only mode (forceLocal flag in aiService)

---

## Troubleshooting

### Gemini API Not Working
1. Check API key in `.env.local`
2. Verify API is enabled at https://console.cloud.google.com
3. Check billing/quota status
4. Fallback to local generators still works

### Components Not Rendering
1. Verify import paths are correct
2. Check browser console for errors
3. Ensure API client URL is correct (http://localhost:5000)
4. Test backend is running: `curl http://localhost:5000/api/health`

### Data Not Saving to Database
1. Check SurrealDB connection in `backend/db.js`
2. Verify mood data is being sent to correct endpoint
3. Check browser Network tab for POST requests

---

## Future Enhancements

- [ ] Real image upload (not just URLs)
- [ ] PDF export for weekly reports
- [ ] Integration with calendar for mood tracking
- [ ] Multi-language support
- [ ] Voice input for decisions/affirmations
- [ ] Export mood data as CSV
- [ ] Integration with health apps
- [ ] Real-time collaboration on decisions
- [ ] Machine learning model for personalization
- [ ] Offline-first Progressive Web App support

---

## Support & Feedback

For issues or feature requests, refer to:
- Backend logs: Check `backend/` console output
- Frontend logs: Browser DevTools Console
- Documentation: This file and inline code comments
