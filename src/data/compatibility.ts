import { appSource, type Locale } from '../lib/site';

export const brands = {
  vivo: { zh: 'vivo', en: 'vivo' },
  huawei: { zh: '华为', en: 'Huawei' },
  honor: { zh: '荣耀', en: 'HONOR' },
  nicehck: { zh: '原道', en: 'NiceHCK' },
  redmi: { zh: '小米 / Redmi', en: 'Xiaomi / Redmi' },
  oppo: { zh: 'OPPO', en: 'OPPO' },
  edifier: { zh: '漫步者', en: 'Edifier' },
  rose: { zh: '弱水时砂', en: 'ROSESELSA' },
  sony: { zh: '索尼', en: 'Sony' },
  technics: { zh: 'Technics', en: 'Technics' },
} as const;

export type Evidence = 'hardware' | 'partial' | 'prototype';
type Capability = 'components' | 'verified' | 'offOnly' | 'candidate' | 'unknown';
type DeviceRecord = {
  brand: keyof typeof brands;
  model: string;
  aliases?: string[];
  watch: string | null;
  battery: Capability;
  noise: Capability;
  transparency: Capability;
  evidence: Evidence;
  verifiedOn: string | null;
  source: string;
};

const readme = appSource + 'README.md';
const protocols = appSource + 'docs/protocol-validation.md';

// Dates and watch models stay null when the cited record has no device-level detail.
export const compatibility: DeviceRecord[] = [
  {
    brand: 'vivo', model: 'TWS Air3 Pro', watch: 'Galaxy Watch7',
    battery: 'components', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'sony', model: 'WF-1000XM5', watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'redmi', model: 'Redmi Buds 6', aliases: ['红米 Buds 6'], watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'oppo', model: 'Enco Air5 Pro', aliases: ['OPPO Enco Air5 Pro'], watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'oppo', model: 'Enco Free4', aliases: ['OPPO Enco Free4'], watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'honor', model: 'HONOR Earbuds X9', aliases: ['荣耀 Earbuds X9'], watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'huawei', model: 'FreeBuds 6i', watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'nicehck', model: 'OriG in', aliases: ['原点', '原道原点', 'Origin'], watch: null,
    battery: 'verified', noise: 'verified', transparency: 'verified',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'huawei', model: 'FreeBuds SE 4 ANC', watch: null,
    battery: 'verified', noise: 'verified', transparency: 'offOnly',
    evidence: 'hardware', verifiedOn: null, source: readme,
  },
  {
    brand: 'redmi', model: 'Redmi Buds 5', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'redmi', model: 'Redmi Buds 6 Lite', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'oppo', model: 'Enco Air3 Pro', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'edifier', model: 'FitBuds Turbo', watch: null,
    battery: 'candidate', noise: 'unknown', transparency: 'unknown',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'rose', model: 'CERAMICS-MK2', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'sony', model: 'WH-CH720N', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
  {
    brand: 'technics', model: 'EAH-AZ80', watch: null,
    battery: 'candidate', noise: 'candidate', transparency: 'candidate',
    evidence: 'prototype', verifiedOn: null, source: protocols,
  },
];

export const evidenceLabels: Record<Locale, Record<Evidence, string>> = {
  zh: { hardware: '有真机记录', partial: '部分验证', prototype: '协议候选' },
  en: { hardware: 'Hardware record', partial: 'Partial record', prototype: 'Protocol candidate' },
};

export const capabilityLabels: Record<Locale, Record<Capability, string>> = {
  zh: { components: '左右耳与盒', verified: '已验证', offOnly: '仅关闭有记录', candidate: '待真机确认', unknown: '未记录' },
  en: { components: 'L / R / case', verified: 'Verified', offOnly: 'Off mode recorded', candidate: 'Pending device test', unknown: 'Unrecorded' },
};
