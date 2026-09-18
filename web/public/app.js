document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('artwork-form');
  const titleInput = document.getElementById('title-input');
  const authorInput = document.getElementById('author-input');
  const descriptionInput = document.getElementById('description-input');
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const dropPrompt = document.getElementById('drop-zone-prompt');
  const previewContainer = document.getElementById('preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removeFileBtn = document.getElementById('btn-remove-file');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  const feedbackMessage = document.getElementById('feedback-message');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryLoading = document.getElementById('gallery-loading');
  const galleryEmpty = document.getElementById('gallery-empty');
  const artworkCount = document.getElementById('artwork-count');
  const refreshBtn = document.getElementById('refresh-btn');

  // Lightbox elements
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxAuthor = document.getElementById('lightbox-author');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxOverlay = document.getElementById('lightbox-overlay');

  let currentFile = null;

  // Fetch and display artworks
  async function loadArtworks() {
    galleryLoading.classList.remove('hidden');
    galleryEmpty.classList.add('hidden');
    galleryGrid.innerHTML = '';

    try {
      const response = await fetch('/api/artworks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        renderGallery(result.data);
      } else {
        throw new Error(result.error || 'Failed to load artworks');
      }
    } catch (err) {
      console.error('Error loading artworks:', err);
      galleryGrid.innerHTML = `<p class="alert alert-error">Unable to load artworks. Please check your connection or server status.</p>`;
    } finally {
      galleryLoading.classList.add('hidden');
    }
  }

  function renderGallery(artworks) {
    artworkCount.textContent = `${artworks.length} artwork${artworks.length === 1 ? '' : 's'}`;

    if (artworks.length === 0) {
      galleryEmpty.classList.remove('hidden');
      return;
    }

    galleryEmpty.classList.add('hidden');
    galleryGrid.innerHTML = '';

    artworks.forEach((art) => {
      const card = document.createElement('article');
      card.className = 'art-card';

      const dateStr = new Date(art.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      card.innerHTML = `
        <div class="art-card-img-wrapper" title="Click to enlarge">
          <img src="${escapeHtml(art.imageUrl)}" alt="${escapeHtml(art.title)}" loading="lazy">
        </div>
        <div class="art-card-body">
          <h3 class="art-card-title">${escapeHtml(art.title)}</h3>
          <p class="art-card-author">by ${escapeHtml(art.author)}</p>
          <p class="art-card-desc">${art.description ? escapeHtml(art.description) : '<em>No description provided</em>'}</p>
          <div class="art-card-footer">
            <span>Posted ${dateStr}</span>
          </div>
        </div>
      `;

      card.querySelector('.art-card-img-wrapper').addEventListener('click', () => {
        openLightbox(art);
      });

      galleryGrid.appendChild(card);
    });
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

  // File Preview Handler
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
    const description = descriptionInput.value.trim();

    if (!title) {
      showFeedback('Please provide an artwork title.', 'error');
      titleInput.focus();
      return;
    }

    if (!author) {
      showFeedback('Please provide the artist / author name.', 'error');
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
    formData.append('description', description);
    formData.append('image', fileToUpload);

    setSubmitting(true);

    try {
      const response = await fetch('/api/artworks', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload artwork');
      }

      showFeedback('🎉 Artwork posted successfully!', 'success');
      form.reset();
      clearSelectedFile();
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
      btnText.textContent = 'Uploading...';
      btnSpinner.classList.remove('hidden');
    } else {
      btnText.textContent = 'Publish Artwork';
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

  // Lightbox
  function openLightbox(art) {
    lightboxImg.src = art.imageUrl;
    lightboxImg.alt = art.title;
    lightboxTitle.textContent = art.title;
    lightboxAuthor.textContent = `by ${art.author}`;
    lightboxDesc.textContent = art.description || '';
    lightboxModal.classList.remove('hidden');
  }

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxImg.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxOverlay.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightboxModal.classList.contains('hidden')) {
      closeLightbox();
    }
  });

  refreshBtn.addEventListener('click', () => {
    loadArtworks();
  });

  // Initial load
  loadArtworks();
});
