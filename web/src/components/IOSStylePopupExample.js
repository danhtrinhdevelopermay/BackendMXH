import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import IOSStylePopup from './IOSStylePopup';

const IOSStylePopupExample = () => {
  const [scalePopupVisible, setScalePopupVisible] = useState(false);
  const [slidePopupVisible, setSlidePopupVisible] = useState(false);
  const [bothPopupVisible, setBothPopupVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>iOS Style Popup Examples</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setScalePopupVisible(true)}
      >
        <Text style={styles.buttonText}>Show Scale Animation Popup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setSlidePopupVisible(true)}
      >
        <Text style={styles.buttonText}>Show Slide Animation Popup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setBothPopupVisible(true)}
      >
        <Text style={styles.buttonText}>Show Combined Animation Popup</Text>
      </TouchableOpacity>

      <IOSStylePopup
        visible={scalePopupVisible}
        onClose={() => setScalePopupVisible(false)}
        animationType="scale"
      >
        <View style={styles.popupContent}>
          <Ionicons name="star" size={60} color="#FFD700" />
          <Text style={styles.popupTitle}>Scale Animation</Text>
          <Text style={styles.popupMessage}>
            Popup xuất hiện với hiệu ứng phóng to từ nhỏ, giống iOS Alert
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setScalePopupVisible(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </IOSStylePopup>

      <IOSStylePopup
        visible={slidePopupVisible}
        onClose={() => setSlidePopupVisible(false)}
        animationType="slide"
      >
        <View style={styles.popupContent}>
          <Ionicons name="airplane" size={60} color="#1877f2" />
          <Text style={styles.popupTitle}>Slide Animation</Text>
          <Text style={styles.popupMessage}>
            Popup trượt lên từ phía dưới, mượt mà như iOS Modal
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSlidePopupVisible(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </IOSStylePopup>

      <IOSStylePopup
        visible={bothPopupVisible}
        onClose={() => setBothPopupVisible(false)}
        animationType="both"
      >
        <View style={styles.popupContent}>
          <Ionicons name="sparkles" size={60} color="#FF6B6B" />
          <Text style={styles.popupTitle}>Combined Animation</Text>
          <Text style={styles.popupMessage}>
            Kết hợp cả scale và slide để tạo hiệu ứng đẹp nhất!
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setBothPopupVisible(false)}
          >
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </IOSStylePopup>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#050505',
  },
  button: {
    backgroundColor: '#1877f2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  popupContent: {
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#050505',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 16,
    color: '#65676b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#1877f2',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default IOSStylePopupExample;
