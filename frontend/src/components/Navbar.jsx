import React from 'react';
import { Terminal, Compass, Package, PlusCircle, User as UserIcon, Search, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onOpenAuth, onLogout, searchQuery, setSearchQuery }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 11, 16, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('feed')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff2a85 0%, #00f3ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(255, 42, 133, 0.4)',
            }}
          >
            <Terminal size={22} color="#000" />
          </div>
          <div>
            <h1
              className="text-gradient"
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              PINKY
            </h1>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
              EXPERIENCE & RUN
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ flex: '1', maxWidth: '440px', position: 'relative' }}>
          <Search
            size={16}
            color="#64748b"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search projects, CLI tools, #tags, developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', height: '40px', borderRadius: '20px', fontSize: '0.88rem' }}
          />
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'feed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('feed')}
          >
            <Terminal size={16} /> Feed
          </button>

          <button
            className={`btn ${activeTab === 'explore' ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('explore')}
          >
            <Compass size={16} /> Explore
          </button>

          <button
            className={`btn ${activeTab === 'apt' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('apt')}
          >
            <Package size={16} /> APT Repo
          </button>

          {currentUser && (
            <button
              className={`btn ${activeTab === 'create' ? 'btn-cyan' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('create')}
            >
              <PlusCircle size={16} /> Publish
            </button>
          )}

          {/* User Profile / Auth */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px' }}>
              <div
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>@{currentUser.username}</span>
              </div>

              <button
                className="btn btn-secondary"
                style={{ padding: '8px', borderRadius: '50%' }}
                onClick={onLogout}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', marginLeft: '8px' }}
              onClick={onOpenAuth}
            >
              <UserIcon size={16} /> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
