import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { radius, shadow } from '../theme/tokens';
import { formatBalance } from '../services/currency';
import type { TrendGranularity, TrendPoint } from '../services/records';

type Props = {
  data: TrendPoint[];
  granularity: TrendGranularity;
  onGranularityChange: (g: TrendGranularity) => void;
  width: number;
  height?: number;
};

const RANGES: { key: TrendGranularity; label: string }[] = [
  { key: 'day',   label: 'D' },
  { key: 'week',  label: 'W' },
  { key: 'month', label: 'M' },
  { key: 'year',  label: 'Y' },
];

const PAD = { top: 28, right: 16, bottom: 26, left: 16 };

export function BalanceChart({ data, granularity, onGranularityChange, width, height = 210 }: Props) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const geom = useMemo(() => {
    if (data.length < 2) return null;

    const values = data.map(d => d.balance);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    const chartW = width - PAD.left - PAD.right;
    const chartH = height - PAD.top - PAD.bottom;

    const xStep = chartW / (data.length - 1);
    const points = data.map((d, i) => ({
      x: PAD.left + i * xStep,
      y: PAD.top + chartH - ((d.balance - min) / range) * chartH,
    }));

    // Cardinal spline → cubic Bezier
    const t = 0.2;
    let line = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) * t;
      const cp1y = p1.y + (p2.y - p0.y) * t;
      const cp2x = p2.x - (p3.x - p1.x) * t;
      const cp2y = p2.y - (p3.y - p1.y) * t;
      line += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const baselineY = PAD.top + chartH - ((0 - min) / range) * chartH;
    const clampedBaseline = Math.max(PAD.top, Math.min(PAD.top + chartH, baselineY));
    const area = `${line} L${points[points.length - 1].x},${clampedBaseline} L${points[0].x},${clampedBaseline} Z`;

    return { line, area, points, min, max, baselineY: clampedBaseline, chartW, chartH, xStep };
  }, [data, width, height]);

  const updateTouch = (fingerX: number) => {
    if (!geom) return;
    const idx = Math.round((fingerX - PAD.left) / geom.xStep);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setActiveIndex(clamped);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-12, 12])
    .onStart((e) => runOnJS(updateTouch)(e.x))
    .onUpdate((e) => runOnJS(updateTouch)(e.x))
    .onFinalize(() => runOnJS(setActiveIndex)(null));

  // 5 evenly-distributed axis label indices (0, ¼, ½, ¾, end).
  const axisIdx = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length <= 5) return data.map((_, i) => i);
    const n = data.length - 1;
    return [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n];
  }, [data]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, width, borderRadius: radius.lg },
        shadow.sm,
      ]}
    >
      {/* Header: range chips (left) + Low/High stats (right) */}
      <View style={styles.header}>
        <View style={[styles.rangeGroup, { backgroundColor: colors.surfaceAlt }]}>
          {RANGES.map(r => {
            const active = r.key === granularity;
            return (
              <Pressable
                key={r.key}
                onPress={() => onGranularityChange(r.key)}
                style={[
                  styles.rangeChip,
                  active && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={{
                  color: active ? colors.onPrimary : colors.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.6,
                }}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {geom ? (
          <View style={styles.stats}>
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}>Low</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{formatBalance(geom.min)}</Text>
            <View style={{ width: 10 }} />
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}>High</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{formatBalance(geom.max)}</Text>
          </View>
        ) : null}
      </View>

      {/* Chart body */}
      {!geom ? (
        <View style={[styles.empty, { height: height - 60 }]}>
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
            Not enough data in this range yet.
          </Text>
        </View>
      ) : (
        <GestureDetector gesture={pan}>
          <View style={{ position: 'relative' }} collapsable={false}>
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.primary} stopOpacity="0.28" />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {/* Baseline (zero) */}
              <Line
                x1={PAD.left} y1={geom.baselineY} x2={width - PAD.right} y2={geom.baselineY}
                stroke={colors.divider} strokeWidth={1} strokeDasharray="3,4"
              />

              {/* Fill */}
              <Path d={geom.area} fill="url(#balFill)" />

              {/* Line */}
              <Path
                d={geom.line}
                stroke={colors.primary}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Touch indicator */}
              {activeIndex !== null && geom.points[activeIndex] ? (
                <>
                  <Line
                    x1={geom.points[activeIndex].x}
                    y1={PAD.top - 8}
                    x2={geom.points[activeIndex].x}
                    y2={height - PAD.bottom}
                    stroke={colors.textDim}
                    strokeWidth={1}
                  />
                  <Circle
                    cx={geom.points[activeIndex].x}
                    cy={geom.points[activeIndex].y}
                    r={8}
                    fill={colors.primary}
                    fillOpacity={0.22}
                  />
                  <Circle
                    cx={geom.points[activeIndex].x}
                    cy={geom.points[activeIndex].y}
                    r={4}
                    fill={colors.primary}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </>
              ) : null}
            </Svg>

            {/* Floating tooltip */}
            {activeIndex !== null && geom.points[activeIndex] ? (
              <View
                style={[
                  styles.tooltip,
                  {
                    backgroundColor: colors.surfaceAlt,
                    left: geom.points[activeIndex].x,
                    top: geom.points[activeIndex].y - 8,
                  },
                  shadow.md,
                ]}
                pointerEvents="none"
              >
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '500' }}>
                  {data[activeIndex].tooltip}
                </Text>
                <Text style={{
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}>
                  {formatBalance(data[activeIndex].balance)}
                </Text>
              </View>
            ) : null}
          </View>
        </GestureDetector>
      )}

      {/* X-axis labels */}
      {geom ? (
        <View style={styles.xLabels}>
          {axisIdx.map(i => (
            <Text key={i} style={[styles.xLabel, { color: colors.textDim }]}>
              {data[i].label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    paddingBottom: 10,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  rangeGroup: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 2,
  },
  rangeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    height: 24,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginLeft: 3,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    transform: [
      { translateX: '-50%' as any },
      { translateY: '-100%' as any },
    ],
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  xLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
