import { FileEntityType } from "@prisma/client";

export const BUCKET_FOLDER: Record<FileEntityType, string> = {
  IMAGE: 'images',
  VIDEO: 'videos',
  FILE: 'files',
  AUDIO:'audio'
}
