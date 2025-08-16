import * as fs from 'fs';
import { Response } from 'express';

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileEntityType } from '@prisma/client';

import { FileInterceptorWithRequestParams } from '@core/interceptors';
import { BucketService } from '@core/services';

import { FILE_SIZE_LIMIT_IN_BYTES } from './constants';

@Controller('files')
export class FileController {

  constructor(
    private readonly bucketService: BucketService,
  ) {}

  @Get(':filename')
  async serveImage(@Param('filename') filename: string, @Query('bucket') bucket: string, @Res() res: Response) {
    const filePath = await this.bucketService.getFilePath({
      bucket,
      entityType: FileEntityType.FILE,
      filename,
    });

    if (!filePath) {
      res.sendStatus(400);
      return;
    }

    console.log(filePath)
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.sendStatus(404);

        return;
      }

      res.sendFile(filePath);
    });
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteFile(@Param('filename') filename: string, @Query('bucket') bucket: string,) {
    this.bucketService.deleteFile({
      bucket,
      entityType: FileEntityType.FILE,
      filename,
    });
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptorWithRequestParams('file', FileEntityType.FILE, () => ({
      limits: {
        fileSize: FILE_SIZE_LIMIT_IN_BYTES,
      },
    })),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file type not allowed',
      );
    }

    const baseFilePath = 'files';
    const filePath = `${baseFilePath}/${file.filename}`;

    return {
      filePath,
    };
  }
}
