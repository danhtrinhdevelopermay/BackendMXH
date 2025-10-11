#!/bin/bash
cd "$(dirname "$0")"
export EXPO_NO_TELEMETRY=1
export EXPO_NO_DOTENV=1
npx expo start --tunnel --clear
