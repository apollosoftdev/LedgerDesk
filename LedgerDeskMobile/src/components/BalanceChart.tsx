import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../theme/tokens';
import { formatBalance } from '../services/currency';

type Point = { date: string; balance: number };

type Props = {
  data: Point[];
  width: number;
  height?: number;
};

/**
 * Smooth line chart (Cardinal spline) with a soft gradient fill underneath.
 * Pure react-native-svg, no extra dependencies.
 */
export function BalanceChart({ data, width, height = 180 }: Props) {
  const { colors } = useTheme();
  const padding = { top: 16, right: 16, bottom: 24, left: 12 };

  const paths = useMemo(() => {
    if (data.length < 2) return null;

    const values = data.map(d => d.balance);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xStep = chartW / (data.length - 1);
    const points = data.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + chartH - ((d.balance - min) / range) * chartH,
    }));

    // Cardinal spline → smooth Bezier path
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

    // Fill area: close path down to the baseline (y at balance = 0 or min)
    const baselineY = padding.top + chartH - ((0 - min) / range) * chartH;
    const clampedBaseline = Math.max(padding.top, Math.min(padding.top + chartH, baselineY));
    const area = `${line} L${points[points.length - 1].x},${clampedBaseline} L${points[0].x},${clampedBaseline} Z`;

    return { line, area, points, min, max, baselineY: clampedBaseline, chartW, chartH };
  }, [data, width, height]);

  if (!paths || data.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.surface, height }]}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          Not enough data yet — add a few records to see the trend.
        </Text>
      </View>
    );
  }

  const first = data[0];
  const last = data[data.length - 1];

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Baseline (zero line) */}
        <Path
          d={`M${padding.left},${paths.baselineY} L${width - padding.right},${paths.baselineY}`}
          stroke={colors.divider}
          strokeWidth={1}
          strokeDasharray="3,4"
        />

        {/* Fill area */}
        <Path d={paths.area} fill="url(#fill)" />

        {/* Line */}
        <Path
          d={paths.line}
          stroke={colors.primary}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* X-axis labels (first + last date) */}
      <View style={styles.xLabels}>
        <Text style={[styles.xLabelText, { color: colors.textDim }]}>{short(first.date)}</Text>
        <Text style={[styles.xLabelText, { color: colors.textDim }]}>{short(last.date)}</Text>
      </View>

      {/* Overlay stats */}
      <View style={styles.stats}>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Low</Text>
        <Text style={[styles.statVal, { color: colors.text }]}>{formatBalance(paths.min)}</Text>
        <View style={{ width: 16 }} />
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>High</Text>
        <Text style={[styles.statVal, { color: colors.text }]}>{formatBalance(paths.max)}</Text>
      </View>
    </View>
  );
}

function short(iso: string): string {
  // "2026-04-22" → "Apr 22"
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  xLabels: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  stats: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginRight: 4,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
