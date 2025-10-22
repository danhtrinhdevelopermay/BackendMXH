import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

const FILTERS = [
  { id: 'none', name: 'Gốc', icon: 'close-circle' },
  { id: 'bright', name: 'Sáng', brightness: 0.3, contrast: 0.1 },
  { id: 'vivid', name: 'Rực rỡ', saturation: 0.4, contrast: 0.2 },
  { id: 'cool', name: 'Mát', saturation: -0.2, brightness: 0.1 },
  { id: 'warm', name: 'Ấm', saturation: 0.2, brightness: 0.15 },
  { id: 'vintage', name: 'Cổ điển', sepia: 0.5, contrast: -0.1 },
  { id: 'bw', name: 'Đen trắng', saturation: -1, contrast: 0.15 },
  { id: 'fade', name: 'Mờ', contrast: -0.25, brightness: 0.1 },
  { id: 'dramatic', name: 'Kịch tính', contrast: 0.5, saturation: 0.2 },
];

const EDIT_TOOLS = [
  { id: 'filters', name: 'Bộ lọc', icon: 'color-palette' },
  { id: 'adjust', name: 'Điều chỉnh', icon: 'options' },
  { id: 'crop', name: 'Cắt', icon: 'crop' },
  { id: 'rotate', name: 'Xoay', icon: 'refresh' },
  { id: 'text', name: 'Chữ', icon: 'text' },
  { id: 'draw', name: 'Vẽ', icon: 'brush' },
];

const ImageEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, mediaType = 'image' } = route.params;

  const [selectedTool, setSelectedTool] = useState('filters');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [editedImageUri, setEditedImageUri] = useState(imageUri);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    sharpen: 0,
  });

  const [rotation, setRotation] = useState(0);

  const applyFilter = async (filterId) => {
    if (filterId === 'none') {
      setEditedImageUri(imageUri);
      setSelectedFilter('none');
      return;
    }

    setIsProcessing(true);
    const filter = FILTERS.find(f => f.id === filterId);
    
    try {
      const actions = [];
      
      if (filter.brightness !== undefined) {
        actions.push({ brightness: filter.brightness });
      }
      if (filter.contrast !== undefined) {
        actions.push({ contrast: filter.contrast });
      }
      if (filter.saturation !== undefined) {
        actions.push({ saturation: filter.saturation });
      }
      if (filter.sepia !== undefined) {
        actions.push({ sepia: filter.sepia });
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
      setSelectedFilter(filterId);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyAdjustments = async () => {
    setIsProcessing(true);
    
    try {
      const actions = [];
      
      if (adjustments.brightness !== 0) {
        actions.push({ brightness: adjustments.brightness });
      }
      if (adjustments.contrast !== 0) {
        actions.push({ contrast: adjustments.contrast });
      }
      if (adjustments.saturation !== 0) {
        actions.push({ saturation: adjustments.saturation });
      }

      if (actions.length === 0) {
        setIsProcessing(false);
        return;
      }

      const result = await ImageManipulator.manipulateAsync(
        editedImageUri || imageUri,
        actions,
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
    } catch (error) {
      console.error('Error applying adjustments:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyRotation = async (degrees) => {
    setIsProcessing(true);
    
    try {
      const result = await ImageManipulator.manipulateAsync(
        editedImageUri || imageUri,
        [{ rotate: degrees }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
      setRotation((rotation + degrees) % 360);
    } catch (error) {
      console.error('Error rotating image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCrop = async (cropData) => {
    setIsProcessing(true);
    
    try {
      const result = await ImageManipulator.manipulateAsync(
        editedImageUri || imageUri,
        [{ crop: cropData }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToFeed = () => {
    navigation.navigate('CreatePost', {
      capturedMedia: { uri: editedImageUri, type: mediaType }
    });
  };

  const handlePostToStory = () => {
    navigation.navigate('CreateStory', {
      capturedMedia: { uri: editedImageUri, type: mediaType }
    });
  };

  const resetEdits = () => {
    setEditedImageUri(imageUri);
    setSelectedFilter('none');
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      sharpen: 0,
    });
    setRotation(0);
  };

  const renderToolPanel = () => {
    switch (selectedTool) {
      case 'filters':
        return (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.id}
                style={styles.filterButton}
                onPress={() => applyFilter(filter.id)}
              >
                <View style={[
                  styles.filterPreview,
                  selectedFilter === filter.id && styles.filterPreviewActive
                ]}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.filterPreviewImage}
                  />
                </View>
                <Text style={[
                  styles.filterName,
                  selectedFilter === filter.id && styles.filterNameActive
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'adjust':
        return (
          <ScrollView style={styles.adjustPanel}>
            <View style={styles.adjustItem}>
              <View style={styles.adjustHeader}>
                <Ionicons name="sunny" size={20} color="#1D9BF0" />
                <Text style={styles.adjustLabel}>Độ sáng</Text>
                <Text style={styles.adjustValue}>{Math.round(adjustments.brightness * 100)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={-1}
                maximumValue={1}
                value={adjustments.brightness}
                onValueChange={(value) => 
                  setAdjustments(prev => ({ ...prev, brightness: value }))
                }
                onSlidingComplete={applyAdjustments}
                minimumTrackTintColor="#1D9BF0"
                maximumTrackTintColor="#CFD9DE"
              />
            </View>

            <View style={styles.adjustItem}>
              <View style={styles.adjustHeader}>
                <MaterialCommunityIcons name="contrast-box" size={20} color="#1D9BF0" />
                <Text style={styles.adjustLabel}>Độ tương phản</Text>
                <Text style={styles.adjustValue}>{Math.round(adjustments.contrast * 100)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={-1}
                maximumValue={1}
                value={adjustments.contrast}
                onValueChange={(value) => 
                  setAdjustments(prev => ({ ...prev, contrast: value }))
                }
                onSlidingComplete={applyAdjustments}
                minimumTrackTintColor="#1D9BF0"
                maximumTrackTintColor="#CFD9DE"
              />
            </View>

            <View style={styles.adjustItem}>
              <View style={styles.adjustHeader}>
                <MaterialCommunityIcons name="invert-colors" size={20} color="#1D9BF0" />
                <Text style={styles.adjustLabel}>Độ bão hòa</Text>
                <Text style={styles.adjustValue}>{Math.round(adjustments.saturation * 100)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={-1}
                maximumValue={1}
                value={adjustments.saturation}
                onValueChange={(value) => 
                  setAdjustments(prev => ({ ...prev, saturation: value }))
                }
                onSlidingComplete={applyAdjustments}
                minimumTrackTintColor="#1D9BF0"
                maximumTrackTintColor="#CFD9DE"
              />
            </View>
          </ScrollView>
        );

      case 'rotate':
        return (
          <View style={styles.rotatePanel}>
            <TouchableOpacity 
              style={styles.rotateButton}
              onPress={() => applyRotation(-90)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.rotateText}>Xoay trái</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.rotateButton}
              onPress={() => applyRotation(90)}
            >
              <Ionicons name="arrow-forward" size={24} color="#fff" />
              <Text style={styles.rotateText}>Xoay phải</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.rotateButton}
              onPress={() => applyRotation(180)}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.rotateText}>Lật ngược</Text>
            </TouchableOpacity>
          </View>
        );

      case 'crop':
        return (
          <View style={styles.cropPanel}>
            <Text style={styles.comingSoonText}>Đang phát triển</Text>
            <Text style={styles.comingSoonSubtext}>Tính năng cắt ảnh sẽ có sớm</Text>
          </View>
        );

      case 'text':
      case 'draw':
        return (
          <View style={styles.cropPanel}>
            <Text style={styles.comingSoonText}>Đang phát triển</Text>
            <Text style={styles.comingSoonSubtext}>Tính năng này sẽ có sớm</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#0F1419" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa ảnh</Text>
        <TouchableOpacity onPress={resetEdits}>
          <Text style={styles.resetText}>Đặt lại</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#1D9BF0" />
            <Text style={styles.processingText}>Đang xử lý...</Text>
          </View>
        )}
        {mediaType === 'video' ? (
          <Video
            source={{ uri: editedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <Image 
            source={{ uri: editedImageUri }} 
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
      </View>

      {mediaType === 'image' && (
        <>
          <View style={styles.toolsContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toolsScroll}
            >
              {EDIT_TOOLS.map(tool => (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolButton,
                    selectedTool === tool.id && styles.toolButtonActive
                  ]}
                  onPress={() => setSelectedTool(tool.id)}
                >
                  <View style={[
                    styles.toolIconContainer,
                    selectedTool === tool.id && styles.toolIconContainerActive
                  ]}>
                    <Ionicons 
                      name={tool.icon} 
                      size={24} 
                      color={selectedTool === tool.id ? '#fff' : '#0F1419'} 
                    />
                  </View>
                  <Text style={[
                    styles.toolName,
                    selectedTool === tool.id && styles.toolNameActive
                  ]}>
                    {tool.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.toolPanel}>
            {renderToolPanel()}
          </View>
        </>
      )}
      
      {mediaType === 'video' && (
        <View style={styles.videoInfo}>
          <Ionicons name="videocam" size={24} color="#1D9BF0" />
          <Text style={styles.videoInfoText}>Video đã sẵn sàng để đăng</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.storyButton}
          onPress={handlePostToStory}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.storyButtonText}>Đăng Story</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.postButton}
          onPress={handlePostToFeed}
        >
          <Ionicons name="send" size={24} color="#fff" />
          <Text style={styles.postButtonText}>Đăng bài viết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D9BF0',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: width,
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  toolsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    paddingVertical: 12,
  },
  toolsScroll: {
    paddingHorizontal: 16,
    gap: 20,
  },
  toolButton: {
    alignItems: 'center',
  },
  toolIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F7F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  toolIconContainerActive: {
    backgroundColor: '#1D9BF0',
  },
  toolName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#536471',
  },
  toolNameActive: {
    color: '#1D9BF0',
    fontWeight: '700',
  },
  toolPanel: {
    backgroundColor: '#fff',
    height: 200,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  filterButton: {
    alignItems: 'center',
  },
  filterPreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  filterPreviewActive: {
    borderColor: '#1D9BF0',
  },
  filterPreviewImage: {
    width: '100%',
    height: '100%',
  },
  filterName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#536471',
  },
  filterNameActive: {
    color: '#1D9BF0',
    fontWeight: '700',
  },
  adjustPanel: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  adjustItem: {
    marginBottom: 20,
  },
  adjustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  adjustLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1419',
  },
  adjustValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D9BF0',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rotatePanel: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rotateButton: {
    alignItems: 'center',
    backgroundColor: '#1D9BF0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  rotateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cropPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#536471',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#8899A6',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  storyButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#7856FF',
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  storyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  postButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1D9BF0',
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#F7F9FA',
  },
  videoInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
  },
});

export default ImageEditorScreen;
