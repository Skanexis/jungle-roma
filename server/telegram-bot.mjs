const TELEGRAM_API_ROOT = "https://api.telegram.org/bot";
const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);
const BROADCAST_DELAY_MS = 45;
const ADMIN_ACCESS_TRIGGER = "tropico6";
const ADMIN_PASSWORD_WAIT_MS = 1000 * 60 * 3;
const CHAT_INACTIVITY_DELETE_MS = 1000 * 60 * 3;
const BROADCAST_DELETE_MS = 1000 * 60 * 60 * 36;
const START_INFO_CALLBACK = "jr_start_info";
const START_INFO_TEXT = [
  "SHIP🇮🇹",
  "Stealth",
  "Reship 100% T.O.S.",
  "Spedizioni giorno dopo al pagamento",
  "Possibilità ship Refrigerata o con Gps",
  "",
  "MEET UP ROMA📌",
  "Lunedi-Sabato",
  "15:00-20:00",
  "Verifica Obbligatoria",
  "Possibilità orari extra su richiesta",
  "",
  "DELIVERY ROMA🛵",
  "Lunedi-Sabato",
  "15:00-20:00",
  "Verifica Obbligatoria",
  "Possibilità orari extra su richiesta",
].join("\n");
const chatCleanupState = new Map();
const broadcastDeleteTimers = new Map();
const botProfilePhotoCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function isBotEnabled() {
  return !DISABLED_VALUES.has(env("TELEGRAM_BOT_ENABLED", "true").toLowerCase());
}

function resolveWebAppUrl({ logWarnings = true } = {}) {
  const rawUrl = env("TELEGRAM_WEBAPP_URL") || env("PUBLIC_APP_URL") || env("APP_URL");
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const isLocalUrl = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !isLocalUrl) {
      if (logWarnings) console.warn("Telegram bot disabled: TELEGRAM_WEBAPP_URL must be HTTPS.");
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    if (logWarnings) console.warn("Telegram bot disabled: TELEGRAM_WEBAPP_URL is not a valid URL.");
    return "";
  }
}

function getTelegramConfig() {
  const token = env("TELEGRAM_BOT_TOKEN");
  const webAppUrl = resolveWebAppUrl({ logWarnings: false });

  return {
    token,
    webAppUrl,
    buttonText: env("TELEGRAM_MINI_APP_BUTTON_TEXT", "Mini App"),
    contactUrl: env("TELEGRAM_CONTACT_URL"),
    welcomeText: env("TELEGRAM_BOT_WELCOME_TEXT", "Apri Jungle Roma dentro Telegram."),
  };
}

function validTelegramUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildProductWebAppUrl(webAppUrl, productId) {
  const url = new URL(webAppUrl);
  url.searchParams.set("section", "catalog");
  url.searchParams.set("product", productId);
  return url.toString();
}

async function telegramApi(token, method, payload = {}) {
  const response = await fetch(`${TELEGRAM_API_ROOT}${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Telegram normally returns JSON, but keep the error useful if it does not.
  }

  if (!response.ok || body?.ok === false) {
    const description = body?.description || response.statusText || "Telegram API error";
    throw new Error(`${method}: ${description}`);
  }

  return body?.result;
}

function cleanupStateKey(chatId) {
  return String(chatId || "");
}

function largestPhotoSize(photoSizes = []) {
  return [...photoSizes]
    .filter((photo) => photo?.file_id)
    .sort((left, right) => {
      const leftScore = Number(left.file_size) || Number(left.width) * Number(left.height) || 0;
      const rightScore = Number(right.file_size) || Number(right.width) * Number(right.height) || 0;
      return rightScore - leftScore;
    })[0] || null;
}

async function getBotProfilePhotoFileId(token) {
  if (botProfilePhotoCache.has(token)) {
    return botProfilePhotoCache.get(token);
  }

  try {
    const bot = await telegramApi(token, "getMe");
    const photos = await telegramApi(token, "getUserProfilePhotos", {
      user_id: bot.id,
      limit: 1,
    });
    const fileId = largestPhotoSize(photos?.photos?.[0])?.file_id || "";
    botProfilePhotoCache.set(token, fileId);
    return fileId;
  } catch (error) {
    console.warn(`Telegram bot profile photo lookup failed: ${error.message}`);
    botProfilePhotoCache.set(token, "");
    return "";
  }
}

function getChatCleanupState(token, chatId) {
  const key = cleanupStateKey(chatId);
  if (!key) return null;

  const existing = chatCleanupState.get(key);
  if (existing) {
    existing.token = token || existing.token;
    return existing;
  }

  const next = {
    token,
    chatId: key,
    lastActivityAt: Date.now(),
    messageId: null,
    timer: null,
  };
  chatCleanupState.set(key, next);
  return next;
}

async function deleteTrackedBotMessages(state) {
  if (!state.messageId) return;
  const messageId = state.messageId;
  state.messageId = null;
  await deleteTelegramMessage(state.token, state.chatId, messageId);
}

async function deleteTelegramMessage(token, chatId, messageId) {
  if (!chatId || !messageId) return;

  try {
    await telegramApi(token, "deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
  } catch {
    // The message may already be gone, too old, or not deletable in this chat.
  }
}

async function deleteIncomingPrivateMessage(token, message) {
  if (message?.chat?.type !== "private") return;
  await deleteTelegramMessage(token, message.chat.id, message.message_id);
}

function isMessageNotModifiedError(error) {
  return String(error?.message || "").toLowerCase().includes("message is not modified");
}

function editPayloadFromSendPayload(payload, messageId) {
  const hasReplyMarkup = Object.prototype.hasOwnProperty.call(payload, "reply_markup");

  return {
    chat_id: payload.chat_id,
    message_id: messageId,
    text: payload.text,
    parse_mode: payload.parse_mode,
    disable_web_page_preview: payload.disable_web_page_preview,
    reply_markup: hasReplyMarkup ? payload.reply_markup : { inline_keyboard: [] },
  };
}

function scheduleChatCleanup(state) {
  if (!state) return;
  if (state.timer) clearTimeout(state.timer);

  state.timer = setTimeout(async () => {
    const currentState = chatCleanupState.get(state.chatId);
    if (!currentState) return;

    const inactiveFor = Date.now() - currentState.lastActivityAt;
    if (inactiveFor < CHAT_INACTIVITY_DELETE_MS) {
      scheduleChatCleanup(currentState);
      return;
    }

    await deleteTrackedBotMessages(currentState);
    if (currentState.timer) clearTimeout(currentState.timer);
    chatCleanupState.delete(currentState.chatId);
  }, CHAT_INACTIVITY_DELETE_MS + 250);
}

function markChatActivity(token, chatId) {
  const state = getChatCleanupState(token, chatId);
  if (!state) return;

  state.lastActivityAt = Date.now();
  scheduleChatCleanup(state);
}

function trackBotMessage(token, chatId, message) {
  if (!message?.message_id) return;

  const state = getChatCleanupState(token, chatId);
  if (!state) return;

  state.lastActivityAt = Date.now();
  state.messageId = message.message_id;
  scheduleChatCleanup(state);
}

async function sendTelegramMessage(token, payload) {
  const state = getChatCleanupState(token, payload.chat_id);
  if (state?.messageId) {
    try {
      const edited = await telegramApi(token, "editMessageText", editPayloadFromSendPayload(payload, state.messageId));
      state.lastActivityAt = Date.now();
      scheduleChatCleanup(state);
      return edited;
    } catch (error) {
      if (isMessageNotModifiedError(error)) {
        state.lastActivityAt = Date.now();
        scheduleChatCleanup(state);
        return null;
      }
      state.messageId = null;
    }
  }

  const message = await telegramApi(token, "sendMessage", payload);
  trackBotMessage(token, payload.chat_id, message);
  return message;
}

async function sendTelegramPhotoByFileId(token, payload, photoFileId) {
  const state = getChatCleanupState(token, payload.chat_id);
  if (state?.messageId) {
    await deleteTrackedBotMessages(state);
  }

  const message = await telegramApi(token, "sendPhoto", {
    ...payload,
    photo: photoFileId,
  });
  trackBotMessage(token, payload.chat_id, message);
  return message;
}

function broadcastDeleteKey(chatId, messageId) {
  return `${chatId}:${messageId}`;
}

async function deleteBroadcastMessage(token, record, options = {}) {
  await deleteTelegramMessage(token, record.chatId, record.messageId);
  await options.markBroadcastMessageDeleted?.(record);
}

export function scheduleBroadcastMessageDeletion(record, options = {}) {
  const config = getTelegramConfig();
  if (!config.token || !record?.chatId || !record?.messageId) return;

  const key = broadcastDeleteKey(record.chatId, record.messageId);
  const existingTimer = broadcastDeleteTimers.get(key);
  if (existingTimer) clearTimeout(existingTimer);

  const deleteAtMs = Number.isFinite(record.deleteAtMs)
    ? record.deleteAtMs
    : Date.parse(record.deleteAt || "");
  const delay = Math.max(0, (deleteAtMs || Date.now()) - Date.now());

  const timer = setTimeout(async () => {
    broadcastDeleteTimers.delete(key);
    await deleteBroadcastMessage(config.token, record, options);
  }, delay);

  broadcastDeleteTimers.set(key, timer);
}

async function sendBroadcastMessage(token, payload, options = {}) {
  const message = await telegramApi(token, "sendMessage", payload);

  if (message?.message_id) {
    const deleteAtMs = Date.now() + BROADCAST_DELETE_MS;
    const record = {
      chatId: String(payload.chat_id),
      messageId: message.message_id,
      createdAt: new Date().toISOString(),
      deleteAt: new Date(deleteAtMs).toISOString(),
      deleteAtMs,
    };
    await options.trackBroadcastMessage?.(record);
    scheduleBroadcastMessageDeletion(record, {
      markBroadcastMessageDeleted: options.markBroadcastMessageDeleted,
    });
  }

  return message;
}

function miniAppKeyboard(webAppUrl, buttonText) {
  return {
    inline_keyboard: [
      [
        {
          text: buttonText,
          web_app: { url: webAppUrl },
        },
      ],
    ],
  };
}

function startMenuKeyboard(webAppUrl, contactUrl) {
  const keyboard = [
    [
      {
        text: "ℹ️ Informazioni",
        callback_data: START_INFO_CALLBACK,
      },
      {
        text: "🔞 Contatto",
        url: validTelegramUrl(contactUrl) || webAppUrl,
      },
    ],
    [
      {
        text: "📱 Mini-App",
        web_app: { url: webAppUrl },
      },
    ],
  ];

  return { inline_keyboard: keyboard };
}

async function resolveContactUrl(options = {}, fallbackUrl = "") {
  const fromOptions = await options.getContactUrl?.();
  return validTelegramUrl(fromOptions) || validTelegramUrl(getTelegramConfig().contactUrl) || fallbackUrl;
}

function isForbiddenTelegramError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("bot was blocked")
    || message.includes("user is deactivated")
    || message.includes("chat not found")
    || message.includes("forbidden");
}

async function configureBot(token, webAppUrl, buttonText) {
  await telegramApi(token, "deleteWebhook", { drop_pending_updates: false });
  await telegramApi(token, "setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: buttonText,
      web_app: { url: webAppUrl },
    },
  });
  await telegramApi(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Open Jungle Roma" },
      { command: "app", description: "Open Mini App" },
    ],
  });
}

async function sendStartMenu(token, chatId, webAppUrl, contactUrl, welcomeText) {
  const replyMarkup = startMenuKeyboard(webAppUrl, contactUrl);
  const photoFileId = await getBotProfilePhotoFileId(token);

  try {
    if (!photoFileId) throw new Error("Bot profile photo is not set.");
    await sendTelegramPhotoByFileId(token, {
      chat_id: chatId,
      reply_markup: replyMarkup,
    }, photoFileId);
  } catch (error) {
    console.warn(`Telegram bot profile photo send failed: ${error.message}`);
    const state = getChatCleanupState(token, chatId);
    if (state) state.messageId = null;
    await sendTelegramMessage(token, {
      chat_id: chatId,
      text: welcomeText,
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    });
  }
}

async function answerCallbackQuery(token, callbackQueryId, payload = {}) {
  if (!callbackQueryId) return;
  await telegramApi(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...payload,
  });
}

async function showStartInfo(token, callbackQuery, webAppUrl, contactUrl) {
  const message = callbackQuery?.message;
  if (!message?.chat?.id || !message?.message_id) return;

  const replyMarkup = startMenuKeyboard(webAppUrl, contactUrl);
  try {
    await telegramApi(token, "editMessageCaption", {
      chat_id: message.chat.id,
      message_id: message.message_id,
      caption: START_INFO_TEXT,
      reply_markup: replyMarkup,
    });
    trackBotMessage(token, message.chat.id, message);
  } catch (error) {
    if (!isMessageNotModifiedError(error)) {
      await sendTelegramMessage(token, {
        chat_id: message.chat.id,
        text: START_INFO_TEXT,
        reply_markup: replyMarkup,
      });
    }
  }
}

async function sendAdminPasswordRequest(token, chatId) {
  await sendTelegramMessage(token, {
    chat_id: chatId,
    text: "Inserisci la password admin.",
  });
}

async function sendAdminLoginButton(token, chatId, adminUrl) {
  await sendTelegramMessage(token, {
    chat_id: chatId,
    text: "Password corretta. Apri il pannello admin.",
    disable_web_page_preview: true,
    reply_markup: miniAppKeyboard(adminUrl, "Apri pannello admin"),
  });
}

async function handleUpdate(token, update, webAppUrl, buttonText, welcomeText, options = {}) {
  if (update.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.message?.chat?.id;
    if (chatId) markChatActivity(token, chatId);

    if (callbackQuery.data === START_INFO_CALLBACK) {
      const contactUrl = await resolveContactUrl(options, webAppUrl);
      await answerCallbackQuery(token, callbackQuery.id);
      await showStartInfo(token, callbackQuery, webAppUrl, contactUrl);
      return;
    }

    await answerCallbackQuery(token, callbackQuery.id);
    return;
  }

  const message = update.message;
  if (!message?.chat?.id) return;
  markChatActivity(token, message.chat.id);
  await deleteIncomingPrivateMessage(token, message);

  if (message.chat.type === "private") {
    await options.upsertSubscriber?.({
      chatId: String(message.chat.id),
      firstName: message.from?.first_name || message.chat.first_name || "",
      lastName: message.from?.last_name || message.chat.last_name || "",
      username: message.from?.username || message.chat.username || "",
      languageCode: message.from?.language_code || "",
    });
  }

  const chatType = message.chat.type;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const chatId = String(message.chat.id);
  const command = text.split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  const isKnownCommand = command === "/start" || command === "/app" || command === "/menu";

  if (message.web_app_data) {
    await sendTelegramMessage(token, {
      chat_id: message.chat.id,
      text: "Ricevuto.",
    });
    return;
  }

  if (chatType === "private" && text.toLowerCase() === ADMIN_ACCESS_TRIGGER) {
    options.adminPasswordRequests?.set(chatId, Date.now() + ADMIN_PASSWORD_WAIT_MS);
    await sendAdminPasswordRequest(token, chatId);
    return;
  }

  const passwordRequestExpiresAt = options.adminPasswordRequests?.get(chatId);
  if (chatType === "private" && passwordRequestExpiresAt) {
    options.adminPasswordRequests.delete(chatId);

    if (passwordRequestExpiresAt <= Date.now()) {
      await sendTelegramMessage(token, {
        chat_id: chatId,
        text: "Richiesta scaduta. Scrivi di nuovo Tropico6.",
      });
      return;
    }

    if (!options.verifyAdminPassword?.(text)) {
      await sendTelegramMessage(token, {
        chat_id: chatId,
        text: "Password non corretta.",
      });
      return;
    }

    const adminUrl = options.createAdminLoginUrl?.({
      telegramChatId: chatId,
      telegramUsername: message.from?.username || message.chat.username || "",
    });

    if (!adminUrl) {
      await sendTelegramMessage(token, {
        chat_id: chatId,
        text: "Accesso admin non configurato.",
      });
      return;
    }

    await sendAdminLoginButton(token, chatId, adminUrl);
    return;
  }

  if (chatType === "private" || isKnownCommand) {
    const contactUrl = await resolveContactUrl(options, webAppUrl);
    await sendStartMenu(token, message.chat.id, webAppUrl, contactUrl, welcomeText);
  }
}

export async function sendTelegramBroadcast(subscribers, message, options = {}) {
  const config = getTelegramConfig();
  const result = {
    total: Array.isArray(subscribers) ? subscribers.length : 0,
    sent: 0,
    failed: 0,
    disabled: 0,
    skipped: 0,
  };

  if (!config.token || !config.webAppUrl) {
    const error = new Error("Bot Telegram non configurato.");
    error.status = 400;
    throw error;
  }

  const text = String(message || "").trim();
  if (!text) {
    const error = new Error("Il testo del broadcast è obbligatorio.");
    error.status = 400;
    throw error;
  }

  const buttonText = String(options.buttonText || config.buttonText || "Apri Mini App").trim();
  const buttonUrl = String(options.webAppUrl || config.webAppUrl);

  for (const subscriber of subscribers || []) {
    if (!subscriber?.chatId || subscriber.isActive === false) {
      result.skipped += 1;
      continue;
    }

    try {
      await sendBroadcastMessage(
        config.token,
        {
          chat_id: subscriber.chatId,
          text,
          parse_mode: options.parseMode || undefined,
          disable_web_page_preview: true,
          reply_markup: miniAppKeyboard(buttonUrl, buttonText),
        },
        options,
      );
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      if (isForbiddenTelegramError(error)) {
        result.disabled += 1;
        await options.disableSubscriber?.(subscriber.chatId);
      }
    }

    await sleep(BROADCAST_DELAY_MS);
  }

  return result;
}

export async function sendProductBroadcast(subscribers, product, options = {}) {
  const config = getTelegramConfig();
  if (!config.token || !config.webAppUrl) {
    const error = new Error("Bot Telegram non configurato.");
    error.status = 400;
    throw error;
  }

  const productUrl = buildProductWebAppUrl(config.webAppUrl, product.id);
  const categories = (product.categories?.length ? product.categories : [product.category]).filter(Boolean);
  const intro = [
    "🌿 <b>Nuovo prodotto disponibile</b>",
    "",
    `<b>${escapeHtml(product.name)}</b>`,
    product.shortDescription ? escapeHtml(product.shortDescription) : "",
    categories.length ? `Categoria: ${escapeHtml(categories.join(" / "))}` : "",
  ].filter((line) => line !== "").join("\n");

  return sendTelegramBroadcast(subscribers, intro, {
    ...options,
    webAppUrl: productUrl,
    buttonText: "Apri scheda prodotto",
    parseMode: "HTML",
  });
}

export function startTelegramBot(options = {}) {
  if (!isBotEnabled()) {
    console.log("Telegram bot disabled by TELEGRAM_BOT_ENABLED.");
    return null;
  }

  const config = getTelegramConfig();
  if (!config?.token) {
    console.log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set.");
    return null;
  }

  if (!config.webAppUrl) {
    console.log("Telegram bot disabled: set TELEGRAM_WEBAPP_URL to the public app URL.");
    return null;
  }

  let stopped = false;
  let offset = 0;
  const adminPasswordRequests = new Map();

  async function pollingLoop() {
    while (!stopped) {
      try {
        const updates = await telegramApi(config.token, "getUpdates", {
          offset,
          timeout: 25,
          allowed_updates: ["message", "callback_query"],
        });

        for (const update of updates || []) {
          offset = update.update_id + 1;
          await handleUpdate(
            config.token,
            update,
            config.webAppUrl,
            config.buttonText,
            config.welcomeText,
            { ...options, adminPasswordRequests },
          );
        }
      } catch (error) {
        if (!stopped) {
          console.error(`Telegram bot polling error: ${error.message}`);
          await sleep(3000);
        }
      }
    }
  }

  async function boot() {
    try {
      await configureBot(config.token, config.webAppUrl, config.buttonText);
      const pendingBroadcastMessages = await options.getPendingBroadcastMessages?.();
      for (const record of pendingBroadcastMessages || []) {
        scheduleBroadcastMessageDeletion(record, {
          markBroadcastMessageDeleted: options.markBroadcastMessageDeleted,
        });
      }
      console.log("Telegram bot is running in long polling mode.");
      await pollingLoop();
    } catch (error) {
      console.error(`Telegram bot startup error: ${error.message}`);
    }
  }

  void boot();

  return {
    stop() {
      stopped = true;
    },
  };
}
