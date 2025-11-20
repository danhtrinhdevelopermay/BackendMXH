import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  Card,
  Avatar,
  IconButton,
  Text,
  Menu,
  Divider,
} from "react-native-paper";
import { Video } from "expo-av";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { postAPI, reactionAPI, storyAPI } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import UserAvatar from "../components/UserAvatar";
import VerifiedBadge from "../components/VerifiedBadge";
import ReactionsModal from "../components/ReactionsModal";
import LikeButton from "../components/LikeButton";
import ShareModal from "../components/ShareModal";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState({});
  const [reactionMenuVisible, setReactionMenuVisible] = useState({});
  const [visibleItems, setVisibleItems] = useState([]);
  const [reactionsModalVisible, setReactionsModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [mediaErrors, setMediaErrors] = useState({});
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState('discover');
  const videoRefs = useRef({});

  const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:5000";

  const fetchPosts = async () => {
    try {
      const response = await postAPI.getNewsFeed();
      setPosts(response.data);
    } catch (error) {
      showAlert("Error", "Failed to fetch posts", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getAllStories();
      setStories(response.data);
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStories();

      return () => {
        Object.values(videoRefs.current).forEach(async (video) => {
          if (video) {
            try {
              await video.pauseAsync();
            } catch (error) {
              console.log("Error pausing video:", error);
            }
          }
        });
      };
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
    fetchStories();
  }, []);

  const handleReaction = async (postId, reactionType, currentReaction) => {
    try {
      if (reactionType === "like" && currentReaction === "like") {
        await reactionAPI.removeReaction(postId);
      } else {
        await reactionAPI.addReaction(postId, { reaction_type: reactionType });
      }
      setReactionMenuVisible({});
      fetchPosts();
    } catch (error) {
      showAlert("Error", "Failed to update reaction", "error");
    }
  };

  const handleDeletePost = async (postId) => {
    showAlert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      "warning",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await postAPI.deletePost(postId);
              fetchPosts();
              showAlert("Success", "Post deleted successfully", "success");
            } catch (error) {
              showAlert("Error", "Failed to delete post", "error");
            }
          },
        },
      ],
    );
  };

  const toggleMenu = (postId) => {
    setMenuVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleReactionMenu = (postId) => {
    setReactionMenuVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const getReactionIcon = (reactionType) => {
    const icons = {
      like: "👍",
      love: "❤️",
      haha: "😂",
      wow: "😮",
      sad: "😢",
      angry: "😡",
    };
    return icons[reactionType] || "👍";
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString("vi-VN");
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const visiblePostIds = viewableItems.map((item) => item.item.id);
    setVisibleItems(visiblePostIds);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleVideoPress = async (postId) => {
    let videoPosition = 0;
    if (videoRefs.current[postId]) {
      try {
        const status = await videoRefs.current[postId].getStatusAsync();
        if (status.isLoaded) {
          videoPosition = status.positionMillis;
        }
        await videoRefs.current[postId].pauseAsync();
      } catch (error) {
        console.log("Error pausing video:", error);
      }
    }
    navigation.navigate("PostDetail", { postId, videoPosition });
  };

  const renderStoryItem = (item, index) => {
    const isOwnStory = index === 0;
    return (
      <TouchableOpacity 
        key={index}
        style={styles.storyItem}
        onPress={() => isOwnStory ? navigation.navigate("CreateStory") : navigation.navigate("ViewStory", { userId: item.user_id })}
      >
        <LinearGradient
          colors={isOwnStory ? ['#e0e0e0', '#e0e0e0'] : ['#FF6B35', '#F7931E', '#FF6B35']}
          style={styles.storyGradient}
        >
          <View style={styles.storyInner}>
            {isOwnStory ? (
              <View style={styles.ownStoryAvatar}>
                <UserAvatar user={user} size={60} />
                <View style={styles.addStoryButton}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: item.media_url }}
                style={styles.storyImage}
              />
            )}
          </View>
        </LinearGradient>
        <Text style={styles.storyLabel} numberOfLines={1}>
          {isOwnStory ? 'Your Story' : item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <UserAvatar user={user} size={40} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
          {activeTab === 'discover' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.inactiveTabText]}>
            Following
          </Text>
          {activeTab === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        {renderStoryItem({ user_id: user?.id }, 0)}
        {stories.map((story, index) => renderStoryItem(story, index + 1))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Post</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postHeaderLeft}
          onPress={() =>
            navigation.navigate("Profile", { userId: item.user_id })
          }
        >
          <UserAvatar user={item} size={44} />
          <View style={styles.postHeaderInfo}>
            <View style={styles.authorNameContainer}>
              <Text style={styles.authorName}>
                {item.full_name || item.username}
              </Text>
              <VerifiedBadge isVerified={item.is_verified} size={14} />
            </View>
            <Text style={styles.postMeta}>
              Posted in u88 - {formatTimeAgo(item.created_at)} ago
            </Text>
          </View>
        </TouchableOpacity>
        {user?.id === item.user_id && (
          <Menu
            visible={menuVisible[item.id] || false}
            onDismiss={() => toggleMenu(item.id)}
            anchor={
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => toggleMenu(item.id)}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                toggleMenu(item.id);
                handleDeletePost(item.id);
              }}
              title="Xóa bài viết"
            />
          </Menu>
        )}
      </View>

      {item.content && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("PostDetail", { postId: item.id })
          }
        >
          <Text style={styles.postContent}>{item.content}</Text>
        </TouchableOpacity>
      )}

      {item.media_type &&
        item.media_url &&
        (() => {
          const mediaUrl = item.media_url.startsWith("http")
            ? item.media_url
            : `${API_URL}${item.media_url}`;
          const isVideo = item.media_type?.startsWith("video/");
          const isVisible = visibleItems.includes(item.id);
          const hasError = mediaErrors[item.id];

          const aspectRatio =
            item.media_width && item.media_height
              ? item.media_width / item.media_height
              : 1;

          const mediaStyle = {
            width: "100%",
            aspectRatio: aspectRatio,
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
          };

          const handleMediaError = () => {
            setMediaErrors((prev) => ({ ...prev, [item.id]: true }));
          };

          if (hasError) {
            return (
              <View style={styles.mediaErrorContainer}>
                <Ionicons name="image-outline" size={48} color="#d1d5db" />
                <Text style={styles.mediaErrorText}>
                  Không thể tải media
                </Text>
              </View>
            );
          }

          return (
            <View style={styles.mediaContainer}>
              {isVideo ? (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => handleVideoPress(item.id)}
                >
                  <Video
                    ref={(ref) => {
                      if (ref) {
                        videoRefs.current[item.id] = ref;
                      }
                    }}
                    source={{ uri: mediaUrl }}
                    style={mediaStyle}
                    resizeMode="cover"
                    shouldPlay={isVisible}
                    isLooping
                    isMuted={false}
                    onError={(error) => {
                      console.log("Video error:", error);
                      handleMediaError();
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() =>
                    navigation.navigate("PostDetail", { postId: item.id })
                  }
                >
                  <Image
                    source={{ uri: mediaUrl }}
                    style={mediaStyle}
                    onError={handleMediaError}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        })()}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B35", "#F7931E"]}
            tintColor="#FF6B35"
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
            <Text style={styles.emptyText}>
              Hãy bắt đầu chia sẻ khoảnh khắc của bạn!
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <ReactionsModal
        visible={reactionsModalVisible}
        onClose={() => setReactionsModalVisible(false)}
        postId={selectedPostId}
      />

      <ShareModal
        visible={shareModalVisible}
        onDismiss={() => {
          setShareModalVisible(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9f4",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#a7e4c4',
  },
  topBarLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#a7e4c4',
  },
  tab: {
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    paddingBottom: 8,
  },
  activeTabText: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  inactiveTabText: {
    color: '#6b7280',
  },
  tabIndicator: {
    height: 3,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    marginTop: 4,
  },
  storiesContainer: {
    backgroundColor: '#a7e4c4',
    paddingTop: 16,
    paddingBottom: 20,
  },
  storiesContent: {
    paddingHorizontal: 16,
  },
  storyItem: {
    marginRight: 12,
    alignItems: 'center',
    width: 72,
  },
  storyGradient: {
    borderRadius: 16,
    padding: 2,
  },
  storyInner: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  ownStoryAvatar: {
    position: 'relative',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4ade80',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyImage: {
    width: 68,
    height: 88,
  },
  storyLabel: {
    fontSize: 11,
    color: '#1a1a1a',
    marginTop: 6,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  postMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  mediaContainer: {
    marginTop: 4,
  },
  mediaErrorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  mediaErrorText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});

export default HomeScreen;
