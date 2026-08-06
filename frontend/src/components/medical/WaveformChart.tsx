import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

interface WaveformChartProps {
  type: 'ecg' | 'spo2';
  color?: string;
}

export const WaveformChart: React.FC<WaveformChartProps> = ({
  type,
  color,
}) => {
  const { colors } = useTheme();
  const strokeColor = color || (type === 'ecg' ? colors.statusCritical : colors.primary);

  const [points, setPoints] = useState<number[]>([]);

  useEffect(() => {
    let frameId: number;
    let index = 0;

    const baseEcgPattern = [
      50, 50, 50, 50, 50, 45, 30, 90, 10, 70, 50, 50, 50, 50, 50, 50, 50, 50
    ];

    const baseSpo2Pattern = [
      70, 70, 68, 65, 55, 40, 50, 62, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70
    ];

    const pattern = type === 'ecg' ? baseEcgPattern : baseSpo2Pattern;
    const initialPoints = Array.from({ length: 40 }, () => 50);
    setPoints(initialPoints);

    const updateWaveform = () => {
      setPoints((prev) => {
        const nextPoints = [...prev.slice(1), pattern[index % pattern.length]];
        return nextPoints;
      });
      index++;
      frameId = requestAnimationFrame(updateWaveform);
    };

    // Slow down the updates slightly to make it readable
    const interval = setInterval(() => {
      frameId = requestAnimationFrame(updateWaveform);
    }, 80);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
    };
  }, [type]);

  const generatePath = () => {
    if (points.length === 0) return '';
    const width = Dimensions.get('window').width - 48; // Spacing adjustment
    const step = width / (points.length - 1);
    
    return points.reduce((path, val, idx) => {
      const x = idx * step;
      // Map pattern values to height ratio (0-100 container height)
      const y = val;
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  return (
    <View style={[styles.container, { borderColor: colors.outlineVariant + '33' }]}>
      <Svg style={styles.svg} height="80" width="100%">
        <Path
          d={generatePath()}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
