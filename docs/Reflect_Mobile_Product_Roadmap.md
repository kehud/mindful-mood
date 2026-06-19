# Reflect Mobile Product Roadmap

## Current State

- Home screen
- Check-in flow
- Journey / History
- Moments / Tools screen
- Firebase Auth + Firestore
- Mood entries saved to Firestore
- Hebrew / English support
- Dark / Light theme support
- Recommendation Engine MVP 2.5
- Support Mode and Growth Mode
- User Preferences support from Firestore
- Tool Engagement structure:
  - `shownCount`
  - `openedCount`
- Recommendations connected to the Tools / Moments screen
- Recommendation cards carousel
- Tools section scroll behavior improved

## Recommendation Engine MVP 2.5

### Type

Rules Engine.

No AI.  
No ML.  
No backend logic.  
No Cloud Functions.

### Inputs

- Latest check-in
- User preferences
- Tool engagement
- Local tool catalog

### Scoring

- Emotion Match: 35%
- Influence Match: 25%
- Preference Match: 20%
- Mood Match: 10%
- Engagement: 10%

### Support Mode

Triggered by:

- Low mood
- Stress
- Anxiety
- Sadness
- Loneliness
- Overwhelmed

Target mix:

- 70% Therapeutic
- 30% Personal

### Growth Mode

Triggered by:

- Mood 5–7
- Happy
- Hopeful
- Grateful
- Excited

Target mix:

- 30% Therapeutic
- 70% Personal + Growth

## Product Decisions

- Therapeutic tools should not be replaced by personal tools.
- Recommendations should combine therapeutic, personal, and growth tools.
- Not every tool requires a timer.
- Tool Details should support a generic flow:
  - Recommendation Card
  - Tool Details
  - Start
  - Complete
- Suggested activities like Walking, Music, Nature, Photography, Reading, Friends should use simple calming content, not forced timers.
- Guided tools like Breathing, Grounding, Meditation, Muscle Relaxation may get timers or steps later.
- Growth tools should show prompts or small actions.

## In Progress / Next

### 1. Tool Details Screen

Goal:

Create the first real engagement loop.

Flow:

```text
Recommendation
→ Tool Details
→ Start
→ Complete
```

### 2. completedCount

Save when the user completes a tool.

Firestore path:

```text
users/{uid}/toolEngagement/{toolId}
```

Field:

```text
completedCount
```

### 3. did_it_help

After completing a tool, ask:

```text
Did this help?
Yes / A little / No
```

### 4. Favorites

Allow users to mark tools as favorites.

### 5. Onboarding Preferences

Collect what usually helps the user:

- Music
- Walking
- Nature
- Friends
- Journaling
- Meditation
- Breathing
- Reading
- Learning
- Creativity
- Photography
- Quiet time alone
- Talking to someone close

### 6. Dynamic Recommendation Count

Current temporary UI testing value: 5.

Later, recommendation count should be dynamic based on:

- Score quality
- Mood
- Mode
- Engagement
- Available matches
- Screen context

## UX Notes

- Keep Reflect soft, premium, calming, and wellness-focused.
- Apple Health can inspire chip/card language, but do not copy the layout directly.
- Moments structure is good:
  - Based on your check-in
  - All Moments
- Consider making cards lighter, icon circles smaller, title more dominant, and descriptions shorter.

## Future Ideas

- AI personalization
- Cloud Functions
- Remote/admin-managed tool catalog
- Advanced engagement learning
- Recency/decay scoring
- Apple Health integration
