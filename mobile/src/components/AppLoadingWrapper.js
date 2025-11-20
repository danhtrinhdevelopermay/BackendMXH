import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import { postAPI, storyAPI, notificationAPI, friendshipAPI, thoughtAPI, messageAPI } from '../api/api';

const AppLoadingWrapper = ({ children, isAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [preloadedData, setPreloadedData] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      preloadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const preloadData = async () => {
    try {
      const loadPromises = [
        postAPI.getNewsFeed().catch(() => ({ data: [] })),
        storyAPI.getAllStories().catch(() => ({ data: [] })),
        notificationAPI.getNotifications().catch(() => ({ data: [] })),
        friendshipAPI.getFriendRequests().catch(() => ({ data: [] })),
        friendshipAPI.getSuggestedFriends().catch(() => ({ data: [] })),
        thoughtAPI.getAllThoughts().catch(() => ({ data: [] })),
        messageAPI.getConversations().catch(() => ({ data: [] })),
      ];

      const [
        feedData,
        storiesData,
        notificationsData,
        requestsData,
        suggestionsData,
        thoughtsData,
        conversationsData,
      ] = await Promise.all(loadPromises);

      setPreloadedData({
        feed: feedData.data,
        stories: storiesData.data,
        notifications: notificationsData.data,
        friendRequests: requestsData.data,
        suggestions: suggestionsData.data,
        thoughts: thoughtsData.data,
        conversations: conversationsData.data,
      });

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error preloading data:', error);
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  if (isLoading && isAuthenticated) {
    return <SplashScreen onLoadComplete={() => setIsLoading(false)} />;
  }

  return <>{children}</>;
};

export default AppLoadingWrapper;
