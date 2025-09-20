import { Module } from '@nestjs/common';
import { AudioController } from './audio.controller';
import { BucketService } from '@core/services';

@Module({
  controllers: [AudioController],
  providers: [BucketService],
})
export class AudioModule {}
