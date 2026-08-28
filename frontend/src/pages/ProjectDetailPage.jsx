import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, FileText, Download, MessageSquare, Star, Heart, ArrowLeft, ExternalLink, Send, Check, Copy } from 'lucide-react';
import TerminalDemo from '../components/TerminalDemo';

export default function ProjectDetailPage({
  project: initialProject,
  currentUser,
  onBack,
  onStar,
  onLike,
  onAuthorClick,
}) {
  const [project, setProject] = useState(initialProject);
  const [comments, setComments] = useState([]);
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'readme' | 'releases' | 'comments'
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${initialProject.slug || initialProject.id}`);
      const data = await res.json();
      if (data.project) setProject(data.project);
      if (data.comments) setComments(data.comments);
    } catch (e) {
      console.error('Failed to load project detail', e);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [initialProject]);

  const isStarred = currentUser && project.starredBy?.includes(currentUser.id);
  const isLiked = currentUser && project.likedBy?.includes(currentUser.id);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      const token = localStorage.getItem('pinky_token');
      const res = await fetch(`/api/projects/${project.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      const commentData = await res.json();
      if (res.ok) {
        setComments([commentData, ...comments]);
        setNewComment('');
      }
    } catch (e) {
      console.error('Failed to post comment', e);
    }
  };

  const copyInstall = () => {
    const cmd = project.installCmd || `sudo apt update && sudo apt install ${project.slug}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn btn-secondary"
        style={{ marginBottom: '20px', padding: '6px 12px', fontSize: '0.85rem' }}
      >
        <ArrowLeft size={16} /> Back to Feed
      </button>

      {/* Hero Header */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '28px 32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div
            onClick={() => onAuthorClick(project.ownerUsername)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <img
              src={project.ownerAvatar}
              alt={project.ownerUsername}
              style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #ff2a85' }}
            />
            <div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>@{project.ownerUsername}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className="badge badge-pink">{project.category}</span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => onStar(project.id)}
              className="btn btn-secondary"
              style={{ color: isStarred ? '#ffb703' : '#94a3b8' }}
            >
              <Star size={16} fill={isStarred ? '#ffb703' : 'none'} /> {project.starsCount}
            </button>
            <button
              onClick={() => onLike(project.id)}
              className="btn btn-secondary"
              style={{ color: isLiked ? '#ff2a85' : '#94a3b8' }}
            >
              <Heart size={16} fill={isLiked ? '#ff2a85' : 'none'} /> {project.likesCount}
            </button>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn btn-cyan">
                <ExternalLink size={16} /> GitHub
              </a>
            )}
          </div>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{project.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '16px' }}>
          {project.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {project.tags.map((tag, idx) => (
            <span key={idx} className="badge badge-cyan">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px',
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('demo')}
          className={`btn ${activeTab === 'demo' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <TerminalIcon size={16} /> Live Demo Container
        </button>

        <button
          onClick={() => setActiveTab('readme')}
          className={`btn ${activeTab === 'readme' ? 'btn-cyan' : 'btn-secondary'}`}
        >
          <FileText size={16} /> Documentation & README
        </button>

        <button
          onClick={() => setActiveTab('releases')}
          className={`btn ${activeTab === 'releases' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Download size={16} /> APT Packages ({project.releases?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('comments')}
          className={`btn ${activeTab === 'comments' ? 'btn-cyan' : 'btn-secondary'}`}
        >
          <MessageSquare size={16} /> Discussion ({comments.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'demo' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: '#00f3ff' }}>
            Interactive PTY Sandbox Runner
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px' }}>
            This terminal runs an isolated execution sandbox on the NestJS backend streaming ANSI output over WebSockets.
          </p>
          <TerminalDemo
            projectId={project.id}
            projectSlug={project.slug}
            installCmd={project.installCmd}
            previewGif={project.previewGif}
            autoStart={false}
          />

        </div>
      )}

      {activeTab === 'readme' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <pre
            className="font-mono"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#f0f3f9',
              lineHeight: 1.6,
              fontSize: '0.92rem',
            }}
          >
            {project.readmeContent || `# ${project.title}\n\n${project.description}`}
          </pre>
        </div>
      )}

      {activeTab === 'releases' && (
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#00f3ff', marginBottom: '8px' }}>
              APT Installation Command
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(0, 243, 255, 0.3)',
              }}
            >
              <code className="font-mono" style={{ color: '#f0f3f9' }}>
                {project.installCmd || `sudo apt update && sudo apt install ${project.slug}`}
              </code>
              <button className="btn btn-cyan" onClick={copyInstall}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Release Packages</h3>
          {project.releases?.length > 0 ? (
            project.releases.map((rel) => (
              <div key={rel.id} className="glass-panel" style={{ padding: '20px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#ff2a85' }}>v{rel.version}</span>
                    <span className="badge badge-cyan" style={{ marginLeft: '10px' }}>
                      {rel.architecture}
                    </span>
                    <p className="font-mono" style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
                      {rel.debFilename} ({(rel.fileSize / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                  <a href={rel.debPath} download className="btn btn-primary">
                    <Download size={14} /> Download .deb
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8' }}>No .deb package releases uploaded yet.</p>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div>
          {/* Post Comment */}
          {currentUser ? (
            <form onSubmit={handleAddComment} className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Join the Discussion</h4>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Share your thoughts, test results, or feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                <Send size={14} /> Post Comment
              </button>
            </form>
          ) : (
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', textAlign: 'center', color: '#94a3b8' }}>
              Sign in to post comments and interact with the creator.
            </div>
          )}

          {/* Comment List */}
          {comments.map((cm) => (
            <div key={cm.id} className="glass-panel" style={{ padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <img src={cm.userAvatar} alt={cm.username} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>@{cm.username}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ color: '#f0f3f9', fontSize: '0.92rem', lineHeight: 1.5 }}>{cm.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
