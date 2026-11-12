# CLAUDE.md - Frontend Project

This file contains instructions for working with this React Native (Expo) Employee Management System frontend.

## Project Overview

A mobile application for Employee Management System (EMS) built with React Native (Expo).

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation v7
- **State Management**: Zustand v5
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/       # Screen/page components
├── services/      # API services
├── navigations/    # Navigation configuration
├── contexts/       # React Context providers
├── styles/        # Global styles
├── utils/         # Utility functions
└── config/        # Configuration files
```

## Key Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build for Android
npx expo run:android

# Prebuild native folders
npx expo prebuild --platform android
```

## Design System

- **Primary Color**: #7057FC
- **Secondary Color**: #f0f1f7
- **Border Radius**: 12px (cards), 24px (modals)

## Common Patterns

### Creating a new screen:
1. Add screen to `src/screens/`
2. Add to navigation in `src/navigations/`
3. Create service if API needed in `src/services/`

### API Integration:
- Use existing services in `src/services/` as reference
- All services use `apiClient` from `./api`
- Response interceptor handles auth token automatically

### Styling:
- Use `Colors` from `src/styles/color.js`
- Follow existing component patterns
- Use `SafeAreaView` from `react-native-safe-area-context`

## Backend Connection

- Backend runs on `http://10.0.2.2:3000` (Android emulator) or `http://localhost:3000`
- API base URL configured in `src/config/api.config.js`
- All endpoints prefixed with `/api`

## Important Notes

- Do NOT commit native folders (`/android`, `/ios`)
- Do NOT commit `.env` files
- API config is gitignored - do not modify `src/config/api.config.js`

## Report & Documentation Output Policy

- All reports, progress summaries, memory notes, and markdown documentation generated for the frontend MUST be placed inside the `report/` directory (`project/report/<filename>.md`). Do NOT create new `.md` report files at the root of `project/`.
- All `.log` files (test logs, lint logs, export/build logs) MUST be created and placed inside `project/report/logs/<filename>.log`. Do NOT place `.log` files at the root of `project/` or directly in `project/report/`.
