const TELEGRAM_API_ROOT = "https://api.telegram.org/bot";
const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function env(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function isBotEnabled() {
  return !DISABLED_VALUES.has(env("TELEGRAM_BOT_ENABLED", "true").toLowerCase());
}

function resolveWebAppUrl() {
  const rawUrl = env("TELEGRAM_WEBAPP_URL") || env("PUBLIC_APP_URL") || env("APP_URL");
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const isLocalUrl = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !isLocalUrl) {
      console.warn("Telegram bot disabled: TELEGRAM_WEBAPP_URL must be HTTPS.");
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    console.warn("Telegram bot disabled: TELEGRAM_WEBAPP_URL is not a valid URL.");
    return "";
  }
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
  await telegramApi(token, "sendMessage", {
    chat_id: chatId,
    text: welcomeText,
    disable_web_page_preview: true,
    reply_markup: miniAppKeyboard(webAppUrl, buttonText),
  });
}

async function handleUpdate(token, update, webAppUrl, buttonText, welcomeText) {
  const message = update.message;
  if (!message?.chat?.id) return;

  const chatType = message.chat.type;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const command = text.split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  const isKnownCommand = command === "/start" || command === "/app" || command === "/menu";

  if (message.web_app_data) {
    await telegramApi(token, "sendMessage", {
      chat_id: message.chat.id,
      text: "Ricevuto.",
    });
    return;
  }

  if (chatType === "private" || isKnownCommand) {
    await sendMiniAppInvite(token, message.chat.id, webAppUrl, buttonText, welcomeText);
  }
}

export function startTelegramBot() {
  if (!isBotEnabled()) {
    console.log("Telegram bot disabled by TELEGRAM_BOT_ENABLED.");
    return null;
  }

  const token = env("TELEGRAM_BOT_TOKEN");
  if (!token) {
    console.log("Telegram bot disabled: TELEGRAM_BOT_TOKEN is not set.");
    return null;
  }

  const webAppUrl = resolveWebAppUrl();
  if (!webAppUrl) {
    console.log("Telegram bot disabled: set TELEGRAM_WEBAPP_URL to the public app URL.");
    return null;
  }

  const buttonText = env("TELEGRAM_MINI_APP_BUTTON_TEXT", "Apri Jungle Roma");
  const welcomeText = env("TELEGRAM_BOT_WELCOME_TEXT", "Apri Jungle Roma dentro Telegram.");
  let stopped = false;
  let offset = 0;

  async function pollingLoop() {
    while (!stopped) {
      try {
        const updates = await telegramApi(token, "getUpdates", {
          offset,
          timeout: 25,
          allowed_updates: ["message"],
        });

        for (const update of updates || []) {
          offset = update.update_id + 1;
          await handleUpdate(token, update, webAppUrl, buttonText, welcomeText);
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
      await configureBot(token, webAppUrl, buttonText);
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
