import {getRequestConfig} from 'next-intl/server';

// 支持的语言
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  // 如果locale无效，使用默认的中文
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'zh';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
