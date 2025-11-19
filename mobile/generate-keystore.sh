#!/bin/bash

mkdir -p android/app

keytool -genkeypair \
  -v \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass shatter2024 \
  -keypass shatter2024 \
  -alias shatter-key \
  -keystore android/app/release.keystore \
  -dname "CN=com.shatter.app,OU=Shatter,O=Shatter,L=Hanoi,S=Hanoi,C=VN"

echo ""
echo "Keystore created: android/app/release.keystore"
echo ""
echo "SHA-1 Fingerprint:"
keytool -list -v -keystore android/app/release.keystore -alias shatter-key -storepass shatter2024 | grep SHA1
echo ""
echo "SHA-256 Fingerprint:"
keytool -list -v -keystore android/app/release.keystore -alias shatter-key -storepass shatter2024 | grep SHA256
