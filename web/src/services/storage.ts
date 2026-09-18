import fs from 'fs';
import path from 'path';
import {
  Artwork,
  ArtworkComment,
  ArtworkQueryOptions,
  ArtworkStats,
  CreateArtworkDto,
  CreateCommentDto,
  PaginatedArtworks,
  RawArtworkRecord
} from '../types/artwork';

export class ArtworkStorageService {
  private readonly dataDir: string;
  private readonly dataFilePath: string;
  private readonly uploadsDir: string;
  private writeLock: Promise<void> = Promise.resolve();
  private cachedArtworks: Artwork[] | null = null;

  constructor(baseDir: string) {
    this.dataDir = path.join(baseDir, 'data');
    this.dataFilePath = path.join(this.dataDir, 'artworks.json');
    this.uploadsDir = path.join(baseDir, 'uploads');
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.dataFilePath)) {
      fs.writeFileSync(this.dataFilePath, JSON.stringify([], null, 2), 'utf-8');
      this.cachedArtworks = [];
    }
  }

  public getUploadsDir(): string {
    return this.uploadsDir;
  }

  public async getAll(): Promise<Artwork[]> {
    if (this.cachedArtworks !== null) {
      return [...this.cachedArtworks];
    }

    try {
      const fileContent: string = await fs.promises.readFile(this.dataFilePath, 'utf-8');
      const records: RawArtworkRecord[] = JSON.parse(fileContent);
      if (!Array.isArray(records)) {
        this.cachedArtworks = [];
        return [];
      }

      const validArtworks: Artwork[] = [];
      for (const item of records) {
        if (
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.author === 'string' &&
          typeof item.description === 'string' &&
          typeof item.imageUrl === 'string' &&
          typeof item.createdAt === 'string'
        ) {
          const category: string = typeof item.category === 'string' && item.category ? item.category : 'General';
          const likes: number = typeof item.likes === 'number' && item.likes >= 0 ? item.likes : 0;
          const tags: string[] = Array.isArray(item.tags)
            ? item.tags.filter((t: string): boolean => typeof t === 'string' && t.trim().length > 0)
            : [];

          const comments: ArtworkComment[] = [];
          if (Array.isArray(item.comments)) {
            for (const c of item.comments) {
              if (
                typeof c.id === 'string' &&
                typeof c.author === 'string' &&
                typeof c.text === 'string' &&
                typeof c.createdAt === 'string'
              ) {
                comments.push({
                  id: c.id,
                  author: c.author,
                  text: c.text,
                  createdAt: c.createdAt
                });
              }
            }
          }

          validArtworks.push({
            id: item.id,
            title: item.title,
            author: item.author,
            description: item.description,
            category,
            tags,
            imageUrl: item.imageUrl,
            likes,
            comments,
            createdAt: item.createdAt
          });
        }
      }
      this.cachedArtworks = validArtworks;
      return [...validArtworks];
    } catch {
      this.cachedArtworks = [];
      return [];
    }
  }

  public async query(options: ArtworkQueryOptions = {}): Promise<PaginatedArtworks> {
    const allArtworks: Artwork[] = await this.getAll();
    let filtered: Artwork[] = allArtworks;

    const category: string = typeof options.category === 'string' ? options.category.trim().toLowerCase() : '';
    if (category && category !== 'all') {
      filtered = filtered.filter((art: Artwork): boolean => art.category.toLowerCase() === category);
    }

    const searchTerm: string = typeof options.search === 'string' ? options.search.trim().toLowerCase() : '';
    if (searchTerm) {
      filtered = filtered.filter((art: Artwork): boolean => {
        const matchesTitle: boolean = art.title.toLowerCase().includes(searchTerm);
        const matchesAuthor: boolean = art.author.toLowerCase().includes(searchTerm);
        const matchesDesc: boolean = art.description.toLowerCase().includes(searchTerm);
        const matchesTags: boolean = art.tags.some((t: string): boolean => t.toLowerCase().includes(searchTerm));
        return matchesTitle || matchesAuthor || matchesDesc || matchesTags;
      });
    }

    const sortBy: string = options.sortBy || 'newest';
    if (sortBy === 'popular') {
      filtered.sort((a: Artwork, b: Artwork): number => b.likes - a.likes);
    } else if (sortBy === 'oldest') {
      filtered.sort((a: Artwork, b: Artwork): number => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Default: newest
      filtered.sort((a: Artwork, b: Artwork): number => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total: number = filtered.length;
    const page: number = typeof options.page === 'number' && options.page > 0 ? options.page : 1;
    const limit: number = typeof options.limit === 'number' && options.limit > 0 ? Math.min(options.limit, 100) : 12;
    const totalPages: number = total > 0 ? Math.ceil(total / limit) : 1;

    const startIndex: number = (page - 1) * limit;
    const paginatedArtworks: Artwork[] = filtered.slice(startIndex, startIndex + limit);

    return {
      artworks: paginatedArtworks,
      total,
      page,
      limit,
      totalPages
    };
  }

  public async create(dto: CreateArtworkDto, filename: string): Promise<Artwork> {
    return new Promise<Artwork>((resolve, reject): void => {
      this.writeLock = this.writeLock
        .then(async (): Promise<void> => {
          try {
            const artwork: Artwork = await this.performCreate(dto, filename);
            resolve(artwork);
          } catch (error) {
            reject(error);
          }
        })
        .catch((error): void => {
          reject(error);
        });
    });
  }

  public async like(id: string): Promise<Artwork | null> {
    return new Promise<Artwork | null>((resolve, reject): void => {
      this.writeLock = this.writeLock
        .then(async (): Promise<void> => {
          try {
            const artwork: Artwork | null = await this.performLike(id);
            resolve(artwork);
          } catch (error) {
            reject(error);
          }
        })
        .catch((error): void => {
          reject(error);
        });
    });
  }

  private async performCreate(dto: CreateArtworkDto, filename: string): Promise<Artwork> {
    const artworks: Artwork[] = await this.getAll();
    const uniqueId: string = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const category: string = dto.category && dto.category.trim() ? dto.category.trim() : 'Digital';
    const tags: string[] = Array.isArray(dto.tags)
      ? dto.tags.map((t: string): string => t.trim()).filter((t: string): boolean => t.length > 0)
      : [];

    const newArtwork: Artwork = {
      id: uniqueId,
      title: dto.title.trim(),
      author: dto.author.trim(),
      description: dto.description.trim(),
      category,
      tags,
      imageUrl: `/uploads/${filename}`,
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };

    artworks.unshift(newArtwork);
    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
    this.cachedArtworks = [...artworks];
    return newArtwork;
  }

  private async performLike(id: string): Promise<Artwork | null> {
    const artworks: Artwork[] = await this.getAll();
    const index: number = artworks.findIndex((art: Artwork): boolean => art.id === id);
    if (index === -1) {
      return null;
    }

    artworks[index].likes += 1;
    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
    this.cachedArtworks = [...artworks];
    return artworks[index];
  }

  public async getById(id: string): Promise<Artwork | null> {
    const artworks: Artwork[] = await this.getAll();
    const found: Artwork | undefined = artworks.find((art: Artwork): boolean => art.id === id);
    return found || null;
  }

  public async delete(id: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject): void => {
      this.writeLock = this.writeLock
        .then(async (): Promise<void> => {
          try {
            const success: boolean = await this.performDelete(id);
            resolve(success);
          } catch (error) {
            reject(error);
          }
        })
        .catch((error): void => {
          reject(error);
        });
    });
  }

  private async performDelete(id: string): Promise<boolean> {
    const artworks: Artwork[] = await this.getAll();
    const index: number = artworks.findIndex((art: Artwork): boolean => art.id === id);
    if (index === -1) {
      return false;
    }

    const removed: Artwork = artworks.splice(index, 1)[0];
    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
    this.cachedArtworks = [...artworks];

    if (removed.imageUrl && removed.imageUrl.startsWith('/uploads/')) {
      const filename: string = path.basename(removed.imageUrl);
      const filePath: string = path.join(this.uploadsDir, filename);
      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch {
        // Ignore file cleanup error
      }
    }

    return true;
  }

  public async addComment(id: string, dto: CreateCommentDto): Promise<ArtworkComment | null> {
    return new Promise<ArtworkComment | null>((resolve, reject): void => {
      this.writeLock = this.writeLock
        .then(async (): Promise<void> => {
          try {
            const comment: ArtworkComment | null = await this.performAddComment(id, dto);
            resolve(comment);
          } catch (error) {
            reject(error);
          }
        })
        .catch((error): void => {
          reject(error);
        });
    });
  }

  private async performAddComment(id: string, dto: CreateCommentDto): Promise<ArtworkComment | null> {
    const artworks: Artwork[] = await this.getAll();
    const index: number = artworks.findIndex((art: Artwork): boolean => art.id === id);
    if (index === -1) {
      return null;
    }

    const uniqueCommentId: string = 'cmt-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const newComment: ArtworkComment = {
      id: uniqueCommentId,
      author: dto.author.trim(),
      text: dto.text.trim(),
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(artworks[index].comments)) {
      artworks[index].comments = [];
    }
    artworks[index].comments.push(newComment);

    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
    this.cachedArtworks = [...artworks];
    return newComment;
  }

  public async getComments(id: string): Promise<ArtworkComment[] | null> {
    const artwork: Artwork | null = await this.getById(id);
    if (!artwork) {
      return null;
    }
    return [...(artwork.comments || [])];
  }

  public async getStats(): Promise<ArtworkStats> {
    const artworks: Artwork[] = await this.getAll();
    const totalArtworks: number = artworks.length;
    let totalLikes: number = 0;
    let totalComments: number = 0;
    const artistsSet: Set<string> = new Set<string>();
    const categoryCounts: Record<string, number> = {};

    for (const art of artworks) {
      totalLikes += art.likes;
      totalComments += Array.isArray(art.comments) ? art.comments.length : 0;
      const cleanAuthor: string = art.author.trim();
      if (cleanAuthor.length > 0) {
        artistsSet.add(cleanAuthor.toLowerCase());
      }
      const cat: string = art.category && art.category.trim() ? art.category.trim() : 'Digital';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return {
      totalArtworks,
      totalLikes,
      totalArtists: artistsSet.size,
      totalComments,
      categoryCounts
    };
  }
}
