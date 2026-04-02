import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../constants/theme';

interface BilingualTextProps {
  english: string;
  kinyarwanda: string;
  style?: object;
  englishStyle?: object;
  kinyarwandaStyle?: object;
  separator?: string;
  inline?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export const BilingualText: React.FC<BilingualTextProps> = ({
  english,
  kinyarwanda,
  style,
  englishStyle,
  kinyarwandaStyle,
  separator = ' / ',
  inline = true,
  primaryColor = '#1A1A1A',
  secondaryColor = '#5C5C5C',
}) => {
  if (inline) {
    return (
      <Text style={[styles.inline, style]}>
        <Text style={[styles.english, { color: primaryColor }, englishStyle]}>
          {english}
        </Text>
        <Text style={[styles.separator, { color: secondaryColor }]}>{separator}</Text>
        <Text style={[styles.kinyarwanda, { color: secondaryColor }, kinyarwandaStyle]}>
          {kinyarwanda}
        </Text>
      </Text>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.english, { color: primaryColor }, englishStyle]}>
        {english}
      </Text>
      <Text style={[styles.kinyarwanda, { color: secondaryColor }, kinyarwandaStyle]}>
        {kinyarwanda}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  inline: {
    flexWrap: 'wrap',
  },
  english: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  separator: {
    fontSize: Typography.sizes.md,
  },
  kinyarwanda: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
  },
});
