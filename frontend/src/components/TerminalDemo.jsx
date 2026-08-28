import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Play, Square, Copy, Check, Terminal as TermIcon, Download } from 'lucide-react';

// ─── ANSI animation helpers (only used when no GIF is available) ──────────────
const col = (n) => `\x1b[38;5;${n}m`;
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const HOME = '\x1b[H';
const HIDE = '\x1b[?25l';
const SHOW = '\x1b[?25h';
const CLEAR = '\x1b[2J';

const PALETTES = [
  [206, 207, 213, 219, 225],
  [51, 45, 39, 33, 27],
  [82, 76, 70, 64, 58],
  [226, 220, 214, 208, 202],
];

function buildDefaultFrame(tick) {
  const spinners = ['◐', '◓', '◑', '◒'];
  const dots = '.'.repeat((tick % 4));
  const spin = spinners[tick % 4];
  const pulseColors = [51, 45, 39, 33, 39, 45];
  const pc = col(pulseColors[tick % pulseColors.length]);

  const lines = [
    ``,
    `  ${BOLD}${col(206)}Pinky${RESET} ${DIM}Developer Platform${RESET}`,
    ``,
    `  ${pc}┌──────────────────────────────────────────┐${RESET}`,
    `  ${pc}│${RESET}                                          ${pc}│${RESET}`,
    `  ${pc}│${RESET}   ${col(226)}${spin}${RESET}  ${BOLD}Interactive PTY Sandbox${RESET}              ${pc}│${RESET}`,
    `  ${pc}│${RESET}      Stream live ANSI output via         ${pc}│${RESET}`,
    `  ${pc}│${RESET}      WebSocket — keyboard input          ${pc}│${RESET}`,
    `  ${pc}│${RESET}      forwarded to real process           ${pc}│${RESET}`,
    `  ${pc}│${RESET}                                          ${pc}│${RESET}`,
    `  ${pc}│${RESET}   ${col(82)}●${RESET} Sandbox container: ${BOLD}standby${RESET}           ${pc}│${RESET}`,
    `  ${pc}│${RESET}   ${col(226)}●${RESET} ANSI 256-color: ${BOLD}supported${RESET}           ${pc}│${RESET}`,
    `  ${pc}│${RESET}   ${col(51)}●${RESET} PTY stream: ${BOLD}ready${dots.padEnd(4, ' ')}${RESET}               ${pc}│${RESET}`,
    `  ${pc}│${RESET}                                          ${pc}│${RESET}`,
    `  ${pc}└──────────────────────────────────────────┘${RESET}`,
    ``,
    `  ${DIM}Click ${RESET}${BOLD}${col(51)}Run Demo${RESET}${DIM} to launch live interactive session${RESET}`,
  ];
  return HIDE + HOME + lines.map(l => l + '\x1b[K').join('\r\n') + '\r\n';
}
// ─── GIF preview mode (no xterm needed) ──────────────────────────────────────
function InstallPanel({ projectSlug, installCmd, aptRepoBase }) {
  const [copied, setCopied] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupCopied, setSetupCopied] = useState(null);

  const BASE = aptRepoBase || 'http://localhost:4000/public';

  // The simple command users paste — no GPG key needed with [trusted=yes]
  const mainCmd = installCmd || `sudo apt update && sudo apt install ${projectSlug}`;

  // First-time repo setup steps (only needed once per machine)
  const setupSteps = [
    {
      label: 'Add repo',
      cmd: `echo "deb [trusted=yes] ${BASE} stable main" | sudo tee /etc/apt/sources.list.d/pinky.list`,
      color: '#bd93f9',
    },
    {
      label: 'Install',
      cmd: mainCmd,
      color: '#50fa7b',
    },
  ];

  const copyMain = () => {
    navigator.clipboard.writeText(mainCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copySetup = (idx, cmd) => {
    navigator.clipboard.writeText(cmd);
    setSetupCopied(idx);
    setTimeout(() => setSetupCopied(null), 2500);
  };

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid rgba(0,243,255,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
      }}
    >
      {/* ── Primary install command ── */}
      <div
        onClick={copyMain}
        title="Click to copy install command"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          borderRadius: '8px',
          padding: '8px 10px',
          background: copied ? 'rgba(80,250,123,0.07)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${copied ? 'rgba(80,250,123,0.35)' : 'rgba(0,243,255,0.15)'}`,
          transition: 'all 0.2s',
          position: 'relative',
        }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'rgba(0,243,255,0.06)'; }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      >
        <Download size={14} color={copied ? '#50fa7b' : '#00f3ff'} style={{ flexShrink: 0 }} />
        <code
          className="font-mono"
          style={{
            flex: 1,
            fontSize: '0.83rem',
            color: copied ? '#50fa7b' : '#f0f3f9',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {mainCmd}
        </code>
        <span style={{ color: copied ? '#50fa7b' : '#94a3b8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
          {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
        </span>

        {/* Floating confirmation tooltip */}
        {copied && (
          <span style={{
            position: 'absolute', top: '-30px', right: '8px',
            background: '#50fa7b', color: '#0d0e15',
            fontSize: '0.7rem', fontWeight: 700,
            padding: '2px 10px', borderRadius: '20px',
            pointerEvents: 'none', animation: 'fadeInUp 0.2s ease',
          }}>
            ✓ Copied! Paste in your terminal
          </span>
        )}
      </div>

      {/* ── First-time setup accordion ── */}
      <button
        onClick={() => setSetupOpen(o => !o)}
        style={{
          width: '100%',
          marginTop: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#64748b',
          fontSize: '0.7rem',
          padding: '2px 0',
        }}
      >
        <span style={{ transition: 'transform 0.2s', transform: setupOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
        First time on this machine? Setup Pinky repo first
      </button>

      {setupOpen && (
        <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(0,243,255,0.2)' }}>
          {setupSteps.map((step, idx) => {
            const isCopied = setupCopied === idx;
            return (
              <div
                key={idx}
                onClick={() => copySetup(idx, step.cmd)}
                title="Click to copy"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: idx < setupSteps.length - 1 ? '6px' : 0,
                  cursor: 'pointer', borderRadius: '4px', padding: '3px 4px',
                  background: isCopied ? 'rgba(80,250,123,0.07)' : 'transparent',
                  position: 'relative', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isCopied) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isCopied) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '0.66rem', color: step.color, flexShrink: 0, minWidth: '55px', fontWeight: 600 }}>
                  {step.label}
                </span>
                <code className="font-mono" style={{
                  flex: 1, fontSize: '0.75rem',
                  color: isCopied ? '#50fa7b' : '#94a3b8',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={step.cmd}>
                  {step.cmd}
                </code>
                <span style={{ color: isCopied ? '#50fa7b' : '#475569', flexShrink: 0 }}>
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}






function GifPreview({ gifUrl, projectSlug, installCmd, onRunDemo }) {
  return (
    <div style={{ marginTop: '12px' }}>
      {/* Terminal frame showing GIF */}
      <div className="terminal-window" style={{ marginBottom: '0', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
        <div className="terminal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="terminal-dot" style={{ background: '#ff5f56' }} />
            <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
            <div className="terminal-dot" style={{ background: '#27c93f' }} />
            <span className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '6px' }}>
              $ {projectSlug}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge" style={{ background: 'rgba(0,243,255,0.08)', color: '#00f3ff', border: '1px solid rgba(0,243,255,0.2)', fontSize: '0.72rem' }}>
              ● Live Preview
            </span>
            <button
              className="btn btn-cyan"
              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
              onClick={onRunDemo}
              title="Launch interactive sandbox PTY"
            >
              <Play size={12} /> Run Demo
            </button>
          </div>
        </div>

        {/* GIF display */}
        <div style={{ background: '#0d0e15', padding: '0', lineHeight: 0, maxHeight: '280px', overflow: 'hidden' }}>
          <img
            src={gifUrl}
            alt={`${projectSlug} live preview`}
            style={{
              width: '100%',
              height: '260px',
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
            loading="lazy"
          />
        </div>
      </div>

      <InstallPanel projectSlug={projectSlug} installCmd={installCmd} />
    </div>
  );
}

// ─── Live xterm PTY (for "Run Demo") ─────────────────────────────────────────
function LiveTerminal({ projectId, projectSlug, installCmd, onStop, autoStart = false }) {
  const terminalRef = useRef(null);
  const containerRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const animFrameRef = useRef(null);
  const tickRef = useRef(0);
  const isVisibleRef = useRef(false);
  const observerRef = useRef(null);

  const [mode, setMode] = useState('anim'); // 'anim' | 'connecting' | 'running'
  const [installCopied, setInstallCopied] = useState(false);

  const initXterm = (allowInput) => {
    if (xtermInstance.current) return xtermInstance.current;
    if (!terminalRef.current) return null;

    const term = new Terminal({
      cursorBlink: false,
      theme: {
        background: '#0d0e15', foreground: '#f0f3f9', cursor: '#ff2a85',
        selectionBackground: 'rgba(255,42,133,0.3)',
        black: '#000000', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
        blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#bfbfbf',
        brightBlack: '#4d4d4d', brightRed: '#ff6e6e', brightGreen: '#69ff94',
        brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92d0',
        brightCyan: '#a4ffff', brightWhite: '#ffffff',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      disableStdin: !allowInput,
      scrollback: 0,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;
    return term;
  };

  const stopAnim = () => {
    if (animFrameRef.current) { clearTimeout(animFrameRef.current); animFrameRef.current = null; }
  };

  const startAnim = () => {
    if (wsRef.current) return;
    const term = initXterm(false);
    if (!term) return;
    term.write(CLEAR + HOME + HIDE);
    const loop = () => {
      if (!isVisibleRef.current || wsRef.current) return;
      term.write(buildDefaultFrame(tickRef.current++));
      animFrameRef.current = setTimeout(loop, 160);
    };
    stopAnim();
    loop();
  };

  const startSession = () => {
    stopAnim();
    const term = initXterm(true);
    if (!term) return;
    term.options.disableStdin = false;
    term.options.cursorBlink = true;
    term.write(SHOW + CLEAR + HOME);
    term.writeln('\x1b[38;5;206m[Pinky Sandbox]\x1b[0m Initializing isolated PTY container...');
    setMode('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:4000/ws/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      setMode('running');
      term.writeln('\x1b[32m[Connected]\x1b[0m Press keys to interact.\r\n');
      ws.send(JSON.stringify({ type: 'init', projectId: projectId || projectSlug }));
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') term.write(msg.data);
        else if (msg.type === 'exit') { term.writeln(`\r\n\x1b[33m[Exited: ${msg.code}]\x1b[0m`); stopSession(); }
      } catch { term.write(e.data); }
    };
    ws.onerror = () => { term.writeln('\r\n\x1b[31m[Error]\x1b[0m Could not connect.'); stopSession(); };
    ws.onclose = () => { setMode('anim'); };
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
    });
  };

  const stopSession = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setMode('anim');
    setTimeout(() => { if (xtermInstance.current) xtermInstance.current.options.disableStdin = true; startAnim(); }, 400);
  };

  const copyInstall = () => {
    navigator.clipboard.writeText(installCmd || `sudo apt update && sudo apt install ${projectSlug}`);
    setInstallCopied(true);
    setTimeout(() => setInstallCopied(false), 2500);
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        if (!xtermInstance.current) startAnim();
        else if (!wsRef.current && !animFrameRef.current) startAnim();
      } else {
        stopAnim();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) observerRef.current.observe(containerRef.current);
    if (autoStart) setTimeout(startSession, 300);

    return () => {
      stopAnim();
      observerRef.current?.disconnect();
      if (wsRef.current) wsRef.current.close();
      xtermInstance.current?.write(SHOW);
    };
  }, []);

  const isRunning = mode === 'running';
  const statusLabel = mode === 'running' ? 'Running' : mode === 'connecting' ? 'Connecting...' : 'Sandbox';
  const statusColor = isRunning ? '#00ff9d' : '#94a3b8';

  return (
    <div ref={containerRef}>
      <div className="terminal-window" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
        <div className="terminal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="terminal-dot" style={{ background: '#ff5f56' }} />
            <div className="terminal-dot" style={{ background: '#ffbd2e' }} />
            <div className="terminal-dot" style={{ background: '#27c93f' }} />
            <span className="font-mono" style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '6px' }}>
              $ {projectSlug}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge" style={{ background: isRunning ? 'rgba(0,255,157,0.12)' : 'rgba(255,255,255,0.05)', color: statusColor, border: `1px solid ${isRunning ? 'rgba(0,255,157,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
              ● {statusLabel}
            </span>
            {!isRunning ? (
              <button className="btn btn-cyan" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={startSession}>
                <Play size={12} /> Run Demo
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem', color: '#ff5555' }} onClick={stopSession}>
                <Square size={12} /> Stop
              </button>
            )}
            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={onStop} title="Switch back to GIF preview">
              <TermIcon size={13} />
            </button>
          </div>
        </div>

        <div ref={terminalRef} style={{ height: '240px', width: '100%', padding: '8px', backgroundColor: '#0d0e15' }} />
      </div>

      <InstallPanel projectSlug={projectSlug} installCmd={installCmd} />
    </div>

  );
}

// ─── Main export — smart switcher between GIF preview and live terminal ───────
export default function TerminalDemo({ projectId, projectSlug, installCmd, previewGif, autoStart = false }) {
  const [showLive, setShowLive] = useState(autoStart || !previewGif);

  if (!previewGif || showLive) {
    return (
      <LiveTerminal
        projectId={projectId}
        projectSlug={projectSlug}
        installCmd={installCmd}
        autoStart={autoStart}
        onStop={previewGif ? () => setShowLive(false) : undefined}
      />
    );
  }

  return (
    <GifPreview
      gifUrl={previewGif}
      projectSlug={projectSlug}
      installCmd={installCmd}
      onRunDemo={() => setShowLive(true)}
    />
  );
}
