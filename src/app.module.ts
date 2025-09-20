import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BucketService, BucketServiceModule } from '@core/services';

import { ImageModule, VideoModule, FileModule, BucketModule, AudioModule } from './module';
import { VideoGatewayModule } from './gateway';
import { DatabaseModule, DatabaseService } from './core/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    BucketServiceModule,
    AudioModule,
    VideoModule,
    ImageModule,
    FileModule,
    VideoGatewayModule,
    BucketModule,
  ],
  providers: [DatabaseService, BucketService],
})
export class AppModule {}
