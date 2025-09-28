import { BucketCreateInputParams, BucketService } from '@core/services';
import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('bucket')
export class BucketController {
  constructor(
    private readonly bucketService: BucketService
  ) {}
  @Get(':id')
  async getBucketById(@Param() id: string, @Res() res, @Req() req) {
    const bucket = await this.bucketService.getBucketById(Number(id));

    if (!bucket) {
      res.sendStatus(404);
      return;
    }

    return bucket;
  }

  @Get(':name')
  async getBucketByName(@Param() name: string, @Res() res: Response, @Req() req: Request) {
    const bucket = await this.bucketService.getBucketByName(name);

    if (!bucket) {
      res.sendStatus(404);
      return;
    }

    return bucket;
  }

  @Post()
  async createBucket(@Body() body: BucketCreateInputParams, @Res() res: Response, @Req() req: Request) {
    const bucket = await this.bucketService.createBucket(body);

    if(!bucket) {  
      throw new NotFoundException();
    }

    res.json(bucket).sendStatus(201);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteBucket(@Param('id', ParseIntPipe) id: number) {
    this.bucketService.deleteBucket(id);
  }
}
