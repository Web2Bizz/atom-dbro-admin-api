import { Injectable } from '@nestjs/common';
import { AVATAR_EMOJIS } from './avatar.constants';

interface PaletteColor {
  primaryColor: string;
  foreignColor: string;
}

interface PaletteResponse {
  items: Array<{
    primaryColor: string;
    foreignColor: string;
  }>;
}

interface GenerateAvatarResponse {
  id?: string;
  url?: string;
  imageUrl?: string;
  image_url?: string;
  avatarUrl?: string;
  avatar_url?: string;
  createdAt?: string;
  version?: string;
  [key: string]: any; // Для поддержки других возможных форматов
}

@Injectable()
export class AvatarService {
  private readonly API_BASE_URL = 'http://82.202.140.37:12745';
  private paletteCache: PaletteColor[] | null = null;
  private paletteCacheTime: number = 0;
  private readonly PALETTE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа

  /**
   * Получает палитру цветов с кешированием
   */
  private async getPalette(): Promise<PaletteColor[]> {
    const now = Date.now();
    
    // Проверяем кеш
    if (this.paletteCache && (now - this.paletteCacheTime) < this.PALETTE_CACHE_TTL) {
      return this.paletteCache;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/palettes?pick=30&offset=0`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch palette: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const data: PaletteResponse = await response.json();
      
      if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
        console.warn('Invalid palette response, using default palette');
        return [
          { primaryColor: '#3B82F6', foreignColor: '#EF4444' },
          { primaryColor: '#10B981', foreignColor: '#F59E0B' },
          { primaryColor: '#8B5CF6', foreignColor: '#EC4899' },
        ];
      }

      this.paletteCache = data.items.map(p => ({
        primaryColor: p.primaryColor,
        foreignColor: p.foreignColor,
      }));
      this.paletteCacheTime = now;

      return this.paletteCache;
    } catch (error) {
      console.error('Error fetching palette:', error);
      // Возвращаем дефолтную палитру при ошибке
      return [
        { primaryColor: '#3B82F6', foreignColor: '#EF4444' },
        { primaryColor: '#10B981', foreignColor: '#F59E0B' },
        { primaryColor: '#8B5CF6', foreignColor: '#EC4899' },
      ];
    }
  }

  /**
   * Генерирует аватарку для пользователя
   * @returns Объект с URL для размеров 4-9
   */
  async generateAvatar(): Promise<Record<number, string>> {
    const palettes = await this.getPalette();
    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
    const randomEmoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
    const randomAngle = Math.floor(Math.random() * 361); // 0-360

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v3/generate`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emoji: randomEmoji,
          backgroundType: 'linear',
          primaryColor: randomPalette.primaryColor,
          foreignColor: randomPalette.foreignColor,
          angle: randomAngle,
          emojiSize: 'medium',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to generate avatar: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Avatar API response text:', responseText);
      
      let data: GenerateAvatarResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse avatar API response as JSON:', parseError);
        console.error('Response text:', responseText);
        throw new Error(`Invalid JSON response from avatar API: ${responseText.substring(0, 200)}`);
      }
      
      console.log('Parsed avatar API response:', JSON.stringify(data, null, 2));
      
      // Проверяем различные возможные форматы ответа
      let avatarId: string | undefined;
      let directUrl: string | undefined;
      
      // Если ответ - это просто строка URL
      if (typeof data === 'string') {
        directUrl = data;
      }
      // Если ответ - это объект
      else if (data && typeof data === 'object') {
        // Проверяем поле url (прямой URL)
        if ('url' in data && typeof data.url === 'string') {
          directUrl = data.url;
        }
        // Проверяем другие возможные варианты прямых URL
        else if ('imageUrl' in data && typeof data.imageUrl === 'string') {
          directUrl = data.imageUrl;
        }
        else if ('image_url' in data && typeof data.image_url === 'string') {
          directUrl = data.image_url;
        }
        else if ('avatarUrl' in data && typeof data.avatarUrl === 'string') {
          directUrl = data.avatarUrl;
        }
        else if ('avatar_url' in data && typeof data.avatar_url === 'string') {
          directUrl = data.avatar_url;
        }
        // Если API возвращает ID, используем его для формирования URL
        // Формат: /api/v1/{id}?size={size}, где size от 4 до 9
        else if ('id' in data && typeof data.id === 'string' && data.id.trim() !== '') {
          avatarId = data.id.trim();
          console.log(`Avatar ID received: ${avatarId}`);
        }
      }
      
      // Формируем объект с URL для размеров 4-9
      const avatarUrls: Record<number, string> = {};
      
      if (avatarId) {
        // Если есть ID, формируем URL для каждого размера с параметром size
        // Формат: /api/v1/{id}?size={size}
        for (let size = 4; size <= 9; size++) {
          avatarUrls[size] = `${this.API_BASE_URL}/api/v1/${avatarId}?size=${size}`;
        }
        console.log(`Generated avatar URLs for sizes 4-9 using ID: ${avatarId}`);
      } else if (directUrl) {
        // Если есть прямой URL, используем его для всех размеров
        // (на случай, если API вернул прямой URL без параметра size)
        for (let size = 4; size <= 9; size++) {
          avatarUrls[size] = directUrl;
        }
        console.log(`Using direct URL for all sizes: ${directUrl}`);
      } else {
        console.error('Avatar API response structure:', data);
        throw new Error(`Invalid response from avatar API: missing ID or URL. Response structure: ${JSON.stringify(data)}`);
      }

      if (Object.keys(avatarUrls).length === 0) {
        throw new Error('Failed to create avatar URLs object');
      }

      return avatarUrls;
    } catch (error) {
      console.error('Error generating avatar:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
        throw error;
      }
      throw new Error(`Failed to generate avatar: ${String(error)}`);
    }
  }
}

