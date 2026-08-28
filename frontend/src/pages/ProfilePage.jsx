import React, { useState, useEffect } from 'react';
import { User, Star, Users, ExternalLink, Terminal, Shield } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';

export default function ProfilePage({
  username,
  currentUser,
  onStar,
  onLike,
  onOpenDetail,
}) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      setProfileData(data);
      if (currentUser && data.user) {
        setIsFollowing(data.user.followers?.includes(currentUser.id));
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) fetchProfile();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('pinky_token');
      const res = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsFollowing(data.isFollowing);
      fetchProfile();
    } catch (e) {
      console.error('Failed to toggle follow', e);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        <p className="font-mono">Loading developer portfolio...</p>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        <h3>Developer @{username} not found</h3>
      </div>
    );
  }

  const { user, projects, stats } = profileData;
  const isSelf = currentUser && currentUser.id === user.id;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Profile Header Hero */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img
              src={user.avatarUrl}
              alt={user.username}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid #ff2a85',
                boxShadow: '0 0 20px rgba(255, 42, 133, 0.4)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user.name || user.username}</h1>
                <span className="badge badge-cyan">@{user.username}</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '6px', maxWidth: '540px' }}>
                {user.bio}
              </p>
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#00f3ff',
                    fontSize: '0.85rem',
                    marginTop: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} /> {user.githubUrl}
                </a>
              )}
            </div>
          </div>

          {!isSelf && currentUser && (
            <button
              onClick={handleFollowToggle}
              className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '8px 20px' }}
            >
              {isFollowing ? 'Following' : '+ Follow Developer'}
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f3f9' }}>{stats.projectsCount}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Projects</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffb703' }}>{stats.totalStars}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Total Stars</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ff2a85' }}>{stats.followersCount}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Followers</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00f3ff' }}>{stats.followingCount}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Following</span>
          </div>
        </div>
      </div>

      {/* Developer Projects List */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px', color: '#f0f3f9' }}>
        Showcased Technical Projects ({projects.length})
      </h2>

      {projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
          <Terminal size={36} color="#00f3ff" style={{ margin: '0 auto 10px' }} />
          <p>No projects published by this developer yet.</p>
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
            onAuthorClick={() => { }}
          />
        ))
      )}
    </div>
  );
}
