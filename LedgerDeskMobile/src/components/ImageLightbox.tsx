import React, { useState } from 'react';
import {
  Dimensions, FlatList, Modal, Pressable, StatusBar,
  StyleSheet, Text, View,
} from 'react-native';
import {
  Gesture, GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';

type Props = {
  uris: string[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

export function ImageLightbox({ uris, initialIndex, visible, onClose }: Props) {
  const { colors } = useTheme();
  const { width, height } = Dimensions.get('window');
  const [page, setPage] = useState(initialIndex);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={[styles.root, { backgroundColor: '#000' }]}>
        <FlatList
          data={uris}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const p = Math.round(e.nativeEvent.contentOffset.x / width);
            setPage(p);
          }}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <ZoomableImage uri={item} width={width} height={height} />
          )}
        />

        <View style={[styles.topBar, { paddingTop: spacing.xxxl }]}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            {page + 1} / {uris.length}
          </Text>
          <Pressable onPress={onClose} hitSlop={16}>
            <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ZoomableImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const reset = () => {
    'worklet';
    scale.value = withSpring(1);
    savedScale.value = 1;
    tx.value = withSpring(0);
    savedTx.value = 0;
    ty.value = withSpring(0);
    savedTy.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(0.8, savedScale.value * e.scale);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        reset();
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    // Require finger to move before pan activates — otherwise static taps
    // get consumed as pan and the double-tap gesture never fires.
    .minDistance(8)
    .minPointers(1)
    .maxPointers(2)
    .onUpdate(e => {
      if (scale.value <= 1.05) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .maxDistance(10)
    .onStart((e) => {
      if (scale.value > 1.05) {
        reset();
      } else {
        // Zoom toward where the user tapped, not toward the image center.
        const cx = e.x - width / 2;
        const cy = e.y - height / 2;
        const target = 2.5;
        scale.value = withSpring(target);
        savedScale.value = target;
        // Offset so the tap point stays roughly under the finger after zoom.
        tx.value = withSpring(-cx * (target - 1));
        savedTx.value = -cx * (target - 1);
        ty.value = withSpring(-cy * (target - 1));
        savedTy.value = -cy * (target - 1);
      }
    });

  const composed = Gesture.Simultaneous(pinch, Gesture.Exclusive(doubleTap, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.Image
          source={{ uri }}
          resizeMode="contain"
          style={[{ width, height }, animStyle]}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
