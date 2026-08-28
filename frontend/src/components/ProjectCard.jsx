import React, { useState } from 'react';
import { Star, Heart, MessageSquare, ExternalLink, Download, Play, Terminal as TerminalIcon, Check, Copy } from 'lucide-react';
import TerminalDemo from './TerminalDemo';

export default function ProjectCard({
  project,
  currentUser,
  onStar,
  onLike,
  onOpenDetail,
  onAuthorClick,
}) {
  const [showInstallDrawer, setShowInstallDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const isStarred = currentUser && project.starredBy?.includes(currentUser.id);
  const isLiked = currentUser && project.likedBy?.includes(currentUser.id);

  const handleCopyInstall = () => {
    const cmd = project.installCmd || `sudo apt update && sudo apt install ${project.slug}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div
          onClick={() => onAuthorClick && onAuthorClick(project.ownerUsername)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <img
            src={project.ownerAvatar}
            alt={project.ownerUsername}
            style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid rgba(255, 42, 133, 0.3)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>@{project.ownerUsername}</span>
              <span className="badge badge-pink">{project.category}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ExternalLink size={14} /> GitHub
          </a>
        )}
      </div>

      {/* Project Info */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          onClick={() => onOpenDetail(project)}
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: '6px',
            color: '#f0f3f9',
            display: 'inline-block',
          }}
          className="hover-pink"
        >
          {project.title}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '12px' }}>
          {project.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {project.tags.map((tag, idx) => (
            <span key={idx} className="font-mono" style={{ fontSize: '0.78rem', color: '#00f3ff', opacity: 0.85 }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Live Interactive Terminal Preview */}
      {project.isLiveSupported && (
        <TerminalDemo
          projectId={project.id}
          projectSlug={project.slug}
          installCmd={project.installCmd}
        />
      )}

      {/* Social Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Star Button */}
          <button
            onClick={() => onStar(project.id)}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              color: isStarred ? '#ffb703' : '#94a3b8',
              borderColor: isStarred ? 'rgba(255, 183, 3, 0.4)' : undefined,
            }}
          >
            <Star size={16} fill={isStarred ? '#ffb703' : 'none'} />
            <span>{project.starsCount}</span>
          </button>

          {/* Like Button */}
          <button
            onClick={() => onLike(project.id)}
            className="btn btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              color: isLiked ? '#ff2a85' : '#94a3b8',
              borderColor: isLiked ? 'rgba(255, 42, 133, 0.4)' : undefined,
            }}
          >
            <Heart size={16} fill={isLiked ? '#ff2a85' : 'none'} />
            <span>{project.likesCount}</span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => onOpenDetail(project)}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#94a3b8' }}
          >
            <MessageSquare size={16} />
            <span>View Discussion</span>
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Play size={12} color="#00ff9d" /> {project.runsCount} runs
          </span>

          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setShowInstallDrawer(!showInstallDrawer)}
          >
            <Download size={14} /> Install
          </button>
        </div>
      </div>

      {/* Install Instruction Snippet Drawer */}
      {showInstallDrawer && (
        <div
          style={{
            marginTop: '14px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: 'rgba(0, 243, 255, 0.05)',
            border: '1px solid rgba(0, 243, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: '#00f3ff', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              DEBIAN / UBUNTU APT INSTALLATION
            </span>
            <code className="font-mono" style={{ fontSize: '0.85rem', color: '#f0f3f9' }}>
              {project.installCmd || `sudo apt update && sudo apt install ${project.slug}`}
            </code>
          </div>
          <button className="btn btn-cyan" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleCopyInstall}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
