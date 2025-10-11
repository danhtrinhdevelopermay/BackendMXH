#!/bin/bash
cd "$(dirname "$0")"

# Bypass login prompt and start Expo in tunnel mode
export EXPO_NO_TELEMETRY=1

# Continuously send down arrow + enter every 3 seconds to auto-select "Proceed anonymously"
{ while true; do sleep 3; printf "\e[B\r"; done; } | npx expo start --tunnel --clear
