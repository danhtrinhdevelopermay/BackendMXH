import React, { useContext } from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useIncomingCall } from '../hooks/useIncomingCall';
import IncomingCallModal from '../components/IncomingCallModal';

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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1877f2',
        tabBarInactiveTintColor: '#65676b',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e4e6eb',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
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
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'Trang chủ',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Search')}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="search" size={24} color="#050505" />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen 
        name="Bạn bè" 
        component={FriendsScreen}
        options={{
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Tin nhắn" 
        component={MessagesScreen}
        options={{
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Thông báo" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Hồ sơ" 
        component={ProfileScreen}
        options={{
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
};

const NavigationWrapper = () => {
  const { user } = useContext(AuthContext);
  const { incomingCall, acceptCall, rejectCall } = useIncomingCall();

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={HomeTabs} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: true, title: 'Tìm kiếm' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Hồ sơ' }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ headerShown: true, title: 'Tạo bài viết' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Comments" component={CommentsScreen} options={{ headerShown: true, title: 'Comments' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ' }} />
            <Stack.Screen name="VoiceCall" component={VoiceCallScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
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
