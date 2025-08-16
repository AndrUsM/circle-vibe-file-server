import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { BucketService } from '@core/services';

@Module({
  controllers: [ImageController],
  providers: [ImageService, BucketService]
})
export class ImageModule {}
