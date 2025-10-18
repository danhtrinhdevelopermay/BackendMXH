#!/bin/bash
cd web
npm install
npx expo export:web
npx serve web-build -l 5000
