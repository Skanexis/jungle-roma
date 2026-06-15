import type { BroadcastStats, Category, ContactLink, Product, SiteData, SiteSettings } from "../data/products";

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
  disabled: number;
  skipped: number;
  subscriberCount?: number;
}

export interface CreateProductResult {
  product: Product;
  broadcast: BroadcastResult | null;
  broadcastError?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : "Request failed.";
    throw new Error(message);
  }

  return payload as T;
}

async function jsonRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse<T>(response);
}

export async function fetchPublicData(): Promise<SiteData> {
  return jsonRequest<SiteData>("/api/public-data");
}

export async function loginAdmin(username: string, password: string) {
  return jsonRequest<{ user: { username: string } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function loginAdminWithTelegramToken(token: string) {
  return jsonRequest<{ user: { username: string } }>("/api/auth/telegram-admin-login", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function fetchAdminMe() {
  return jsonRequest<{ user: { username: string } }>("/api/auth/me");
}

export async function logoutAdmin() {
  return jsonRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export async function fetchAdminBootstrap(): Promise<SiteData> {
  return jsonRequest<SiteData>("/api/admin/bootstrap");
}

export async function saveAdminSettings(settings: SiteSettings): Promise<SiteSettings> {
  return jsonRequest<SiteSettings>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export async function saveAdminContacts(contacts: ContactLink[]): Promise<ContactLink[]> {
  return jsonRequest<ContactLink[]>("/api/admin/contacts", {
    method: "PUT",
    body: JSON.stringify({ contacts }),
  });
}

export async function createAdminCategory(name: string): Promise<Category> {
  return jsonRequest<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateAdminCategory(id: string, name: string): Promise<Category> {
  return jsonRequest<Category>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteAdminCategory(id: string): Promise<Category[]> {
  return jsonRequest<Category[]>(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createAdminProduct(product: Product, options: { notifyTelegram?: boolean } = {}): Promise<CreateProductResult> {
  return jsonRequest<CreateProductResult>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({ ...product, notifyTelegram: options.notifyTelegram === true }),
  });
}

export async function updateAdminProduct(product: Product): Promise<Product> {
  return jsonRequest<Product>(`/api/admin/products/${encodeURIComponent(product.id)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteAdminProduct(id: string): Promise<Product[]> {
  return jsonRequest<Product[]>(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function uploadAdminProductMedia(
  productId: string,
  images: File[],
  videos: File[],
): Promise<Product> {
  const formData = new FormData();
  images.forEach((file) => formData.append("images", file));
  videos.forEach((file) => formData.append("videos", file));

  const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/media`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  return parseResponse<Product>(response);
}

export async function deleteAdminProductMedia(productId: string, url: string): Promise<Product> {
  return jsonRequest<Product>(`/api/admin/products/${encodeURIComponent(productId)}/media`, {
    method: "DELETE",
    body: JSON.stringify({ url }),
  });
}

export async function fetchAdminBroadcastStats(): Promise<BroadcastStats> {
  return jsonRequest<BroadcastStats>("/api/admin/broadcast");
}

export async function sendAdminBroadcast(message: string, buttonText: string): Promise<BroadcastResult> {
  return jsonRequest<BroadcastResult>("/api/admin/broadcast", {
    method: "POST",
    body: JSON.stringify({ message, buttonText }),
  });
}
