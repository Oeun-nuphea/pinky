import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { SandboxService } from './sandbox.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ path: '/ws/terminal' })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TerminalGateway.name);
  private clientSessions = new Map<WebSocket, string>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly sandboxService: SandboxService) {}

  handleConnection(client: WebSocket) {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    this.clientSessions.set(client, sessionId);
    this.logger.log(`WebSocket Terminal Client connected: ${sessionId}`);

    client.on('message', (message: string | Buffer) => {
      try {
        const payload = JSON.parse(message.toString());
        const sid = this.clientSessions.get(client);
        if (!sid) return;

        if (payload.type === 'init' || payload.type === 'start') {
          const projectId = payload.projectId || 'arttime';
          this.sandboxService.createSession(
            sid,
            projectId,
            (outputData) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'output', data: outputData }));
              }
            },
            (exitCode) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'exit', code: exitCode }));
              }
            },
          );
        } else if (payload.type === 'input') {
          this.sandboxService.writeInput(sid, payload.data);
        }
      } catch (err) {
        // Plain text fallback
        const sid = this.clientSessions.get(client);
        if (sid) {
          this.sandboxService.writeInput(sid, message.toString());
        }
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    const sid = this.clientSessions.get(client);
    if (sid) {
      this.logger.log(`WebSocket Terminal Client disconnected: ${sid}`);
      this.sandboxService.killSession(sid);
      this.clientSessions.delete(client);
    }
  }
}
