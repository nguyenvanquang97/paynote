import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from 'react-native';

// SplashScreen render trước khi store/theme load xong → hardcode màu primary
const SPLASH_PRIMARY = '#62d84e';

const SplashScreen: React.FC = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      setPercent(Math.min(100, Math.floor(value * 100)));
    });

    // Main progress animation
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start(() => setPercent(100));

    // Shimmer effect animation - running once as requested (no loop)
    Animated.timing(shimmer, {
      toValue: 1,
      duration: 2200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    return () => {
      progress.removeListener(listenerId);
    };
  }, [progress, shimmer]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 400],
  });

  return (
    <ImageBackground
      source={require('../../assets/images/splash-main.png')}
      resizeMode="cover"
      style={styles.container}>
      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterpolate }]}>
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslateX }] },
              ]}
            />
            <View style={styles.stripes}>
              {Array.from({ length: 12 }).map((_, i) => (
                <View key={i} style={styles.stripe} />
              ))}
            </View>
          </Animated.View>
        </View>
        <Text style={styles.loadingText}>{percent}%</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottom: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 118,
  },
  progressTrack: {
    width: '88%',
    height: 14,
    borderRadius: 999,
    backgroundColor: '#fff9dd',
    borderWidth: 1,
    borderColor: '#f3e7a5',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: 10,
    marginHorizontal: 2,
    borderRadius: 999,
    backgroundColor: SPLASH_PRIMARY,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 140,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ skewX: '-20deg' }],
  },
  stripes: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    gap: 12,
  },
  stripe: {
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ skewX: '-24deg' }],
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default SplashScreen;
