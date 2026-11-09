export const site = {
  name: 'WearEars',
  origin: 'https://wearears.com',
  appRepository: 'https://github.com/hdzw1155/WearEars',
  sourceRepository: 'https://github.com/hdzw1155/wearears-website',
  contactEmail: '',
};

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routes = {
  home: '',
  project: 'project',
  compatibility: 'compatibility',
  developers: 'developers',
  partners: 'partners',
  blog: 'blog',
  privacy: 'privacy',
} as const;
export type SitePage = keyof typeof routes;
export const pages = Object.keys(routes) as SitePage[];
export const navigation = ['project', 'compatibility', 'developers', 'partners', 'blog'] as const;

export const releasesUrl = site.appRepository + '/releases';
export const issuesUrl = site.appRepository + '/issues';
export const appRevision = 'da06a6b80bda8b7b303a25c65b2e9c845866200d';
export const appSource = site.appRepository + '/blob/' + appRevision + '/';

export function pagePath(locale: Locale, page: SitePage): string {
  const segments = [locale === 'en' ? 'en' : '', routes[page]].filter(Boolean);
  return segments.length ? '/' + segments.join('/') + '/' : '/';
}

export const siteCopy = {
  zh: {
    lang: 'zh-CN',
    title: 'WearEars · 声音，在腕上',
    description: 'WearEars 是面向 Wear OS 的开源耳机控制项目。查看耳机电量、切换声学模式，探索跨品牌适配。',
    menu: '打开导航',
    skip: '跳至主要内容',
    navigation: '主导航',
    footer: '页脚导航',
    language: 'Read in English',
    languageLabel: 'EN',
    tagline: '把耳机控制带到手腕上。',
    pages: {
      home: '首页',
      project: '项目',
      compatibility: '兼容性',
      developers: '开发者',
      partners: '合作',
      blog: '动态',
      privacy: '数据与隐私',
    },
    descriptions: {
      home: '在 Wear OS 手表上查看耳机电量、切换降噪与通透。查找你的耳机型号，了解 WearEars 的开源驱动。',
      project: '了解 WearEars 如何把耳机电量与声学控制带到 Wear OS 手表。',
      compatibility: '按品牌、型号和证据类型查询 WearEars 的设备记录及功能范围。',
      developers: '了解 WearEars 的 TwsClient 统一契约、驱动调度和协议验证方法。',
      partners: '探索 WearEars 面向耳机品牌、ODM 和穿戴设备团队的联合验证与技术合作方向。',
      blog: '查看 WearEars 的 GitHub 发布记录、项目更新和协议技术笔记。',
      privacy: '了解 WearEars 官网的兼容性查询和外部链接如何处理数据。',
    },
  },
  en: {
    lang: 'en',
    title: 'WearEars · Sound, on your wrist',
    description: 'WearEars brings earbud battery and listening controls to Wear OS through open-source device drivers.',
    menu: 'Open navigation',
    skip: 'Skip to content',
    navigation: 'Primary navigation',
    footer: 'Footer navigation',
    language: '阅读中文版',
    languageLabel: '中文',
    tagline: 'Earbud controls, brought to your wrist.',
    pages: {
      home: 'Home',
      project: 'Project',
      compatibility: 'Compatibility',
      developers: 'Developers',
      partners: 'Partners',
      blog: 'Journal',
      privacy: 'Data & privacy',
    },
    descriptions: {
      home: 'Check earbud battery and switch listening modes from Wear OS. Find your model and explore the open-source drivers.',
      project: 'See how WearEars brings earbud battery and listening controls to a Wear OS watch.',
      compatibility: 'Browse WearEars device records by brand, model and evidence. See which functions each record covers.',
      developers: 'Explore the WearEars TwsClient contract, driver selection and protocol verification workflow.',
      partners: 'Explore joint validation and engineering collaboration for audio brands, ODMs and wearable teams.',
      blog: 'Read WearEars GitHub releases, project updates and protocol notes.',
      privacy: 'Learn how the WearEars website handles compatibility searches and external links.',
    },
  },
} as const;
