import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { BucketService } from '@core/services';

@Module({
  controllers: [FileController],
  providers: [BucketService],
})
export class FileModule {}
