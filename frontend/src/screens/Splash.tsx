import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import { useAuthStore } from '../stores';
import { useTheme } from '../theme/ThemeProvider';
import { websocketManager } from '../services/websocketManager';
import { fcmService } from '../services/fcmService';
import { Wind } from 'lucide-react-native';

export const Splash: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { restoreSession } = useAuthStore();
  
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  // Animated breathing wave rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.8);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.8);
  const ring3Scale = useSharedValue(1);
  const ring3Opacity = useSharedValue(0.8);

  useEffect(() => {
    // 1. Run logo pop animation
    logoScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, {
      duration: 1000,
    });

    // 2. Animate breathing rings (continuous loops)
    ring1Scale.value = withRepeat(
      withTiming(2.2, { duration: 4000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    ring2Scale.value = withDelay(
      1300,
      withRepeat(
        withTiming(2.2, { duration: 4000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    ring2Opacity.value = withDelay(
      1300,
      withRepeat(
        withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );

    ring3Scale.value = withDelay(
      2600,
      withRepeat(
        withTiming(2.2, { duration: 4000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    ring3Opacity.value = withDelay(
      2600,
      withRepeat(
        withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );

    // 3. Setup Firebase Notifications
    fcmService.requestUserPermission();
    fcmService.registerListeners();
 
    // 4. Check authentication session
    const checkAuth = async () => {
      await restoreSession();
      // Bounded delay of 2 seconds for branding visualization
      setTimeout(() => {
        if (useAuthStore.getState().isAuthenticated) {
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
      }, 2500);
    };

    checkAuth();
  }, [logoOpacity, logoScale, ring1Opacity, ring1Scale, ring2Opacity, ring2Scale, ring3Opacity, ring3Scale, restoreSession, navigation]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
      opacity: logoOpacity.value,
    };
  });

  const r1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const r2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const r3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Ambient Breathing Waves */}
      <View style={styles.breathingContainer}>
        <Animated.View style={[styles.ring, { borderColor: `${colors.primary}1A` }, r1Style]} />
        <Animated.View style={[styles.ring, { borderColor: `${colors.statusCritical}1A` }, r2Style]} />
        <Animated.View style={[styles.ring, { borderColor: `${colors.primary}0D` }, r3Style]} />
        {/* Soft center glow */}
        <View style={[styles.glow, { backgroundColor: `${colors.statusCritical}0D` }]} />
      </View>

      {/* Main Content Area */}
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        {/* Glassmorphic Logo Container */}
        <View
          style={[
            styles.glassLogoCard,
            {
              backgroundColor: colors.surfaceGlass,
              borderRadius: 20,
              shadowColor: '#14213d',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.06,
              shadowRadius: 32,
              elevation: 4,
            },
          ]}
        >
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida/AP1WRLuUjQKqEB7Y8VBjqlpEpXqhqmfSfXF20uk7k_AecsBQ2UsiG5tXvv9YAZmGqWRSJSMJNzGsk6xo4MbZ8nd7s_ntJH0i1U_YpbScpjnv7fyaIimjTXTQkkaA0WGFkPZcZzG6bcCC84z7oy1p6cDHkiQJhd9Q2DyPS-3yAm6AneLjnT9Fl17ZXQwjvXtliK3x-3Mi9_AqOUj_y8TnXmmWiooXRoXzCdPl-fjGWtjElQEgoZ_aFq0MhOjCRvvd' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Tagline pill */}
        <View
          style={[
            styles.taglinePill,
            {
              backgroundColor: colors.surfaceGlass,
              borderRadius: 20,
              shadowColor: 'rgba(0,0,0,0.02)',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              borderWidth: 1,
            },
          ]}
        >
          <Wind size={16} color={colors.statusCritical} style={styles.pillIcon} />
          <Text style={[typography.labelCaps, { color: colors.primaryContainer, fontSize: 11, fontWeight: 'bold' }]}>
            AI-POWERED VENTILATOR MONITORING
          </Text>
        </View>
      </Animated.View>

      {/* Loading dots at bottom */}
      <View style={styles.loaderDots}>
        <View style={[styles.dot, { backgroundColor: `${colors.primaryContainer}66` }]} />
        <View style={[styles.dot, { backgroundColor: `${colors.primaryContainer}B3` }]} />
        <View style={[styles.dot, { backgroundColor: colors.statusCritical }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  glassLogoCard: {
    width: 220,
    height: 220,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pillIcon: {
    marginRight: 8,
  },
  loaderDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

