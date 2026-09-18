import { Router, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import { ArtworkStorageService } from '../services/storage';
import {
  ApiResponse,
  Artwork,
  ArtworkComment,
  ArtworkQueryOptions,
  ArtworkStats,
  CreateArtworkDto,
  CreateCommentDto,
  PaginatedArtworks
} from '../types/artwork';

interface ArtworkBody {
  title?: string;
  author?: string;
  description?: string;
  category?: string;
  tags?: string;
}

interface CommentBody {
  author?: string;
  text?: string;
}

async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Ignore error if file does not exist
  }
}

type SortOption = 'newest' | 'oldest' | 'popular';

const VALID_SORT_OPTIONS: ReadonlyArray<SortOption> = ['newest', 'oldest', 'popular'];
const VALID_CATEGORIES: ReadonlyArray<string> = ['Digital', 'Pixel Art', 'Illustration', '3D', 'Traditional', 'Anime'];

export function createArtworkRouter(storageService: ArtworkStorageService, upload: multer.Multer): Router {
  const router: Router = Router();

  // GET /api/artworks with query filtering, sorting, and pagination
  router.get('/', async (req: Request, res: Response<ApiResponse<PaginatedArtworks>>): Promise<void> => {
    try {
      const rawPageStr: string = typeof req.query.page === 'string' ? req.query.page : '';
      const rawLimitStr: string = typeof req.query.limit === 'string' ? req.query.limit : '';
      const rawPage: number = rawPageStr ? parseInt(rawPageStr, 10) : 1;
      const rawLimit: number = rawLimitStr ? parseInt(rawLimitStr, 10) : 12;
      const page: number = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
      const limit: number = isNaN(rawLimit) || rawLimit < 1 ? 12 : Math.min(rawLimit, 100);
      const rawSearch: string = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const search: string = rawSearch.slice(0, 100);
      const rawCategory: string = typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const category: string = rawCategory.slice(0, 50);
      const sortByRaw: string = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'newest';

      const sortBy: SortOption = VALID_SORT_OPTIONS.includes(sortByRaw as SortOption)
        ? (sortByRaw as SortOption)
        : 'newest';

      const queryOptions: ArtworkQueryOptions = {
        page,
        limit,
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

  // GET /api/artworks/stats
  router.get('/stats', async (_req: Request, res: Response<ApiResponse<ArtworkStats>>): Promise<void> => {
    try {
      const stats: ArtworkStats = await storageService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to retrieve community stats';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // GET /api/artworks/:id
  router.get('/:id', async (req: Request, res: Response<ApiResponse<Artwork>>): Promise<void> => {
    try {
      const artworkId: string = req.params.id;
      if (!artworkId || artworkId.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Artwork ID is required.' });
        return;
      }

      const artwork: Artwork | null = await storageService.getById(artworkId);
      if (!artwork) {
        res.status(404).json({ success: false, error: 'Artwork not found.' });
        return;
      }

      res.status(200).json({ success: true, data: artwork });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to retrieve artwork';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // DELETE /api/artworks/:id
  router.delete('/:id', async (req: Request, res: Response<ApiResponse<{ id: string }>>): Promise<void> => {
    try {
      const artworkId: string = req.params.id;
      if (!artworkId || artworkId.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Artwork ID is required.' });
        return;
      }

      const deleted: boolean = await storageService.delete(artworkId);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Artwork not found.' });
        return;
      }

      res.status(200).json({ success: true, data: { id: artworkId } });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to delete artwork';
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

  // GET /api/artworks/:id/comments
  router.get('/:id/comments', async (req: Request, res: Response<ApiResponse<ArtworkComment[]>>): Promise<void> => {
    try {
      const artworkId: string = req.params.id;
      if (!artworkId || artworkId.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Artwork ID is required.' });
        return;
      }

      const comments: ArtworkComment[] | null = await storageService.getComments(artworkId);
      if (!comments) {
        res.status(404).json({ success: false, error: 'Artwork not found.' });
        return;
      }

      res.status(200).json({ success: true, data: comments });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to retrieve comments';
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // POST /api/artworks/:id/comments
  router.post('/:id/comments', async (req: Request, res: Response<ApiResponse<ArtworkComment>>): Promise<void> => {
    try {
      const artworkId: string = req.params.id;
      if (!artworkId || artworkId.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Artwork ID is required.' });
        return;
      }

      const body: CommentBody = req.body;
      const author: string = typeof body.author === 'string' ? body.author.trim() : '';
      const text: string = typeof body.text === 'string' ? body.text.trim() : '';

      if (!author) {
        res.status(400).json({ success: false, error: 'Comment author name is required.' });
        return;
      }

      if (author.length > 60) {
        res.status(400).json({ success: false, error: 'Author name cannot exceed 60 characters.' });
        return;
      }

      if (!text) {
        res.status(400).json({ success: false, error: 'Comment text cannot be empty.' });
        return;
      }

      if (text.length > 500) {
        res.status(400).json({ success: false, error: 'Comment text cannot exceed 500 characters.' });
        return;
      }

      const commentDto: CreateCommentDto = { author, text };
      const createdComment: ArtworkComment | null = await storageService.addComment(artworkId, commentDto);

      if (!createdComment) {
        res.status(404).json({ success: false, error: 'Artwork not found.' });
        return;
      }

      res.status(201).json({ success: true, data: createdComment });
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : 'Failed to post comment';
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

        if (req.file.size === 0) {
          await safeDeleteFile(req.file.path);
          res.status(400).json({ success: false, error: 'Artwork image file cannot be empty.' });
          return;
        }

        const body: ArtworkBody = req.body;
        const title: string = typeof body.title === 'string' ? body.title.trim() : '';
        const author: string = typeof body.author === 'string' ? body.author.trim() : '';
        const description: string = typeof body.description === 'string' ? body.description.trim() : '';
        const rawCategory: string = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'Digital';
        const matchedCategory: string | undefined = VALID_CATEGORIES.find(
          (c: string): boolean => c.toLowerCase() === rawCategory.toLowerCase()
        );
        const category: string = matchedCategory || 'Digital';
        
        let tags: string[] = [];
        if (typeof body.tags === 'string' && body.tags.trim().length > 0) {
          const rawTokens: string[] = body.tags.split(/[,\s]+/);

          tags = rawTokens
            .map((t: string): string => t.trim().replace(/^#+/, '').slice(0, 30))
            .filter((t: string): boolean => t.length > 0)
            .slice(0, 10);
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
