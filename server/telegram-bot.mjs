const TELEGRAM_API_ROOT = "https://api.telegram.org/bot";
const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);
const BROADCAST_DELAY_MS = 45;
const ADMIN_ACCESS_TRIGGER = "tropico6";
const ADMIN_PASSWORD_WAIT_MS = 1000 * 60 * 3;
const CHAT_INACTIVITY_DELETE_MS = 1000 * 60 * 3;
const chatCleanupState = new Map();

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
    buttonText: env("TELEGRAM_MINI_APP_BUTTON_TEXT", "Apri Jungle Roma"),
    welcomeText: env("TELEGRAM_BOT_WELCOME_TEXT", "Apri Jungle Roma dentro Telegram."),
  };
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
    messageIds: new Set(),
    timer: null,
  };
  chatCleanupState.set(key, next);
  return next;
}

async function deleteTrackedBotMessages(state) {
  const messageIds = Array.from(state.messageIds);
  state.messageIds.clear();

  for (const messageId of messageIds) {
    await deleteTelegramMessage(state.token, state.chatId, messageId);
  }
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
  state.messageIds.add(message.message_id);
  scheduleChatCleanup(state);
}

async function sendTelegramMessage(token, payload) {
  const message = await telegramApi(token, "sendMessage", payload);
  trackBotMessage(token, payload.chat_id, message);
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

async function sendMiniAppInvite(token, chatId, webAppUrl, buttonText, welcomeText) {
  await sendTelegramMessage(token, {
    chat_id: chatId,
    text: welcomeText,
    disable_web_page_preview: true,
    reply_markup: miniAppKeyboard(webAppUrl, buttonText),
  });
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
    await sendMiniAppInvite(token, message.chat.id, webAppUrl, buttonText, welcomeText);
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
      await sendTelegramMessage(config.token, {
        chat_id: subscriber.chatId,
        text,
        parse_mode: options.parseMode || undefined,
        disable_web_page_preview: true,
        reply_markup: miniAppKeyboard(buttonUrl, buttonText),
      });
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
          allowed_updates: ["message"],
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
