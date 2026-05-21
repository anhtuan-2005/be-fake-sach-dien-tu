declare module 'bcrypt';
declare module 'multer';

declare namespace Express {
  interface Request {
    user?: any;
    file?: any;
    files?: any;
  }
}
