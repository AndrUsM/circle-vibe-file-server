import { FileEntityType } from '@prisma/client';
import { STORAGE_PATH } from '@core/constants';

import { BUCKET_FOLDER } from './bucket-folder';

export const BUCKET_FOLDERS: string[] = Object.values(BUCKET_FOLDER);

export const BUCKET_FOLDER_FULL_PATHS_MAP = (
  bucketFolder: string,
): Record<FileEntityType, string> => ({
  [FileEntityType.IMAGE]: `${STORAGE_PATH}/${bucketFolder}/${BUCKET_FOLDER.IMAGE}`,
  [FileEntityType.VIDEO]: `${STORAGE_PATH}/${bucketFolder}/${BUCKET_FOLDER.VIDEO}`,
  [FileEntityType.FILE]: `${STORAGE_PATH}/${bucketFolder}/${BUCKET_FOLDER.FILE}`,
  [FileEntityType.AUDIO]: `${STORAGE_PATH}/${bucketFolder}/${BUCKET_FOLDER.AUDIO}`,
});

export const BUCKET_FOLDER_FULL_PATHS = (bucketFolder: string): string[] =>
  Object.values(BUCKET_FOLDER_FULL_PATHS_MAP(bucketFolder));

export const BUCKET_BASE_PATH = (bucketFolder: string) => `${STORAGE_PATH}/${bucketFolder}`;