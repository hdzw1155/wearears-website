export const site = {
  name: 'WearEars',
  origin: 'https://wearears.com',
  directDownloadUrl: 'https://download.wearears.com',
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
export const appRevision = 'fefa5f22109460258092888880c063f2b7f85158';
export const appSource = site.appRepository + '/blob/' + appRevision + '/';

export function pagePath(locale: Locale, page: SitePage): string {
  const segments = [locale === 'en' ? 'en' : '', routes[page]].filter(Boolean);
  return segments.length ? '/' + segments.join('/') + '/' : '/';
}

export const siteCopy = {
  zh: {
    lang: 'zh-CN',
    title: 'WearEars · 声音，在腕上与掌间',
    description: 'WearEars是面向Wear OS 3+手表与Android 11+手机的开源耳机控制项目。支持跨品牌电量读取、声学模式切换、通用特性扩展与本机单端空间音频。',
    menu: '打开导航',
    skip: '跳至主要内容',
    navigation: '主导航',
    footer: '页脚导航',
    language: 'Read in English',
    languageLabel: 'EN',
    tagline: '把跨品牌耳机控制带到手表与手机。',
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
      home: '在Wear OS 3+手表和Android 11+手机上查看耳机电量、切换降噪与音效。支持9大品牌驱动、通用特性扩展与本机单端空间音频。',
      project: '了解WearEars如何用同一套安装包把跨品牌耳机电量、进阶声学控制与本机空间音频带到手表和手机。',
      compatibility: '按品牌、型号和证据类型查询WearEars的真机记录、协议候选与扩展能力边界。',
      developers: '了解WearEars的三层模块化目录结构、通用特性引擎、9大品牌驱动裁剪与Windows离线构建流程。',
      partners: '面向耳机品牌、ODM和穿戴设备团队的联合验证与技术合作方向。',
      blog: '查看WearEars的GitHub公开发布记录、v0.5.0-exp架构重构与底层交接文档。',
      privacy: '了解WearEars应用的纯本地蓝牙零收集原则、官网数据处理说明与商标政策。',
    },
  },
  en: {
    lang: 'en',
    title: 'WearEars · Sound, on wrist & phone',
    description: 'WearEars brings cross-brand earbud battery, listening modes, extensible features and local binaural spatial audio to Wear OS 3+ watches and Android 11+ phones.',
    menu: 'Open navigation',
    skip: 'Skip to content',
    navigation: 'Primary navigation',
    footer: 'Footer navigation',
    language: '阅读中文版',
    languageLabel: '中文',
    tagline: 'Cross-brand earbud controls for watch and phone.',
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
      home: 'Check earbud battery and switch ANC modes from Wear OS 3+ watches and Android 11+ phones. Nine brand drivers, extensible features and local spatial DSP.',
      project: 'See how WearEars delivers earbud battery, extended acoustic controls and local binaural spatial audio across watch and phone in one APK.',
      compatibility: 'Browse WearEars device records by brand, model and evidence, along with protocol extension boundaries.',
      developers: 'Explore the WearEars modular codebase, FeatureTransactions engine, 9 brand drivers and offline Windows build workflow.',
      partners: 'Explore joint validation and engineering collaboration for audio brands, ODMs and wearable teams.',
      blog: 'Read WearEars GitHub releases, the v0.5.0-exp modular refactor and architecture handoff notes.',
      privacy: 'Learn about the app zero-data-collection guarantee, website handling and trademark policy.',
    },
  },
} as const;
