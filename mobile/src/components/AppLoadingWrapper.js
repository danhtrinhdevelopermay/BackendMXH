import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import { postsAPI, storiesAPI, notificationsAPI, friendshipAPI, thoughtsAPI, messagesAPI } from '../api/api';

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
      const loadPromises = [];
      
      if (postsAPI?.getFeed) loadPromises.push(postsAPI.getFeed().catch(() => ({ data: [] })));
      if (storiesAPI?.getStories) loadPromises.push(storiesAPI.getStories().catch(() => ({ data: [] })));
      if (notificationsAPI?.getNotifications) loadPromises.push(notificationsAPI.getNotifications().catch(() => ({ data: [] })));
      if (friendshipAPI?.getFriendRequests) loadPromises.push(friendshipAPI.getFriendRequests().catch(() => ({ data: [] })));
      if (friendshipAPI?.getSuggestedFriends) loadPromises.push(friendshipAPI.getSuggestedFriends().catch(() => ({ data: [] })));
      if (thoughtsAPI?.getThoughts) loadPromises.push(thoughtsAPI.getThoughts().catch(() => ({ data: [] })));
      if (messagesAPI?.getConversations) loadPromises.push(messagesAPI.getConversations().catch(() => ({ data: [] })));

      if (loadPromises.length > 0) {
        const results = await Promise.all(loadPromises);
        
        setPreloadedData({
          feed: results[0]?.data || [],
          stories: results[1]?.data || [],
          notifications: results[2]?.data || [],
          friendRequests: results[3]?.data || [],
          suggestions: results[4]?.data || [],
          thoughts: results[5]?.data || [],
          conversations: results[6]?.data || [],
        });
      }

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
