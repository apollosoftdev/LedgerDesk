import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import { getSetting, setSetting } from '../services/settings';

export const SUPPORTED_LANGS = ['en', 'zh-CN'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

function detectDefault(): SupportedLang {
  const locales = Localization.getLocales();
  const primary = locales[0]?.languageTag?.toLowerCase() ?? 'en';
  if (primary.startsWith('zh')) return 'zh-CN';
  return 'en';
}

export async function initI18n() {
  const stored = await getSetting('language');
  const lang: SupportedLang = (SUPPORTED_LANGS as readonly string[]).includes(stored ?? '')
    ? (stored as SupportedLang)
    : detectDefault();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        'zh-CN': { translation: zhCN },
      },
      lng: lang,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
}

export async function changeLanguage(lang: SupportedLang) {
  await i18n.changeLanguage(lang);
  await setSetting('language', lang);
}

export default i18n;
