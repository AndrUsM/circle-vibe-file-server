// video.controller.ts
import { Controller, Get, Header, Param, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

@Controller('video')
export class VideoController {
  @Get(':filename')
  async streamVideo(@Param('filename') filename: string, @Req() req: Request, @Res() res: Response) {
    const filePath = join(__dirname, '..', '..', 'uploads', filename);
    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const stream = createReadStream(filePath, { start, end });
      const contentLength = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4',
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      createReadStream(filePath).pipe(res);
    }
  }
}
