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
  Animated,
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
import StoriesBar from "../components/StoriesBar";
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

  const getReactionColor = (reactionType) => {
    const colors = {
      like: "#1877f2",
      love: "#f33e58",
      haha: "#f7b125",
      wow: "#f7b125",
      sad: "#f7b125",
      angry: "#e9710f",
    };
    return colors[reactionType] || "#65676b";
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "Vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      

      <Pressable
        style={styles.createPostContainer}
        onPress={() => navigation.navigate("CreatePost")}
      >
        <View style={styles.createPostTop}>
          <UserAvatar user={user} size={44} />
          <View style={styles.createPostInput}>
            <Text style={styles.createPostText}>Chia sẻ điều gì đó...</Text>
          </View>
        </View>
        <View style={styles.createPostDivider} />
        <View style={styles.createPostActions}>
          <TouchableOpacity
            style={styles.createPostAction}
            onPress={() => navigation.navigate("Camera")}
          >
            <LinearGradient
              colors={["#FF6B35", "#F7931E"]}
              style={styles.actionIconGradient}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.createActionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createPostAction}>
            <LinearGradient
              colors={["#f093fb", "#f5576c"]}
              style={styles.actionIconGradient}
            >
              <Ionicons name="image" size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.createActionText}>Ảnh/Video</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <StoriesBar
        stories={stories}
        currentUserId={user?.id}
        onCreateStory={() => navigation.navigate("CreateStory")}
        onViewStory={(userId) => navigation.navigate("ViewStory", { userId })}
      />
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={["rgba(102, 126, 234, 0.05)", "rgba(118, 75, 162, 0.05)"]}
        style={styles.cardGradientBorder}
      >
        <View style={styles.card}>
          <View style={styles.postHeader}>
            <TouchableOpacity
              style={styles.postHeaderLeft}
              onPress={() =>
                navigation.navigate("Profile", { userId: item.user_id })
              }
            >
              <UserAvatar user={item} size={50} style={styles.avatar} />
              <View style={styles.postHeaderInfo}>
                <View style={styles.authorNameContainer}>
                  <Text style={styles.authorName}>
                    {item.full_name || item.username}
                  </Text>
                  <VerifiedBadge isVerified={item.is_verified} size={16} />
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={13} color="#9ca3af" />
                  <Text style={styles.postTime}>
                    {formatTimeAgo(item.created_at)}
                  </Text>
                </View>
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
                      size={22}
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
              const API_URL =
                Constants.expoConfig?.extra?.apiUrl || "http://localhost:5000";
              const mediaUrl = item.media_url.startsWith("http")
                ? item.media_url
                : `${API_URL}${item.media_url}`;
              const isVideo = item.media_type?.startsWith("video/");
              const isVisible = visibleItems.includes(item.id);
              const hasError = mediaErrors[item.id];

              const aspectRatio =
                item.media_width && item.media_height
                  ? item.media_width / item.media_height
                  : 16 / 9;

              const mediaStyle = {
                width: "100%",
                aspectRatio: aspectRatio,
                backgroundColor: "#f3f4f6",
                borderRadius: 16,
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
                      <Card.Cover
                        source={{ uri: mediaUrl }}
                        style={mediaStyle}
                        onError={handleMediaError}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

          {(item.reaction_count > 0 || item.comment_count > 0) && (
            <View style={styles.statsContainer}>
              {item.reaction_count > 0 && (
                <TouchableOpacity
                  style={styles.reactionStats}
                  onPress={() => {
                    setSelectedPostId(item.id);
                    setReactionsModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={["#FF6B35", "#F7931E"]}
                    style={styles.reactionCountBadge}
                  >
                    <Text style={styles.reactionIcon}>
                      {getReactionIcon(item.user_reaction || "like")}
                    </Text>
                    <Text style={styles.reactionCountText}>
                      {item.reaction_count}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {item.comment_count > 0 && (
                <View style={styles.commentBadge}>
                  <Ionicons name="chatbubble" size={14} color="#FF6B35" />
                  <Text style={styles.commentCountText}>
                    {item.comment_count} bình luận
                  </Text>
                </View>
              )}
            </View>
          )}

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
      </LinearGradient>
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
            <LinearGradient
              colors={["#FF6B35", "#F7931E"]}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="newspaper-outline" size={48} color="#fff" />
            </LinearGradient>
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
    backgroundColor: "#f8f9fa",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingBottom: 16,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  createPostContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  createPostInput: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: "#f3f4f6",
  },
  createPostText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "400",
  },
  createPostDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 14,
  },
  createPostActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  createPostAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  createActionText: {
    fontSize: 15,
    color: "#4b5563",
    fontWeight: "600",
  },
  cardWrapper: {
    marginTop: 16,
    marginHorizontal: 12,
  },
  cardGradientBorder: {
    borderRadius: 24,
    padding: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    backgroundColor: "#FF6B35",
    borderWidth: 2,
    borderColor: "#f3f4f6",
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: 0,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  postTime: {
    fontSize: 13,
    color: "#9ca3af",
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: "#374151",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  mediaContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  mediaErrorContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  mediaErrorText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reactionStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  reactionCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  reactionIcon: {
    fontSize: 14,
  },
  reactionCountText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  commentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentCountText: {
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    position: "relative",
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  actionNormal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  actionIconEmoji: {
    fontSize: 18,
  },
  actionTextActive: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "600",
  },
  actionText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "600",
  },
  reactionMenu: {
    position: "absolute",
    bottom: 60,
    left: 20,
    zIndex: 1000,
    borderRadius: 30,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  reactionMenuContent: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reactionOption: {
    padding: 8,
  },
  reactionOptionIcon: {
    fontSize: 28,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default HomeScreen;
