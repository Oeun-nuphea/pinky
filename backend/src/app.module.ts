import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

import { DatabaseModule } from './db/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AptModule } from './modules/apt/apt.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    AptModule,
    SandboxModule,
  ],
})
export class AppModule {}
