import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');

const images = [
  require('@/assets/images/partial-react-logo.png'),
  require('@/assets/images/react-logo.png'),
  require('@/assets/images/adaptive-icon.png'),
];

export function ImageCarousel() {
  const scrollX = useSharedValue(0);
  const currentIndex = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % images.length;
      scrollX.value = withTiming(currentIndex.current * width, { duration: 500 });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.carousel, animatedStyle]}>
        {images.map((image, index) => (
          <Image
            key={index}
            source={image}
            style={styles.image}
            contentFit="contain"
          />
        ))}
      </Animated.View>
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  currentIndex.current === index ? '#0A7EA4' : '#D0D0D0',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1000,
    width: '100%',
    overflow: 'hidden',
  },
  carousel: {
    flexDirection: 'row',
    height: 1000,
  },
  image: {
    width: width,
    height: 1000,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    width: '100%',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}); 