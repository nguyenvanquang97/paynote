import React, {useEffect, useRef} from 'react';
import {Animated, Easing, ImageBackground, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../shared/theme';

const SplashScreen: React.FC = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [progress, shimmer]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 300],
  });

  return (
    <ImageBackground
      source={require('../../assets/images/splash-main.png')}
      resizeMode="cover"
      style={styles.container}>
      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {width: widthInterpolate}]}>
            <Animated.View
              style={[
                styles.shimmer,
                {transform: [{translateX: shimmerTranslateX}]},
              ]}
            />
            <View style={styles.stripes}>
              {Array.from({length: 12}).map((_, i) => (
                <View key={i} style={styles.stripe} />
              ))}
            </View>
          </Animated.View>
        </View>
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
    height: 30,
    borderRadius: 999,
    backgroundColor: '#fff9dd',
    borderWidth: 1,
    borderColor: '#f3e7a5',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    height: 22,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 140,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{skewX: '-20deg'}],
  },
  stripes: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    gap: 8,
  },
  stripe: {
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{skewX: '-24deg'}],
  },
  loadingText: {
    marginTop: 18,
    fontSize: 34,
    fontWeight: '600',
    color: theme.colors.primaryDeep,
  },
});

export default SplashScreen;
