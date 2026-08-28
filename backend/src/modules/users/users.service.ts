import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../db/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  getProfile(username: string) {
    const user = this.db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new NotFoundException(`User ${username} not found`);
    }

    const userProjects = this.db.projects.filter((p) => p.ownerId === user.id);
    const totalStars = userProjects.reduce((acc, curr) => acc + curr.starsCount, 0);

    const { passwordHash, ...safeUser } = user;
    return {
      user: safeUser,
      projects: userProjects,
      stats: {
        projectsCount: userProjects.length,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        totalStars,
      },
    };
  }

  toggleFollow(currentUserId: string, targetUsername: string) {
    const currentUser = this.db.users.find((u) => u.id === currentUserId);
    const targetUser = this.db.users.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());

    if (!currentUser || !targetUser) {
      throw new NotFoundException('User not found');
    }

    const isFollowing = currentUser.following.includes(targetUser.id);
    if (isFollowing) {
      currentUser.following = currentUser.following.filter((id) => id !== targetUser.id);
      targetUser.followers = targetUser.followers.filter((id) => id !== currentUser.id);
    } else {
      currentUser.following.push(targetUser.id);
      targetUser.followers.push(currentUser.id);
    }

    this.db.saveData();
    return { isFollowing: !isFollowing, followersCount: targetUser.followers.length };
  }
}
