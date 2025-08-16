import * as multer from 'multer';
import { Request } from 'express';

import { FileEntityType } from '@prisma/client';
import { FileInterceptor, MulterModuleOptions } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MULTER_MODULE_OPTIONS } from '@nestjs/platform-express/multer/files.constants';
import {
  ExecutionContext,
  Optional,
  Inject,
  CallHandler,
  mixin,
  Type,
  NestInterceptor,
} from '@nestjs/common';

import { BucketService } from '@core/services';
import { modifyFileName } from '@core/constants';

export const FileInterceptorWithRequestParams = (
  fieldName: string,
  entityType: FileEntityType,
  localOptions: (context: ExecutionContext) => MulterOptions,
) => {
  const FileInterceptorInstance = FileInterceptor(fieldName);

  class MixinInterceptor extends FileInterceptorInstance {
    protected multer: any;
    protected moduleOptions: {};

    constructor(
      @Optional()
      @Inject(MULTER_MODULE_OPTIONS)
      options: MulterModuleOptions = {},
      private readonly bucketService: BucketService
    ) {
      super();
      this.moduleOptions = options;
    }

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<any> {
      const req = context.switchToHttp().getRequest() as Request;
      const bucket = String(req.query.bucket);
      const destination = await this.bucketService.getBaseEntityFolder({ bucket, entityType }) ?? '';

      this.multer = (multer as any)({
        ...this.moduleOptions,
        ...localOptions(context),
        storage: multer.diskStorage({
          destination,
          filename: modifyFileName,
        }),
      });

      return super.intercept(context, next);
    }
  }

  const Interceptor = mixin(MixinInterceptor);
  return Interceptor as Type<NestInterceptor>;
};