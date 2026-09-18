import fs from 'fs';
import path from 'path';
import { Artwork, CreateArtworkDto, RawArtworkRecord } from '../types/artwork';

export class ArtworkStorageService {
  private readonly dataDir: string;
  private readonly dataFilePath: string;
  private readonly uploadsDir: string;

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
          validArtworks.push({
            id: item.id,
            title: item.title,
            author: item.author,
            description: item.description,
            imageUrl: item.imageUrl,
            createdAt: item.createdAt
          });
        }
      }
      return validArtworks;
    } catch {
      return [];
    }
  }

  private writeLock: Promise<void> = Promise.resolve();

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

  private async performCreate(dto: CreateArtworkDto, filename: string): Promise<Artwork> {
    const artworks: Artwork[] = await this.getAll();
    const uniqueId: string = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    const newArtwork: Artwork = {
      id: uniqueId,
      title: dto.title,
      author: dto.author,
      description: dto.description,
      imageUrl: `/uploads/${filename}`,
      createdAt: new Date().toISOString()
    };

    artworks.unshift(newArtwork);
    await fs.promises.writeFile(this.dataFilePath, JSON.stringify(artworks, null, 2), 'utf-8');
    return newArtwork;
  }
}
