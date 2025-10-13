#!/bin/bash

echo "================================"
echo "   BUILD APK - SHATTER APP"
echo "================================"
echo ""

# Kiểm tra xem đã login chưa
if ! eas whoami > /dev/null 2>&1; then
    echo "❌ Bạn chưa đăng nhập Expo!"
    echo ""
    echo "Vui lòng chạy lệnh sau để đăng nhập:"
    echo "  eas login"
    echo ""
    echo "Nếu chưa có tài khoản, đăng ký tại: https://expo.dev"
    exit 1
fi

echo "✅ Đã đăng nhập Expo"
echo ""
echo "Chọn loại build:"
echo "1. Preview APK (nhanh, dùng để test)"
echo "2. Production APK (build chính thức)"
echo ""
read -p "Nhập lựa chọn (1 hoặc 2): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Đang build Preview APK..."
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "🚀 Đang build Production APK..."
        eas build --platform android --profile production
        ;;
    *)
        echo "❌ Lựa chọn không hợp lệ!"
        exit 1
        ;;
esac

echo ""
echo "✅ Build hoàn tất! Link tải APK sẽ hiển thị ở trên."
