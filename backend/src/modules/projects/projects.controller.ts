import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { AuthService } from '../auth/auth.service';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getProjects(
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'trending' | 'latest' | 'stars',
  ) {
    return this.projectsService.getAllProjects({ category, tag, search, sort });
  }

  @Get(':slug')
  async getProjectBySlug(@Param('slug') slug: string) {
    return this.projectsService.getProjectBySlug(slug);
  }

  @Post()
  async createProject(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid or expired token');

    return this.projectsService.createProject(user, body);
  }

  @Post(':id/star')
  async toggleStar(
    @Param('id') projectId: string,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.projectsService.toggleStar(user, projectId);
  }

  @Post(':id/like')
  async toggleLike(
    @Param('id') projectId: string,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.projectsService.toggleLike(user, projectId);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') projectId: string,
    @Body('content') content: string,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.projectsService.addComment(user, projectId, content);
  }

  @Post(':id/releases')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRelease(
    @Param('id') projectId: string,
    @Body('version') version: string,
    @UploadedFile() file: Express.Multer.File,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.projectsService.attachDebRelease(projectId, version, file);
  }
}
