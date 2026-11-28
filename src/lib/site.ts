export const site = {
  name: 'WearEars',
  origin: 'https://wearears.com',
  directDownloadUrl: 'https://download.wearears.com',
  windowsDownloadUrl: 'https://github.com/hdzw1155/WearEars/releases/download/v0.5.0-exp-C/WearEars-0.5.0-exp-C-Windows.exe',
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
export const appRevision = '2bde754';
export const appSource = site.appRepository + '/blob/' + appRevision + '/';

export function pagePath(locale: Locale, page: SitePage): string {
  const segments = [locale === 'en' ? 'en' : '', routes[page]].filter(Boolean);
  return segments.length ? '/' + segments.join('/') + '/' : '/';
}

export const siteCopy = {
  zh: {
    lang: 'zh-CN',
    title: 'WearEars · 声音，在腕上与全端',
    description: 'WearEars是面向Wear OS 3+手表、Android 11+手机、智能眼镜HUD与Windows桌面的开源跨品牌耳机控制项目，纯本地蓝牙与局域网零云端。',
    menu: '打开导航',
    skip: '跳至主要内容',
    navigation: '主导航',
    footer: '页脚导航',
    language: 'Read in English',
    languageLabel: 'EN',
    tagline: '跨品牌耳机控制，覆盖手表、手机、眼镜HUD与Windows桌面。',
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
      home: '在Wear OS 3+手表、Android 11+手机、眼镜HUD与Windows托盘上统一查看耳机电量、切换降噪与音效，支持9大品牌驱动、局域网协同与本机空间音频。',
      project: '获取WearEars Android多端同包APK与Windows 22.5MB独立单文件托盘版，体验四套皮肤、局域网协同与听觉安全护栏。',
      compatibility: '按品牌、型号和证据类型查询WearEars的真机记录、协议候选与扩展能力边界。',
      developers: '了解WearEars的四层模块化结构、9大品牌驱动裁剪、局域网防火墙与Windows离线构建流程。',
      partners: '面向耳机品牌、ODM和穿戴设备团队的联合验证与技术合作方向。',
      blog: '查看WearEars的GitHub公开发布记录、v0.5.0-exp-C多端协同与Windows桌面端演进。',
      privacy: '了解WearEars应用的纯本地蓝牙零收集原则、官网数据处理说明与商标政策。',
    },
  },
  en: {
    lang: 'en',
    title: 'WearEars · Sound across every screen',
    description: 'WearEars brings cross-brand earbud battery, listening modes, local LAN mesh and binaural spatial audio to Wear OS 3+, Android 11+, AR/TV HUD and Windows.',
    menu: 'Open navigation',
    skip: 'Skip to content',
    navigation: 'Primary navigation',
    footer: 'Footer navigation',
    language: '阅读中文版',
    languageLabel: '中文',
    tagline: 'Cross-brand earbud control for watch, phone, AR HUD and Windows.',
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
      home: 'Manage cross-brand earbuds across Wear OS 3+, Android 11+, AR/TV HUD and Windows tray. Nine brand drivers, local LAN mesh and 48 kHz binaural spatial DSP.',
      project: 'Download the unified WearEars Android APK and standalone Windows tray executable with 4 themes, LAN firewall and hearing safety gates.',
      compatibility: 'Browse WearEars device records by brand, model and evidence, along with protocol extension boundaries.',
      developers: 'Explore WearEars modular codebase, 9 trimmable brand drivers, LAN firewall and offline Windows builds.',
      partners: 'Explore joint validation and engineering collaboration for audio brands, ODMs and wearable teams.',
      blog: 'Read WearEars GitHub releases, v0.5.0-exp-C multi-device mesh and Windows desktop engineering notes.',
      privacy: 'Learn about the app zero-data-collection guarantee, website handling and trademark policy.',
    },
  },
} as const;
