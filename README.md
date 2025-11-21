# atom-dbro-backend

Бэкенд для хакатона Atom DBRO

## Настройка

### База данных

Настройка через переменную окружения `DATABASE_URL`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/atom_dbro
```

### S3 хранилище

Сервис поддерживает работу с любыми S3-совместимыми хранилищами (AWS S3, Beget, Yandex Object Storage, DigitalOcean Spaces, MinIO и др.).

**Минимальная конфигурация:**
```env
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
```

**Для кастомных провайдеров (Beget, Yandex и т.д.):**
```env
S3_ENDPOINT=https://s3.ru1.storage.beget.cloud
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=ru1
```

Подробная документация по настройке S3: [docs/S3_CONFIGURATION.md](docs/S3_CONFIGURATION.md)

### CORS настройка

API настроен для работы с фронтендом на `localhost:5173` (Vite dev server). По умолчанию разрешены следующие источники:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:3000`

Для настройки других источников используйте переменную окружения `CORS_ORIGINS`:
```env
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com,https://app.yourdomain.com
```

**Примечание:** В development режиме (`NODE_ENV !== 'production'`) автоматически разрешаются все локальные адреса (`localhost:*` и `127.0.0.1:*`).

## Запуск

```bash
# Установка зависимостей
npm install

# Применение миграций
npm run db:migrate

# Запуск в режиме разработки
npm run start:dev

# Запуск в продакшене
npm run start:prod
```

## API документация

После запуска приложения Swagger UI доступен по адресу:
```
http://localhost:3000/api
```

## Аутентификация

API использует JWT (JSON Web Tokens) для аутентификации. При успешном входе пользователь получает два токена:

- **access_token** - короткоживущий токен для доступа к защищенным ресурсам (по умолчанию 24 часа)
- **refresh_token** - долгоживущий токен для обновления access_token (по умолчанию 7 дней)

### Endpoints

#### Регистрация
```
POST /auth/register
Body: {
  "firstName": "Иван",
  "lastName": "Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Вход
```
POST /auth/login
Body: {
  "email": "ivan@example.com",
  "password": "password123"
}

Response: {
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": 1,
    "email": "ivan@example.com",
    "firstName": "Иван",
    "lastName": "Иванов"
  }
}
```

#### Обновление токена
```
POST /auth/refresh
Body: {
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: {
  "access_token": "...",
  "refresh_token": "...",
  "user": { ... }
}
```
**Примечание:** Endpoint требует валидный refresh token (авторизованный пользователь).

### Использование токенов

Для доступа к защищенным эндпоинтам добавьте токен в заголовок Authorization:
```
Authorization: Bearer <access_token>
```

### Настройка токенов

Срок действия токенов настраивается через переменные окружения:

```env
JWT_EXPIRES_IN=24h              # Срок действия access token (по умолчанию 24h)
JWT_REFRESH_EXPIRES_IN=7d      # Срок действия refresh token (по умолчанию 7d)
JWT_SECRET=your-secret-key     # Секретный ключ для подписи access токенов
JWT_REFRESH_SECRET=your-refresh-secret-key  # Секретный ключ для подписи refresh токенов (опционально, по умолчанию используется JWT_SECRET)
```

## Структура проекта

- `src/organization/` - модуль организаций с поддержкой галереи изображений
- `src/database/` - схемы базы данных
- `src/auth/` - аутентификация и авторизация
- `docs/` - документация
