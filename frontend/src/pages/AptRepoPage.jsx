import React, { useState, useEffect } from 'react';
import { Package, Terminal, Check, Copy, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export default function AptRepoPage() {
  const [aptInfo, setAptInfo] = useState(null);
  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedStep2, setCopiedStep2] = useState(false);

  useEffect(() => {
    fetch('/api/apt/info')
      .then((res) => res.json())
      .then((data) => setAptInfo(data))
      .catch((err) => console.error(err));
  }, []);

  const copyStep1 = () => {
    const cmd = aptInfo?.addRepoCommand || `echo "deb [trusted=yes] http://localhost:4000/public dists/stable/main/binary-all/" | sudo tee /etc/apt/sources.list.d/pinky.list`;
    navigator.clipboard.writeText(cmd);
    setCopiedStep1(true);
    setTimeout(() => setCopiedStep1(false), 2000);
  };

  const copyStep2 = () => {
    const cmd = aptInfo?.quickInstall || `sudo apt update && sudo apt install pinky`;
    navigator.clipboard.writeText(cmd);
    setCopiedStep2(true);
    setTimeout(() => setCopiedStep2(false), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Header */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f3ff 0%, #00ff9d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={24} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Pinky Official APT Repository</h1>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Native Debian/Ubuntu package distribution for published CLI tools and developer utilities.
            </p>
          </div>
        </div>
      </div>

      {/* Step by Step Setup */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00f3ff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} /> Step 1: Add Pinky Repository to APT Sources
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
          Run this single command in your Linux terminal to add Pinky's package repository to your system:
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: '#0d0e15',
            borderRadius: '10px',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            marginBottom: '24px',
          }}
        >
          <code className="font-mono" style={{ fontSize: '0.85rem', color: '#00f3ff', wordBreak: 'break-all' }}>
            {aptInfo?.addRepoCommand || `echo "deb [trusted=yes] http://localhost:4000/public dists/stable/main/binary-all/" | sudo tee /etc/apt/sources.list.d/pinky.list`}
          </code>
          <button className="btn btn-cyan" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={copyStep1}>
            {copiedStep1 ? <Check size={14} /> : <Copy size={14} />} {copiedStep1 ? 'Copied' : 'Copy'}
          </button>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff2a85', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={18} /> Step 2: Update & Install Packages
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
          Update APT package lists and install any project published on Pinky:
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: '#0d0e15',
            borderRadius: '10px',
            border: '1px solid rgba(255, 42, 133, 0.3)',
          }}
        >
          <code className="font-mono" style={{ fontSize: '0.9rem', color: '#f0f3f9' }}>
            {aptInfo?.quickInstall || `sudo apt update && sudo apt install pinky`}
          </code>
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={copyStep2}>
            {copiedStep2 ? <Check size={14} /> : <Copy size={14} />} {copiedStep2 ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Security & Validation Notice */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'rgba(0, 255, 157, 0.05)',
          border: '1px solid rgba(0, 255, 157, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldCheck size={20} color="#00ff9d" />
          <h4 style={{ fontSize: '1rem', color: '#00ff9d', fontWeight: 700 }}>Package Security & Isolation</h4>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
          All uploaded Debian packages undergo SHA256 checksum verification and index integrity generation. Pre-execution live demos run inside isolated NestJS PTY sandboxes with strict CPU, memory, and runtime restrictions.
        </p>
      </div>
    </div>
  );
}
