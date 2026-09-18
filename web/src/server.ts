import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import { ArtworkStorageService } from './services/storage';
import { createArtworkRouter } from './routes/artwork';

const app: Express = express();
const port: number = parseInt(process.env.PORT || '3000', 10);
const baseDir: string = path.resolve(__dirname, '..');

const storageService: ArtworkStorageService = new ArtworkStorageService(baseDir);

const diskStorage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, callback: (error: Error | null, destination: string) => void): void => {
    callback(null, storageService.getUploadsDir());
  },
  filename: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void): void => {
    const ext: string = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix: string = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `artwork-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  const allowedExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  const ext: string = path.extname(file.originalname).toLowerCase();
  const mime: string = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only JPG, PNG, GIF, WEBP, and SVG images are permitted.'));
  }
};

const upload: multer.Multer = multer({
  storage: diskStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicDir: string = path.join(baseDir, 'public');
app.use(express.static(publicDir));

// Serve uploaded images
app.use('/uploads', express.static(storageService.getUploadsDir()));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// API routes
app.use('/api/artworks', createArtworkRouter(storageService, upload));

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (res.headersSent) {
    _next(err);
    return;
  }
  const isClientError: boolean = err instanceof multer.MulterError || err.message.includes('Invalid file type');
  const statusCode: number = isClientError ? 400 : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(port, (): void => {
  console.log(`Pinky Artwork Web Application running at http://localhost:${port}`);
});

export default app;
