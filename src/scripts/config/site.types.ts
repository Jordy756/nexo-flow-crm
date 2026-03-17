export interface LinkItem {
  label: string;
  href: string;
}

export interface CtaItem extends LinkItem {}

export interface HeroStat {
  label: string;
  value: string;
}

export interface FeatureGroup {
  title: string;
  subtitle: string;
  items: string[];
}

export interface Segment {
  name: string;
  description: string;
  bullets: string[];
}

export interface Integration {
  name: string;
  description: string;
  tag: string;
}

export interface Kpi {
  label: string;
  value: string;
  trend: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SiteData {
  seo: {
    title: string;
    description: string;
  };
  brand: {
    name: string;
    tagline: string;
    description: string;
    primaryCta: CtaItem;
    secondaryCta: CtaItem;
  };
  nav: LinkItem[];
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    stats: HeroStat[];
    visualNotes: string[];
  };
  featureGroups: FeatureGroup[];
  segments: Segment[];
  integrations: Integration[];
  workflow: string[];
  kpis: Kpi[];
  faq: FaqItem[];
  cta: {
    title: string;
    description: string;
    primary: CtaItem;
    secondary: CtaItem;
  };
  footer: {
    legal: string;
    links: LinkItem[];
  };
}
