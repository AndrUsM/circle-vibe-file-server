import * as fs from 'fs';
import { join } from 'path';

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SERVER_PATH } from 'src/core';
import { VideoService } from 'src/module';

@WebSocketGateway(3005, { cors: true })
export class VideosGateway implements OnGatewayConnection {
  private fileStream: fs.WriteStream;
  private token: string;

  handleConnection(client: Socket) {
    const query = client.handshake.auth;
    const token = query.token;
    const filename = query.filename;
    const outputPath = join(__dirname, `../../../uploads/videos/${filename}`);

    this.fileStream = fs.createWriteStream(outputPath, { flags: 'a' });
    console.log('Video stream started.');
  }

  handleDisconnect(client: Socket) {
    this.fileStream.end();
    console.log('Video stream end.');
  }

  @SubscribeMessage('UPLOAD_VIDEO_CHUNK')
  handleVideoChunk(@MessageBody() chunk: Buffer) {
    this.fileStream.write(chunk);
    console.log('Uploading.');
  }

  @SubscribeMessage('UPLOAD_VIDEO_END')
  async handleVideoEnd(client: Socket) {
    client.emit('VIDEO_UPLOADED', {
      filePath: `${SERVER_PATH}/api/videos/${client.handshake.auth.filename}`,
    });
    this.fileStream.end();

    console.log('Video successfully saved.');
  }
}