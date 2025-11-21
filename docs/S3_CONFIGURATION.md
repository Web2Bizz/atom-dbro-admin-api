# Конфигурация S3 хранилища

Сервис поддерживает работу с любыми S3-совместимыми хранилищами через переменные окружения.

## Переменные окружения

### Обязательные

- `S3_BUCKET_NAME` - имя bucket для хранения файлов

### Учетные данные

Используйте один из вариантов:

**Вариант 1 (универсальный):**
- `S3_ACCESS_KEY_ID` - ключ доступа
- `S3_SECRET_ACCESS_KEY` - секретный ключ

**Вариант 2 (для обратной совместимости с AWS):**
- `AWS_ACCESS_KEY_ID` - ключ доступа
- `AWS_SECRET_ACCESS_KEY` - секретный ключ

### Регион

- `S3_REGION` или `AWS_REGION` - регион хранилища (по умолчанию `us-east-1`)

### Кастомный провайдер

- `S3_ENDPOINT` - endpoint URL для кастомных провайдеров (Beget, Yandex, DigitalOcean, MinIO и т.д.)
- `S3_FORCE_PATH_STYLE` - использовать path-style URLs (по умолчанию `true` для кастомных endpoint)

### Кастомный URL шаблон

- `S3_PUBLIC_URL_TEMPLATE` - шаблон для формирования публичных URL
  - Доступные переменные: `{bucket}`, `{key}`, `{region}`
  - Пример: `https://cdn.example.com/{key}`

## Примеры конфигураций

### AWS S3

```env
S3_BUCKET_NAME=my-bucket
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=eu-west-1
```

**Формат URL:** `https://my-bucket.s3.eu-west-1.amazonaws.com/organizations/1/uuid.jpg`

### Beget S3

```env
S3_ENDPOINT=https://s3.ru1.storage.beget.cloud
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=your-beget-access-key
S3_SECRET_ACCESS_KEY=your-beget-secret-key
S3_REGION=ru1
```

**Формат URL:** `https://s3.ru1.storage.beget.cloud/my-bucket/organizations/1/uuid.jpg`

### Yandex Object Storage

```env
S3_ENDPOINT=https://storage.yandexcloud.net
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=YCAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=YCMIOSFODNN7EXAMPLE
S3_REGION=ru-central1
```

**Формат URL:** `https://storage.yandexcloud.net/my-bucket/organizations/1/uuid.jpg`

### DigitalOcean Spaces

```env
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET_NAME=my-space
S3_ACCESS_KEY_ID=DOIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=secret
S3_REGION=nyc3
```

**Формат URL:** `https://nyc3.digitaloceanspaces.com/my-space/organizations/1/uuid.jpg`

### MinIO (локальный)

```env
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_REGION=us-east-1
```

**Формат URL:** `http://localhost:9000/my-bucket/organizations/1/uuid.jpg`

### С кастомным CDN/доменом

```env
S3_ENDPOINT=https://s3.ru1.storage.beget.cloud
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_REGION=ru1
S3_PUBLIC_URL_TEMPLATE=https://cdn.example.com/{key}
```

**Формат URL:** `https://cdn.example.com/organizations/1/uuid.jpg`

## Примечания

1. **Path-style vs Virtual-hosted-style:**
   - Для AWS S3 используется virtual-hosted-style: `https://bucket.s3.region.amazonaws.com/key`
   - Для кастомных провайдеров используется path-style: `https://endpoint.com/bucket/key`
   - Можно переопределить через `S3_FORCE_PATH_STYLE=false`

2. **Публичный доступ:**
   - Убедитесь, что bucket настроен для публичного чтения
   - Для AWS S3 может потребоваться bucket policy вместо ACL

3. **Регион:**
   - Для AWS S3 регион важен для формирования URL
   - Для других провайдеров регион может быть произвольным, но должен быть указан

4. **Обратная совместимость:**
   - Поддерживаются старые переменные `AWS_*` для совместимости
   - Приоритет: `S3_*` > `AWS_*`

