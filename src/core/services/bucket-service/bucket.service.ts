import { Bucket } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';

import * as Randomstring from 'randomstring';
import * as fs from 'fs';

import { DatabaseService } from '@core/database';

import { BucketComposeOutputFolderInputParams, BucketCreateInputParams, BucketReadFileInputParams, BucketUpdateInputParams } from './params';
import { BUCKET_BASE_PATH, BUCKET_FOLDER_FULL_PATHS, BUCKET_FOLDER_FULL_PATHS_MAP } from './constants';

@Injectable()
export class BucketService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getFilePath(params: BucketReadFileInputParams): Promise<string | null> {
    const { bucket, entityType, filename } = params;
    const bucketFull = await this.databaseService.bucket.findFirst({ where: { name: bucket }, select: { folder: true } });

    if (!entityType || !bucketFull?.folder) {
      return null;
    }

    const pathByEntity = BUCKET_FOLDER_FULL_PATHS_MAP(bucketFull?.folder)[entityType];

    return [pathByEntity, filename].join('/');
  }

  async getBaseEntityFolder(params: BucketComposeOutputFolderInputParams): Promise<string | null> {
    const { entityType, bucket } = params;
    const bucketFull = await this.databaseService.bucket.findFirst({ where: { name: bucket }, select: { folder: true } });

    if (!bucketFull?.folder ){
      return null;
    }

    return BUCKET_FOLDER_FULL_PATHS_MAP(bucketFull?.folder)[entityType];
  }

  getBaseFolder(bucketFolder: string): string {
    return BUCKET_BASE_PATH(bucketFolder);
  }

  async deleteFile(params: BucketReadFileInputParams): Promise<void> {
    try {
      const filePath = await this.getFilePath(params);
      if (filePath) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      Logger.log(error);
    }
  }

  async createBucket(params: BucketCreateInputParams): Promise<Bucket | null> {
    const { name, description } = params;

    const folder = this.generateFolderName();

    try {
      const bucket = await this.databaseService.bucket.create({
        data: {
          name,
          description,
          folder,
        }
      });

      await this.createBucketFolders(bucket);

      return bucket;
    } catch (error) {
      return null;
    }
  }

  async updateBucket(params: BucketUpdateInputParams): Promise<Bucket | null> {
    const { id, name, description } = params;
    const folder = this.generateFolderName();

    try {
      return this.databaseService.bucket.update({
        where: {
          id,
        },
        data: {
          name,
          description,
        }
      });
    } catch (error) {
      return null;
    }
  }

  deleteBucket(id: number): void {
    try {
      this.databaseService.bucket.delete({ where: { id } })
    } catch (error) {
      Logger.error(error);
    }
  }

  async createBucketFolders(bucket: Bucket): Promise<void> {
    const bucketFolder = this.getBaseFolder(bucket.folder);

    try {
      if (!fs.existsSync(bucketFolder)) {
        fs.mkdirSync(bucketFolder, { recursive: true });
      }


      BUCKET_FOLDER_FULL_PATHS(bucket.folder).forEach(filePath => {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath, {
            recursive: true,
          });
        }
      })
    } catch (error) {
      Logger.error(error);
    }
  }

  generateFolderName(): string {
    return Randomstring.generate({
      length: 10,
      readable: true,
      charset: 'alphanumeric',
      capitalization: 'lowercase',
    });
  }

  async checkIfBucketExists(name: string): Promise<boolean> {
    const bucket = await this.databaseService.bucket.findFirst({ where: { name }, select: { id: true } });

    return Boolean(bucket);
  }

  async getBucketById(id: number): Promise<Bucket | null> {
    return this.databaseService.bucket.findFirst({ where: { id } });
  }

  async getBucketByName(name: string): Promise<Bucket | null> {
    return this.databaseService.bucket.findFirst({ where: { name } });
  }
}
