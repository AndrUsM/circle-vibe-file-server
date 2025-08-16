import { Module } from "@nestjs/common";
import { BucketService } from "./bucket.service";

@Module({
  imports: [],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketServiceModule {}
