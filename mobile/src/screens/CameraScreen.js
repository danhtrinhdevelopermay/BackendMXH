import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

const FILTERS = [
  { id: 'none', name: 'Gốc', icon: 'close-circle' },
  { id: 'beauty', name: 'Làm đẹp', icon: 'sparkles' },
  { id: 'bright', name: 'Sáng', icon: 'sunny' },
  { id: 'smooth', name: 'Mịn', icon: 'water' },
  { id: 'pink', name: 'Hồng', icon: 'heart' },
  { id: 'vintage', name: 'Cổ điển', icon: 'time' },
  { id: 'cool', name: 'Mát mẻ', icon: 'snow' },
  { id: 'warm', name: 'Ấm áp', icon: 'flame' },
];

const CameraScreen = () => {
  const navigation = useNavigation();
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [flashMode, setFlashMode] = useState('off');
  const [isRecording, setIsRecording] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const cameraRef = useRef(null);
  
  const [beautySettings, setBeautySettings] = useState({
    smooth: 50,
    brighten: 30,
    bigEyes: 20,
    slimFace: 15,
  });
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (showSettings) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }, [showSettings]);

  useEffect(() => {
    if (selectedFilter !== 'beauty' && showSettings) {
      setShowSettings(false);
    }
  }, [selectedFilter]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#CFD9DE" />
        <Text style={styles.permissionTitle}>Cần quyền truy cập camera</Text>
        <Text style={styles.permissionText}>
          Ứng dụng cần quyền truy cập camera để chụp ảnh và quay video
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Cho phép</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const applyFilter = async (uri) => {
    if (selectedFilter === 'none') return uri;

    const filterActions = [];

    switch (selectedFilter) {
      case 'beauty':
        filterActions.push(
          { brightness: beautySettings.brighten / 100 },
          { contrast: 0.1 },
          { saturation: 0.2 }
        );
        break;
      case 'bright':
        filterActions.push({ brightness: 0.4 });
        break;
      case 'smooth':
        filterActions.push({ blur: 2 });
        break;
      case 'pink':
        filterActions.push(
          { saturation: 0.3 },
          { brightness: 0.15 }
        );
        break;
      case 'vintage':
        filterActions.push(
          { sepia: 0.5 },
          { contrast: -0.15 }
        );
        break;
      case 'cool':
        filterActions.push(
          { saturation: -0.2 },
          { brightness: 0.1 }
        );
        break;
      case 'warm':
        filterActions.push(
          { saturation: 0.25 },
          { brightness: 0.15 },
          { contrast: 0.1 }
        );
        break;
    }

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1080 } },
          ...filterActions.map(action => {
            const key = Object.keys(action)[0];
            return { [key]: action[key] };
          })
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error applying filter:', error);
      return uri;
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: false,
        });
        
        navigation.navigate('ImageEditor', { 
          imageUri: photo.uri,
          mediaType: 'image'
        });
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });
        
        navigation.navigate('ImageEditor', { 
          imageUri: video.uri,
          mediaType: 'video'
        });
      } catch (error) {
        console.error('Error recording video:', error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const getFlashIcon = () => {
    if (flashMode === 'on') return 'flash';
    if (flashMode === 'auto') return 'flash-outline';
    return 'flash-off';
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flashMode}
      />
      
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.topButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
            <Ionicons name={getFlashIcon()} size={28} color="#fff" />
          </TouchableOpacity>
          
          {selectedFilter === 'beauty' && (
            <TouchableOpacity 
              style={styles.topButton} 
              onPress={() => setShowSettings(!showSettings)}
            >
              <Ionicons name="options" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSettings && (
        <Animated.View 
          style={[
            styles.settingsPanel,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Tùy chỉnh làm đẹp</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close" size={24} color="#0F1419" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="water" size={20} color="#1D9BF0" />
              <Text style={styles.settingLabel}>Làm mịn</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={beautySettings.smooth}
              onValueChange={(value) => 
                setBeautySettings(prev => ({ ...prev, smooth: value }))
              }
              minimumTrackTintColor="#1D9BF0"
              maximumTrackTintColor="#CFD9DE"
            />
            <Text style={styles.settingValue}>{Math.round(beautySettings.smooth)}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="sunny" size={20} color="#1D9BF0" />
              <Text style={styles.settingLabel}>Làm sáng</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={beautySettings.brighten}
              onValueChange={(value) => 
                setBeautySettings(prev => ({ ...prev, brighten: value }))
              }
              minimumTrackTintColor="#1D9BF0"
              maximumTrackTintColor="#CFD9DE"
            />
            <Text style={styles.settingValue}>{Math.round(beautySettings.brighten)}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="eye" size={20} color="#1D9BF0" />
              <Text style={styles.settingLabel}>To mắt</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={beautySettings.bigEyes}
              onValueChange={(value) => 
                setBeautySettings(prev => ({ ...prev, bigEyes: value }))
              }
              minimumTrackTintColor="#1D9BF0"
              maximumTrackTintColor="#CFD9DE"
            />
            <Text style={styles.settingValue}>{Math.round(beautySettings.bigEyes)}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="happy" size={20} color="#1D9BF0" />
              <Text style={styles.settingLabel}>Nhỏ mặt</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={beautySettings.slimFace}
              onValueChange={(value) => 
                setBeautySettings(prev => ({ ...prev, slimFace: value }))
              }
              minimumTrackTintColor="#1D9BF0"
              maximumTrackTintColor="#CFD9DE"
            />
            <Text style={styles.settingValue}>{Math.round(beautySettings.slimFace)}</Text>
          </View>
        </Animated.View>
      )}

      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <View style={[
                  styles.filterIconContainer,
                  selectedFilter === filter.id && styles.filterIconContainerActive
                ]}>
                  <Ionicons 
                    name={filter.icon} 
                    size={24} 
                    color={selectedFilter === filter.id ? '#fff' : '#fff'} 
                  />
                </View>
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.filterTextActive
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={styles.galleryButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name={showFilters ? "funnel" : "funnel-outline"} size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
          onPress={takePicture}
          onLongPress={startRecording}
          onPressOut={stopRecording}
        >
          <View style={[styles.captureInner, isRecording && styles.captureInnerRecording]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Đang quay...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F1419',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#536471',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#1D9BF0',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsPanel: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1419',
  },
  slider: {
    width: '85%',
    height: 40,
  },
  settingValue: {
    position: 'absolute',
    right: 0,
    top: 28,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D9BF0',
  },
  filtersContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    alignItems: 'center',
    gap: 8,
  },
  filterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterIconContainerActive: {
    backgroundColor: '#1D9BF0',
    borderColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    fontWeight: '700',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonRecording: {
    borderColor: '#FF0000',
  },
  captureInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  captureInnerRecording: {
    borderRadius: 8,
    width: 36,
    height: 36,
    backgroundColor: '#FF0000',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraScreen;
