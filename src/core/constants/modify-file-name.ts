import { extname } from 'path';

/**
 * Modify the filename of the uploaded file to ensure it has a unique name
 * @param {Request} req - The request object
 * @param {File} file - The file object
 * @param {Function} callback - The function to call with the modified filename
 * @returns {void}
 */
export const modifyFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0].replace(/\s+/g, '-');
  const ext = extname(file.originalname);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  callback(null, `${name}-${uniqueSuffix}${ext}`);
};
