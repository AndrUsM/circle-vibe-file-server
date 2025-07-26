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
  GenericFileServerSocketKeys,
  FileSocketConnectionAuthParams,
  FileSocketErrorOutput,
  FileSocketStartUploadParams,
  FileSocketSuccessOutput,
  GatewayNamespaces,
  MessageFileEntityType,
} from '@circle-vibe/shared';
import {
  composeFileGatewayUploadPath,
  composeUploadedVideoUrl,
  composeUploadedFileUrl,
  composeUploadedImageUrl,
  UPLOAD_FILE_LIMIT_IN_BYTES,
  VIDEOS_UPLOAD_PATH,
} from 'src/core';
import { VideoService } from 'src/module';

interface FileConfiguration {
  fileName: string;
  filePath: string;
  fileType: MessageFileEntityType;
}

@WebSocketGateway(3005, {
  cors: true,
  namespace: `/${GatewayNamespaces.FILE_UPLOAD}`,
  maxHttpBufferSize: UPLOAD_FILE_LIMIT_IN_BYTES,
})
export class FilesGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private streams: Map<string, fs.WriteStream> = new Map();
  private files: Map<string, FileConfiguration> = new Map();

  constructor(private readonly videoService: VideoService) {}

  handleConnection(client: Socket<FileSocketConnectionAuthParams>) {
    const query = client.handshake.auth;
    const token = query.token;

    if (!token) {
      client.disconnect();
    }
  }

  @SubscribeMessage(GenericFileServerSocketKeys.START_UPLOAD)
  handleStartUpload(
    @MessageBody() data: FileSocketStartUploadParams,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const uploadDir = join(__dirname, VIDEOS_UPLOAD_PATH);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
      const uploadFilePath = composeFileGatewayUploadPath(data.type);
      const filePath = join(uploadDir, `${client.id}-${data.fileName}`);
      const writeStream = fs.createWriteStream(filePath, { flags: 'w' });

      this.streams.set(client.id, writeStream);
      this.files.set(client.id, {
        fileName: data.fileName,
        filePath: uploadFilePath,
        fileType: data.type,
      });

      client.emit(GenericFileServerSocketKeys.UPLOAD_STARTED);
    } catch (error) {
      client.emit<FileSocketErrorOutput>(
        GenericFileServerSocketKeys.UPLOAD_ERROR,
        error.message,
      );
    }
  }

  @SubscribeMessage(GenericFileServerSocketKeys.UPLOAD_CHUNK)
  handleUploadChunk(
    @MessageBody() chunk: Buffer,
    @ConnectedSocket() client: Socket,
  ) {
    const writeStream = this.streams.get(client.id);

    if (!writeStream) {
      client.emit<FileSocketErrorOutput>(
        GenericFileServerSocketKeys.UPLOAD_ERROR,
        'Upload stream not found.',
      );
      return;
    }

    writeStream.write(chunk);
  }

  @SubscribeMessage(GenericFileServerSocketKeys.UPLOAD_END)
  handleUploadEnd(@ConnectedSocket() client: Socket) {
    const writeStream = this.streams.get(client.id);
    if (!writeStream) {
      client.emit<FileSocketErrorOutput>(
        GenericFileServerSocketKeys.UPLOAD_ERROR,
        'Upload stream not found.',
      );
      return;
    }

    writeStream.end(async () => {
      this.streams.delete(client.id);
      const {
        fileName: uploadedFileName,
        filePath,
        fileType,
      } = this.files.get(client.id) ?? {};

      if (!uploadedFileName || !filePath) {
        client.emit<FileSocketErrorOutput>(
          GenericFileServerSocketKeys.UPLOAD_ERROR,
          'File name not found.',
        );
        return;
      }

      const filePathForConvertation = join(
        __dirname,
        filePath,
        uploadedFileName,
      );

      if (fileType === MessageFileEntityType.VIDEO) {
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

        this.files.delete(client.id);

        if (fileExtension !== 'mp4') {
          fs.unlinkSync(filePathForConvertation);
        }

        client.emit(GenericFileServerSocketKeys.UPLOAD_SUCCESS, {
          filePath: composeUploadedVideoUrl(String(convertedVideoFileName)),
        } as FileSocketSuccessOutput);

        return;
      }

      if (fileType === MessageFileEntityType.FILE) {
        client.emit(GenericFileServerSocketKeys.UPLOAD_SUCCESS, {
          filePath: composeUploadedFileUrl(uploadedFileName),
        } as FileSocketSuccessOutput);

        return;
      }

      client.emit(GenericFileServerSocketKeys.UPLOAD_SUCCESS, {
        filePath: composeUploadedImageUrl(uploadedFileName),
      } as FileSocketSuccessOutput);
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
