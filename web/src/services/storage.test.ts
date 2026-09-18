import test, { TestContext } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { ArtworkStorageService } from './storage';
import { Artwork, CreateArtworkDto } from '../types/artwork';

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

  await t.test('creates and retrieves a new artwork', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const dto: CreateArtworkDto = {
      title: 'Test Masterpiece',
      author: 'Tester',
      description: 'Unit test description'
    };
    const filename: string = 'test-image.png';

    const created: Artwork = await service.create(dto, filename);

    assert.strictEqual(typeof created.id, 'string');
    assert.strictEqual(created.title, 'Test Masterpiece');
    assert.strictEqual(created.author, 'Tester');
    assert.strictEqual(created.description, 'Unit test description');
    assert.strictEqual(created.imageUrl, '/uploads/test-image.png');
    assert.strictEqual(typeof created.createdAt, 'string');

    const all: Artwork[] = await service.getAll();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].id, created.id);
  });

  await t.test('handles concurrent creations without race conditions', async (): Promise<void> => {
    const service: ArtworkStorageService = new ArtworkStorageService(testBaseDir);
    const count: number = 5;

    const promises: Promise<Artwork>[] = [];
    for (let i: number = 0; i < count; i++) {
      const dto: CreateArtworkDto = {
        title: `Concurrent Artwork ${i}`,
        author: `Artist ${i}`,
        description: `Description ${i}`
      };
      promises.push(service.create(dto, `image-${i}.png`));
    }

    const results: Artwork[] = await Promise.all(promises);
    assert.strictEqual(results.length, count);

    const all: Artwork[] = await service.getAll();
    // 1 from previous test + 5 from concurrent test = 6
    assert.strictEqual(all.length, 1 + count);
  });

  // Cleanup after tests
  cleanupTestDir();
});
