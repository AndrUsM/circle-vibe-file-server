import { Module } from '@nestjs/common';
import { BucketController } from './bucket.controller';
import { BucketService } from '@core/services';

@Module({
  controllers: [BucketController],
  providers: [BucketService]
})
export class BucketModule {}
