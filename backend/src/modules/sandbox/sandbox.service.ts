import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService, Project } from '../../db/database.service';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export interface SandboxSession {
  id: string;
  projectId: string;
  process: ChildProcess;
  timeoutId: NodeJS.Timeout;
}

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private sessions = new Map<string, SandboxSession>();

  constructor(private readonly db: DatabaseService) {}

  createSession(
    sessionId: string,
    projectId: string,
    onData: (data: string) => void,
    onExit: (code: number | null) => void,
  ): SandboxSession | null {
    const project = this.db.projects.find((p) => p.id === projectId || p.slug === projectId);
    
    // Command resolution
    let cmd = 'python3';
    let args: string[] = ['backend/demos/pinky_cli_demo.py'];

    if (project) {
      this.db.projects.find((p) => p.id === project.id)!.runsCount += 1;
      this.db.saveData();

      if (project.demoCmd) cmd = project.demoCmd;
      if (project.demoArgs && project.demoArgs.length > 0) args = project.demoArgs;
    } else if (projectId === 'arttime') {
      args = ['backend/demos/arttime_demo.py'];
    }

    // Resolve relative path to root or backend directory
    const cwd = process.cwd();
    const fullCmdPath = cmd;
    
    // Normalize path to handle whether backend is run from root or backend/ directory
    const rootDir = cwd.endsWith('backend') ? path.dirname(cwd) : cwd;
    const fullArgs = args.map((a) => {
      if (a.startsWith('backend/demos/') || a.startsWith('demos/')) {
        const relativePath = a.startsWith('backend/') ? a : path.join('backend', a);
        return path.join(rootDir, relativePath);
      }
      return a;
    });

    this.logger.log(`Launching Sandbox PTY for session ${sessionId}: ${fullCmdPath} ${fullArgs.join(' ')}`);

    // Launch PTY using python script wrapper to emulate real ANSI terminal PTY on Linux
    const ptyWrapperCode = `
import pty, os, sys, select

master, slave = pty.openpty()
pid = os.fork()

if pid == 0:
    # Child process
    os.close(master)
    os.setsid()
    os.dup2(slave, 0)
    os.dup2(slave, 1)
    os.dup2(slave, 2)
    if slave > 2:
        os.close(slave)
    env = os.environ.copy()
    env["TERM"] = "xterm-256color"
    os.execvpe(sys.argv[1], sys.argv[1:], env)
else:
    # Parent process
    os.close(slave)
    try:
        while True:
            r, _, _ = select.select([sys.stdin, master], [], [])
            if master in r:
                data = os.read(master, 1024)
                if not data:
                    break
                os.write(sys.stdout.fileno(), data)
                sys.stdout.flush()
            if sys.stdin in r:
                data = os.read(sys.stdin.fileno(), 1024)
                if not data:
                    break
                os.write(master, data)
    except Exception:
        pass
    finally:
        os.close(master)
`;

    let proc: ChildProcess;
    try {
      proc = spawn('python3', ['-c', ptyWrapperCode, fullCmdPath, ...fullArgs], {
        cwd,
        env: { ...process.env, TERM: 'xterm-256color' },
      });
    } catch (err) {
      this.logger.error(`Failed to spawn process: ${err}`);
      onData(`\r\n\x1b[31m[Sandbox Error] Failed to launch execution environment: ${err}\x1b[0m\r\n`);
      onExit(1);
      return null;
    }

    // Max execution duration cap (120 seconds) for sandbox safety
    const timeoutId = setTimeout(() => {
      onData('\r\n\x1b[33m[Pinky Sandbox] Session time limit reached (120s max). Session closed.\x1b[0m\r\n');
      this.killSession(sessionId);
    }, 120000);

    proc.stdout?.on('data', (chunk: Buffer) => {
      onData(chunk.toString('utf-8'));
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      onData(chunk.toString('utf-8'));
    });

    proc.on('exit', (code) => {
      clearTimeout(timeoutId);
      this.sessions.delete(sessionId);
      onExit(code);
    });

    const session: SandboxSession = {
      id: sessionId,
      projectId: projectId,
      process: proc,
      timeoutId,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  writeInput(sessionId: string, data: string) {
    const session = this.sessions.get(sessionId);
    if (session && session.process.stdin && !session.process.killed) {
      session.process.stdin.write(data);
    }
  }

  killSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      clearTimeout(session.timeoutId);
      if (!session.process.killed) {
        try {
          session.process.kill('SIGTERM');
        } catch (e) {}
      }
      this.sessions.delete(sessionId);
    }
  }
}
