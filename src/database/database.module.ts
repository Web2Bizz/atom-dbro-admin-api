import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<NodePgDatabase<typeof schema>> => {
        const connectionString = 
          configService.get<string>('DATABASE_URL') || 
          'postgresql://postgres:postgres@localhost:5432/atom_dbro';
        
        if (typeof connectionString !== 'string') {
          throw new Error(
            `DATABASE_URL должна быть строкой, получен тип: ${typeof connectionString}`,
          );
        }

        // Проверяем формат connection string
        if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
          throw new Error(
            'DATABASE_URL должна начинаться с postgresql:// или postgres://',
          );
        }

        console.log('Подключение к базе данных:', connectionString.replace(/:[^:@]+@/, ':****@'));

        const pool = new Pool({
          connectionString,
        });
        
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}

