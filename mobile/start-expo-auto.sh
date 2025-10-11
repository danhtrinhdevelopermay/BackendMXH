#!/bin/bash
cd "$(dirname "$0")"

# Auto-select "Proceed anonymously" by simulating down arrow and enter
(sleep 2; printf "\x1b[B\n") | EXPO_NO_TELEMETRY=1 npx expo start --tunnel --clear
