import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/components/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { BilingualText } from '../../src/components/BilingualText';
import { translations } from '../../src/constants/translations';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const settingsGroups = [
    {
      title: 'Appearance / Isura',
      items: [
        {
          icon: theme === 'dark' ? 'moon' : 'sunny',
          title: translations.theme.en,
          titleKin: translations.theme.kin,
          subtitle: theme === 'dark' ? 'Dark Mode / Umwijima' : 'Light Mode / Urumuri',
          type: 'toggle',
          value: theme === 'dark',
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: 'Information / Amakuru',
      items: [
        {
          icon: 'language',
          title: translations.language.en,
          titleKin: translations.language.kin,
          subtitle: 'English + Kinyarwanda',
          type: 'info',
        },
        {
          icon: 'information-circle',
          title: translations.about.en,
          titleKin: translations.about.kin,
          subtitle: 'Plant Doctor v1.0.0',
          type: 'info',
        },
      ],
    },
    {
      title: 'Support / Ubufasha',
      items: [
        {
          icon: 'help-circle',
          title: 'Help & FAQ',
          titleKin: 'Ubufasha n\'Ibibazo',
          subtitle: 'Get help with the app',
          type: 'link',
          onPress: () => {},
        },
        {
          icon: 'mail',
          title: 'Contact Us',
          titleKin: 'Twandikire',
          subtitle: 'Send us feedback',
          type: 'link',
          onPress: () => Linking.openURL('mailto:support@plantdoctor.app'),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <BilingualText
          english={translations.settings.en}
          kinyarwanda={translations.settings.kin}
          primaryColor={colors.text}
          secondaryColor={colors.textSecondary}
          englishStyle={styles.headerTitle}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Card */}
        <View style={[styles.appCard, { backgroundColor: colors.primary }]}>
          <View style={styles.appIconContainer}>
            <Ionicons name="leaf" size={40} color={colors.white} />
          </View>
          <Text style={[styles.appName, { color: colors.white }]}>Plant Doctor</Text>
          <Text style={[styles.appTagline, { color: colors.white + 'CC' }]}>
            Umuganga w'Ibihingwa
          </Text>
          <Text style={[styles.appDescription, { color: colors.white + '99' }]}>
            Helping farmers grow healthier crops
          </Text>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>
              {group.title}
            </Text>
            <View style={[styles.groupContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex < group.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={item.type === 'link' ? item.onPress : undefined}
                  disabled={item.type !== 'link'}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.itemContent}>
                    <BilingualText
                      english={item.title}
                      kinyarwanda={item.titleKin}
                      primaryColor={colors.text}
                      secondaryColor={colors.textSecondary}
                      englishStyle={styles.itemTitle}
                      inline={false}
                    />
                    <Text style={[styles.itemSubtitle, { color: colors.textTertiary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {item.type === 'toggle' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: colors.primary + '60' }}
                      thumbColor={item.value ? colors.primary : colors.textTertiary}
                    />
                  )}
                  {item.type === 'link' && (
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Language Notice */}
        <View style={[styles.languageNotice, { backgroundColor: colors.info + '10' }]}>
          <Ionicons name="globe" size={24} color={colors.info} />
          <View style={styles.languageContent}>
            <Text style={[styles.languageTitle, { color: colors.text }]}>
              Bilingual Support / Indimi Ebyiri
            </Text>
            <Text style={[styles.languageText, { color: colors.textSecondary }]}>
              All content is displayed in both English and Kinyarwanda to serve farmers better.
            </Text>
            <Text style={[styles.languageTextKin, { color: colors.textTertiary }]}>
              Ibintu byose bigaragara mu Cyongereza no mu Kinyarwanda kugira ngo dufashe abahinzi neza.
            </Text>
          </View>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  appCard: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  appTagline: {
    fontSize: Typography.sizes.md,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  appDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  groupContent: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  itemSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  languageNotice: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  languageContent: {
    flex: 1,
  },
  languageTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  languageText: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  languageTextKin: {
    fontSize: Typography.sizes.sm,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  version: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
});
