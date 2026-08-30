let currentPage = 1;
const limit = 20;

document.getElementById('searchInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents accidental form submissions
    currentPage = 1;

    // Trigger your fetch logic based on the active tab
    if (typeof currentActiveTab !== 'undefined' && currentActiveTab === 'following') {
      fetchFollowingFeed();
    } else {
      fetchPosts();
    }
  }
});

// Fetch posts from backend API
async function fetchPosts() {
  const search = document.getElementById('searchInput').value;
  const orderBy = document.getElementById('sortSelect').value;
  const feed = document.getElementById('postsFeed');
  const token = localStorage.getItem('token');

  try {
    const response = await apiClient(`/posts?page=${currentPage}&pageLenght=${limit}&searchTerm=${search}&order=${orderBy}`);
    const data = await response.json();

    if (!data.posts || data.posts.length === 0) {
      feed.innerHTML = `<div class="text-center py-8 text-gray-500">No published posts found.</div>`;
      return;
    }

    feed.innerHTML = data.posts.map(post => `
      <article class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-3">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>By <strong>@${post.author?.username || 'Unknown'}</strong></span>
          <span>${new Date(post.timestamp || post.createdAt).toLocaleDateString()}</span>
        </div>

        <h3 class="text-lg font-bold text-gray-900">${post.title}</h3>
        <p class="text-gray-700 text-sm leading-relaxed">${post.content}</p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 pt-2">
          ${(post.tags || []).map(tag => `<span class="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium">#${tag}</span>`).join('')}
        </div>

        <!-- Interactive Engagement Controls -->
        <div class="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">          
          <div class="flex space-x-4">
            ${token ? `
              <button onclick="toggleLike('${post._id}')" class="flex items-center space-x-1 font-medium hover:text-red-500 transition">
                <span>❤️</span> <span>${post.like_count || 0} Likes</span>
              </button>
              <button onclick="toggleCommentBox('${post._id}')" class="flex items-center space-x-1 font-medium hover:text-indigo-600 transition">
                <span>💬</span> <span>${post.comment_count || 0} Comments</span>
              </button>
            ` : `
              <span class="text-gray-500">❤️ ${post.like_count || 0} Likes</span>
              <span class="text-gray-500">💬 ${post.comment_count || 0} Comments</span>
            `}
          </div>
        </div>

        <!-- Dynamic Comment Box (Visible when toggled for auth users) -->
        ${token ? `
          <div id="commentBox-${post._id}" class="hidden pt-3 space-y-2 border-t border-gray-50">
            <div class="flex gap-2">
              <input type="text" id="commentInput-${post._id}" placeholder="Write a comment..." 
                     class="flex-1 p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500">
              <button onclick="submitComment('${post._id}')" class="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700">
                Post
              </button>
            </div>
          </div>
        ` : ''}
      </article>
    `).join('');

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
  } catch (err) {
    feed.innerHTML = `<div class="text-center py-8 text-red-500">Failed to load feed.</div>`;
  }
}

function changePage(direction) {
  if (currentPage + direction > 0) {
    currentPage += direction;
    fetchPosts();
  }
}

// Event Listeners for Filters
// document.getElementById('sortSelect').addEventListener('change', fetchPosts);
// document.getElementById('searchInput').addEventListener('input', fetchPosts);

// --- Modal Visibility Controls ---

function toggleAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.toggle('hidden');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginBtn = document.getElementById('loginTabBtn');
  const signupBtn = document.getElementById('signupTabBtn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginBtn.className = "flex-1 py-2 font-semibold text-indigo-600 border-b-2 border-indigo-600";
    signupBtn.className = "flex-1 py-2 font-semibold text-gray-500 border-b-2 border-transparent hover:text-indigo-600";
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    signupBtn.className = "flex-1 py-2 font-semibold text-indigo-600 border-b-2 border-indigo-600";
    loginBtn.className = "flex-1 py-2 font-semibold text-gray-500 border-b-2 border-transparent hover:text-indigo-600";
  }
}

function openCreateModal() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Please sign in to create a post.");
    toggleAuthModal();
    return;
  }
  document.getElementById('createPostModal').classList.remove('hidden');
}

function closeCreateModal() {
  document.getElementById('createPostModal').classList.add('hidden');
  document.getElementById('createPostForm').reset();
}

// --- API Request Handlers ---

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginIdentifier').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('token', data.token);
    if (data.user && data.user.username) {
      localStorage.setItem('username', data.user.username);
    } else if (data.username) {
      localStorage.setItem('username', data.username);
    }

    toggleAuthModal();
    updateAuthUI();
    fetchPosts();
    fetchMyPosts();
  } catch (err) {
    alert(err.message);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const payload = {
    first_name: document.getElementById('signupFirstName').value,
    last_name: document.getElementById('signupLastName').value,
    username: document.getElementById('signupUsername').value,
    email: document.getElementById('signupEmail').value,
    password: document.getElementById('signupPassword').value
  };

  try {
    const res = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Signup failed');

    alert('Account created! Please sign in.');
    switchAuthTab('login');
  } catch (err) {
    alert(err.message);
  }
}

async function handleCreatePost(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const tagsInput = document.getElementById('postTags').value;

  const tags = tagsInput 
    ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

  const invalidTag = tags.find(tag => tag.length < 3);
  if (invalidTag) {
    alert(`Tag "${invalidTag}" is too short. Each tag must be at least 3 letters long.`);
    return;
  }

  const payload = {
    title: document.getElementById('postTitle').value,
    content: document.getElementById('postContent').value,
    tags
  };

  try {
    const res = await apiClient('/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create post');

    closeCreateModal();
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
}

function updateAuthUI() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const authContainer = document.getElementById('authActions');
  const topBar = document.getElementById('authenticatedTopBar');
  const myPostsSection = document.getElementById('myPostsSection');
  const createPostBtn = document.getElementById('createPostBtn');

  if (token) {
    authContainer.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-sm font-semibold text-gray-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
          👤 @${username || 'user'}
        </span>
        <button onclick="handleLogout()" class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-300 transition">
          Sign Out
        </button>
      </div>
    `;
    // Show "My Posts" section and load data
    if (topBar) topBar.classList.remove('hidden');
    if (myPostsSection)  myPostsSection.classList.remove('hidden');
    if (createPostBtn) createPostBtn.classList.remove('hidden');
    fetchUserNetworkCounts();
    fetchMyPosts();
  } else {
    authContainer.innerHTML = `
      <button onclick="toggleAuthModal()" class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition">
        Sign In / Register
      </button>
    `;

    // Hide "My Posts" section for guests
    if (topBar) topBar.classList.add('hidden');
    if (myPostsSection) myPostsSection.classList.add('hidden');
    if (createPostBtn) createPostBtn.classList.add('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  updateAuthUI();
  fetchPosts();
}

// Centralized fetch wrapper that injects the Authorization Bearer header
async function apiClient(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Attach Authorization header if JWT token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(endpoint, config);

  // Automatically handle expired tokens or unauthenticated responses
  if (response.status === 401) {
    localStorage.removeItem('token');
    updateAuthUI();
    alert('Session expired. Please log in again.');
  }

  return response;
}

let currentMyPostsState = '';

// Fetch and render the authenticated user's posts
async function fetchMyPosts(state = '') {
  currentMyPostsState = state;
  const container = document.getElementById('myPostsContainer');

  try {
    const endpoint = state ? `/posts/by_user?state=${state}` : '/posts/by_user';
    const res = await apiClient(endpoint);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to fetch your posts');

    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = `<div class="bg-white p-8 rounded-xl text-center text-gray-500 border border-gray-200">No ${state} posts found.</div>`;
      return;
    }

    container.innerHTML = data.posts.map(post => `
      <article class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-3">
        <div class="flex items-center justify-between">
          <!-- State Badge -->
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${post.state === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }">
            ${post.state.toUpperCase()}
          </span>
          <span class="text-xs text-gray-400">${new Date(post.createdAt || post.timestamp).toLocaleDateString()}</span>
        </div>

        <h3 class="text-lg font-bold text-gray-900">${post.title}</h3>
        <p class="text-gray-700 text-sm leading-relaxed">${post.content}</p>

        <!-- Row 1: Tags -->
    <div class="pt-3 border-t border-gray-100">
      <div class="flex flex-wrap gap-1.5 items-center">
        ${(post.tags && post.tags.length > 0) 
          ? post.tags.map(tag => `<span class="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded text-xs font-medium">#${tag}</span>`).join('')
          : '<span class="text-xs text-gray-400 italic">No tags</span>'
        }
      </div>
    </div>

    <!-- Row 2: Action Controls -->
    <div class="flex items-center justify-end space-x-2 pt-2 border-t border-gray-50">
      ${post.state === 'draft' ? `
        <button onclick="publishPost('${post._id}')" class="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">
          Publish
        </button>
      ` : ''}
      
      <button onclick="openEditModal('${post._id}', \`${encodeURIComponent(post.title)}\`, \`${encodeURIComponent(post.content)}\`, '${(post.tags || []).join(', ')}')" 
              class="px-3 py-1 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-50 transition">
        Edit
      </button>

      <button onclick="deletePost('${post._id}')" class="px-3 py-1 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition">
        Delete
      </button>
      </article>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center py-8 text-red-500">${err.message}</div>`;
  }
}

// Filter Tab Switcher
function filterMyPosts(state) {
  ['all', 'published', 'draft'].forEach(tab => {
    const btn = document.getElementById(`tab-${tab}`);
    if (btn) btn.className = 'px-3 py-1.5 rounded-md text-gray-600 hover:text-indigo-600';
  });

  const activeTab = document.getElementById(`tab-${state || 'all'}`);
  if (activeTab) activeTab.className = 'px-3 py-1.5 rounded-md bg-white shadow-sm text-indigo-600';

  fetchMyPosts(state);
}

// Publish Draft Action
async function publishPost(postId) {
  try {
    const res = await apiClient(`/posts/${postId}/published`, {
      method: 'PUT'
    });

    if (!res.ok) throw new Error('Failed to publish post');
    fetchMyPosts(currentMyPostsState);
  } catch (err) {
    alert(err.message);
  }
}

// Delete Post Action
async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    const res = await apiClient(`/posts/${postId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete post');
    fetchMyPosts(currentMyPostsState);
  } catch (err) {
    alert(err.message);
  }
}

// Open Edit Modal and pre-fill form fields
function openEditModal(id, encodedTitle, encodedContent, tags) {
  document.getElementById('editPostId').value = id;
  document.getElementById('editPostTitle').value = decodeURIComponent(encodedTitle);
  document.getElementById('editPostContent').value = decodeURIComponent(encodedContent);
  document.getElementById('editPostTags').value = tags;

  document.getElementById('editPostModal').classList.remove('hidden');
}

// Close Edit Modal
function closeEditModal() {
  document.getElementById('editPostModal').classList.add('hidden');
  document.getElementById('editPostForm').reset();
}

// Handle submit and send PATCH/PUT request to backend
async function handleEditPost(e) {
  e.preventDefault();

  const postId = document.getElementById('editPostId').value;
  const tagsInput = document.getElementById('editPostTags').value;

  const payload = {
    title: document.getElementById('editPostTitle').value,
    content: document.getElementById('editPostContent').value,
    tags: tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : []
  };

  try {
    const res = await apiClient(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update post');

    closeEditModal();
    fetchMyPosts(currentMyPostsState); // Refresh view
  } catch (err) {
    alert(err.message);
  }
}

// --- Like / Unlike API Action ---
async function toggleLike(postId) {
  try {
    const res = await apiClient(`/posts/${postId}/toggle_like`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not update like status');
    
    fetchPosts(); // Refresh counts
  } catch (err) {
    alert(err.message);
  }
}

// --- Comment Handlers ---
function toggleCommentBox(postId) {
  const box = document.getElementById(`commentBox-${postId}`);
  if (box) box.classList.toggle('hidden');
}

async function submitComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const content = input.value.trim();

  if (!content) return alert('Comment cannot be empty');

  try {
    const res = await apiClient(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add comment');

    input.value = '';
    fetchPosts(); // Refresh comment counts
  } catch (err) {
    alert(err.message);
  }
}

// --- Pill Navigation Tab Switching ---
let currentActiveTab = 'all';

function switchFeedTab(tab) {
  currentActiveTab = tab;

  // Reset pill button styles
  ['all-posts', 'following', 'followers'].forEach(t => {
    const btn = document.getElementById(`pill-${t}`);
    if (btn) {
      btn.className = "px-3.5 py-1.5 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition";
    }
  });

  // Highlight active pill
  const activeBtn = document.getElementById(`pill-${tab === 'all' ? 'all-posts' : tab}`);
  if (activeBtn) {
    activeBtn.className = "px-3.5 py-1.5 rounded-full bg-indigo-600 text-white shadow-sm transition";
  }

  // Handle specific feed loading logic
  if (tab === 'all') {
    fetchPosts();
  } else if (tab === 'following') {
    fetchFollowingFeed();
  } else if (tab === 'followers') {
    fetchFollowersList();
  }
}

// --- User Search Bar Handler ---
let searchDebounceTimeout;

function handleUserSearch(event) {
  clearTimeout(searchDebounceTimeout);
  const query = event.target.value.trim();
  const dropdown = document.getElementById('userSearchResults');

  if (!query) {
    dropdown.classList.add('hidden');
    return;
  }

  // Debounce API calls by 300ms
  searchDebounceTimeout = setTimeout(async () => {
    try {
      const res = await apiClient(`/users/search?q=${query}`);
      const data = await res.json();

      if (!res.ok || !data.users || data.users.length === 0) {
        dropdown.innerHTML = `<div class="p-2 text-xs text-gray-500 text-center">No users found</div>`;
        dropdown.classList.remove('hidden');
        return;
      }

      dropdown.innerHTML = data.users.map(user => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border-b border-gray-100 text-xs">
          <div>
            <p class="font-bold text-gray-800">${user.first_name || ''} ${user.last_name || ''}</p>
            <p class="text-gray-500">@${user.username}</p>
          </div>
          <button onclick="toggleFollowUser('${user._id}')" class="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md font-medium hover:bg-indigo-100">
            Follow
          </button>
        </div>
      `).join('');

      dropdown.classList.remove('hidden');
    } catch (err) {
      console.error("Search error:", err);
    }
  }, 300);
}

// Fetch network counts for pills badges
async function fetchUserNetworkCounts() {
  try {
    const res = await apiClient('/users/network-counts');
    const data = await res.json();
    if (res.ok) {
      document.getElementById('followingCountBadge').innerText = data.followingCount || 0;
      document.getElementById('followersCountBadge').innerText = data.followersCount || 0;
    }
  } catch (err) {
    // Fallback if endpoint is unavailable
  }
}

// Initial UI Auth state check
updateAuthUI();

// Initial Load
fetchPosts();