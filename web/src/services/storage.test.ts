import test, { TestContext } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { ArtworkStorageService } from './storage';
import {
  Artwork,
  ArtworkComment,
  ArtworkStats,
  CreateArtworkDto,
  CreateCommentDto,
  PaginatedArtworks
} from '../types/artwork';

const testBaseDir: string = path.join(__dirname, '..', '..', 'scratch_test_dir');

function cleanupTestDir(): void {
  if (fs.existsSync(testBaseDir)) {
    fs.rmSync(testBaseDir, { recursive: true, force: true });
  }
}

test('ArtworkStorageService Suite', async (t: TestContext): Promise<void> => {
  cleanupTestDir();

  await t.test('initializes directories and empty store', (): void => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const dataDir: string = path.join(testBaseDir, 'data');
    const uploadsDir: string = path.join(testBaseDir, 'uploads');
    const jsonPath: string = path.join(dataDir, 'artworks.json');

    assert.strictEqual(fs.existsSync(dataDir), true, 'Data directory must exist');
    assert.strictEqual(fs.existsSync(uploadsDir), true, 'Uploads directory must exist');
    assert.strictEqual(fs.existsSync(jsonPath), true, 'artworks.json file must exist');
    assert.strictEqual(service.getUploadsDir(), uploadsDir);
  });

  await t.test('creates artwork with categories, tags, and default likes', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const dto: CreateArtworkDto = {
      title: 'Neon Cyberpig',
      author: 'PinkyDev',
      description: 'Futuristic piglet in neon city',
      category: 'Pixel Art',
      tags: ['cyberpunk', 'neon', 'pig']
    };
    const filename: string = 'neon-pig.png';

    const created: Artwork = await service.create(dto, filename);

    assert.strictEqual(typeof created.id, 'string');
    assert.strictEqual(created.title, 'Neon Cyberpig');
    assert.strictEqual(created.author, 'PinkyDev');
    assert.strictEqual(created.category, 'Pixel Art');
    assert.deepStrictEqual(created.tags, ['cyberpunk', 'neon', 'pig']);
    assert.strictEqual(created.likes, 0);
    assert.strictEqual(created.imageUrl, '/uploads/neon-pig.png');
  });

  await t.test('increments artwork likes correctly', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const all: Artwork[] = await service.getAll();
    assert.strictEqual(all.length >= 1, true);

    const targetId: string = all[0].id;
    const updated: Artwork | null = await service.like(targetId);

    assert.notStrictEqual(updated, null);
    if (updated) {
      assert.strictEqual(updated.likes, 1);
    }

    const updatedAgain: Artwork | null = await service.like(targetId);
    assert.notStrictEqual(updatedAgain, null);
    if (updatedAgain) {
      assert.strictEqual(updatedAgain.likes, 2);
    }
  });

  await t.test('filters artworks by search and category', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);

    // Create another piece in a different category
    await service.create(
      {
        title: 'Watercolor Sunset Landscape',
        author: 'NatureArtist',
        description: 'Serene meadow at dusk',
        category: 'Traditional',
        tags: ['sunset', 'watercolor', 'nature']
      },
      'sunset.jpg'
    );

    const pixelCategoryResults: PaginatedArtworks = await service.query({ category: 'Pixel Art' });
    assert.strictEqual(pixelCategoryResults.artworks.length, 1);
    assert.strictEqual(pixelCategoryResults.artworks[0].category, 'Pixel Art');

    const searchResults: PaginatedArtworks = await service.query({ search: 'sunset' });
    assert.strictEqual(searchResults.artworks.length, 1);
    assert.strictEqual(searchResults.artworks[0].title, 'Watercolor Sunset Landscape');
  });

  await t.test('sorts artworks by popularity (likes)', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const popularResults: PaginatedArtworks = await service.query({ sortBy: 'popular' });

    assert.strictEqual(popularResults.artworks.length, 2);
    // First item should have higher likes (Neon Cyberpig has 2 likes)
    assert.strictEqual(popularResults.artworks[0].likes >= popularResults.artworks[1].likes, true);
  });

  await t.test('handles concurrent creations without race conditions', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const count: number = 5;

    const promises: Promise<Artwork>[] = [];
    for (let i: number = 0; i < count; i++) {
      const dto: CreateArtworkDto = {
        title: `Concurrent Artwork ${i}`,
        author: `Artist ${i}`,
        description: `Description ${i}`,
        category: 'Digital',
        tags: [`tag${i}`]
      };
      promises.push(service.create(dto, `image-${i}.png`));
    }

    const results: Artwork[] = await Promise.all(promises);
    assert.strictEqual(results.length, count);

    const all: Artwork[] = await service.getAll();
    // 2 existing + 5 = 7
    assert.strictEqual(all.length, 2 + count);
  });

  await t.test('retrieves artwork by id and handles delete', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const created: Artwork = await service.create(
      {
        title: 'Temporary Piece',
        author: 'TempArtist',
        description: 'To be deleted',
        category: 'Digital'
      },
      'temp-art.png'
    );

    const fetched: Artwork | null = await service.getById(created.id);
    assert.notStrictEqual(fetched, null);
    if (fetched) {
      assert.strictEqual(fetched.id, created.id);
      assert.strictEqual(fetched.title, 'Temporary Piece');
    }

    const deleteSuccess: boolean = await service.delete(created.id);
    assert.strictEqual(deleteSuccess, true);

    const fetchedAgain: Artwork | null = await service.getById(created.id);
    assert.strictEqual(fetchedAgain, null);

    const nonExistentDelete: boolean = await service.delete('fake-id-999');
    assert.strictEqual(nonExistentDelete, false);
  });

  await t.test('handles comments lifecycle and retrieval', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const created: Artwork = await service.create(
      {
        title: 'Critique Target Piece',
        author: 'CriticArtist',
        description: 'Open to feedback',
        category: 'Digital'
      },
      'critique.png'
    );

    const initialComments: ArtworkComment[] | null = await service.getComments(created.id);
    assert.notStrictEqual(initialComments, null);
    if (initialComments) {
      assert.strictEqual(initialComments.length, 0);
    }

    const commentDto: CreateCommentDto = {
      author: 'ArtReviewer',
      text: 'Incredible lighting and composition!'
    };

    const added: ArtworkComment | null = await service.addComment(created.id, commentDto);
    assert.notStrictEqual(added, null);
    if (added) {
      assert.strictEqual(typeof added.id, 'string');
      assert.strictEqual(added.author, 'ArtReviewer');
      assert.strictEqual(added.text, 'Incredible lighting and composition!');
      assert.strictEqual(typeof added.createdAt, 'string');
    }

    const fetchedComments: ArtworkComment[] | null = await service.getComments(created.id);
    assert.notStrictEqual(fetchedComments, null);
    if (fetchedComments) {
      assert.strictEqual(fetchedComments.length, 1);
      assert.strictEqual(fetchedComments[0].author, 'ArtReviewer');
    }

    const nonExistentComment: ArtworkComment | null = await service.addComment('fake-id', commentDto);
    assert.strictEqual(nonExistentComment, null);

    const nonExistentGet: ArtworkComment[] | null = await service.getComments('fake-id');
    assert.strictEqual(nonExistentGet, null);
  });

  await t.test('computes community statistics accurately', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const stats: ArtworkStats = await service.getStats();

    assert.strictEqual(typeof stats.totalArtworks, 'number');
    assert.strictEqual(typeof stats.totalLikes, 'number');
    assert.strictEqual(typeof stats.totalArtists, 'number');
    assert.strictEqual(typeof stats.totalComments, 'number');
    assert.strictEqual(typeof stats.categoryCounts, 'object');

    assert.strictEqual(stats.totalArtworks >= 2, true);
    assert.strictEqual(stats.totalLikes >= 2, true);
    assert.strictEqual(stats.totalArtists >= 2, true);
    assert.strictEqual(stats.totalComments >= 1, true);
  });

  cleanupTestDir();
});
