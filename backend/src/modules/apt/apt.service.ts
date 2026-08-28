import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { DatabaseService } from '../../db/database.service';

@Injectable()
export class AptService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  // Resolve the GPG key fingerprint for "apt@pinky.dev"
  private getSigningKeyId(): string | null {
    try {
      const output = execSync(
        'gpg --list-keys --keyid-format LONG apt@pinky.dev 2>/dev/null',
        { encoding: 'utf8' },
      );
      const match = output.match(/pub\s+\S+\/([A-F0-9]{16})/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Sign data with GPG and return the clearsign / detached signature
  private gpgSign(filePath: string): void {
    const keyId = this.getSigningKeyId();
    if (!keyId) {
      console.warn('[APT] No signing key found — Release file will be unsigned.');
      return;
    }

    try {
      // InRelease = cleartext signed Release
      execSync(
        `gpg --default-key "${keyId}" --clearsign --batch --yes -o "${filePath.replace('Release', 'InRelease')}" "${filePath}"`,
      );
      // Release.gpg = detached signature
      execSync(
        `gpg --default-key "${keyId}" -abs --batch --yes -o "${filePath}.gpg" "${filePath}"`,
      );
      console.log('[APT] Release file signed with GPG key:', keyId);
    } catch (e) {
      console.error('[APT] GPG signing failed:', e.message);
    }
  }

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
Maintainer: Pinky apt@pinky.dev
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

      // Compute hashes for Packages files (needed in Release)
      const hashFile = (p: string) => {
        if (!fs.existsSync(p)) return { md5: '', sha1: '', sha256: '', size: 0 };
        const buf = fs.readFileSync(p);
        return {
          md5:    crypto.createHash('md5').update(buf).digest('hex'),
          sha1:   crypto.createHash('sha1').update(buf).digest('hex'),
          sha256: crypto.createHash('sha256').update(buf).digest('hex'),
          size:   buf.length,
        };
      };

      const files = [
        { path: 'main/binary-amd64/Packages',    rel: pkgsPath },
        { path: 'main/binary-amd64/Packages.gz', rel: pkgsGzPath },
        { path: 'main/binary-all/Packages',      rel: pkgsAllPath },
        { path: 'main/binary-all/Packages.gz',   rel: pkgsAllGzPath },
      ];

      const md5Lines: string[]    = [];
      const sha1Lines: string[]   = [];
      const sha256Lines: string[] = [];

      for (const f of files) {
        const h = hashFile(f.rel);
        md5Lines.push(` ${h.md5} ${h.size} ${f.path}`);
        sha1Lines.push(` ${h.sha1} ${h.size} ${f.path}`);
        sha256Lines.push(` ${h.sha256} ${h.size} ${f.path}`);
      }

      // Write Release file with file hashes (required for apt signature verification)
      const releaseContent = `Origin: Pinky Developer Platform
Label: Pinky
Suite: stable
Codename: stable
Version: 1.0
Architectures: amd64 all
Components: main
Description: Official Pinky Developer Package Repository
Date: ${new Date().toUTCString()}
MD5Sum:
${md5Lines.join('\n')}
SHA1:
${sha1Lines.join('\n')}
SHA256:
${sha256Lines.join('\n')}
`;

      const releasePath = path.join(process.cwd(), 'public/dists/stable/Release');
      fs.writeFileSync(releasePath, releaseContent);

      // GPG sign the Release → produces InRelease + Release.gpg
      this.gpgSign(releasePath);

      console.log('APT package repository indexes successfully generated.');
    } catch (e) {
      console.error('Failed to generate APT repository index:', e);
    }
  }

  getRepoInstructions(baseUrl: string) {
    const signedKeyUrl = `${baseUrl}/apt-key/pinky.gpg`;
    const addKeyCmd = `curl -fsSL ${signedKeyUrl} | sudo gpg --dearmor -o /etc/apt/keyrings/pinky.gpg`;
    const addRepoCmd = `echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/pinky.gpg] ${baseUrl}/public stable main" | sudo tee /etc/apt/sources.list.d/pinky.list`;

    return {
      title: 'Pinky Official APT Repository',
      repositoryUrl: `${baseUrl}/public`,
      gpgKeyUrl: signedKeyUrl,
      addKeyCommand: addKeyCmd,
      addRepoCommand: addRepoCmd,
      quickInstall: `# Step 1: Import signing key\n${addKeyCmd}\n\n# Step 2: Add repository\n${addRepoCmd}\n\n# Step 3: Install package\nsudo apt update && sudo apt install arttime`,
    };
  }
}
