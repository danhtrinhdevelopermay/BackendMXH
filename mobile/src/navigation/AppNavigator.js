import React, { useContext, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Animated, Easing, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useIncomingCall } from '../hooks/useIncomingCall';
import IncomingCallModal from '../components/IncomingCallModal';
import { registerForPushNotificationsAsync, setupNotificationListeners, unregisterPushToken } from '../services/notificationService';
import { postsAPI, storiesAPI, notificationsAPI, friendshipAPI, thoughtsAPI, messagesAPI } from '../api/api';

import { useIsFocused } from '@react-navigation/native';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ChatScreen from '../screens/ChatScreen';
import CommentsScreen from '../screens/CommentsScreen';
import SearchScreen from '../screens/SearchScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import VoiceCallScreen from '../screens/VoiceCallScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreateStoryScreen from '../screens/CreateStoryScreen';
import ViewStoryScreen from '../screens/ViewStoryScreen';
import CreateThoughtScreen from '../screens/CreateThoughtScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CameraScreen from '../screens/CameraScreen';
import ImageEditorScreen from '../screens/ImageEditorScreen';
import NotificationBell from '../components/NotificationBell';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenTransitionConfig = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const fadeTransition = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
        easing: Easing.out(Easing.poly(4)),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 250,
        easing: Easing.in(Easing.poly(4)),
      },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
};

const slideFromRightTransition = {
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: screenTransitionConfig,
    close: screenTransitionConfig,
  },
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

const modalTransition = {
  gestureDirection: 'vertical',
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
  cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS,
};

const TabBarIcon = ({ focused, iconName, color, size }) => {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const rotate = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 0.85,
        friction: 3,
        tension: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: focused ? 1 : 0,
        duration: 200,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={{ 
        transform: [
          { scale },
          { rotate: focused ? rotateInterpolate : '0deg' }
        ] 
      }}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
};

const withTabAnimation = (Component) => {
  return (props) => {
    const isFocused = useIsFocused();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
      if (isFocused) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 9,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(0);
        translateY.setValue(20);
        scale.setValue(0.95);
      }
    }, [isFocused]);

    return (
      <Animated.View 
        style={{ 
          flex: 1, 
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale }
          ]
        }}
      >
        <Component {...props} />
      </Animated.View>
    );
  };
};

const AnimatedHome = withTabAnimation(HomeScreen);
const AnimatedFriends = withTabAnimation(FriendsScreen);
const AnimatedMessages = withTabAnimation(MessagesScreen);
const AnimatedNotifications = withTabAnimation(NotificationsScreen);
const AnimatedProfile = withTabAnimation(ProfileScreen);

const HomeTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Bạn bè') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Tin nhắn') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Thông báo') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Hồ sơ') iconName = focused ? 'person' : 'person-outline';
          return <TabBarIcon focused={focused} iconName={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: '#1877f2',
        tabBarInactiveTintColor: '#65676b',
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            backgroundColor: 'transparent',
          }} />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          marginHorizontal: 0,
          marginBottom: insets.bottom,
          borderRadius: 0,
          shadowColor: 'transparent',
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[props.style, { flex: 1 }]}
          />
        ),
        headerStyle: {
          backgroundColor: '#fff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e4e6eb',
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1877f2',
        },
        lazy: true,
        unmountOnBlur: false,
      })}
      sceneContainerStyle={{
        backgroundColor: '#fff',
        paddingBottom: 90,
      }}
      tabBar={(props) => (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
        }}>
          <View style={{
            backgroundColor: 'transparent',
            marginHorizontal: 0,
            marginBottom: insets.bottom,
            borderRadius: 0,
            height: 65,
            flexDirection: 'row',
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
          }}>
            {props.state.routes.map((route, index) => {
              const { options } = props.descriptors[route.key];
              const label = options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

              const isFocused = props.state.index === index;

              const onPress = () => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name);
                }
              };

              let iconName;
              if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
              else if (route.name === 'Bạn bè') iconName = isFocused ? 'people' : 'people-outline';
              else if (route.name === 'Tin nhắn') iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
              else if (route.name === 'Thông báo') iconName = isFocused ? 'notifications' : 'notifications-outline';
              else if (route.name === 'Hồ sơ') iconName = isFocused ? 'person' : 'person-outline';

              return (
                <TouchableOpacity
                  key={route.key}
                  activeOpacity={0.7}
                  onPress={onPress}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingTop: 8,
                    paddingBottom: 10,
                    backgroundColor: 'transparent',
                  }}
                >
                  <TabBarIcon
                    focused={isFocused}
                    iconName={iconName}
                    color={isFocused ? '#1877f2' : '#65676b'}
                    size={24}
                  />
                  <Animated.Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: isFocused ? '#1877f2' : '#65676b',
                      marginTop: 4,
                    }}
                  >
                    {label}
                  </Animated.Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    >
      <Tab.Screen 
        name="Home" 
        component={AnimatedHome}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Bạn bè" 
        component={AnimatedFriends}
        options={({ navigation }) => ({
          headerShown: true,
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <NotificationBell navigation={navigation} />
            </View>
          ),
        })}
      />
      <Tab.Screen 
        name="Tin nhắn" 
        component={AnimatedMessages}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Thông báo" 
        component={AnimatedNotifications}
        options={{
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Hồ sơ" 
        component={AnimatedProfile}
        options={({ navigation }) => ({
          headerShown: false,
        })}
      />
    </Tab.Navigator>
  );
};

const NavigationWrapper = () => {
  const { user } = useContext(AuthContext);
  const { incomingCall, acceptCall, rejectCall } = useIncomingCall();
  const navigationRef = useRef(null);
  const pushTokenRef = useRef(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  useEffect(() => {
    if (user && !hasPreloaded) {
      setIsPreloading(true);
      preloadData();
      
      registerForPushNotificationsAsync().then(token => {
        pushTokenRef.current = token;
      });

      const subscription = setupNotificationListeners({
        navigate: (screen, params) => {
          if (navigationRef.current) {
            navigationRef.current.navigate(screen, params);
          }
        }
      });

      return () => {
        subscription.remove();
      };
    } else if (!user) {
      setHasPreloaded(false);
      if (pushTokenRef.current) {
        unregisterPushToken(pushTokenRef.current);
        pushTokenRef.current = null;
      }
    }
  }, [user]);

  const preloadData = async () => {
    try {
      const loadPromises = [];
      
      if (postsAPI?.getFeed) loadPromises.push(postsAPI.getFeed().catch(() => ({ data: [] })));
      if (storiesAPI?.getStories) loadPromises.push(storiesAPI.getStories().catch(() => ({ data: [] })));
      if (notificationsAPI?.getNotifications) loadPromises.push(notificationsAPI.getNotifications().catch(() => ({ data: [] })));
      if (friendshipAPI?.getFriendRequests) loadPromises.push(friendshipAPI.getFriendRequests().catch(() => ({ data: [] })));
      if (friendshipAPI?.getSuggestedFriends) loadPromises.push(friendshipAPI.getSuggestedFriends().catch(() => ({ data: [] })));
      if (thoughtsAPI?.getThoughts) loadPromises.push(thoughtsAPI.getThoughts().catch(() => ({ data: [] })));
      if (messagesAPI?.getConversations) loadPromises.push(messagesAPI.getConversations().catch(() => ({ data: [] })));

      if (loadPromises.length > 0) {
        await Promise.all(loadPromises);
      }
      
      setTimeout(() => {
        setIsPreloading(false);
        setHasPreloaded(true);
      }, 500);
    } catch (error) {
      console.error('Error preloading data:', error);
      setTimeout(() => {
        setIsPreloading(false);
        setHasPreloaded(true);
      }, 1000);
    }
  };

  if (isPreloading && user) {
    return <SplashScreen onLoadComplete={() => setIsPreloading(false)} />;
  }

  return (
    <>
      <Stack.Navigator 
        ref={navigationRef}
        screenOptions={{
          headerShown: false,
          ...slideFromRightTransition,
          gestureEnabled: true,
          gestureResponseDistance: 50,
        }}
      >
        {user ? (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={HomeTabs}
              options={{
                ...fadeTransition,
              }}
            />
            <Stack.Screen 
              name="Search" 
              component={SearchScreen} 
              options={{ 
                headerShown: true, 
                title: 'Tìm kiếm',
                ...slideFromRightTransition,
              }} 
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                headerShown: true, 
                title: 'Hồ sơ',
                ...slideFromRightTransition,
              }} 
            />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePostScreen} 
              options={{ 
                headerShown: true, 
                title: 'Tạo bài viết',
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="PostDetail" 
              component={PostDetailScreen} 
              options={{ 
                headerShown: true, 
                title: 'Bài viết',
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ 
                headerShown: true,
                ...slideFromRightTransition,
              }} 
            />
            <Stack.Screen 
              name="Comments" 
              component={CommentsScreen} 
              options={{ 
                headerShown: true, 
                title: 'Comments',
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen} 
              options={{ 
                headerShown: true, 
                title: 'Chỉnh sửa hồ sơ',
                ...slideFromRightTransition,
              }} 
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ 
                headerShown: false,
                ...slideFromRightTransition,
              }} 
            />
            <Stack.Screen 
              name="VoiceCall" 
              component={VoiceCallScreen} 
              options={{ 
                headerShown: false,
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="CreateStory" 
              component={CreateStoryScreen} 
              options={{ 
                headerShown: false,
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="ViewStory" 
              component={ViewStoryScreen} 
              options={{ 
                headerShown: false,
                ...fadeTransition,
              }} 
            />
            <Stack.Screen 
              name="CreateThought" 
              component={CreateThoughtScreen} 
              options={{ 
                headerShown: false,
                ...modalTransition,
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen} 
              options={{ 
                headerShown: false,
                ...fadeTransition,
                presentation: 'fullScreenModal',
              }} 
            />
            <Stack.Screen 
              name="ImageEditor" 
              component={ImageEditorScreen} 
              options={{ 
                headerShown: false,
                ...slideFromRightTransition,
              }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen}
              options={{
                ...fadeTransition,
              }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                ...slideFromRightTransition,
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                ...slideFromRightTransition,
              }}
            />
          </>
        )}
      </Stack.Navigator>
      
      <IncomingCallModal
        visible={!!incomingCall}
        caller={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    </>
  );
};

const AppNavigator = () => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <NavigationWrapper />
    </NavigationContainer>
  );
};

export default AppNavigator;
