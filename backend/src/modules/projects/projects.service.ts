import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService, Project, Comment, Release } from '../../db/database.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProjectsService {
  constructor(private readonly db: DatabaseService) {}

  getAllProjects(query: { category?: string; tag?: string; search?: string; sort?: 'trending' | 'latest' | 'stars' }) {
    let list = [...this.db.projects];

    if (query.category && query.category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === query.category.toLowerCase());
    }

    if (query.tag) {
      list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === query.tag.toLowerCase()));
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.ownerUsername.toLowerCase().includes(q),
      );
    }

    if (query.sort === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (query.sort === 'stars') {
      list.sort((a, b) => b.starsCount - a.starsCount);
    } else {
      // Trending: weighted stars + likes + runs
      list.sort((a, b) => {
        const scoreA = a.starsCount * 3 + a.likesCount * 2 + a.runsCount * 1;
        const scoreB = b.starsCount * 3 + b.likesCount * 2 + b.runsCount * 1;
        return scoreB - scoreA;
      });
    }

    return list;
  }

  getProjectBySlug(slug: string) {
    const project = this.db.projects.find((p) => p.slug.toLowerCase() === slug.toLowerCase() || p.id === slug);
    if (!project) {
      throw new NotFoundException(`Project ${slug} not found`);
    }

    const comments = this.db.comments
      .filter((c) => c.projectId === project.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { project, comments };
  }

  createProject(user: any, dto: {
    title: string;
    description: string;
    category: any;
    tags: string[];
    readmeContent?: string;
    githubUrl?: string;
    demoCmd?: string;
    demoArgs?: string[];
  }) {
    if (!dto.title || !dto.description) {
      throw new BadRequestException('Title and description are required');
    }

    const slug = dto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = this.db.projects.find((p) => p.slug === slug);
    const finalSlug = existing ? `${slug}-${Date.now().toString(36).substr(2, 4)}` : slug;

    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ownerId: user.id,
      ownerUsername: user.username,
      ownerAvatar: user.avatarUrl,
      title: dto.title,
      slug: finalSlug,
      description: dto.description,
      category: dto.category || 'CLI',
      tags: dto.tags || ['CLI', 'DevTools'],
      readmeContent: dto.readmeContent || `# ${dto.title}\n\n${dto.description}`,
      githubUrl: dto.githubUrl || `https://github.com/${user.username}/${finalSlug}`,
      installCmd: `sudo apt update && sudo apt install ${finalSlug}`,
      demoCmd: dto.demoCmd || 'python3',
      demoArgs: dto.demoArgs || ['backend/demos/pinky_cli_demo.py'],
      isLiveSupported: true,
      starsCount: 1,
      likesCount: 1,
      runsCount: 0,
      starredBy: [user.id],
      likedBy: [user.id],
      releases: [],
      createdAt: new Date().toISOString(),
    };

    this.db.projects.unshift(newProject);
    this.db.saveData();

    return newProject;
  }

  toggleStar(user: any, projectId: string) {
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new NotFoundException('Project not found');

    const index = project.starredBy.indexOf(user.id);
    if (index > -1) {
      project.starredBy.splice(index, 1);
      project.starsCount = Math.max(0, project.starsCount - 1);
    } else {
      project.starredBy.push(user.id);
      project.starsCount += 1;
    }

    this.db.saveData();
    return { starred: index === -1, starsCount: project.starsCount };
  }

  toggleLike(user: any, projectId: string) {
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new NotFoundException('Project not found');

    const index = project.likedBy.indexOf(user.id);
    if (index > -1) {
      project.likedBy.splice(index, 1);
      project.likesCount = Math.max(0, project.likesCount - 1);
    } else {
      project.likedBy.push(user.id);
      project.likesCount += 1;
    }

    this.db.saveData();
    return { liked: index === -1, likesCount: project.likesCount };
  }

  addComment(user: any, projectId: string, content: string) {
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (!content.trim()) throw new BadRequestException('Comment cannot be empty');

    const comment: Comment = {
      id: `cm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      projectId,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatarUrl,
      content,
      createdAt: new Date().toISOString(),
    };

    this.db.comments.unshift(comment);
    this.db.saveData();

    return comment;
  }

  incrementRuns(projectId: string) {
    const project = this.db.projects.find((p) => p.id === projectId);
    if (project) {
      project.runsCount += 1;
      this.db.saveData();
    }
  }

  attachDebRelease(projectId: string, version: string, file: Express.Multer.File) {
    const project = this.db.projects.find((p) => p.id === projectId);
    if (!project) throw new NotFoundException('Project not found');

    const debFilename = file.originalname;
    const destDir = path.join(process.cwd(), 'public/pool/main', project.slug.charAt(0), project.slug);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const destPath = path.join(destDir, debFilename);
    fs.writeFileSync(destPath, file.buffer);

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const release: Release = {
      id: `rel_${Date.now()}`,
      projectId: project.id,
      version: version || '1.0.0',
      debFilename,
      debPath: `/public/pool/main/${project.slug.charAt(0)}/${project.slug}/${debFilename}`,
      architecture: debFilename.includes('amd64') ? 'amd64' : 'all',
      fileSize: file.size,
      sha256: hash,
      createdAt: new Date().toISOString(),
    };

    project.releases.unshift(release);
    this.db.saveData();

    return release;
  }
}
