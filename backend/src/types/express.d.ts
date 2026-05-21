import { JWTPayload } from './types';
import 'multer';

declare module 'bcrypt';
declare module 'multer';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}
