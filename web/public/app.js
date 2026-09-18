document.addEventListener('DOMContentLoaded', () => {
  // Form elements
  const form = document.getElementById('artwork-form');
  const titleInput = document.getElementById('title-input');
  const authorInput = document.getElementById('author-input');
  const categorySelect = document.getElementById('category-select');
  const tagsInput = document.getElementById('tags-input');
  const descriptionInput = document.getElementById('description-input');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const dropPrompt = document.getElementById('drop-zone-prompt');
  const previewContainer = document.getElementById('preview-container');
  const imagePreview = document.getElementById('image-preview');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const removeFileBtn = document.getElementById('btn-remove-file');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const feedbackMessage = document.getElementById('feedback-message');

  // Character counts
  const titleCharCount = document.getElementById('title-char-count');
  const authorCharCount = document.getElementById('author-char-count');
  const descCharCount = document.getElementById('desc-char-count');

  // Gallery controls
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const sortSelect = document.getElementById('sort-select');
  const categoryPills = document.getElementById('category-pills');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryLoading = document.getElementById('gallery-loading');
  const galleryEmpty = document.getElementById('gallery-empty');
  const emptyStateText = document.getElementById('empty-state-text');
  const artworkCount = document.getElementById('artwork-count');

  // Pagination elements
  const paginationContainer = document.getElementById('pagination-container');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const pageIndicator = document.getElementById('page-indicator');

  // Theme elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');

  // Lightbox elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxAuthor = document.getElementById('lightbox-author');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxTags = document.getElementById('lightbox-tags');
  const lightboxDate = document.getElementById('lightbox-date');
  const lightboxLikesCount = document.getElementById('lightbox-likes-count');
  const lightboxLikeBtn = document.getElementById('lightbox-like-btn');
  const lightboxShareBtn = document.getElementById('lightbox-share-btn');
  const lightboxDownloadLink = document.getElementById('lightbox-download-link');
  const lightboxDeleteBtn = document.getElementById('lightbox-delete-btn');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxOverlay = document.getElementById('lightbox-overlay');

  // Delete modal elements
  const deleteModal = document.getElementById('delete-modal');
  const deleteOverlay = document.getElementById('delete-overlay');
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

  // UI elements
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const toastContainer = document.getElementById('toast-container');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  // State
  let currentFile = null;
  let activeCategory = 'all';
  let searchQuery = '';
  let sortBy = 'newest';
  let currentPage = 1;
  let activeModalArtwork = null;
  let searchDebounceTimer = null;
  let currentArtworksList = [];

  // Character counter listeners
  titleInput.addEventListener('input', () => {
    titleCharCount.textContent = `${titleInput.value.length}/100`;
    if (feedbackMessage.classList.contains('alert-error')) clearFeedback();
  });

  authorInput.addEventListener('input', () => {
    authorCharCount.textContent = `${authorInput.value.length}/60`;
    if (feedbackMessage.classList.contains('alert-error')) clearFeedback();
  });

  descriptionInput.addEventListener('input', () => {
    descCharCount.textContent = `${descriptionInput.value.length}/500`;
  });

  // Toast notifications
  function showToast(message, icon = '✨') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Skeleton loading placeholders
  function renderSkeletons(count = 6) {
    galleryGrid.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line author"></div>
          <div class="skeleton-line desc"></div>
        </div>
      </div>
    `).join('');
  }

  // Tag filter helper
  function filterByTag(tag) {
    const cleanTag = tag.replace(/^#+/, '').trim();
    if (!cleanTag) return;
    searchInput.value = cleanTag;
    searchClearBtn.classList.remove('hidden');
    searchQuery = cleanTag;
    currentPage = 1;
    if (activeModalArtwork) {
      closeLightbox();
    }
    loadArtworks();
    galleryGrid.scrollIntoView({ behavior: 'smooth' });
    showToast(`Filtering by #${cleanTag}`, '🏷️');
  }

  // Fetch and display artworks
  async function loadArtworks() {
    galleryLoading.classList.remove('hidden');
    galleryEmpty.classList.add('hidden');
    renderSkeletons(6);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy
      });

      if (activeCategory && activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/artworks?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const result = await response.json();

      if (result.success && result.data) {
        const paginated = result.data;
        currentArtworksList = paginated.artworks || [];
        renderGallery(currentArtworksList);
        renderPagination(paginated);
      } else {
        throw new Error(result.error || 'Failed to load artworks');
      }
    } catch (err) {
      console.error('Error loading artworks:', err);
      galleryGrid.innerHTML = `<p class="alert alert-error">Unable to load artworks. Please check your server status.</p>`;
    } finally {
      galleryLoading.classList.add('hidden');
    }
  }

  function renderGallery(artworks) {
    if (artworks.length === 0) {
      artworkCount.textContent = '0 artworks';
      galleryEmpty.classList.remove('hidden');
      if (searchQuery || activeCategory !== 'all') {
        emptyStateText.textContent = 'No artworks match your search or filter criteria.';
      } else {
        emptyStateText.textContent = 'Be the first artist to publish artwork in this collection!';
      }
      return;
    }

    galleryEmpty.classList.add('hidden');
    galleryGrid.innerHTML = '';

    artworks.forEach((art) => {
      const card = document.createElement('article');
      card.className = 'art-card';
      card.setAttribute('data-id', art.id);

      const dateStr = new Date(art.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const tagsHtml = (art.tags || [])
        .map((t) => `<span class="tag-badge" title="Filter by #${escapeHtml(t)}">#${escapeHtml(t)}</span>`)
        .join('');

      const firstLetter = (art.author || 'A').trim().charAt(0).toUpperCase() || 'A';

      card.innerHTML = `
        <div class="art-card-img-wrapper" title="Click to inspect full artwork">
          <span class="category-badge">${escapeHtml(art.category || 'Digital')}</span>
          <button type="button" class="card-like-btn" title="Like this artwork" data-id="${art.id}">
            <span>❤️</span>
            <span class="like-counter">${art.likes || 0}</span>
          </button>
          <img src="${escapeHtml(art.imageUrl)}" alt="${escapeHtml(art.title)}" loading="lazy">
        </div>
        <div class="art-card-body">
          <div class="author-row">
            <span class="author-avatar">${escapeHtml(firstLetter)}</span>
            <span class="author-name-text">by ${escapeHtml(art.author)}</span>
          </div>
          <h3 class="art-card-title">${escapeHtml(art.title)}</h3>
          <p class="art-card-desc">${art.description ? escapeHtml(art.description) : '<em>No description provided</em>'}</p>
          ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
          <div class="art-card-footer">
            <span>Posted ${dateStr}</span>
          </div>
        </div>
      `;

      // Card image click -> Open lightbox
      card.querySelector('.art-card-img-wrapper').addEventListener('click', (e) => {
        if (e.target.closest('.card-like-btn')) return;
        openLightbox(art);
      });

      // Card tags click -> Filter by tag
      card.querySelectorAll('.tag-badge').forEach((badge) => {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          const tag = badge.textContent.replace(/^#+/, '');
          filterByTag(tag);
        });
      });

      // Like button click
      const likeBtn = card.querySelector('.card-like-btn');
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleLikeArtwork(art.id, card);
      });

      galleryGrid.appendChild(card);
    });
  }

  function renderPagination(meta) {
    artworkCount.textContent = `${meta.total} artwork${meta.total === 1 ? '' : 's'}`;

    if (meta.totalPages <= 1) {
      paginationContainer.classList.add('hidden');
      return;
    }

    paginationContainer.classList.remove('hidden');
    pageIndicator.textContent = `Page ${meta.page} of ${meta.totalPages}`;
    prevPageBtn.disabled = meta.page <= 1;
    nextPageBtn.disabled = meta.page >= meta.totalPages;
  }

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadArtworks();
      galleryGrid.scrollIntoView({ behavior: 'smooth' });
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    loadArtworks();
    galleryGrid.scrollIntoView({ behavior: 'smooth' });
  });

  // Like artwork handler
  async function handleLikeArtwork(id, cardElement) {
    try {
      const response = await fetch(`/api/artworks/${encodeURIComponent(id)}/like`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to like');
      const result = await response.json();

      if (result.success && result.data) {
        const updated = result.data;
        if (cardElement) {
          const counter = cardElement.querySelector('.like-counter');
          if (counter) counter.textContent = updated.likes.toString();
        }
        if (activeModalArtwork && activeModalArtwork.id === id) {
          activeModalArtwork.likes = updated.likes;
          lightboxLikesCount.textContent = updated.likes.toString();
        }
        showToast('Artwork liked! ❤️', '❤️');
      }
    } catch (err) {
      console.error('Error liking artwork:', err);
    }
  }
    }
  }

  // Search input with debounce
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    if (val.length > 0) {
      searchClearBtn.classList.remove('hidden');
    } else {
      searchClearBtn.classList.add('hidden');
    }

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchQuery = val;
      currentPage = 1;
      loadArtworks();
    }, 300);
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.classList.add('hidden');
    searchQuery = '';
    currentPage = 1;
    loadArtworks();
  });

  // Sort selector
  sortSelect.addEventListener('change', () => {
    sortBy = sortSelect.value;
    currentPage = 1;
    loadArtworks();
  });

  // Category filter pills
  categoryPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-btn');
    if (!pill) return;

    categoryPills.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
    pill.classList.add('active');

    activeCategory = pill.getAttribute('data-category') || 'all';
    currentPage = 1;
    loadArtworks();
  });

  // File Preview Handler
  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function handleFileSelect(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('Please select a valid image file (PNG, JPG, GIF, WEBP, or SVG).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showFeedback('Image file size exceeds the 10MB limit.', 'error');
      return;
    }

    currentFile = file;
    previewFilename.textContent = file.name;
    previewFilesize.textContent = formatFileSize(file.size);

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      dropPrompt.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      clearFeedback();
    };
    reader.readAsDataURL(file);
  }

  function clearSelectedFile() {
    currentFile = null;
    fileInput.value = '';
    imagePreview.src = '';
    previewContainer.classList.add('hidden');
    dropPrompt.classList.remove('hidden');
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  });

  removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  // Drag and drop support
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFeedback();

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const category = categorySelect.value;
    const tags = tagsInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title) {
      showFeedback('Please provide an artwork title.', 'error');
      titleInput.focus();
      return;
    }

    if (!author) {
      showFeedback('Please provide your artist / author name.', 'error');
      authorInput.focus();
      return;
    }

    if (!currentFile && (!fileInput.files || fileInput.files.length === 0)) {
      showFeedback('Please select an artwork image file to upload.', 'error');
      return;
    }

    const fileToUpload = currentFile || fileInput.files[0];

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('description', description);
    formData.append('image', fileToUpload);

    setSubmitting(true);

    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        body: formData
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server response error (HTTP ${response.status})`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload artwork');
      }

      showFeedback('🎉 Masterpiece published successfully!', 'success');
      showToast('Masterpiece published! 🚀', '🎉');
      form.reset();
      titleCharCount.textContent = '0/100';
      authorCharCount.textContent = '0/60';
      descCharCount.textContent = '0/500';
      clearSelectedFile();
      currentPage = 1;
      await loadArtworks();
      galleryGrid.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Submit error:', err);
      showFeedback(err.message || 'An error occurred while uploading. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  });

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    if (isSubmitting) {
      btnText.textContent = 'Uploading Masterpiece...';
      btnSpinner.classList.remove('hidden');
    } else {
      btnText.textContent = '🚀 Publish Artwork';
      btnSpinner.classList.add('hidden');
    }
  }

  function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `alert alert-${type}`;
    feedbackMessage.classList.remove('hidden');
  }

  function clearFeedback() {
    feedbackMessage.textContent = '';
    feedbackMessage.className = 'alert hidden';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Theme Switcher
  const savedTheme = localStorage.getItem('pinky-theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
  }

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.textContent = '🌙';
      localStorage.setItem('pinky-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.textContent = '☀️';
      localStorage.setItem('pinky-theme', 'dark');
    }
  });

  // Lightbox
  function openLightbox(art) {
    activeModalArtwork = art;
    lightboxImg.src = art.imageUrl;
    lightboxImg.alt = art.title;
    lightboxCategory.textContent = art.category || 'Digital';
    lightboxTitle.textContent = art.title;
    lightboxAuthor.textContent = `by ${art.author}`;
    lightboxDesc.textContent = art.description || 'No description provided for this artwork.';
    lightboxLikesCount.textContent = (art.likes || 0).toString();

    const dateStr = new Date(art.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    lightboxDate.textContent = `Published on ${dateStr}`;

    // Configure download link
    const sanitizedTitle = (art.title || 'artwork').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = art.imageUrl.split('.').pop() || 'png';
    lightboxDownloadLink.href = art.imageUrl;
    lightboxDownloadLink.download = `${sanitizedTitle}.${ext}`;

    if (art.tags && art.tags.length > 0) {
      lightboxTags.innerHTML = art.tags
        .map((t) => `<span class="tag-badge" title="Filter by #${escapeHtml(t)}">#${escapeHtml(t)}</span>`)
        .join('');

      lightboxTags.querySelectorAll('.tag-badge').forEach((badge) => {
        badge.addEventListener('click', () => {
          const tag = badge.textContent.replace(/^#+/, '');
          filterByTag(tag);
        });
      });

      lightboxTags.classList.remove('hidden');
    } else {
      lightboxTags.innerHTML = '';
      lightboxTags.classList.add('hidden');
    }

    // Deep linking: update URL hash
    history.replaceState(null, '', `#art-${art.id}`);
    lightboxModal.classList.remove('hidden');
  }

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxImg.src = '';
    activeModalArtwork = null;
    if (window.location.hash.startsWith('#art-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Lightbox carousel navigation
  function navigateLightbox(direction) {
    if (!currentArtworksList || currentArtworksList.length <= 1) return;
    const currentIndex = currentArtworksList.findIndex((a) => a.id === activeModalArtwork?.id);
    if (currentIndex === -1) return;
    const newIndex = (currentIndex + direction + currentArtworksList.length) % currentArtworksList.length;
    openLightbox(currentArtworksList[newIndex]);
  }

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  }

  // Share button
  lightboxShareBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Artwork link copied to clipboard!', '🔗');
    } catch {
      prompt('Copy link to artwork:', window.location.href);
    }
  });

  // Delete flow
  lightboxDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('hidden');
  });

  deleteCancelBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  deleteOverlay.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
  });

  deleteConfirmBtn.addEventListener('click', async () => {
    if (!activeModalArtwork) return;
    const targetId = activeModalArtwork.id;
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = 'Deleting...';

    try {
      const response = await fetch(`/api/artworks/${encodeURIComponent(targetId)}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete artwork');
      }

      deleteModal.classList.add('hidden');
      closeLightbox();
      showFeedback('Artwork deleted successfully.', 'success');
      showToast('Artwork deleted.', '🗑️');
      await loadArtworks();
    } catch (err) {
      alert(err.message || 'Error deleting artwork');
    } finally {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = 'Yes, Delete';
    }
  });

  lightboxLikeBtn.addEventListener('click', () => {
    if (activeModalArtwork) {
      const cardElement = document.querySelector(`.art-card[data-id="${activeModalArtwork.id}"]`);
      handleLikeArtwork(activeModalArtwork.id, cardElement);
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!deleteModal.classList.contains('hidden')) {
        deleteModal.classList.add('hidden');
      } else if (!lightboxModal.classList.contains('hidden')) {
        closeLightbox();
      }
    } else if (e.key === 'ArrowLeft') {
      if (!lightboxModal.classList.contains('hidden') && deleteModal.classList.contains('hidden')) {
        navigateLightbox(-1);
      }
    } else if (e.key === 'ArrowRight') {
      if (!lightboxModal.classList.contains('hidden') && deleteModal.classList.contains('hidden')) {
        navigateLightbox(1);
      }
    }
  });

  // Empty state filter reset button
  if (emptyResetBtn) {
    emptyResetBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.classList.add('hidden');
      searchQuery = '';
      activeCategory = 'all';
      categoryPills.querySelectorAll('.pill-btn').forEach((b) => {
        if (b.getAttribute('data-category') === 'all') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      currentPage = 1;
      loadArtworks();
      showToast('Filters reset to All Works', '🔄');
    });
  }

  // Floating Back to Top Button
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        backToTopBtn.classList.remove('hidden');
      } else {
        backToTopBtn.classList.add('hidden');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Check URL hash on startup for direct deep linking
  async function checkDirectDeepLink() {
    if (window.location.hash.startsWith('#art-')) {
      const artId = window.location.hash.replace('#art-', '');
      try {
        const response = await fetch(`/api/artworks/${encodeURIComponent(artId)}`);
        const result = await response.json();
        if (result.success && result.data) {
          openLightbox(result.data);
        }
      } catch (err) {
        console.error('Deep link failed:', err);
      }
    }
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#art-')) {
      checkDirectDeepLink();
    } else if (!lightboxModal.classList.contains('hidden')) {
      closeLightbox();
    }
  });

  // Initial load
  loadArtworks().then(() => {
    checkDirectDeepLink();
  });
});
