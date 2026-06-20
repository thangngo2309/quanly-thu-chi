import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardModule } from './dashboard/dashboard.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath:
        process.env.NODE_ENV === 'development'
          ? [
              '../.env.dev',
              '.env.dev',
            ]
          : [
              '../.env',
              '.env',
            ],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        type: 'postgres',

        host:
          configService.getOrThrow<string>(
            'DB_HOST',
          ),

        port: Number(
          configService.get<string>(
            'DB_PORT',
          ) ?? 5432,
        ),

        username:
          configService.getOrThrow<string>(
            'DB_USERNAME',
          ),

        password:
          configService.getOrThrow<string>(
            'DB_PASSWORD',
          ),

        database:
          configService.getOrThrow<string>(
            'DB_NAME',
          ),

        autoLoadEntities: true,

        synchronize:
          configService.get<string>(
            'DB_SYNC',
          ) === 'true',

        logging:
          configService.get<string>(
            'NODE_ENV',
          ) === 'development',

        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),

    SalesModule,
    ExpensesModule,
    DashboardModule,
  ],
})
export class AppModule {}