import cookieParser from "cookie-parser";
import express from "express";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import sharp from "sharp";
import { sendProductBroadcast, sendTelegramBroadcast, startTelegramBot } from "./telegram-bot.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
await loadEnvFile(path.join(rootDir, ".env"));
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "site.json");
const uploadRoot = path.join(rootDir, "public", "uploads");
const distDir = path.join(rootDir, "dist");

const PORT = Number(process.env.PORT || 3001);
const SESSION_COOKIE = "jr_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const ADMIN_LOGIN_TOKEN_TTL_MS = 1000 * 60 * 5;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "jungle-admin-2026";
const MAX_PRODUCT_IMAGE_SIZE = 1920;
const OPTIMIZABLE_IMAGE_MIME_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const UPLOAD_WEBP_OPTIONS = {
  quality: 92,
  alphaQuality: 100,
  effort: 5,
  smartSubsample: true,
};
const sessions = new Map();
const adminLoginTokens = new Map();

async function loadEnvFile(envFile) {
  let raw = "";

  try {
    raw = await fs.readFile(envFile, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Failed to read ${envFile}: ${error.message}`);
    }
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const entry = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = entry.slice(0, separatorIndex).trim();
    let value = entry.slice(separatorIndex + 1).trim();
    const quote = value[0];

    if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const EMPTY_DB = {
  settings: {
    telegramUsername: "jungle_roma1",
    telegramUrl: "https://t.me/jungle_roma1",
    orderUrl: "https://t.me/jungle_roma1",
  },
  categories: [{ id: "products", name: "Prodotti" }],
  contacts: [],
  products: [],
  telegramSubscribers: [],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 80 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image and video files are allowed."));
  },
});

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || crypto.randomBytes(4).toString("hex");
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanStringArray(value, limit = 20) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .slice(0, limit);
}

function cleanUniqueStringArray(value, limit = 20) {
  const seen = new Set();
  const result = [];

  for (const item of cleanStringArray(value, limit * 2)) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

function cleanBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function cleanPrices(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      label: cleanString(item?.label),
      price: Number(item?.price),
    }))
    .filter((item) => item.label && Number.isFinite(item.price) && item.price >= 0)
    .slice(0, 12);
}

function uniqueId(base, usedIds) {
  const root = slugify(base);
  let candidate = root;
  let index = 2;
  while (usedIds.has(candidate)) {
    candidate = `${root}-${index}`;
    index += 1;
  }
  return candidate;
}

function normalizeSettings(settings = {}) {
  const telegramUsername = cleanString(settings.telegramUsername, "jungle_roma1").replace(/^@/, "");
  const telegramUrl = cleanString(settings.telegramUrl) || `https://t.me/${telegramUsername}`;
  const orderUrl = cleanString(settings.orderUrl) || telegramUrl;

  return {
    telegramUsername,
    telegramUrl,
    orderUrl,
  };
}

function normalizeCategory(category = {}, usedIds = new Set()) {
  const name = cleanString(category.name);
  if (!name) return null;

  const rawId = cleanString(category.id) || name;
  const baseId = slugify(rawId);
  const id = usedIds.has(baseId) ? uniqueId(baseId, usedIds) : baseId;
  usedIds.add(id);

  return { id, name };
}

function normalizeContact(contact = {}, usedIds = new Set()) {
  const title = cleanString(contact.title);
  const href = cleanString(contact.href);
  if (!title || !href) return null;

  const rawId = cleanString(contact.id) || title;
  const baseId = slugify(rawId);
  const id = usedIds.has(baseId) ? uniqueId(baseId, usedIds) : baseId;
  usedIds.add(id);

  return {
    id,
    title,
    detail: cleanString(contact.detail),
    handle: cleanString(contact.handle),
    href,
    type: cleanString(contact.type, "links"),
    wide: cleanBoolean(contact.wide),
  };
}

function normalizeTelegramSubscriber(subscriber = {}) {
  const chatId = cleanString(subscriber.chatId);
  if (!chatId) return null;

  return {
    chatId,
    firstName: cleanString(subscriber.firstName),
    lastName: cleanString(subscriber.lastName),
    username: cleanString(subscriber.username).replace(/^@/, ""),
    languageCode: cleanString(subscriber.languageCode),
    isActive: subscriber.isActive === undefined ? true : cleanBoolean(subscriber.isActive),
    createdAt: cleanString(subscriber.createdAt, nowIso()),
    updatedAt: cleanString(subscriber.updatedAt, nowIso()),
  };
}

function normalizeProduct(product = {}, usedIds = new Set(), existing = null, options = {}) {
  const name = cleanString(product.name);
  if (!name) {
    const error = new Error("Product name is required.");
    error.status = 400;
    throw error;
  }

  const id = existing?.id || uniqueId(product.id || name, usedIds);
  usedIds.add(id);
  const videos = cleanStringArray(product.videos, 3);
  const explicitVideoUrl = cleanString(product.videoUrl);
  const categories = cleanUniqueStringArray(
    Array.isArray(product.categories) ? product.categories : [product.category],
    3,
  );
  const primaryCategory = categories[0] || cleanString(product.category, "Prodotti");

  return {
    id,
    name,
    shortDescription: cleanString(product.shortDescription),
    fullDescription: cleanString(product.fullDescription),
    origin: cleanString(product.origin, "Jungle Roma"),
    effects: cleanStringArray(product.effects, 12),
    images: cleanStringArray(product.images, 5),
    videos,
    videoUrl: explicitVideoUrl || videos[0] || "",
    prices: cleanPrices(product.prices),
    category: primaryCategory,
    categories: categories.length ? categories : [primaryCategory],
    badge: cleanString(product.badge),
    isActive: product.isActive === undefined ? true : cleanBoolean(product.isActive),
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: options.touch === false ? existing?.updatedAt || nowIso() : nowIso(),
  };
}

function normalizeDb(db) {
  const categoryIds = new Set();
  const contactIds = new Set();
  const productIds = new Set();

  const categories = (Array.isArray(db?.categories) ? db.categories : EMPTY_DB.categories)
    .map((category) => normalizeCategory(category, categoryIds))
    .filter(Boolean);

  return {
    settings: normalizeSettings(db?.settings || EMPTY_DB.settings),
    categories: categories.length ? categories : EMPTY_DB.categories,
    contacts: (Array.isArray(db?.contacts) ? db.contacts : [])
      .map((contact) => normalizeContact(contact, contactIds))
      .filter(Boolean),
    products: (Array.isArray(db?.products) ? db.products : [])
      .map((product) => normalizeProduct(product, productIds, product, { touch: false }))
      .filter(Boolean),
    telegramSubscribers: (Array.isArray(db?.telegramSubscribers) ? db.telegramSubscribers : [])
      .map(normalizeTelegramSubscriber)
      .filter(Boolean),
  };
}

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadRoot, { recursive: true });
  if (!fsSync.existsSync(dataFile)) {
    await fs.writeFile(dataFile, JSON.stringify(EMPTY_DB, null, 2));
  }
}

async function readDb() {
  await ensureStorage();
  const raw = await fs.readFile(dataFile, "utf8");
  return normalizeDb(JSON.parse(raw));
}

async function writeDb(db) {
  const normalized = normalizeDb(db);
  const tempFile = `${dataFile}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(normalized, null, 2));
  await fs.rename(tempFile, dataFile);
  return normalized;
}

function publicDb(db) {
  return {
    settings: db.settings,
    categories: db.categories,
    contacts: db.contacts,
    products: db.products.filter((product) => product.isActive),
  };
}

function activeTelegramSubscribers(db) {
  return (db.telegramSubscribers || []).filter((subscriber) => subscriber.isActive !== false);
}

function adminDb(db) {
  return {
    ...db,
    broadcast: {
      subscriberCount: activeTelegramSubscribers(db).length,
      totalSubscriberCount: db.telegramSubscribers.length,
    },
  };
}

async function upsertTelegramSubscriber(profile = {}) {
  const nextSubscriber = normalizeTelegramSubscriber({
    ...profile,
    isActive: true,
    updatedAt: nowIso(),
  });

  if (!nextSubscriber) return null;

  const db = await readDb();
  const index = db.telegramSubscribers.findIndex((subscriber) => subscriber.chatId === nextSubscriber.chatId);

  if (index === -1) {
    db.telegramSubscribers.push({
      ...nextSubscriber,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  } else {
    db.telegramSubscribers[index] = {
      ...db.telegramSubscribers[index],
      ...nextSubscriber,
      createdAt: db.telegramSubscribers[index].createdAt,
      updatedAt: nowIso(),
      isActive: true,
    };
  }

  const saved = await writeDb(db);
  return saved.telegramSubscribers.find((subscriber) => subscriber.chatId === nextSubscriber.chatId) || null;
}

async function disableTelegramSubscriber(chatId) {
  const cleanChatId = cleanString(chatId);
  if (!cleanChatId) return;

  const db = await readDb();
  const subscriber = db.telegramSubscribers.find((item) => item.chatId === cleanChatId);
  if (!subscriber) return;

  subscriber.isActive = false;
  subscriber.updatedAt = nowIso();
  await writeDb(db);
}

function sendNotFound(res, label = "Not found.") {
  res.status(404).json({ error: label });
}

function getSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  req.admin = session;
  next();
}

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isAdminPassword(value) {
  return timingSafeEqualString(value, ADMIN_PASSWORD);
}

function cleanupAdminLoginTokens() {
  const now = Date.now();
  for (const [token, record] of adminLoginTokens.entries()) {
    if (!record?.expiresAt || record.expiresAt <= now) {
      adminLoginTokens.delete(token);
    }
  }
}

function publicAppUrl() {
  const rawUrl = cleanString(process.env.PUBLIC_APP_URL)
    || cleanString(process.env.APP_URL)
    || cleanString(process.env.TELEGRAM_WEBAPP_URL)
    || `http://localhost:${PORT}`;

  try {
    const url = new URL(rawUrl);
    url.hash = "";
    return url;
  } catch {
    return new URL(`http://localhost:${PORT}`);
  }
}

function createAdminLoginUrl(meta = {}) {
  cleanupAdminLoginTokens();
  const token = crypto.randomBytes(32).toString("hex");
  adminLoginTokens.set(token, {
    username: ADMIN_USERNAME,
    telegramChatId: cleanString(meta.telegramChatId),
    telegramUsername: cleanString(meta.telegramUsername),
    createdAt: Date.now(),
    expiresAt: Date.now() + ADMIN_LOGIN_TOKEN_TTL_MS,
  });

  const url = publicAppUrl();
  url.pathname = "/admin";
  url.search = "";
  url.searchParams.set("adminLoginToken", token);
  return url.toString();
}

function redeemAdminLoginToken(token) {
  cleanupAdminLoginTokens();

  const cleanToken = cleanString(token);
  const record = adminLoginTokens.get(cleanToken);
  if (!record || record.expiresAt <= Date.now()) {
    adminLoginTokens.delete(cleanToken);
    return null;
  }

  adminLoginTokens.delete(cleanToken);
  return record;
}

function startAdminSession(res, username) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    username,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  setSessionCookie(res, token);
  return { user: { username } };
}

function safeUploadName(originalName, extensionOverride = null) {
  const originalExt = path.extname(originalName || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  const ext = extensionOverride || originalExt;
  const base = path.basename(originalName || "media", originalExt).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 48) || "media";
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${base}${ext}`;
}

function shouldOptimizeImage(file) {
  return OPTIMIZABLE_IMAGE_MIME_TYPES.has(file?.mimetype);
}

async function prepareUploadedImage(file) {
  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: MAX_PRODUCT_IMAGE_SIZE,
      height: MAX_PRODUCT_IMAGE_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp(UPLOAD_WEBP_OPTIONS)
    .toBuffer();

  return {
    buffer,
    filename: safeUploadName(file.originalname, ".webp"),
  };
}

function urlToUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return null;

  const relative = url.replace(/^\/uploads\//, "");
  const resolved = path.resolve(uploadRoot, relative);
  if (!resolved.startsWith(uploadRoot)) return null;
  return resolved;
}

async function saveUploadedFiles(productId, files, options = {}) {
  const productDir = path.join(uploadRoot, productId);
  await fs.mkdir(productDir, { recursive: true });

  const saved = [];
  for (const file of files) {
    const prepared = options.optimizeImages && shouldOptimizeImage(file)
      ? await prepareUploadedImage(file)
      : {
          buffer: file.buffer,
          filename: safeUploadName(file.originalname),
        };
    const filename = prepared.filename;
    const target = path.join(productDir, filename);
    await fs.writeFile(target, prepared.buffer);
    saved.push(`/uploads/${productId}/${filename}`);
  }

  return saved;
}

const app = express();
app.disable("x-powered-by");
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadRoot, { immutable: true, maxAge: "30d", fallthrough: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: nowIso() });
});

app.get("/api/public-data", async (_req, res) => {
  const db = await readDb();
  res.json(publicDb(db));
});

app.post("/api/auth/login", async (req, res) => {
  const username = cleanString(req.body?.username);
  const password = cleanString(req.body?.password);

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  res.json(startAdminSession(res, username));
});

app.post("/api/auth/telegram-admin-login", async (req, res) => {
  const record = redeemAdminLoginToken(req.body?.token);
  if (!record) {
    res.status(401).json({ error: "Token admin non valido o scaduto." });
    return;
  }

  res.json(startAdminSession(res, record.username));
});

app.get("/api/auth/me", (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  res.json({ user: { username: session.username } });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/admin/bootstrap", requireAuth, async (_req, res) => {
  const db = await readDb();
  res.json(adminDb(db));
});

app.put("/api/admin/settings", requireAuth, async (req, res) => {
  const db = await readDb();
  db.settings = normalizeSettings(req.body);
  const saved = await writeDb(db);
  res.json(saved.settings);
});

app.put("/api/admin/contacts", requireAuth, async (req, res) => {
  const db = await readDb();
  const usedIds = new Set();
  db.contacts = (Array.isArray(req.body?.contacts) ? req.body.contacts : [])
    .map((contact) => normalizeContact(contact, usedIds))
    .filter(Boolean);
  const saved = await writeDb(db);
  res.json(saved.contacts);
});

app.get("/api/admin/broadcast", requireAuth, async (_req, res) => {
  const db = await readDb();
  res.json(adminDb(db).broadcast);
});

app.post("/api/admin/broadcast", requireAuth, async (req, res) => {
  const message = cleanString(req.body?.message);
  const buttonText = cleanString(req.body?.buttonText, "Apri Mini App");

  if (!message) {
    res.status(400).json({ error: "Il testo del broadcast è obbligatorio." });
    return;
  }

  const db = await readDb();
  const result = await sendTelegramBroadcast(activeTelegramSubscribers(db), message, {
    buttonText,
    disableSubscriber: disableTelegramSubscriber,
  });

  const nextDb = await readDb();
  res.json({
    ...result,
    subscriberCount: activeTelegramSubscribers(nextDb).length,
  });
});

app.post("/api/admin/categories", requireAuth, async (req, res) => {
  const db = await readDb();
  const name = cleanString(req.body?.name);
  if (!name) {
    res.status(400).json({ error: "Category name is required." });
    return;
  }

  const usedIds = new Set(db.categories.map((category) => category.id));
  const category = normalizeCategory({ id: req.body?.id || name, name }, usedIds);
  db.categories.push(category);
  const saved = await writeDb(db);
  res.status(201).json(category ?? saved.categories.at(-1));
});

app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
  const db = await readDb();
  const category = db.categories.find((item) => item.id === req.params.id);
  if (!category) {
    sendNotFound(res, "Category not found.");
    return;
  }

  const nextName = cleanString(req.body?.name);
  if (!nextName) {
    res.status(400).json({ error: "Category name is required." });
    return;
  }

  const previousName = category.name;
  category.name = nextName;
  db.products = db.products.map((product) => (
    product.category === previousName || product.categories?.includes(previousName)
      ? {
          ...product,
          category: product.category === previousName ? nextName : product.category,
          categories: (product.categories || [product.category]).map((item) => (
            item === previousName ? nextName : item
          )),
          updatedAt: nowIso(),
        }
      : product
  ));

  const saved = await writeDb(db);
  res.json(saved.categories.find((item) => item.id === req.params.id));
});

app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
  const db = await readDb();
  const category = db.categories.find((item) => item.id === req.params.id);
  if (!category) {
    sendNotFound(res, "Category not found.");
    return;
  }

  const inUse = db.products.some((product) => (
    product.category === category.name || product.categories?.includes(category.name)
  ));
  if (inUse) {
    res.status(409).json({ error: "Category is used by products." });
    return;
  }

  db.categories = db.categories.filter((item) => item.id !== req.params.id);
  const saved = await writeDb(db);
  res.json(saved.categories);
});

app.get("/api/admin/products", requireAuth, async (_req, res) => {
  const db = await readDb();
  res.json(db.products);
});

app.post("/api/admin/products", requireAuth, async (req, res) => {
  const db = await readDb();
  const notifyTelegram = cleanBoolean(req.body?.notifyTelegram);
  const usedIds = new Set(db.products.map((product) => product.id));
  const product = normalizeProduct(req.body, usedIds);
  db.products.push(product);
  const saved = await writeDb(db);
  const savedProduct = saved.products.find((item) => item.id === product.id);
  let broadcast = null;
  let broadcastError = "";

  if (notifyTelegram && savedProduct?.isActive !== false) {
    try {
      broadcast = await sendProductBroadcast(activeTelegramSubscribers(saved), savedProduct, {
        disableSubscriber: disableTelegramSubscriber,
      });
    } catch (error) {
      broadcastError = error.message || "Broadcast non inviato.";
    }
  }

  res.status(201).json({ product: savedProduct, broadcast, broadcastError });
});

app.put("/api/admin/products/:id", requireAuth, async (req, res) => {
  const db = await readDb();
  const index = db.products.findIndex((product) => product.id === req.params.id);
  if (index === -1) {
    sendNotFound(res, "Product not found.");
    return;
  }

  const usedIds = new Set(db.products.map((product) => product.id));
  usedIds.delete(req.params.id);
  const product = normalizeProduct({ ...req.body, id: req.params.id }, usedIds, db.products[index]);
  db.products[index] = product;
  const saved = await writeDb(db);
  res.json(saved.products[index]);
});

app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
  const db = await readDb();
  const product = db.products.find((item) => item.id === req.params.id);
  if (!product) {
    sendNotFound(res, "Product not found.");
    return;
  }

  db.products = db.products.filter((item) => item.id !== req.params.id);
  const productUploadDir = path.join(uploadRoot, product.id);
  if (productUploadDir.startsWith(uploadRoot) && fsSync.existsSync(productUploadDir)) {
    await fs.rm(productUploadDir, { recursive: true, force: true });
  }
  const saved = await writeDb(db);
  res.json(saved.products);
});

app.post(
  "/api/admin/products/:id/media",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "videos", maxCount: 3 },
  ]),
  async (req, res) => {
    const db = await readDb();
    const product = db.products.find((item) => item.id === req.params.id);
    if (!product) {
      sendNotFound(res, "Product not found.");
      return;
    }

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    if (product.images.length + imageFiles.length > 5) {
      res.status(400).json({ error: "A product can have up to 5 photos." });
      return;
    }

    if (product.videos.length + videoFiles.length > 3) {
      res.status(400).json({ error: "A product can have up to 3 videos." });
      return;
    }

    const savedImages = await saveUploadedFiles(product.id, imageFiles, { optimizeImages: true });
    const savedVideos = await saveUploadedFiles(product.id, videoFiles);
    product.images = [...product.images, ...savedImages];
    product.videos = [...product.videos, ...savedVideos];
    product.videoUrl = product.videoUrl || product.videos[0] || "";
    product.updatedAt = nowIso();

    await writeDb(db);
    res.status(201).json(product);
  },
);

app.delete("/api/admin/products/:id/media", requireAuth, async (req, res) => {
  const db = await readDb();
  const product = db.products.find((item) => item.id === req.params.id);
  if (!product) {
    sendNotFound(res, "Product not found.");
    return;
  }

  const url = cleanString(req.body?.url);
  if (!url) {
    res.status(400).json({ error: "Media url is required." });
    return;
  }

  product.images = product.images.filter((item) => item !== url);
  product.videos = product.videos.filter((item) => item !== url);
  if (product.videoUrl === url) {
    product.videoUrl = product.videos[0] || "";
  }
  product.updatedAt = nowIso();

  const uploadPath = urlToUploadPath(url);
  if (uploadPath && fsSync.existsSync(uploadPath)) {
    await fs.rm(uploadPath, { force: true });
  }

  const saved = await writeDb(db);
  res.json(saved.products.find((item) => item.id === req.params.id));
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

app.use((err, _req, res, _next) => {
  const status = err.status || (err instanceof multer.MulterError ? 400 : 500);
  res.status(status).json({ error: err.message || "Server error." });
});

async function attachFrontend() {
  const serveDist = process.argv.includes("--serve-dist") || process.env.NODE_ENV === "production";

  if (serveDist) {
    app.use(
      "/assets",
      express.static(path.join(distDir, "assets"), {
        immutable: true,
        maxAge: "1y",
      }),
    );
    app.use(express.static(distDir, {
      setHeaders(res, filePath) {
        if (path.basename(filePath) === "index.html") {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }));
    app.use((req, res, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
    return "dist";
  }

  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root: rootDir,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  return "vite";
}

await ensureStorage();
const frontendMode = await attachFrontend();
app.listen(PORT, () => {
  console.log(`Jungle Roma server running at http://localhost:${PORT}`);
  console.log(`Frontend mode: ${frontendMode}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
  startTelegramBot({
    upsertSubscriber: upsertTelegramSubscriber,
    verifyAdminPassword: isAdminPassword,
    createAdminLoginUrl,
  });
});
