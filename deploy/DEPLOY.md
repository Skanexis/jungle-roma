# Deploy Jungle Roma на VPS

Домен: `jungle-roma.com`

Приложение внутри Docker слушает `3001`, наружу на VPS проброшено только на локальный адрес:

```text
127.0.0.1:43187 -> container:3001
```

Порт `43187` выбран специально, чтобы не пересекаться с типовыми портами других проектов. В firewall его открывать не нужно: Nginx будет проксировать запросы локально.

## 1. Подготовить DNS

В панели домена создайте записи:

```text
A     jungle-roma.com      VPS_IP
A     www                  VPS_IP
```

Если `www` не нужен, вторую запись можно не создавать, но тогда уберите `www.jungle-roma.com` из команд Certbot и Nginx-конфига.

Проверка после обновления DNS:

```bash
dig +short jungle-roma.com
dig +short www.jungle-roma.com
```

Обе команды должны вернуть IP вашего VPS.

## 2. Подготовить Git-репозиторий локально

Если репозитория еще нет:

```bash
git init
git add .
git commit -m "Initial Jungle Roma deploy setup"
git branch -M main
git remote add origin git@github.com:YOUR_USER/jungle-roma.git
git push -u origin main
```

Если репозиторий уже есть:

```bash
git status
git add Dockerfile docker-compose.yml .dockerignore .gitignore .env.example deploy README.md index.html src server
git commit -m "Add Docker and VPS deployment setup"
git push
```

Файл `.env` не коммитьте. Он уже добавлен в `.gitignore`.

## 3. Установить пакеты на VPS

Подключитесь к VPS:

```bash
ssh root@VPS_IP
```

Для Ubuntu/Debian:

```bash
apt update
apt install -y git nginx certbot curl ca-certificates
curl -fsSL https://get.docker.com | sh
docker compose version
```

Если деплоите не от `root`, добавьте пользователя в группу Docker и перелогиньтесь:

```bash
usermod -aG docker $USER
```

## 4. Склонировать проект на VPS

Рекомендуемый путь:

```bash
mkdir -p /opt
git clone git@github.com:YOUR_USER/jungle-roma.git /opt/jungle-roma
cd /opt/jungle-roma
```

Если используете HTTPS-репозиторий:

```bash
git clone https://github.com/YOUR_USER/jungle-roma.git /opt/jungle-roma
cd /opt/jungle-roma
```

## 5. Настроить `.env` на VPS

```bash
cp .env.example .env
nano .env
```

Минимально проверьте эти значения:

```bash
PORT=3001
HOST_BIND_IP=127.0.0.1
HOST_PORT=43187

PUBLIC_APP_URL=https://jungle-roma.com
APP_URL=https://jungle-roma.com

ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBAPP_URL=https://jungle-roma.com
TELEGRAM_MINI_APP_BUTTON_TEXT=Apri Jungle Roma
TELEGRAM_BOT_WELCOME_TEXT=Apri Jungle Roma dentro Telegram.
TELEGRAM_BOT_ENABLED=false
```

Обязательно замените:

```text
ADMIN_PASSWORD
TELEGRAM_BOT_TOKEN
```

Если запускаете Telegram-бота, вставьте реальный token и включите:

```bash
TELEGRAM_BOT_TOKEN=REAL_BOTFATHER_TOKEN
TELEGRAM_BOT_ENABLED=true
```

## 6. Запустить Docker

```bash
cd /opt/jungle-roma
docker compose up -d --build
docker compose ps
docker compose logs -f jungle-roma
```

Проверка health endpoint:

```bash
curl http://127.0.0.1:43187/api/health
```

Ожидаемый ответ:

```json
{"ok":true,"time":"..."}
```

## 7. Включить Nginx без SSL

Сначала нужен HTTP-конфиг, чтобы Certbot смог выпустить сертификат.

```bash
mkdir -p /var/www/certbot
cp /opt/jungle-roma/deploy/nginx/jungle-roma.com.http.conf /etc/nginx/sites-available/jungle-roma.com
ln -sfn /etc/nginx/sites-available/jungle-roma.com /etc/nginx/sites-enabled/jungle-roma.com
nginx -t
systemctl reload nginx
```

Проверка:

```bash
curl -I http://jungle-roma.com
```

Должен быть ответ от сайта через Nginx.

## 8. Выпустить SSL-сертификат

Если используете и основной домен, и `www`:

```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d jungle-roma.com \
  -d www.jungle-roma.com \
  --agree-tos \
  --no-eff-email \
  --email YOUR_EMAIL@example.com
```

Если `www` не настроен в DNS, используйте только:

```bash
certbot certonly --webroot \
  -w /var/www/certbot \
  -d jungle-roma.com \
  --agree-tos \
  --no-eff-email \
  --email YOUR_EMAIL@example.com
```

После успешного выпуска сертификата включите HTTPS-конфиг:

```bash
cp /opt/jungle-roma/deploy/nginx/jungle-roma.com.ssl.conf /etc/nginx/sites-available/jungle-roma.com
nginx -t
systemctl reload nginx
```

Проверка:

```bash
curl -I https://jungle-roma.com
```

## 9. Firewall

Открыты должны быть только SSH, HTTP и HTTPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

Порт `43187` открывать не нужно, потому что он слушает только `127.0.0.1`.

## 10. Telegram BotFather

В `@BotFather`:

1. Создайте бота или откройте существующего.
2. Получите token и вставьте в `.env` как `TELEGRAM_BOT_TOKEN`.
3. Настройте Main Mini App:

```text
Bot Settings -> Configure Mini App -> Main Mini App
URL: https://jungle-roma.com
```

Сервер при запуске сам настроит menu button через Bot API. В сообщении бота будет кнопка Mini App без видимой ссылки.

## 10.1 Broadcast Telegram

После включения бота пользователи автоматически попадают в список рассылки, когда пишут боту или используют `/start`.

В админке:

```text
/admin -> Broadcast
```

Там можно отправить ручной broadcast всем активным iscritti Telegram.

При создании нового продукта в разделе `Prodotti` доступна опция:

```text
Invia broadcast Telegram dopo il salvataggio
```

Если опция включена, бот отправит сообщение `Nuovo prodotto disponibile` с кнопкой `Apri scheda prodotto`. Кнопка открывает Mini App сразу на карточке созданного товара.

## 10.2 Вход в админку через бота

В личном чате с ботом напишите:

```text
Tropico6
```

Бот ответит:

```text
Inserisci la password admin.
```

Отправьте пароль из `.env`:

```bash
ADMIN_PASSWORD=...
```

Если пароль правильный, бот отправит кнопку:

```text
Apri pannello admin
```

Кнопка открывает `/admin` уже с активной сессией. Token одноразовый и живёт 5 минут.

В private chat бот сразу удаляет входящие сообщения пользователя, включая `/start`, `Tropico6` и пароль админки. Для обычных сценариев бот держит одно служебное сообщение в чате и редактирует его вместо отправки новых. Это сообщение удаляется после 3 минут без активности.

Broadcast-сообщения не участвуют в 3-минутной очистке. Они отправляются отдельными сообщениями и автоматически удаляются через 36 часов после отправки.

## 11. Обновление проекта после изменений

На локальной машине:

```bash
git add .
git commit -m "Describe change"
git push
```

На VPS:

```bash
cd /opt/jungle-roma
git pull --ff-only
docker compose up -d --build
docker compose ps
```

Если нужно посмотреть логи:

```bash
docker compose logs -f jungle-roma
```

## 12. Backup данных

Данные админки лежат в Docker volume `jungle-roma_jungle_roma_data`, загруженные файлы в `jungle-roma_jungle_roma_uploads`.

Бэкап:

```bash
mkdir -p /opt/backups/jungle-roma
docker run --rm \
  -v jungle-roma_jungle_roma_data:/data \
  -v /opt/backups/jungle-roma:/backup \
  alpine tar czf /backup/data-$(date +%F).tar.gz -C /data .

docker run --rm \
  -v jungle-roma_jungle_roma_uploads:/uploads \
  -v /opt/backups/jungle-roma:/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /uploads .
```

## 13. Если порт 43187 занят

Поменяйте порт в двух местах:

1. В `.env`:

```bash
HOST_PORT=NEW_PORT
```

2. В Nginx-конфигах:

```text
proxy_pass http://127.0.0.1:NEW_PORT;
```

Потом:

```bash
docker compose up -d
nginx -t
systemctl reload nginx
```

## 14. Если Docker пишет `"/public": not found`

Это означает, что на VPS старая версия `Dockerfile`, где пытались копировать пустую папку `public/`. Подтяните актуальный код и пересоберите:

```bash
cd /opt/jungle-roma
git pull --ff-only
docker compose up -d --build
```
