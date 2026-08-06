import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { useAuthStore } from '../stores';
import { useTheme } from '../theme/ThemeProvider';
import { websocketManager } from '../services/websocketManager';
import { fcmService } from '../services/fcmService';

export const Splash: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { restoreSession, isAuthenticated } = useAuthStore();
  
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Run logo pop animation
    logoScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, {
      duration: 1000,
    });

    // 2. Setup Firebase Notifications
    fcmService.requestUserPermission();
    fcmService.registerListeners();

    // 3. Check authentication session
    const checkAuth = async () => {
      await restoreSession();
      // Bounded delay of 2 seconds for branding visualization
      setTimeout(() => {
        if (useAuthStore.getState().isAuthenticated) {
          // Connect global websocket
          websocketManager.connect();
          navigation.reset({
            index: 0,
            routes: [{ name: 'App' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 2000);
    };

    checkAuth();
  }, [logoOpacity, logoScale, restoreSession, navigation]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Animated Brand Logo Icon Container */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <View style={[styles.brandSymbol, { borderColor: colors.secondaryContainer }]} />
        <Animated.Text style={[typography.headlineLg, { color: '#ffffff', fontWeight: 'bold', marginTop: 16 }]}>
          MedNova
        </Animated.Text>
        <Animated.Text style={[typography.labelCaps, { color: colors.outlineVariant, marginTop: 4 }]}>
          Smart Clinical Intelligence
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandSymbol: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 6,
    transform: [{ rotate: '45deg' }],
  },
});
