# Cricket Umpire & Scorer

A modern, mobile-first Cricket Umpire & Scorer web application built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## Features

- **Fully Customizable Setup (4-step Wizard)**:
  - Team names & 3-letter short codes
  - Flexible rosters (2–15 players per team) with Captain & Wicket-Keeper markers
  - Reorder batting lineups & quick fill
  - Custom rules: overs (1–50), max overs per bowler, wide/no-ball penalty values, re-bowl rules, free hit, and Last Man Stands (batting alone)
  - Toss outcome & opening lineup selection
- **Over-End Forced Bowler Selection**:
  - Automatically locks the scoring pad at over end until the next bowler is selected
  - Enforces consecutive over restriction
  - Live bowler statistics (O-R-W)
  - Quick-add new bowlers on the fly
- **Interactive Live Scoring**:
  - Large touch-friendly run buttons (0, 1, 2, 3, 4, 6)
  - Extras pad with granular run selection (Wide, No Ball, Bye, Leg Bye)
  - Wicket sheet with dismissal types, fielder attribution, run-out details, and free hit enforcement
  - Ball-by-ball timeline chips
  - Multi-level undo with full state restoration
- **In-Match Customization Menu**:
  - Tactical / injury bowler change mid-over
  - Retired hurt batter flow
  - Mid-match overs adjustment
  - Dynamic player addition & renaming
- **Detailed Scorecard & Match History**:
  - Batting, bowling, extras, and fall of wickets breakdown
  - Saved match records persisted in `localStorage`
  - Screen Wake Lock API & tactile haptic feedback

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **State Management**: `useReducer` + Context API
- **Persistence**: `localStorage`
- **Icons**: `lucide-react`
- **Testing**: Vitest

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run Vitest test suite
npm test

# Build for production
npm run build
```

