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
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} tuần trước`;
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
    const displayUrl = item.thumbnail_url || item.media_url;
    
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
            ) : displayUrl ? (
              <Image
                source={{ uri: displayUrl }}
                style={styles.storyImage}
              />
            ) : (
              <UserAvatar user={item} userId={item.user_id} size={60} />
            )}
          </View>
        </LinearGradient>
        <Text style={styles.storyLabel} numberOfLines={1}>
          {isOwnStory ? 'Bạn' : item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <Pressable
        style={styles.createPostBox}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <UserAvatar user={user} size={40} />
        <View style={styles.createPostInput}>
          <Text style={styles.createPostPlaceholder}>Bạn đang nghĩ gì vậy?</Text>
        </View>
      </Pressable>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.storiesContainer}
        contentContainerStyle={styles.storiesContent}
      >
        {renderStoryItem({ user_id: user?.id }, 0)}
        {stories.map((story, index) => renderStoryItem(story, index + 1))}
      </ScrollView>
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
              {formatTimeAgo(item.created_at)}
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

      <View style={styles.actionsContainer}>
        <LikeButton
          isLiked={!!item.user_reaction}
          reactionType={item.user_reaction}
          onPress={() =>
            handleReaction(item.id, "like", item.user_reaction)
          }
          onLongPress={() => toggleReactionMenu(item.id)}
        />

        {reactionMenuVisible[item.id] && (
          <View style={styles.reactionMenu}>
            <LinearGradient
              colors={["#ffffff", "#f9fafb"]}
              style={styles.reactionMenuContent}
            >
              {["like", "love", "haha", "wow", "sad", "angry"].map(
                (reaction) => (
                  <TouchableOpacity
                    key={reaction}
                    onPress={() =>
                      handleReaction(item.id, reaction, item.user_reaction)
                    }
                    style={styles.reactionOption}
                  >
                    <Text style={styles.reactionOptionIcon}>
                      {getReactionIcon(reaction)}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </LinearGradient>
          </View>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("Comments", { postId: item.id })
          }
        >
          <View style={styles.actionNormal}>
            <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
            <Text style={styles.actionText}>Bình luận</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedPost(item);
            setShareModalVisible(true);
          }}
        >
          <View style={styles.actionNormal}>
            <Ionicons name="share-outline" size={22} color="#6b7280" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.appLogo}>Shatter</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Thông báo')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

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

      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
        style={styles.topGradient}
        pointerEvents="none"
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
    backgroundColor: "#fff",
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    zIndex: 1000,
  },
  appLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1877f2',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 112,
    paddingBottom: 85,
  },
  headerWrapper: {
    backgroundColor: '#fff',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 999,
  },
  createPostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  createPostInput: {
    flex: 1,
  },
  createPostPlaceholder: {
    fontSize: 15,
    color: '#9ca3af',
  },
  storiesContainer: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 16,
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
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  reactionMenu: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    zIndex: 1000,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  reactionMenuContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  reactionOption: {
    padding: 4,
  },
  reactionOptionIcon: {
    fontSize: 28,
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
