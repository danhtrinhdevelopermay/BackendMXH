# iOS-Style Popup Components 📱

Hệ thống popup với Gaussian blur và animations mượt mà giống iOS.

## 🎯 Components

### 1. CustomAlert (Global Alert System)
Alert system toàn cục với Gaussian blur backdrop và iOS-style animations.

**Cách sử dụng:**

```javascript
import { useAlert } from '../context/AlertContext';

const MyComponent = () => {
  const { showAlert } = useAlert();
  
  const handleAction = () => {
    showAlert(
      'Thành công!',
      'Bài viết đã được đăng thành công',
      'success',
      [
        { text: 'OK', onPress: () => console.log('OK pressed') }
      ]
    );
  };
  
  return (
    <Button onPress={handleAction}>Hiện Alert</Button>
  );
};
```

**Các loại alert:**
- `success` - Màu xanh lá, icon checkmark
- `error` - Màu đỏ, icon close-circle  
- `warning` - Màu cam, icon warning
- `info` - Màu xanh dương, icon information-circle

**Hiệu ứng:**
- ✅ Spring-based scale animation (bouncy effect)
- ✅ Gaussian blur backdrop với animated intensity
- ✅ Smooth fade in/out
- ✅ Native driver cho 60fps performance

### 2. IOSStylePopup (Custom Popup Component)
Component popup linh hoạt cho các trường hợp custom với nhiều kiểu animation.

**Cách sử dụng:**

```javascript
import IOSStylePopup from '../components/IOSStylePopup';

const MyComponent = () => {
  const [visible, setVisible] = useState(false);
  
  return (
    <>
      <Button onPress={() => setVisible(true)}>Mở Popup</Button>
      
      <IOSStylePopup
        visible={visible}
        onClose={() => setVisible(false)}
        animationType="both"  // 'scale' | 'slide' | 'both'
        dismissOnBackdropPress={true}
      >
        <View>
          <Text>Nội dung custom của bạn</Text>
          <Button onPress={() => setVisible(false)}>Đóng</Button>
        </View>
      </IOSStylePopup>
    </>
  );
};
```

**Props:**
- `visible` (boolean) - Hiện/ẩn popup
- `onClose` (function) - Callback khi đóng popup
- `animationType` (string) - Kiểu animation: `'scale'` | `'slide'` | `'both'`
- `dismissOnBackdropPress` (boolean) - Đóng khi tap backdrop (default: true)
- `contentStyle` (object) - Custom style cho content container
- `children` (React.Node) - Nội dung bên trong popup

**Animation Types:**

1. **Scale Animation** (`animationType="scale"`)
   - Popup phóng to từ nhỏ (0.85 → 1)
   - Bouncy spring effect
   - Giống iOS Alert

2. **Slide Animation** (`animationType="slide"`)
   - Popup trượt lên từ dưới
   - Smooth spring animation
   - Giống iOS Modal

3. **Combined Animation** (`animationType="both"`)
   - Kết hợp cả scale và slide
   - Hiệu ứng đẹp nhất!

## 🎨 Hiệu ứng Gaussian Blur

Cả hai component đều sử dụng `expo-blur` với:
- **Blur intensity:** 0 → 95 (animated)
- **Tint:** dark
- **Animation:** Smooth cubic easing
- **Duration:** 300-350ms

## ⚡ Performance

- ✅ Tất cả animations dùng `useNativeDriver: true` (trừ blur intensity)
- ✅ 60fps smooth animations
- ✅ Spring-based physics cho cảm giác tự nhiên
- ✅ Optimized cho cả iOS và Android

## 📝 Example Usage

Xem file `IOSStylePopupExample.js` để biết cách sử dụng chi tiết với ví dụ đầy đủ.

## 🎯 Best Practices

1. **Dùng CustomAlert cho:**
   - Thông báo hệ thống
   - Confirmations đơn giản
   - Success/Error messages

2. **Dùng IOSStylePopup cho:**
   - Custom UI phức tạp
   - Forms trong popup
   - Rich content với images/videos
   - Multi-step interactions

## 🚀 Tips

- Luôn dùng `animationType="both"` cho hiệu ứng đẹp nhất
- Set `dismissOnBackdropPress={false}` cho critical actions
- Kết hợp với `Ionicons` để có UI đẹp hơn
- Thêm shadow và borderRadius cho content bên trong
