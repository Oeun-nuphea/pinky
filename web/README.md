# Pinky Artwork Web Application 🐷🎨

A full-featured web application that allows users to upload, publish, and browse artwork.

---

## Features
- **Upload Artwork:** Users can provide an artwork title, author name, optional description, and select/drag-and-drop an image.
- **Image Validation & Preview:** Real-time client-side preview with size (<= 10MB) and file format checking (JPG, PNG, GIF, WEBP, SVG).
- **Gallery Feed:** Live gallery displaying artwork cards, author information, submission dates, and empty/loading states.
- **Lightbox Viewer:** Click any artwork in the gallery to inspect the high-resolution image in a modal viewer.
- **REST API:** Clean JSON endpoints for retrieving and posting artworks.
- **Strict TypeScript:** Strictly typed backend without `any` or `unknown` types.

---

## Directory Structure
```text
web/
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   └── artwork.ts       # TypeScript interfaces for artworks and API responses
│   ├── services/
│   │   └── storage.ts       # Filesystem and JSON database storage service
│   ├── routes/
│   │   └── artwork.ts       # Express router for GET and POST endpoints
│   └── server.ts            # Server entrypoint with Multer upload middleware
└── public/
    ├── index.html           # Single-page web interface
    ├── styles.css           # Responsive modern styling
    └── app.js               # Frontend AJAX interaction, preview, and lightbox
```

---

## How to Run

### 1. Install Dependencies
Navigate into the `web` directory and install the required npm packages:
```bash
cd web
npm install
```

### 2. Run in Development Mode
Start the development server with hot-reload via `ts-node`:
```bash
npm run dev
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your web browser.

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```

### 6. Run with Docker Compose
To run the containerized application:
```bash
docker compose up --build
```

---

## REST API Reference

### `GET /api/health`
Returns service health status, timestamp, and uptime in seconds.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-18T04:20:00.000Z",
  "uptimeSeconds": 124
}
```

### `GET /api/artworks`
Returns paginated artworks with optional search, category filtering, and sorting.

**Query Parameters:**
- `page` (number, default: 1): Page index.
- `limit` (number, default: 12): Items per page.
- `search` (string, optional): Search term matching title, author, description, or tags.
- `category` (string, optional): Category filter (e.g., `Digital`, `Pixel Art`, `Illustration`, `3D`, `Traditional`, `Anime`).
- `sortBy` (`newest` | `popular` | `oldest`, default: `newest`): Sort order.

**Response:**
```json
{
  "success": true,
  "data": {
    "artworks": [
      {
        "id": "m1ab2c",
        "title": "Neon Cyber Piglet",
        "author": "Pinky",
        "description": "Futuristic digital art",
        "category": "Pixel Art",
        "tags": ["cyberpunk", "neon"],
        "imageUrl": "/uploads/artwork-1726631234567-891234567.png",
        "likes": 5,
        "createdAt": "2026-09-18T04:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
}
```

### `POST /api/artworks`
Uploads a new artwork. Requires `multipart/form-data`.

**Form Fields:**
- `title` (string, required, max: 100): Artwork title.
- `author` (string, required, max: 60): Artist or user's name.
- `description` (string, optional, max: 500): Description or notes.
- `category` (string, optional): Category name (e.g., `Digital`, `Pixel Art`).
- `tags` (string, optional): Comma-separated list of tags.
- `image` (file, required): Image file (PNG, JPG, GIF, WEBP, SVG up to 10MB).

### `POST /api/artworks/:id/like`
Increments the like count of the specified artwork.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "m1ab2c",
    "title": "Neon Cyber Piglet",
    "likes": 6
  }
}
```
