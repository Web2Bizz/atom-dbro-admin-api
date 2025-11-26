import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule as PrometheusModuleLib } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModuleLib.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get<string>('PROMETHEUS_ENABLED', 'true') === 'true';
        const path = configService.get<string>('PROMETHEUS_PATH', '/metrics');
        const defaultMetrics = configService.get<string>('PROMETHEUS_DEFAULT_METRICS', 'true') === 'true';
        const defaultLabels = configService.get<string>('PROMETHEUS_DEFAULT_LABELS', '{}');

        let parsedLabels = {};
        try {
          if (defaultLabels && defaultLabels !== '{}') {
            parsedLabels = JSON.parse(defaultLabels);
          }
        } catch (e) {
          // Если не удалось распарсить, используем пустой объект
        }

        return {
          defaultMetrics: {
            enabled: defaultMetrics && enabled,
          },
          defaultLabels: parsedLabels,
          // Если Prometheus отключен, не создаем endpoint
          path: enabled ? path : undefined,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [PrometheusModuleLib],
})
export class PrometheusModule {}

