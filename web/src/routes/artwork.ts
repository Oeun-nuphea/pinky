import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ArtworkStorageService } from '../services/storage';
import { ApiResponse, Artwork, CreateArtworkDto } from '../types/artwork';

interface ArtworkBody {
  title?: string;
  author?: string;
  description?: string;
}

export function createArtworkRouter(storageService: ArtworkStorageService, upload: multer.Multer): Router {
  const router: Router = Router();

  router.get('/', async (_req: Request, res: Response<ApiResponse<Artwork[]>>): Promise<void> => {
    try {
      const artworks: Artwork[] = await storageService.getAll();
      res.status(200).json({ success: true, data: artworks });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to retrieve artworks';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  router.post(
    '/',
    upload.single('image'),
    async (req: Request, res: Response<ApiResponse<Artwork>>): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({ success: false, error: 'Artwork image is required.' });
          return;
        }

        const body: ArtworkBody = req.body;
        const title: string = typeof body.title === 'string' ? body.title.trim() : '';
        const author: string = typeof body.author === 'string' ? body.author.trim() : '';
        const description: string = typeof body.description === 'string' ? body.description.trim() : '';

        if (!title) {
          res.status(400).json({ success: false, error: 'Artwork title is required.' });
          return;
        }

        if (!author) {
          res.status(400).json({ success: false, error: 'Artist/Author name is required.' });
          return;
        }

        const dto: CreateArtworkDto = {
          title,
          author,
          description
        };

        const created: Artwork = await storageService.create(dto, req.file.filename);
        res.status(201).json({ success: true, data: created });
      } catch (error) {
        const errorMessage: string = error instanceof Error ? error.message : 'Failed to save artwork';
        res.status(500).json({ success: false, error: errorMessage });
      }
    }
  );

  return router;
}
