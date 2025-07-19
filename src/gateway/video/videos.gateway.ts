import * as fs from 'fs';
import { join } from 'path';
import { Server } from 'http';
import { Socket } from 'socket.io';

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  FileVideoServerSocketKeys,
  FileVideoSocketConnectionAuthParams,
  FileVideoSocketErrorOutput,
  FileVideoSocketStartUploadParams,
  FileVideoSocketSuccessOutput,
  GatewayNamespaces,
} from '@circle-vibe/shared';
import {
  composeUploadedVideoUrl,
  UPLOAD_VIDEO_LIMIT_IN_BYTES,
  VIDEOS_UPLOAD_PATH,
} from 'src/core';
import { VideoService } from 'src/module';

@WebSocketGateway(3005, {
  cors: true,
  namespace: `/${GatewayNamespaces.VIDEO_UPLOAD}`,
  maxHttpBufferSize: UPLOAD_VIDEO_LIMIT_IN_BYTES,
})
export class VideosGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private streams: Map<string, fs.WriteStream> = new Map();
  private fileNames: Map<string, string> = new Map();

  constructor(private readonly videoService: VideoService) {}

  handleConnection(client: Socket<FileVideoSocketConnectionAuthParams>) {
    const query = client.handshake.auth;
    const token = query.token;

    if (!token) {
      client.disconnect();
    }
  }

  @SubscribeMessage(FileVideoServerSocketKeys.START_VIDEO_UPLOAD)
  handleStartUpload(
    @MessageBody() data: FileVideoSocketStartUploadParams,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const uploadDir = join(__dirname, VIDEOS_UPLOAD_PATH);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      const filePath = join(uploadDir, `${client.id}-${data.fileName}`);

      const writeStream = fs.createWriteStream(filePath, { flags: 'w' });
      this.streams.set(client.id, writeStream);
      this.fileNames.set(client.id, `${client.id}-${data.fileName}`);

      client.emit(FileVideoServerSocketKeys.UPLOAD_VIDEO_STARTED);
    } catch (error) {
      client.emit<FileVideoSocketErrorOutput>(
        FileVideoServerSocketKeys.UPLOAD_VIDEO_ERROR,
        error.message,
      );
    }
  }

  @SubscribeMessage(FileVideoServerSocketKeys.UPLOAD_VIDEO_CHUNK)
  handleUploadChunk(
    @MessageBody() chunk: Buffer,
    @ConnectedSocket() client: Socket,
  ) {
    const writeStream = this.streams.get(client.id);

    if (!writeStream) {
      client.emit<FileVideoSocketErrorOutput>(
        FileVideoServerSocketKeys.UPLOAD_VIDEO_ERROR,
        'Upload stream not found.',
      );
      return;
    }

    writeStream.write(chunk);
  }

  @SubscribeMessage(FileVideoServerSocketKeys.UPLOAD_VIDEO_END)
  handleUploadEnd(@ConnectedSocket() client: Socket) {
    const writeStream = this.streams.get(client.id);
    if (!writeStream) {
      client.emit<FileVideoSocketErrorOutput>(
        FileVideoServerSocketKeys.UPLOAD_VIDEO_ERROR,
        'Upload stream not found.',
      );
      return;
    }

    writeStream.end(async () => {
      this.streams.delete(client.id);
      const uploadedFileName = this.fileNames.get(client.id);

      if (!uploadedFileName) {
        client.emit<FileVideoSocketErrorOutput>(
          FileVideoServerSocketKeys.UPLOAD_VIDEO_ERROR,
          'File name not found.',
        );
        return;
      }

      const filePathForConvertation = join(
        __dirname,
        VIDEOS_UPLOAD_PATH,
        uploadedFileName,
      );
      const filePathOutputForConvertation = filePathForConvertation.replace(
        /\.[^/.]+$/,
        `.mp4`,
      );
      const convertedVideoFileName = filePathOutputForConvertation
        .split('/')
        .pop();

      const fileExtension = uploadedFileName.split('.').pop();

      if (fileExtension !== 'mp4') {
        await this.videoService.convertToMp4(
          filePathForConvertation,
          filePathOutputForConvertation,
        );
      }

      this.fileNames.delete(client.id);

      if (fileExtension !== 'mp4') {
        fs.unlinkSync(filePathForConvertation);
      }

      client.emit(FileVideoServerSocketKeys.UPLOAD_VIDEO_SUCCESS, {
        filePath: composeUploadedVideoUrl(String(convertedVideoFileName)),
      } as FileVideoSocketSuccessOutput);
    });
  }

  handleDisconnect(client: Socket) {
    const writeStream = this.streams.get(client.id);
    if (writeStream) {
      writeStream.end();
      this.streams.delete(client.id);
    }
  }
}
