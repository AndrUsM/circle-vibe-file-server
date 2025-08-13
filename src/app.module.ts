import { Module } from '@nestjs/common';

import { ImageModule, VideoModule, FileModule } from './module';
import { VideoGatewayModule } from './gateway';
import { DatabaseModule, DatabaseService } from './core/database';

@Module({
  imports: [
    DatabaseModule,
    VideoModule,
    ImageModule,
    FileModule,
    VideoGatewayModule,
  ],
  providers: [DatabaseService],
})
export class AppModule {}
