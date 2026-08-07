import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';

interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 120,
}) => {
  const { colors, typography } = useTheme();
  
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1000 });
  }, [score, progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getRiskColor = () => {
    if (score >= 75) return colors.statusCritical; // Red / Safety Orange
    if (score >= 50) return colors.secondaryContainer; // Yellow / Amber
    return colors.primary; // Stable Navy
  };

  const riskColor = getRiskColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.surfaceContainerHigh}
          strokeWidth={strokeWidth}
        />
        {/* Progress Arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={riskColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      
      {/* Center Text */}
      <View style={styles.textContainer}>
        <Text style={[typography.headlineLgMobile, { color: colors.onSurface, fontWeight: 'bold' }]}>
          {score}%
        </Text>
        <Text style={[typography.labelCaps, { color: colors.onSurfaceVariant, fontSize: 8 }]}>
          Risk Score
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
