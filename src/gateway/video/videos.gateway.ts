import * as fs from 'fs';
import { join } from 'path';

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SERVER_PATH } from 'src/core';
import { VideoService } from 'src/module';
import { Server } from 'http';

// TODO: huge refactoring
// here limit for files uploading
@WebSocketGateway(3005, { cors: true, namespace: '/video-upload', maxHttpBufferSize: 100 * 1024 * 1024 })
export class VideosGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // Track file write streams by socket id
  private streams: Map<string, fs.WriteStream> = new Map();
  private fileNames: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    const query = client.handshake.auth;
    const token = query.token;

    if (!token) {
      // client.disconnect();
    }
  }

  @SubscribeMessage('START_VIDEO_UPLOAD')
  handleStartUpload(
    @MessageBody() data: { fileName: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const uploadDir = join(
        __dirname,
        `../../../uploads/videos`,
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const filePath = join(uploadDir, `${client.id}-${data.fileName}`);

      const writeStream = fs.createWriteStream(filePath, { flags: 'w' });
      this.streams.set(client.id, writeStream);
      this.fileNames.set(client.id, `${client.id}-${data.fileName}`);
      console.log(`Upload started for ${filePath}`);

      client.emit('UPLOAD_VIDEO_STARTED');
    } catch (error) {
      client.emit('UPLOAD_VIDEO_ERROR', error.message);
    }
  }

  @SubscribeMessage('UPLOAD_VIDEO_CHUNK')
  handleUploadChunk(
    @MessageBody() chunk: Buffer,
    @ConnectedSocket() client: Socket,
  ) {
    const writeStream = this.streams.get(client.id);

    if (!writeStream) {
      client.emit('UPLOAD_VIDEO_ERROR', 'Upload stream not found.');
      return;
    }

    writeStream.write(chunk);
  }

  @SubscribeMessage('UPLOAD_VIDEO_END')
  handleUploadEnd(@ConnectedSocket() client: Socket) {
    const writeStream = this.streams.get(client.id);
    if (!writeStream) {
      client.emit('UPLOAD_VIDEO_ERROR', 'Upload stream not found.');
      return;
    }

    writeStream.end(() => {
      console.log(`Upload finished for client ${client.id}`);
      this.streams.delete(client.id);
      client.emit('UPLOAD_VIDEO_SUCCESS', {
        filePath: `${SERVER_PATH}/api/videos/${this.fileNames.get(client.id)}`,
      });
    });
  }

  handleDisconnect(client: Socket) {
    // Cleanup open streams on disconnect
    const writeStream = this.streams.get(client.id);
    if (writeStream) {
      writeStream.end();
      this.streams.delete(client.id);
    }
    console.log(`Client disconnected: ${client.id}`);
  }
}
