import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FILE_SIZE_LIMIT_IN_BYTES, FILES_PATH_DESTINATION } from './constants';
import { modifyFileName, SERVER_PATH } from 'src/core';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('files')
export class FileController {
  @Get(':filename')
  async serveImage(@Param('filename') filename: string, @Res() res: Response) {
    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'uploads',
      'files',
      filename,
    );

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.sendStatus(404);

        return;
      }

      res.sendFile(imagePath);
    });
  }

  @Delete(':filename')
  @HttpCode(200)
  async deleteFile(@Param('filename') filename: string) {
    const imagePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'uploads',
      'files',
      filename,
    );


    fs.unlinkSync(imagePath);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: FILES_PATH_DESTINATION,
        filename: modifyFileName,
      }),
      limits: {
        fileSize: FILE_SIZE_LIMIT_IN_BYTES,
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded or file type not allowed',
      );
    }

    const baseFilePath = `${SERVER_PATH}/api/files`;
    const filePath = `${baseFilePath}/${file.filename}`;

    return {
      filePath,
    };
  }
}
