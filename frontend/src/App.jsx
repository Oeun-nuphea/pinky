import React, { useState, useEffect } from 'react';
import './styles/theme.css';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import FeedPage from './pages/FeedPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CreateProjectPage from './pages/CreateProjectPage';
import ProfilePage from './pages/ProfilePage';
import AptRepoPage from './pages/AptRepoPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedProject, setSelectedProject] = useState(null);
  const [profileUsername, setProfileUsername] = useState('poetaman');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check stored auth token on init
  useEffect(() => {
    const token = localStorage.getItem('pinky_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch((err) => {
          localStorage.removeItem('pinky_token');
        });
    }
  }, []);

  const handleAuthSuccess = ({ token, user }) => {
    localStorage.setItem('pinky_token', token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('pinky_token');
    setCurrentUser(null);
  };

  const handleStar = async (projectId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const token = localStorage.getItem('pinky_token');
      await fetch(`/api/projects/${projectId}/star`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (projectId) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const token = localStorage.getItem('pinky_token');
      await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetail = (proj) => {
    setSelectedProject(proj);
    setActiveTab('detail');
  };

  const handleAuthorClick = (username) => {
    setProfileUsername(username);
    setActiveTab('profile');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'feed' && (
          <FeedPage
            currentUser={currentUser}
            onStar={handleStar}
            onLike={handleLike}
            onOpenDetail={handleOpenDetail}
            onAuthorClick={handleAuthorClick}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'explore' && (
          <FeedPage
            currentUser={currentUser}
            onStar={handleStar}
            onLike={handleLike}
            onOpenDetail={handleOpenDetail}
            onAuthorClick={handleAuthorClick}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'detail' && selectedProject && (
          <ProjectDetailPage
            project={selectedProject}
            currentUser={currentUser}
            onBack={() => setActiveTab('feed')}
            onStar={handleStar}
            onLike={handleLike}
            onAuthorClick={handleAuthorClick}
          />
        )}

        {activeTab === 'create' && (
          <CreateProjectPage
            currentUser={currentUser}
            onProjectCreated={(newProj) => {
              setSelectedProject(newProj);
              setActiveTab('detail');
            }}
            onCancel={() => setActiveTab('feed')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            username={profileUsername || currentUser?.username || 'poetaman'}
            currentUser={currentUser}
            onStar={handleStar}
            onLike={handleLike}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {activeTab === 'apt' && <AptRepoPage />}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.85rem',
          marginTop: '40px',
        }}
      >
        <p className="font-mono">
          Pinky Developer Social Platform & Live Runtime • Powered by NestJS, WebSockets, xterm.js & APT Distribution
        </p>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
