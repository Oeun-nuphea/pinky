import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as crypto from 'crypto';
import { DatabaseService } from '../../db/database.service';

@Injectable()
export class AptService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  onModuleInit() {
    this.generateAptRepoIndex();
  }

  public generateAptRepoIndex() {
    try {
      const distsDir = path.join(process.cwd(), 'public/dists/stable/main/binary-amd64');
      const distsAllDir = path.join(process.cwd(), 'public/dists/stable/main/binary-all');
      if (!fs.existsSync(distsDir)) fs.mkdirSync(distsDir, { recursive: true });
      if (!fs.existsSync(distsAllDir)) fs.mkdirSync(distsAllDir, { recursive: true });

      let packageEntries = '';

      // Build packages index entry from database releases
      for (const project of this.db.projects) {
        for (const rel of project.releases) {
          packageEntries += `Package: ${project.slug}
Version: ${rel.version}
Section: utils
Priority: optional
Architecture: ${rel.architecture}
Maintainer: ${project.ownerUsername} <${project.ownerUsername}@pinky.dev>
Filename: pool/main/${project.slug.charAt(0)}/${project.slug}/${rel.debFilename}
Size: ${rel.fileSize}
SHA256: ${rel.sha256}
Description: ${project.title} - ${project.description}
 A Linux command line application hosted on Pinky Developer Social Platform.

`;
        }
      }

      // Add pinky CLI package entry if present in workspace root
      const rootDeb = path.join(process.cwd(), 'pinky_1.0.0_all.deb');
      if (fs.existsSync(rootDeb)) {
        const stat = fs.statSync(rootDeb);
        const buf = fs.readFileSync(rootDeb);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        packageEntries += `Package: pinky
Version: 1.0.0
Section: utils
Priority: optional
Architecture: all
Maintainer: Pinky pinky@gmail.com
Filename: pool/main/p/pinky/pinky_1.0.0_all.deb
Size: ${stat.size}
SHA256: ${hash}
Description: Pinky command line tool
 A simple command line application called Pinky.

`;
      }

      // Write Packages & Packages.gz
      const pkgsPath = path.join(distsDir, 'Packages');
      const pkgsGzPath = path.join(distsDir, 'Packages.gz');
      fs.writeFileSync(pkgsPath, packageEntries);
      fs.writeFileSync(pkgsGzPath, zlib.gzipSync(Buffer.from(packageEntries)));

      const pkgsAllPath = path.join(distsAllDir, 'Packages');
      const pkgsAllGzPath = path.join(distsAllDir, 'Packages.gz');
      fs.writeFileSync(pkgsAllPath, packageEntries);
      fs.writeFileSync(pkgsAllGzPath, zlib.gzipSync(Buffer.from(packageEntries)));

      // Write Release file
      const releaseContent = `Origin: Pinky Developer Platform
Label: Pinky
Suite: stable
Codename: stable
Architectures: amd64 all
Components: main
Description: Official Pinky Developer Package Repository
Date: ${new Date().toUTCString()}
`;

      fs.writeFileSync(path.join(process.cwd(), 'public/dists/stable/Release'), releaseContent);
      console.log('APT package repository indexes successfully generated.');
    } catch (e) {
      console.error('Failed to generate APT repository index:', e);
    }
  }

  getRepoInstructions(baseUrl: string) {
    return {
      title: 'Pinky Official APT Repository',
      repositoryUrl: `${baseUrl}/public`,
      addRepoCommand: `echo "deb [trusted=yes] ${baseUrl}/public dists/stable/main/binary-all/" | sudo tee /etc/apt/sources.list.d/pinky.list`,
      quickInstall: `sudo apt update && sudo apt install pinky`,
    };
  }
}
