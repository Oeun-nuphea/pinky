import fs from 'fs';
import path from 'path';
import {
  Artwork,
  ArtworkQueryOptions,
  CreateArtworkDto,
  PaginatedArtworks,
  RawArtworkRecord
} from '../types/artwork';

export class ArtworkStorageService {
  private readonly dataDir: string;
  private readonly dataFilePath: string;
  private readonly uploadsDir: string;
  private writeLock: Promise<void> = Promise.resolve();

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
    }
  }

  public getUploadsDir(): string {
    return this.uploadsDir;
  }

  public async getAll(): Promise<Artwork[]> {
    try {
      const fileContent: string = await fs.promises.readFile(this.dataFilePath, 'utf-8');
      const records: RawArtworkRecord[] = JSON.parse(fileContent);
      if (!Array.isArray(records)) {
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

          validArtworks.push({
            id: item.id,
            title: item.title,
            author: item.author,
            description: item.description,
            category,
            tags,
            imageUrl: item.imageUrl,
            likes,
            createdAt: item.createdAt
          });
        }
      }
      return validArtworks;
    } catch {
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
      createdAt: new Date().toISOString()
    };

    artworks.unshift(newArtwork);
    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
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
    return artworks[index];
  }
}
