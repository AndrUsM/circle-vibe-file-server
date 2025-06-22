import { Module } from '@nestjs/common';

import { ImageModule, VideoModule, FileModule } from './module';
import { VideoGatewayModule } from './gateway';

@Module({
  imports: [VideoModule, ImageModule, FileModule, VideoGatewayModule],
})
export class AppModule {}
