import { Module } from '@nestjs/common';

import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { BucketService } from '@core/services';

@Module({
  controllers: [VideoController],
  providers: [VideoService, BucketService],
})
export class VideoModule {}
