import { Module } from '@nestjs/common';

import { ImageModule, VideoModule, FileModule } from './module';

@Module({
  imports: [VideoModule, ImageModule, FileModule],
})
export class AppModule {}
