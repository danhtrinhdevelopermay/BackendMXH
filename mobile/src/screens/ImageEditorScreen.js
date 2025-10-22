import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

const CROP_PRESETS = [
  { id: 'original', name: 'Gốc', ratio: null },
  { id: 'square', name: 'Vuông', ratio: 1 },
  { id: '4:3', name: '4:3', ratio: 4/3 },
  { id: '16:9', name: '16:9', ratio: 16/9 },
  { id: '9:16', name: '9:16', ratio: 9/16 },
  { id: '3:4', name: '3:4', ratio: 3/4 },
];

const EDIT_TOOLS = [
  { id: 'rotate', name: 'Xoay', icon: 'refresh' },
  { id: 'flip', name: 'Lật', icon: 'swap-horizontal' },
  { id: 'crop', name: 'Cắt', icon: 'crop' },
  { id: 'resize', name: 'Kích thước', icon: 'resize' },
];

const RESIZE_OPTIONS = [
  { id: 'hd', name: 'HD', width: 1280 },
  { id: 'full', name: 'Full HD', width: 1920 },
  { id: '4k', name: '4K', width: 3840 },
  { id: 'original', name: 'Gốc', width: null },
];

const ImageEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri, mediaType = 'image' } = route.params;

  const [selectedTool, setSelectedTool] = useState('rotate');
  const [editedImageUri, setEditedImageUri] = useState(imageUri);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState(null);
  
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState({ horizontal: false, vertical: false });

  React.useEffect(() => {
    Image.getSize(imageUri, (w, h) => {
      setImageSize({ width: w, height: h });
    });
  }, [imageUri]);

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

  const applyFlip = async (direction) => {
    setIsProcessing(true);
    
    try {
      const flipAction = direction === 'horizontal' 
        ? { flip: ImageManipulator.FlipType.Horizontal }
        : { flip: ImageManipulator.FlipType.Vertical };

      const result = await ImageManipulator.manipulateAsync(
        editedImageUri || imageUri,
        [flipAction],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
      setFlipped(prev => ({
        ...prev,
        [direction]: !prev[direction]
      }));
    } catch (error) {
      console.error('Error flipping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCrop = async (preset) => {
    if (!imageSize || preset.ratio === null) return;
    
    setIsProcessing(true);
    
    try {
      const { width: imgWidth, height: imgHeight } = imageSize;
      let cropWidth, cropHeight, originX, originY;

      if (preset.ratio) {
        const currentRatio = imgWidth / imgHeight;
        
        if (currentRatio > preset.ratio) {
          cropHeight = imgHeight;
          cropWidth = cropHeight * preset.ratio;
          originX = (imgWidth - cropWidth) / 2;
          originY = 0;
        } else {
          cropWidth = imgWidth;
          cropHeight = cropWidth / preset.ratio;
          originX = 0;
          originY = (imgHeight - cropHeight) / 2;
        }

        const result = await ImageManipulator.manipulateAsync(
          editedImageUri || imageUri,
          [{
            crop: {
              originX: Math.max(0, originX),
              originY: Math.max(0, originY),
              width: Math.min(cropWidth, imgWidth),
              height: Math.min(cropHeight, imgHeight),
            }
          }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        setEditedImageUri(result.uri);
        Image.getSize(result.uri, (w, h) => {
          setImageSize({ width: w, height: h });
        });
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyResize = async (option) => {
    if (!option.width) return;
    
    setIsProcessing(true);
    
    try {
      const result = await ImageManipulator.manipulateAsync(
        editedImageUri || imageUri,
        [{ resize: { width: option.width } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setEditedImageUri(result.uri);
      Image.getSize(result.uri, (w, h) => {
        setImageSize({ width: w, height: h });
      });
    } catch (error) {
      console.error('Error resizing image:', error);
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
    setRotation(0);
    setFlipped({ horizontal: false, vertical: false });
    Image.getSize(imageUri, (w, h) => {
      setImageSize({ width: w, height: h });
    });
  };

  const renderToolPanel = () => {
    switch (selectedTool) {
      case 'rotate':
        return (
          <View style={styles.actionPanel}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => applyRotation(-90)}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.actionText}>Xoay trái 90°</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => applyRotation(90)}
            >
              <Ionicons name="arrow-forward" size={24} color="#fff" />
              <Text style={styles.actionText}>Xoay phải 90°</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => applyRotation(180)}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.actionText}>Lật ngược 180°</Text>
            </TouchableOpacity>
          </View>
        );

      case 'flip':
        return (
          <View style={styles.actionPanel}>
            <TouchableOpacity 
              style={[styles.actionButton, flipped.horizontal && styles.actionButtonActive]}
              onPress={() => applyFlip('horizontal')}
            >
              <Ionicons name="swap-horizontal" size={24} color="#fff" />
              <Text style={styles.actionText}>Lật ngang</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, flipped.vertical && styles.actionButtonActive]}
              onPress={() => applyFlip('vertical')}
            >
              <Ionicons name="swap-vertical" size={24} color="#fff" />
              <Text style={styles.actionText}>Lật dọc</Text>
            </TouchableOpacity>
          </View>
        );

      case 'crop':
        return (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {CROP_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetButton}
                onPress={() => applyCrop(preset)}
              >
                <View style={[
                  styles.presetBox,
                  preset.ratio && { aspectRatio: preset.ratio }
                ]}>
                  <Ionicons name="crop" size={20} color="#1D9BF0" />
                </View>
                <Text style={styles.presetName}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case 'resize':
        return (
          <View style={styles.actionPanel}>
            {RESIZE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.actionButton}
                onPress={() => applyResize(option)}
              >
                <MaterialCommunityIcons name="resize" size={24} color="#fff" />
                <Text style={styles.actionText}>{option.name}</Text>
                {option.width && (
                  <Text style={styles.actionSubtext}>{option.width}px</Text>
                )}
              </TouchableOpacity>
            ))}
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
        <Text style={styles.headerTitle}>Chỉnh sửa {mediaType === 'video' ? 'video' : 'ảnh'}</Text>
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
        
        {imageSize && (
          <View style={styles.imageSizeInfo}>
            <Text style={styles.imageSizeText}>
              {Math.round(imageSize.width)} × {Math.round(imageSize.height)}
            </Text>
          </View>
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
  imageSizeInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageSizeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    minHeight: 150,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    paddingVertical: 16,
  },
  actionPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#1D9BF0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 100,
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: '#7856FF',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  presetsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  presetButton: {
    alignItems: 'center',
    gap: 8,
  },
  presetBox: {
    width: 70,
    height: 70,
    backgroundColor: '#F7F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E4E6EB',
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F1419',
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
});

export default ImageEditorScreen;
