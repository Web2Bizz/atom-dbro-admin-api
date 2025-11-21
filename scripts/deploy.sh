#!/bin/bash

# Скрипт автоматического деплоя atom-dbro-backend
# Выполняется на сервере через SSH из GitHub Actions
# Образ должен быть уже загружен в Docker (docker load)

set -e  # Остановка при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Переменные окружения
PROJECT_DIR=${PROJECT_DIR:-"$HOME/atom-dbro-backend"}
IMAGE_NAME=${IMAGE_NAME:-"atom-dbro-backend"}

log "🚀 Starting deployment process..."

# Переход в директорию проекта
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
log "📁 Working directory: $(pwd)"

# Проверка наличия docker-compose.prod.yml
if [ ! -f "docker-compose.prod.yml" ]; then
    error "docker-compose.prod.yml not found in project directory"
    exit 1
fi

# Проверка наличия образа
if ! docker images | grep -q "$IMAGE_NAME.*latest"; then
    error "Docker image $IMAGE_NAME:latest not found!"
    error "Please ensure the image is loaded: docker load -i image.tar.gz"
    exit 1
fi

log "✅ Docker image found: $IMAGE_NAME:latest"

# Создание необходимых сетей Docker (если не существуют)
log "🌐 Ensuring Docker networks exist..."
docker network create atom-external-network 2>/dev/null || log "Network atom-external-network already exists"
docker network create atom-internal-network 2>/dev/null || log "Network atom-internal-network already exists"

# Остановка и удаление старых контейнеров
log "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down || warning "No running containers to stop"

# Запуск новых контейнеров
log "▶️ Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание готовности контейнера
log "⏳ Waiting for application container to be ready..."
sleep 10

# Проверка, что контейнер запущен
if ! docker ps | grep -q "atom-dbro-app"; then
    error "Application container failed to start"
    log "📋 Container logs:"
    docker logs atom-dbro-app --tail 50 || true
    exit 1
fi

# Выполнение миграций базы данных
log "🗄️ Running database migrations..."
MAX_MIGRATION_ATTEMPTS=3
MIGRATION_ATTEMPT=0

while [ $MIGRATION_ATTEMPT -lt $MAX_MIGRATION_ATTEMPTS ]; do
    if docker exec atom-dbro-app npm run db:migrate; then
        log "✅ Database migrations completed successfully"
        break
    else
        MIGRATION_ATTEMPT=$((MIGRATION_ATTEMPT + 1))
        if [ $MIGRATION_ATTEMPT -lt $MAX_MIGRATION_ATTEMPTS ]; then
            warning "Migration attempt $MIGRATION_ATTEMPT failed, retrying in 5 seconds..."
            sleep 5
        else
            error "Database migrations failed after $MAX_MIGRATION_ATTEMPTS attempts"
            log "📋 Container logs:"
            docker logs atom-dbro-app --tail 50
            exit 1
        fi
    fi
done

# Health check приложения
log "🏥 Performing health check..."
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_ATTEMPT=0
HEALTH_CHECK_SUCCESS=false

while [ $HEALTH_CHECK_ATTEMPT -lt $MAX_HEALTH_CHECK_ATTEMPTS ]; do
    if curl -f http://localhost:3000/api > /dev/null 2>&1; then
        HEALTH_CHECK_SUCCESS=true
        break
    fi
    HEALTH_CHECK_ATTEMPT=$((HEALTH_CHECK_ATTEMPT + 1))
    if [ $HEALTH_CHECK_ATTEMPT -lt $MAX_HEALTH_CHECK_ATTEMPTS ]; then
        log "Health check attempt $HEALTH_CHECK_ATTEMPT/$MAX_HEALTH_CHECK_ATTEMPTS failed, retrying in 2 seconds..."
        sleep 2
    fi
done

if [ "$HEALTH_CHECK_SUCCESS" = true ]; then
    log "✅ Application is healthy and responding!"
    log "🌐 Application is available at: http://localhost:3000"
    log "📚 Swagger docs: http://localhost:3000/api"
else
    error "Health check failed after $MAX_HEALTH_CHECK_ATTEMPTS attempts"
    log "📋 Container logs:"
    docker logs atom-dbro-app --tail 100
    log "📋 Container status:"
    docker ps -a | grep atom-dbro-app || true
    exit 1
fi

# Очистка старых образов (опционально, для экономии места)
log "🧹 Cleaning up old Docker images..."
docker image prune -f || warning "Failed to clean up old images"

log "✅ Deployment completed successfully!"
