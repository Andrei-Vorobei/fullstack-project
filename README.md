# Fullstack project

## Локальный запуск в режиме разработки

### Требования

- Node.js 24 и npm.
- PostgreSQL 14+ (локально или в Docker).
- Для входа через Яндекс — OAuth-приложение с callback URL `http://localhost:3000/oauth/yandex/callback`. Без реальных OAuth-учётных данных backend не сможет корректно инициализировать Yandex strategy.

### 1. Настроить PostgreSQL

Создайте локальную базу данных и пользователя, например `fullstack_db` и `fullstack_user`. Можно использовать уже установленный PostgreSQL или запустить его в Docker:

```bash
docker run --name fullstack-postgres-dev \
  -e POSTGRES_USER=fullstack_user \
  -e POSTGRES_PASSWORD=dev-password \
  -e POSTGRES_DB=fullstack_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Команда выше предназначена для Bash/Git Bash. В PowerShell её можно выполнить одной строкой:

```powershell
docker run --name fullstack-postgres-dev -e POSTGRES_USER=fullstack_user -e POSTGRES_PASSWORD=dev-password -e POSTGRES_DB=fullstack_db -p 5432:5432 -d postgres:16-alpine
```

### 2. Настроить backend

Создайте `backend/.env` (не добавляйте его в Git) со значениями для локальной среды:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=fullstack_user
DB_PASSWORD=dev-password
DB_DATABASE=fullstack_db
JWT_SECRET=<случайный-секрет>
JWT_REFRESH_SECRET=<другой-случайный-секрет>
SESSION_SECRET=<третий-случайный-секрет>
YANDEX_CLIENT_ID=<client-id>
YANDEX_CLIENT_SECRET=<client-secret>
YANDEX_REDIRECT_URI=http://localhost:3000/oauth/yandex/callback
FRONTEND_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

`FRONTEND_ORIGINS` содержит origin frontend, с которого браузеру разрешено обращаться к API. Несколько origin можно указать через запятую. Для локального Vite это обычно `http://localhost:5173`. Для генерации секретов можно использовать `openssl rand -base64 48`. Backend читает настройки из `backend/.env`, когда запускается из каталога `backend`.

`FRONTEND_URL` — адрес, на который backend перенаправит браузер после входа через Яндекс. Он должен указывать на frontend и быть доступен пользователю.

`SESSION_SECRET` — отдельный случайный секрет для подписи временной OAuth-сессии. Сгенерируйте его отдельно от JWT-секретов, например `openssl rand -base64 48`. В Docker Compose OAuth-сессии хранятся в отдельной таблице PostgreSQL `oauth_sessions`, которая создаётся автоматически. Для production cookie сессии безопасно передаётся только по HTTPS; reverse proxy должен передавать `X-Forwarded-Proto: https`.

Перед каждым входом через Яндекс приложение запрашивает повторное подтверждение доступа к данным (`force_confirm=yes`), даже если пользователь уже разрешал доступ ранее. Это подтверждение не обязательно означает выбор другого аккаунта Яндекса.

Если Яндекс вернул портрет пользователя, приложение сохраняет его URL в поле `avatar`. У уже существующего пользователя портрет Яндекса заменяет только стандартную заглушку — выбранный пользователем аватар не перезаписывается. Чтобы получать фото, включите разрешение «Портрет пользователя» в настройках приложения Яндекс OAuth; если портрет недоступен, останется стандартный аватар.

В отдельном терминале:

```bash
cd backend
npm ci
npm run start:dev
```

Backend доступен на `http://localhost:3000`. При запуске TypeORM автоматически синхронизирует схему БД — это поведение подходит для локальной разработки, но не рекомендуется для production.

### 3. Запустить frontend

Создайте `frontend/.env.local`:

```dotenv
VITE_AUTH_API_URL=http://localhost:3000
```

Во втором терминале:

```bash
cd frontend
npm ci
npm run dev
```

Откройте URL, показанный Vite (обычно `http://localhost:5173`). Изменение `VITE_AUTH_API_URL` требует перезапуска dev-сервера.

Чтобы остановить локальную PostgreSQL из Docker:

```bash
docker stop fullstack-postgres-dev
docker rm fullstack-postgres-dev
```

## Деплой и запуск после деплоя

Ниже описан пример для Linux VPS с Docker Compose, доменом и Caddy в качестве HTTPS reverse proxy. Замените `example.com` и `api.example.com` на свои домены.

### 1. Подготовить сервер

1. Установите Docker Engine и Docker Compose Plugin.
2. Настройте DNS-записи `A` для `example.com` и `api.example.com`, указывающие на IP сервера.
3. Разрешите входящие подключения к SSH и портам `80` и `443`.
4. Установите Caddy на сервер. Он будет завершать HTTPS и проксировать запросы в контейнеры.

### 2. Получить код и настроить production-переменные

```bash
git clone <URL-репозитория> fullstack-project
cd fullstack-project
cp .env.example .env
```

Отредактируйте корневой `.env`. Задайте значения примерно так:

```dotenv
BACKEND_PORT=127.0.0.1:3000
FRONTEND_PORT=127.0.0.1:8080
ADMINER_PORT=127.0.0.1:8081

POSTGRES_USER=fullstack_user
POSTGRES_PASSWORD=<сильный-уникальный-пароль>
POSTGRES_DB=fullstack_db

JWT_SECRET=<случайный-длинный-секрет>
JWT_REFRESH_SECRET=<другой-случайный-длинный-секрет>
SESSION_SECRET=<третий-случайный-длинный-секрет>

YANDEX_CLIENT_ID=<production-client-id>
YANDEX_CLIENT_SECRET=<production-client-secret>
YANDEX_REDIRECT_URI=https://api.example.com/oauth/yandex/callback
FRONTEND_ORIGINS=https://example.com
FRONTEND_URL=https://example.com
VITE_AUTH_API_URL=https://api.example.com
```

`FRONTEND_ORIGINS` задаёт разрешённые адреса frontend для CORS; перечислите несколько через запятую, если нужно. `FRONTEND_URL` задаёт адрес возврата браузера после авторизации через Яндекс. `SESSION_SECRET` должен быть отдельным от JWT-секретов. Сгенерируйте секреты, например командой `openssl rand -base64 48`. Не используйте dev-значения и не коммитьте `.env`. В настройках приложения Яндекс OAuth укажите точно такой же callback URL. `VITE_AUTH_API_URL` встраивается во frontend во время сборки, поэтому после его изменения frontend надо пересобрать.

### 3. Настроить reverse proxy: Caddy или Nginx

Выберите один вариант. Если на сервере уже настроен Nginx, Caddy устанавливать не нужно.

#### Вариант A: Caddy

Создайте Caddyfile с содержимым:

```caddyfile
example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}

api.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Проверьте конфигурацию и перезагрузите Caddy штатной для установленной ОС командой. При доступных DNS-записях и портах 80/443 Caddy автоматически выпустит TLS-сертификаты.

#### Вариант B: Nginx

Настройте DNS-записи `example.com` и `api.example.com` на IP-адрес сервера и получите TLS-сертификат для обоих доменов, например:

```bash
sudo certbot --nginx -d example.com -d api.example.com
```

Создайте конфигурацию сайта Nginx (например, `/etc/nginx/sites-available/fullstack-project`) и замените путь к сертификату, если Certbot сохранил его в другом каталоге:

```nginx
server {
    listen 80;
    server_name example.com api.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте конфигурацию способом, принятым в вашей ОС (например, создайте ссылку из `sites-available` в `sites-enabled`), затем проверьте её и перезагрузите Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Собрать и запустить проект

Из корня репозитория:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Frontend будет доступен на `https://example.com`, API — на `https://api.example.com`. PostgreSQL не опубликован на host-порт; данные сохраняются в named volume `fullstack-postgres-data` при пересборке и перезапуске контейнеров.

При первом запуске backend применит начальную миграцию и создаст таблицы, если их ещё нет. Миграция также регистрируется в таблице `migrations`; при повторных запусках уже применённые миграции не выполняются повторно. Для новых изменений схемы добавляйте новые миграции, не включайте `synchronize` в production.

### Доступ к Adminer через SSH-туннель

Adminer не нужно публиковать в интернет. Убедитесь, что в корневом `.env` порт привязан только к loopback-интерфейсу:

```dotenv
ADMINER_PORT=127.0.0.1:8081
```

На сервере запустите Adminer:

```bash
docker compose --profile tools up -d db-adminer
```

На своём компьютере откройте SSH-туннель, подставив имя пользователя SSH и адрес сервера:

```bash
ssh -L 8081:127.0.0.1:8081 username@server-address
```

Не закрывая это SSH-соединение, откройте в браузере `http://localhost:8081`. В форме Adminer укажите сервер `postgres`, имя базы данных и учётные данные PostgreSQL из корневого `.env` на сервере. Значения `.env` не нужно копировать в команду SSH или публиковать.

Для просмотра состояния и логов:

```bash
docker compose ps
docker compose logs --tail=100 backend frontend postgres
```

Для выкладки новой версии после обновления кода:

```bash
git pull
docker compose up -d --build
docker compose ps
```

Не используйте `docker compose down -v` для обычного обновления: флаг `-v` удалит volume базы данных. Перед изменениями production рекомендуется настроить регулярные резервные копии PostgreSQL и проверить восстановление из backup.

## Важные замечания перед production

- Укажите только доверенные frontend-origin в `FRONTEND_ORIGINS` перед запуском. Не полагайтесь на CORS как на защиту API.
- В TypeORM включён `synchronize: true`. Для production с важными данными следует перейти на миграции и отключить автоматическое изменение схемы.
- Не запускайте Adminer-профиль (`--profile tools`) на публичном сервере без отдельной защиты. По умолчанию Adminer публикует порт на всех интерфейсах, если его привязка не ограничена.
- Не храните production-секреты в Git или Docker image. Для более строгой эксплуатации используйте secret manager и ограничьте доступ к файлу `.env` на сервере.
