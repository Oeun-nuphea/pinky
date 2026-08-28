import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  bio: string;
  githubUrl: string;
  followers: string[]; // userIds
  following: string[]; // userIds
  createdAt: string;
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  debFilename: string;
  debPath: string;
  architecture: string;
  fileSize: number;
  sha256: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerAvatar: string;
  title: string;
  slug: string;
  description: string;
  category: 'CLI' | 'Linux' | 'Terminal Art' | 'DevTools' | 'AI' | 'Games' | 'API' | 'Web';
  tags: string[];
  readmeContent: string;
  githubUrl?: string;
  installCmd: string;
  demoCmd: string;
  demoArgs: string[];
  isLiveSupported: boolean;
  previewGif?: string;   // optional GIF/image shown as lightweight preview
  starsCount: number;
  likesCount: number;
  runsCount: number;
  starredBy: string[]; // userIds
  likedBy: string[]; // userIds
  releases: Release[];
  createdAt: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dbPath = path.join(__dirname, '../../data/db.json');
  public users: User[] = [];
  public projects: Project[] = [];
  public comments: Comment[] = [];

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.projects = parsed.projects || [];
        this.comments = parsed.comments || [];
        return;
      } catch (e) {
        console.error('Failed to parse db.json, re-initializing seed data', e);
      }
    }

    this.seedInitialData();
    this.saveData();
  }

  public saveData() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.dbPath,
        JSON.stringify(
          {
            users: this.users,
            projects: this.projects,
            comments: this.comments,
          },
          null,
          2,
        ),
      );
    } catch (e) {
      console.error('Failed to save db.json', e);
    }
  }

  private seedInitialData() {
    // Seed initial demo users
    const aliceId = 'usr_alice';
    const bobId = 'usr_bob';
    const pinkyDevId = 'usr_pinky';

    this.users = [
      {
        id: pinkyDevId,
        username: 'pinky_creator',
        name: 'Pinky Core Team',
        email: 'dev@pinky.io',
        passwordHash: '$2a$10$w8Tf0N1Z/rY6L2Wk2c1QeO8nE0sZ.X7aW9v1c2b3a4s5d6e7f8g9', // dummy hash
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        bio: 'Building Pinky: Experience and run developer projects live in your browser & APT package ecosystem.',
        githubUrl: 'https://github.com/poetaman/arttime',
        followers: [aliceId, bobId],
        following: [aliceId],
        createdAt: new Date().toISOString(),
      },
      {
        id: aliceId,
        username: 'poetaman',
        name: 'Poetaman Technical Creator',
        email: 'poetaman@arttime.org',
        passwordHash: '$2a$10$w8Tf0N1Z/rY6L2Wk2c1QeO8nE0sZ.X7aW9v1c2b3a4s5d6e7f8g9',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Creator of arttime — Beauty in the terminal. ASCII art, live updates, and terminal aesthetics.',
        githubUrl: 'https://github.com/poetaman/arttime',
        followers: [pinkyDevId],
        following: [pinkyDevId, bobId],
        createdAt: new Date().toISOString(),
      },
      {
        id: bobId,
        username: 'matrix_hacker',
        name: 'Neo Terminal',
        email: 'neo@matrix.io',
        passwordHash: '$2a$10$w8Tf0N1Z/rY6L2Wk2c1QeO8nE0sZ.X7aW9v1c2b3a4s5d6e7f8g9',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Low-level systems hacker, Linux package distribution advocate, and terminal UI enthusiast.',
        githubUrl: 'https://github.com/cmatrix',
        followers: [aliceId],
        following: [pinkyDevId],
        createdAt: new Date().toISOString(),
      },
    ];

    // Seed initial projects
    this.projects = [
      {
        id: 'proj_arttime',
        ownerId: aliceId,
        ownerUsername: 'poetaman',
        ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'arttime',
        slug: 'arttime',
        description: 'Terminal art and live clock tool bringing aesthetic ANSI animations and custom widgets directly into your shell session.',
        category: 'Terminal Art',
        tags: ['CLI', 'Linux', 'Terminal', 'Animation', 'ASCII'],
        readmeContent: `# arttime

Beauty in your terminal. **arttime** brings curated ASCII art, vibrant terminal color palettes, and real-time updating clock widgets directly to your shell.

## Features
- Real-time ANSI clock & ASCII art integration
- Customizable theme palettes and color cycling
- Low resource usage & isolated execution support
- Debian \`.deb\` distribution compatible with \`apt install arttime\`

## Usage
Run directly from terminal:
\`\`\`bash
arttime
\`\`\`
`,
        githubUrl: 'https://github.com/poetaman/arttime',
        installCmd: 'sudo apt update && sudo apt install arttime',
        demoCmd: 'python3',
        demoArgs: ['backend/demos/arttime_demo.py'],
        isLiveSupported: true,
        previewGif: 'https://user-images.githubusercontent.com/71736629/177451474-4d868e17-d577-4500-adaa-f00c49bc78b7.gif',
        starsCount: 540,
        likesCount: 1200,
        runsCount: 3840,
        starredBy: [pinkyDevId, bobId],
        likedBy: [pinkyDevId, bobId],
        releases: [
          {
            id: 'rel_arttime_1',
            projectId: 'proj_arttime',
            version: '2.4.0',
            debFilename: 'arttime_2.4.0_amd64.deb',
            debPath: '/public/pool/main/a/arttime/arttime_2.4.0_amd64.deb',
            architecture: 'amd64',
            fileSize: 1048576,
            sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'proj_pinky_cli',
        ownerId: pinkyDevId,
        ownerUsername: 'pinky_creator',
        ownerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        title: 'pinky-cli',
        slug: 'pinky-cli',
        description: 'Official Pinky developer social CLI. Experience interactive project discovery, package verification, and terminal sandboxing from your command line.',
        category: 'CLI',
        tags: ['CLI', 'DevTools', 'Linux', 'PackageDistribution', 'APT'],
        readmeContent: `# pinky-cli

Official command line application for the Pinky developer platform.

## Quick Start
\`\`\`bash
sudo apt update
sudo apt install pinky
pinky-cli
\`\`\`
`,
        githubUrl: 'https://github.com/poetaman/arttime',
        installCmd: 'sudo apt update && sudo apt install pinky',
        demoCmd: 'python3',
        demoArgs: ['backend/demos/pinky_cli_demo.py'],
        isLiveSupported: true,
        starsCount: 890,
        likesCount: 2150,
        runsCount: 4920,
        starredBy: [aliceId, bobId],
        likedBy: [aliceId, bobId],
        releases: [
          {
            id: 'rel_pinky_1',
            projectId: 'proj_pinky_cli',
            version: '1.0.0',
            debFilename: 'pinky_1.0.0_all.deb',
            debPath: '/public/pool/main/p/pinky/pinky_1.0.0_all.deb',
            architecture: 'all',
            fileSize: 610,
            sha256: '7f93b59368d4a9840ef7bf4b1ab23871f3bb91a1a73404c0d02462e08e64c398',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ];

    // Seed comments
    this.comments = [
      {
        id: 'cm_1',
        projectId: 'proj_arttime',
        userId: bobId,
        username: 'matrix_hacker',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        content: 'Tried the live demo straight from the feed and installed it via apt in 10 seconds! Loving the ANSI clock animation.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'cm_2',
        projectId: 'proj_pinky_cli',
        userId: aliceId,
        username: 'poetaman',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'This live sandbox container feature is a game changer for technical projects! Super clean experience.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];
  }
}
