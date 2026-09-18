import { Router, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import { ArtworkStorageService } from '../services/storage';
import {
  ApiResponse,
  Artwork,
  ArtworkQueryOptions,
  CreateArtworkDto,
  PaginatedArtworks
} from '../types/artwork';

interface ArtworkBody {
  title?: string;
  author?: string;
  description?: string;
  category?: string;
  tags?: string;
}

async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Ignore error if file does not exist
  }
}

export function createArtworkRouter(storageService: ArtworkStorageService, upload: multer.Multer): Router {
  const router: Router = Router();

  // GET /api/artworks with query filtering, sorting, and pagination
  router.get('/', async (req: Request, res: Response<ApiResponse<PaginatedArtworks>>): Promise<void> => {
    try {
      const page: number = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit: number = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      const search: string = typeof req.query.search === 'string' ? req.query.search : '';
      const category: string = typeof req.query.category === 'string' ? req.query.category : '';
      const sortByRaw: string = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'newest';

      const validSortOptions: Array<'newest' | 'oldest' | 'popular'> = ['newest', 'oldest', 'popular'];
      const sortBy: 'newest' | 'oldest' | 'popular' = validSortOptions.includes(sortByRaw as 'newest' | 'oldest' | 'popular')
        ? (sortByRaw as 'newest' | 'oldest' | 'popular')
        : 'newest';

      const queryOptions: ArtworkQueryOptions = {
        page: isNaN(page) ? 1 : page,
        limit: isNaN(limit) ? 12 : limit,
        search,
        category,
        sortBy
      };

      const result: PaginatedArtworks = await storageService.query(queryOptions);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to retrieve artworks';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // POST /api/artworks/:id/like
  router.post('/:id/like', async (req: Request, res: Response<ApiResponse<Artwork>>): Promise<void> => {
    try {
      const artworkId: string = req.params.id;
      if (!artworkId || artworkId.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Artwork ID is required.' });
        return;
      }

      const updatedArtwork: Artwork | null = await storageService.like(artworkId);
      if (!updatedArtwork) {
        res.status(404).json({ success: false, error: 'Artwork not found.' });
        return;
      }

      res.status(200).json({ success: true, data: updatedArtwork });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to like artwork';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // POST /api/artworks
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
        const category: string = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Digital';
        
        let tags: string[] = [];
        if (typeof body.tags === 'string' && body.tags.trim().length > 0) {
          tags = body.tags.split(',').map((t: string): string => t.trim()).filter((t: string): boolean => t.length > 0);
        }

        if (!title) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Artwork title is required.' });
          return;
        }

        if (title.length > 100) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Artwork title cannot exceed 100 characters.' });
          return;
        }

        if (!author) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Artist/Author name is required.' });
          return;
        }

        if (author.length > 60) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Artist/Author name cannot exceed 60 characters.' });
          return;
        }

        if (description.length > 500) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Description cannot exceed 500 characters.' });
          return;
        }

        const dto: CreateArtworkDto = {
          title,
          author,
          description,
          category,
          tags
        };

        const created: Artwork = await storageService.create(dto, req.file.filename);
        res.status(201).json({ success: true, data: created });
      } catch (error) {
        if (req.file) {
          await safeDeleteFile(req.file.path);
        }
        const errorMessage: string = error instanceof Error ? error.message : 'Failed to save artwork';
        res.status(500).json({ success: false, error: errorMessage });
      }
    }
  );

  return router;
}
