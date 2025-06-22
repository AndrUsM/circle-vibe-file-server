import { Module } from '@nestjs/common';
import {VideosGateway} from './videos.gateway';

@Module({
  providers: [VideosGateway],
})
export class VideoGatewayModule {}