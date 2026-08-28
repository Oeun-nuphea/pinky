import React, { useState, useEffect } from 'react';
import { Terminal, Flame, Sparkles, Star, Filter, RefreshCw } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';

const CATEGORIES = ['All', 'CLI', 'Linux', 'Terminal Art', 'DevTools', 'AI', 'Games', 'Web'];

export default function FeedPage({
  currentUser,
  onStar,
  onLike,
  onOpenDetail,
  onAuthorClick,
  searchQuery,
}) {
  const [projects, setProjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('trending');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (searchQuery) queryParams.append('search', searchQuery);
      if (sortOption) queryParams.append('sort', sortOption);

      const res = await fetch(`/api/projects?${queryParams.toString()}`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch projects feed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, sortOption, searchQuery]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Hero Welcome Banner */}
      <div
        className="glass-panel glass-panel-glow"
        style={{
          padding: '28px 32px',
          marginBottom: '28px',
          background: 'linear-gradient(135deg, rgba(255, 42, 133, 0.1) 0%, rgba(0, 243, 255, 0.08) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <span className="badge badge-pink">DON'T JUST LOOK AT A PROJECT — EXPERIENCE AND RUN IT</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f3f9', marginBottom: '8px' }}>
          Discover & Run Interactive Developer Projects
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '680px' }}>
          Execute CLI tools, terminal art, Linux applications, and ASCII games directly in your browser. Install instantly via Pinky's native APT package distribution.
        </p>
      </div>

      {/* Category Pills Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sorting & Filter Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSortOption('trending')}
            className={`btn ${sortOption === 'trending' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <Flame size={14} /> Trending
          </button>
          <button
            onClick={() => setSortOption('latest')}
            className={`btn ${sortOption === 'latest' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <Sparkles size={14} /> Latest
          </button>
          <button
            onClick={() => setSortOption('stars')}
            className={`btn ${sortOption === 'stars' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <Star size={14} /> Most Starred
          </button>
        </div>

        <button
          onClick={fetchProjects}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Feed List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <p className="font-mono">Loading developer project feed...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <Terminal size={40} color="#ff2a85" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
          <h3>No projects found</h3>
          <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
            Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        projects.map((proj) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            currentUser={currentUser}
            onStar={onStar}
            onLike={onLike}
            onOpenDetail={onOpenDetail}
            onAuthorClick={onAuthorClick}
          />
        ))
      )}
    </div>
  );
}
