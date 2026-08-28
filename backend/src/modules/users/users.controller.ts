import { Controller, Get, Post, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';

@Controller('api/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    return this.usersService.getProfile(username);
  }

  @Post(':username/follow')
  async follow(
    @Param('username') username: string,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const user = this.authService.verifyToken(authHeader.split(' ')[1]);
    if (!user) throw new UnauthorizedException('Invalid token');

    return this.usersService.toggleFollow(user.id, username);
  }
}
