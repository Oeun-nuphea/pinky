import React, { useState } from 'react';
import { Terminal, Upload, PlusCircle, Check, ArrowLeft } from 'lucide-react';

export default function CreateProjectPage({ currentUser, onProjectCreated, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CLI');
  const [tagsStr, setTagsStr] = useState('CLI, Linux, Terminal');
  const [githubUrl, setGithubUrl] = useState('');
  const [readmeContent, setReadmeContent] = useState('');
  const [demoCmd, setDemoCmd] = useState('python3');
  const [demoScriptPath, setDemoScriptPath] = useState('backend/demos/pinky_cli_demo.py');
  const [debFile, setDebFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('pinky_token');
      const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          tags,
          githubUrl,
          readmeContent,
          demoCmd,
          demoArgs: [demoScriptPath],
        }),
      });

      const project = await res.json();
      if (!res.ok) throw new Error(project.message || 'Failed to create project');

      // If user uploaded a .deb package file
      if (debFile) {
        const formData = new FormData();
        formData.append('file', debFile);
        formData.append('version', '1.0.0');

        await fetch(`/api/projects/${project.id}/releases`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        // Trigger APT repository re-index
        await fetch('/api/apt/reindex');
      }

      onProjectCreated(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={onCancel} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Cancel
      </button>

      <div className="glass-panel glass-panel-glow" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff2a85 0%, #00f3ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlusCircle size={22} color="#000" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Publish Technical Project</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Share your CLI tool, Linux app, or terminal animation with live interactive demo execution.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 85, 85, 0.15)',
              color: '#ff5555',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Project Title *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. arttime, pinky-cli, matrix-rain"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Short Description *
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="What does this project do? (e.g. Terminal art and live clock tool)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ height: '42px' }}
              >
                <option value="CLI">CLI</option>
                <option value="Linux">Linux</option>
                <option value="Terminal Art">Terminal Art</option>
                <option value="DevTools">DevTools</option>
                <option value="AI">AI</option>
                <option value="Games">Games</option>
                <option value="Web">Web</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="CLI, Linux, Animation"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              GitHub Repository URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://github.com/username/project"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>

          {/* Sandbox Demo Setup */}
          <div style={{ padding: '16px', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#00f3ff', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={16} /> Live PTY Interactive Demo Runner Config
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Runner Executable</label>
                <input
                  type="text"
                  className="input-field font-mono"
                  value={demoCmd}
                  onChange={(e) => setDemoCmd(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Script / Binary Argument</label>
                <input
                  type="text"
                  className="input-field font-mono"
                  value={demoScriptPath}
                  onChange={(e) => setDemoScriptPath(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* README Content */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              README / Documentation (Markdown)
            </label>
            <textarea
              className="input-field font-mono"
              rows={5}
              placeholder="# Project Name&#10;&#10;Explain installation, options, and features..."
              value={readmeContent}
              onChange={(e) => setReadmeContent(e.target.value)}
            />
          </div>

          {/* .deb Package File Upload */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Upload Linux Debian Package (.deb)
            </label>
            <div
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="file"
                accept=".deb"
                id="deb-file-input"
                style={{ display: 'none' }}
                onChange={(e) => setDebFile(e.target.files[0])}
              />
              <label htmlFor="deb-file-input" style={{ cursor: 'pointer' }}>
                <Upload size={32} color="#ff2a85" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  {debFile ? debFile.name : 'Click to select package file (mycli_1.0.0_amd64.deb)'}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Will be automatically indexed into Pinky's APT repository
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Publishing Project...' : '🚀 Publish Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
