import { Module } from '@nestjs/common';

import {ImageModule, VideoModule} from './module';

@Module({
  imports: [VideoModule, ImageModule],
})
export class AppModule {}
