# Jungle Roma

Одностраничный каталог Jungle Roma на Vite, React и Tailwind CSS.

## Запуск

```bash
pnpm install
pnpm dev
```

По умолчанию сайт доступен на `http://localhost:3001/`.

## Проверка сборки

```bash
pnpm build
```

## Docker

Локальная проверка production-сборки:

```bash
docker compose up -d --build
docker compose logs -f jungle-roma
```

По умолчанию compose пробрасывает приложение на `127.0.0.1:43187`.

## VPS deploy

Подробная инструкция для `jungle-roma.com`, Docker, Nginx, SSL и Git-деплоя лежит здесь:

```text
deploy/DEPLOY.md
```

## Telegram Mini App bot

1. Создайте бота через `@BotFather` и скопируйте token.
2. Скопируйте `.env.example` в `.env` и заполните:

```bash
TELEGRAM_BOT_TOKEN=token_from_botfather
TELEGRAM_WEBAPP_URL=https://jungle-roma.com
TELEGRAM_BOT_ENABLED=true
```

`TELEGRAM_WEBAPP_URL` должен быть публичным HTTPS-адресом сайта. Бот отправляет кнопку типа `web_app`, поэтому URL не показывается пользователю в сообщении.

Запуск:

```bash
pnpm dev
```

Для кнопки Mini App в профиле бота настройте Main Mini App в `@BotFather`. Сервер также автоматически настраивает menu button через Bot API.

## Broadcast Telegram

Пользователь попадает в список рассылки после сообщения боту или команды `/start`.

В админке:

- `Broadcast` отправляет ручное сообщение всем активным iscritti Telegram.
- При создании нового продукта можно включить `Invia broadcast Telegram dopo il salvataggio`.
- Уведомление о продукте открывает Mini App сразу на карточке товара.

## Telegram admin login

В личном чате с ботом напишите:

```text
Tropico6
```

Бот попросит пароль админки из `.env` (`ADMIN_PASSWORD`). Если пароль правильный, бот отправит кнопку `Apri pannello admin`; она открывает `/admin` уже с активной сессией. Token одноразовый и живёт 5 минут.
