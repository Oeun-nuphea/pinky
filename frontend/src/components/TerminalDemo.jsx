import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Play, Square, Maximize2, Copy, Check, Terminal as TerminalIcon } from 'lucide-react';

export default function TerminalDemo({ projectId, projectSlug, installCmd, autoStart = false }) {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusText, setStatusText] = useState('Standby');

  const startSession = () => {
    if (isRunning) return;

    if (!xtermInstance.current && terminalRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#0d0e15',
          foreground: '#f0f3f9',
          cursor: '#ff2a85',
          selectionBackground: 'rgba(255, 42, 133, 0.3)',
          black: '#000000',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#bd93f9',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#bfbfbf',
          brightBlack: '#4d4d4d',
          brightRed: '#ff6e6e',
          brightGreen: '#69ff94',
          brightYellow: '#ffffa5',
          brightBlue: '#d6acff',
          brightMagenta: '#ff92d0',
          brightCyan: '#a4ffff',
          brightWhite: '#ffffff',
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.2,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      xtermInstance.current = term;
      fitAddonRef.current = fitAddon;
    }

    const term = xtermInstance.current;
    term.reset();
    term.writeln('\x1b[38;5;206m[Pinky Sandbox]\x1b[0m Initializing isolated PTY execution container...');
    setStatusText('Connecting...');
    setIsRunning(true);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:4000/ws/terminal`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusText('Running');
      term.writeln('\x1b[32m[Connected]\x1b[0m Stream active. Press keys to interact.\r\n');
      ws.send(JSON.stringify({ type: 'init', projectId: projectId || projectSlug }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output') {
          term.write(msg.data);
        } else if (msg.type === 'exit') {
          term.writeln(`\r\n\x1b[33m[Process Exited with code ${msg.code}]\x1b[0m`);
          stopSession();
        }
      } catch (e) {
        term.write(event.data);
      }
    };

    ws.onerror = (err) => {
      term.writeln('\r\n\x1b[31m[WebSocket Error]\x1b[0m Failed to connect to sandbox backend.');
      setStatusText('Error');
      stopSession();
    };

    ws.onclose = () => {
      setStatusText('Ended');
      setIsRunning(false);
    };

    // User keyboard input relay
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });
  };

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false);
    setStatusText('Standby');
  };

  const copyInstall = () => {
    const cmd = installCmd || `sudo apt update && sudo apt install ${projectSlug || 'pinky'}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (autoStart) {
      startSession();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="terminal-window my-3">
      {/* Header Bar */}
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="terminal-dot" style={{ background: '#ff5f56' }}></div>
          <div className="terminal-dot" style={{ background: '#ffbd2e' }}></div>
          <div className="terminal-dot" style={{ background: '#27c93f' }}></div>
          <span className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '6px' }}>
            {projectSlug ? `$ ${projectSlug}` : '$ interactive-pty'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            className="badge"
            style={{
              background: isRunning ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isRunning ? '#00ff9d' : '#94a3b8',
              border: `1px solid ${isRunning ? 'rgba(0, 255, 157, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            ● {statusText}
          </span>

          {!isRunning ? (
            <button className="btn btn-cyan" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={startSession}>
              <Play size={13} /> Run Demo
            </button>
          ) : (
            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', color: '#ff5555' }} onClick={stopSession}>
              <Square size={13} /> Stop
            </button>
          )}

          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={copyInstall} title="Copy Install Command">
            {copied ? <Check size={13} color="#00ff9d" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        style={{
          height: '240px',
          width: '100%',
          padding: '8px',
          backgroundColor: '#0d0e15',
          display: isRunning || xtermInstance.current ? 'block' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!isRunning && !xtermInstance.current && (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
            <TerminalIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.5, color: '#ff2a85' }} />
            <p className="font-mono" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
              Click <strong style={{ color: '#00f3ff' }}>Run Demo</strong> to launch interactive sandbox PTY
            </p>
            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              Streams live ANSI output & keyboard input via WebSockets
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
