export interface PriceVariant {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  origin: string;
  effects: string[];
  images: string[];
  videos?: string[];
  videoUrl?: string;
  prices: PriceVariant[];
  category: string;
  categories?: string[];
  badge?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const TELEGRAM_USERNAME = "jungle_roma1";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;

export interface Category {
  id: string;
  name: string;
}

export type ContactIconType = "links" | "instagram" | "telegram" | "message" | "signal" | "user";

export interface ContactLink {
  id: string;
  title: string;
  detail: string;
  handle: string;
  href: string;
  type: ContactIconType;
  wide?: boolean;
}

export interface SiteSettings {
  telegramUsername: string;
  telegramUrl: string;
  orderUrl: string;
}

export interface BroadcastStats {
  subscriberCount: number;
  totalSubscriberCount?: number;
}

export interface SiteData {
  settings: SiteSettings;
  categories: Category[];
  contacts: ContactLink[];
  products: Product[];
  broadcast?: BroadcastStats;
}

export const products: Product[] = [
  {
    id: "dry",
    name: "DRY",
    shortDescription: "Posizione DRY",
    fullDescription: "Varianti disponibili e prezzi aggiornati sono indicati nella scheda prodotto.",
    origin: "Jungle Roma",
    effects: ["Dry"],
    images: [
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1553267574-277716d448fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    prices: [
      { label: "25g", price: 130 },
      { label: "50g", price: 200 },
      { label: "100g", price: 360 },
      { label: "500g", price: 1400 },
      { label: "1kg", price: 2550 },
    ],
    category: "Prodotti",
    categories: ["Prodotti"],
  },
  {
    id: "frozen",
    name: "FROZEN",
    shortDescription: "Posizione FROZEN",
    fullDescription: "Varianti disponibili e prezzi aggiornati sono indicati nella scheda prodotto.",
    origin: "Jungle Roma",
    effects: ["Frozen"],
    images: [
      "https://images.unsplash.com/photo-1527017895487-3ac53c0f03fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1529576123454-a12c036db670?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1521706862577-47b053587f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    prices: [
      { label: "25g", price: 180 },
      { label: "50g", price: 300 },
      { label: "100g", price: 550 },
      { label: "500g", price: 2450 },
      { label: "1kg", price: 4700 },
    ],
    category: "Prodotti",
    categories: ["Prodotti"],
  },
  {
    id: "cali-usa",
    name: "CALI USA",
    shortDescription: "Posizione CALI USA",
    fullDescription: "Varianti disponibili e prezzi aggiornati sono indicati nella scheda prodotto.",
    origin: "USA",
    effects: ["Cali", "USA"],
    images: [
      "https://images.unsplash.com/photo-1716816211590-c15a328a5ff0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1581600140682-d4e68c8cde32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    prices: [
      { label: "25g", price: 180 },
      { label: "50g", price: 290 },
      { label: "100g", price: 520 },
      { label: "500g", price: 2100 },
      { label: "1kg", price: 3900 },
    ],
    category: "Prodotti",
    categories: ["Prodotti"],
  },
];

export function getProductCategories(product: Product): string[] {
  const source = product.categories?.length ? product.categories : [product.category];
  return Array.from(new Set(source.filter(Boolean))).slice(0, 3);
}

export const categories: Category[] = [
  { id: "products", name: "Prodotti" },
];

export const contactLinks: ContactLink[] = [
  {
    id: "all-links",
    title: "TUTTI I LINK",
    detail: "Linktree ufficiale",
    handle: "linktr.ee/JungleRoma",
    href: "https://linktr.ee/JungleRoma",
    type: "links",
    wide: true,
  },
  {
    id: "instagram",
    title: "INSTAGRAM",
    detail: "Profilo ufficiale",
    handle: "@jungle__roma",
    href: "https://www.instagram.com/jungle__roma?igsh=MWlkM3ZxZHNlam40cg==",
    type: "instagram",
  },
  {
    id: "telegram-channel",
    title: "CANALE TELEGRAM",
    detail: "Aggiornamenti e menu",
    handle: "Canale ufficiale",
    href: "https://t.me/+T1jX_NTMhgQyZGQ0",
    type: "telegram",
  },
  {
    id: "telegram-contact",
    title: "CONTATTO TELEGRAM",
    detail: "Contatto diretto",
    handle: "@jungle_roma1",
    href: TELEGRAM_URL,
    type: "message",
  },
  {
    id: "signal-channel",
    title: "CANALE SIGNAL",
    detail: "Gruppo Signal",
    handle: "Canale riservato",
    href: "https://signal.group/#CjQKIAd7yvijy6XVhdu-3OYI9muCryMRdCU_KwWhzL1jK3aAEhBsMUkM_aVL8I2hlZdDBo0E",
    type: "signal",
  },
  {
    id: "signal-contact",
    title: "CONTATTO SIGNAL",
    detail: "Contatto diretto",
    handle: "Signal direct",
    href: "https://signal.me/#eu/Ii8e52mCfr2xDQlIwGwT533Dj9Hl9BsefdRt5gPFLYeGqHZg4EFD0rzQdBdlJ7_u",
    type: "user",
  },
];

export function getFallbackSiteData(): SiteData {
  return {
    settings: {
      telegramUsername: TELEGRAM_USERNAME,
      telegramUrl: TELEGRAM_URL,
      orderUrl: TELEGRAM_URL,
    },
    categories,
    contacts: contactLinks,
    products,
  };
}
