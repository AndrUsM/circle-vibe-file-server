import { Module } from '@nestjs/common';
import { FilesGateway } from './files.gateway';
import { VideoService } from 'src/module';

@Module({
  providers: [FilesGateway, VideoService],
})
export class VideoGatewayModule {}
