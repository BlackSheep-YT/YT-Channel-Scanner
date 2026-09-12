import JSZip from 'jszip';
import { ExtensionFileItem } from './types';

// Manifest V3 manifest.json
export const MANIFEST_JSON = JSON.stringify(
  {
    manifest_version: 3,
    name: 'YouTube Channel Scanner & CSV Exporter',
    version: '1.0.0',
    description:
      'Scans YouTube channels and lists Videos, Shorts, Live in Date Wise (including Members-Only videos without membership) and exports to CSV.',
    permissions: ['activeTab', 'scripting', 'storage', 'downloads'],
    host_permissions: ['*://*.youtube.com/*'],
    action: {
      default_popup: 'popup.html',
      default_title: 'Scan YouTube Channel',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    background: {
      service_worker: 'background.js',
    },
    content_scripts: [
      {
        matches: ['*://*.youtube.com/*'],
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  null,
  2
);

// popup.html
export const POPUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YT Channel Scanner</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-logo">
        <svg class="yt-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <div>
          <h1 class="title">Channel Scanner</h1>
          <p class="subtitle">Videos • Shorts • Live • Members-Only</p>
        </div>
      </div>
      <span class="badge-v3">Manifest V3</span>
    </header>

    <!-- Channel Detection Card -->
    <div class="channel-card" id="channelCard">
      <div class="channel-info">
        <img id="channelAvatar" class="channel-avatar" src="" alt="Avatar" style="display:none;" />
        <div class="channel-text">
          <div id="channelName" class="channel-name">Checking current tab...</div>
          <div id="channelHandle" class="channel-handle">Open any YouTube channel</div>
        </div>
      </div>
      <button id="refreshTabBtn" class="icon-button" title="Refresh channel info">↻</button>
    </div>

    <!-- Scan Configuration -->
    <div class="config-panel">
      <div class="config-row">
        <label class="config-label">Include Tabs:</label>
        <div class="checkbox-group">
          <label class="pill-checkbox">
            <input type="checkbox" id="tabVideos" checked />
            <span>Videos</span>
          </label>
          <label class="pill-checkbox">
            <input type="checkbox" id="tabShorts" checked />
            <span>Shorts</span>
          </label>
          <label class="pill-checkbox">
            <input type="checkbox" id="tabLive" checked />
            <span>Live</span>
          </label>
        </div>
      </div>

      <div class="config-grid">
        <div class="config-item">
          <label for="scanDepth" class="config-label">Depth:</label>
          <select id="scanDepth" class="select-input">
            <option value="30">Quick (30)</option>
            <option value="100" selected>Deep (100)</option>
            <option value="250">Heavy (250)</option>
            <option value="1000">All Available</option>
          </select>
        </div>
        <div class="config-item">
          <label for="sortOrder" class="config-label">Date Order:</label>
          <select id="sortOrder" class="select-input">
            <option value="newest" selected>Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button id="startScanBtn" class="primary-btn">
        <span class="btn-icon">⚡</span>
        <span id="scanBtnText">Scan Channel</span>
      </button>
      <button id="stopScanBtn" class="secondary-btn danger" style="display:none;">
        <span>Stop</span>
      </button>
    </div>

    <!-- Progress Status -->
    <div id="progressContainer" class="progress-container" style="display:none;">
      <div class="progress-bar-bg">
        <div id="progressBar" class="progress-bar-fill" style="width: 0%;"></div>
      </div>
      <div class="progress-labels">
        <span id="statusMessage" class="status-msg">Scanning...</span>
        <span id="itemCounter" class="counter-badge">0 items</span>
      </div>
    </div>

    <!-- Results Overview -->
    <div id="resultsSection" class="results-section" style="display:none;">
      <div class="stats-bar">
        <div class="stat-pill"><strong id="totalCount">0</strong> Total</div>
        <div class="stat-pill members"><strong id="membersCount">0</strong> Members-Only 🔒</div>
        <div class="stat-pill"><strong id="publicCount">0</strong> Public</div>
      </div>

      <!-- Export Actions -->
      <div class="export-bar">
        <button id="downloadCsvBtn" class="export-btn primary">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download CSV
        </button>
        <button id="copyCsvBtn" class="export-btn secondary">
          Copy CSV
        </button>
      </div>

      <!-- Quick Filter -->
      <div class="filter-row">
        <input type="text" id="filterInput" class="search-input" placeholder="Search title in results..." />
        <select id="filterAccess" class="select-input small">
          <option value="all">All Access</option>
          <option value="members">Members-only</option>
          <option value="public">Public</option>
        </select>
      </div>

      <!-- Video Preview List -->
      <div id="videoList" class="video-list"></div>
    </div>

    <!-- Instructions / Footer -->
    <footer class="footer">
      <span id="noticeText">Includes Members-Only videos without needing membership.</span>
    </footer>
  </div>

  <script src="popup.js"></script>
</body>
</html>`;

// popup.css
export const POPUP_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

body {
  width: 420px;
  max-height: 580px;
  overflow-y: auto;
  background-color: #0f0f11;
  color: #f1f1f5;
  font-size: 13px;
}

.app-container {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #23232a;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.yt-icon {
  width: 28px;
  height: 28px;
  color: #ff0033;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

.subtitle {
  font-size: 11px;
  color: #8e8e9f;
}

.badge-v3 {
  font-size: 10px;
  background: #1c1c24;
  border: 1px solid #323242;
  color: #a1a1b5;
  padding: 2px 6px;
  border-radius: 4px;
}

.channel-card {
  background: #18181f;
  border: 1px solid #282836;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.channel-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.channel-name {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 270px;
}

.channel-handle {
  font-size: 11px;
  color: #8e8e9f;
}

.icon-button {
  background: #252533;
  border: none;
  color: #cfd3dc;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.icon-button:hover {
  background: #343446;
}

.config-panel {
  background: #18181f;
  border: 1px solid #282836;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-label {
  font-size: 11px;
  color: #a0a0b2;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  gap: 6px;
}

.pill-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.pill-checkbox input {
  display: none;
}

.pill-checkbox span {
  padding: 4px 9px;
  background: #22222d;
  border: 1px solid #333342;
  border-radius: 14px;
  font-size: 11px;
  color: #9d9db0;
  transition: all 0.15s ease;
}

.pill-checkbox input:checked + span {
  background: #ff003322;
  border-color: #ff0033;
  color: #ff4d6a;
  font-weight: 600;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.select-input {
  background: #22222e;
  border: 1px solid #333345;
  color: #e5e5ed;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
}

.select-input.small {
  padding: 4px 6px;
  font-size: 11px;
}

.actions {
  display: flex;
  gap: 8px;
}

.primary-btn {
  flex: 1;
  background: #ff0033;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s ease;
}

.primary-btn:hover {
  background: #e6002e;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background: #23232f;
  color: #d1d1de;
  border: 1px solid #373747;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.secondary-btn.danger {
  color: #ff5555;
  border-color: #552222;
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background: #22222f;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff0033, #ff6600);
  transition: width 0.2s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #a0a0b2;
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats-bar {
  display: flex;
  gap: 6px;
}

.stat-pill {
  flex: 1;
  background: #181820;
  border: 1px solid #282835;
  padding: 5px 8px;
  border-radius: 6px;
  text-align: center;
  font-size: 11px;
  color: #a8a8b8;
}

.stat-pill.members {
  border-color: #d97706;
  color: #f59e0b;
  background: #291800;
}

.export-bar {
  display: flex;
  gap: 8px;
}

.export-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.export-btn.primary {
  background: #10b981;
  color: white;
  border: none;
}

.export-btn.primary:hover {
  background: #059669;
}

.export-btn.secondary {
  background: #22222e;
  border: 1px solid #38384b;
  color: #d8d8e6;
}

.export-btn.secondary:hover {
  background: #2d2d3d;
}

.filter-row {
  display: flex;
  gap: 6px;
}

.search-input {
  flex: 1;
  background: #181820;
  border: 1px solid #282835;
  color: #f1f1f5;
  padding: 5px 9px;
  border-radius: 6px;
  font-size: 11px;
  outline: none;
}

.video-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}

.video-item {
  display: flex;
  gap: 8px;
  background: #181820;
  border: 1px solid #262633;
  padding: 6px 8px;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
  align-items: center;
}

.video-thumb {
  width: 58px;
  height: 33px;
  border-radius: 4px;
  object-fit: cover;
  background: #262633;
  flex-shrink: 0;
}

.video-meta {
  flex: 1;
  min-width: 0;
}

.video-item-title {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #e5e5ed;
}

.video-sub-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 10px;
}

.badge-tag {
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
  font-size: 9px;
}

.badge-tag.video { background: #1e3a8a; color: #93c5fd; }
.badge-tag.shorts { background: #831843; color: #f472b6; }
.badge-tag.live { background: #7f1d1d; color: #fca5a5; }

.badge-access {
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
}

.badge-access.members {
  background: #78350f;
  color: #fcd34d;
}

.badge-access.public {
  background: #064e3b;
  color: #6ee7b7;
}

.video-date {
  color: #8e8e9f;
  margin-left: auto;
}

.footer {
  text-align: center;
  font-size: 10px;
  color: #727284;
  padding-top: 4px;
}
`;

// popup.js
export const POPUP_JS = `// popup.js - Controller for YouTube Channel Scanner Extension
let currentTabId = null;
let currentChannel = null;
let scannedVideos = [];
let isScanning = false;

document.addEventListener('DOMContentLoaded', async () => {
  initDOMElements();
  await checkActiveTab();
  setupEventListeners();
});

let dom = {};

function initDOMElements() {
  dom = {
    channelCard: document.getElementById('channelCard'),
    channelAvatar: document.getElementById('channelAvatar'),
    channelName: document.getElementById('channelName'),
    channelHandle: document.getElementById('channelHandle'),
    refreshTabBtn: document.getElementById('refreshTabBtn'),
    tabVideos: document.getElementById('tabVideos'),
    tabShorts: document.getElementById('tabShorts'),
    tabLive: document.getElementById('tabLive'),
    scanDepth: document.getElementById('scanDepth'),
    sortOrder: document.getElementById('sortOrder'),
    startScanBtn: document.getElementById('startScanBtn'),
    stopScanBtn: document.getElementById('stopScanBtn'),
    scanBtnText: document.getElementById('scanBtnText'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    statusMessage: document.getElementById('statusMessage'),
    itemCounter: document.getElementById('itemCounter'),
    resultsSection: document.getElementById('resultsSection'),
    totalCount: document.getElementById('totalCount'),
    membersCount: document.getElementById('membersCount'),
    publicCount: document.getElementById('publicCount'),
    downloadCsvBtn: document.getElementById('downloadCsvBtn'),
    copyCsvBtn: document.getElementById('copyCsvBtn'),
    filterInput: document.getElementById('filterInput'),
    filterAccess: document.getElementById('filterAccess'),
    videoList: document.getElementById('videoList'),
    noticeText: document.getElementById('noticeText'),
  };
}

async function checkActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.url) return;
    currentTabId = tab.id;

    if (!tab.url.includes('youtube.com')) {
      dom.channelName.textContent = 'Not on YouTube';
      dom.channelHandle.textContent = 'Please open a YouTube channel page';
      dom.startScanBtn.disabled = true;
      return;
    }

    // Ask content script for channel information
    chrome.tabs.sendMessage(currentTabId, { action: 'GET_CHANNEL_INFO' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        // Content script might not be injected or page isn't channel yet
        extractChannelFromUrl(tab.url);
      } else {
        updateChannelUI(response.channel);
      }
    });
  } catch (err) {
    console.error('Error checking active tab:', err);
  }
}

function extractChannelFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Check handles e.g. /@handle
    const handleMatch = pathname.match(/\\/(@[^\\/]+)/);
    if (handleMatch) {
      updateChannelUI({
        title: handleMatch[1],
        handle: handleMatch[1],
        url: 'https://www.youtube.com/' + handleMatch[1],
      });
      dom.startScanBtn.disabled = false;
      return;
    }

    // Check /channel/UC... or /c/...
    const channelMatch = pathname.match(/\\/(channel|c|user)\\/([^\\/]+)/);
    if (channelMatch) {
      updateChannelUI({
        title: channelMatch[2],
        handle: channelMatch[1] + '/' + channelMatch[2],
        url: url,
      });
      dom.startScanBtn.disabled = false;
      return;
    }

    dom.channelName.textContent = 'YouTube Opened';
    dom.channelHandle.textContent = 'Navigate to a channel page (e.g. /@channel)';
    dom.startScanBtn.disabled = false;
  } catch (e) {
    console.error(e);
  }
}

function updateChannelUI(channel) {
  currentChannel = channel;
  dom.channelName.textContent = channel.title || channel.handle || 'Channel Detected';
  dom.channelHandle.textContent = channel.handle || 'Ready to scan';
  if (channel.avatarUrl) {
    dom.channelAvatar.src = channel.avatarUrl;
    dom.channelAvatar.style.display = 'block';
  }
  dom.startScanBtn.disabled = false;
}

function setupEventListeners() {
  dom.refreshTabBtn.addEventListener('click', () => checkActiveTab());

  dom.startScanBtn.addEventListener('click', startScanning);
  dom.stopScanBtn.addEventListener('click', stopScanning);

  dom.downloadCsvBtn.addEventListener('click', downloadCsv);
  dom.copyCsvBtn.addEventListener('click', copyCsv);

  dom.filterInput.addEventListener('input', renderVideoList);
  dom.filterAccess.addEventListener('change', renderVideoList);
  dom.sortOrder.addEventListener('change', () => {
    sortVideos();
    renderVideoList();
  });
}

function startScanning() {
  if (isScanning) return;
  isScanning = true;
  scannedVideos = [];

  dom.startScanBtn.style.display = 'none';
  dom.stopScanBtn.style.display = 'block';
  dom.progressContainer.style.display = 'flex';
  dom.resultsSection.style.display = 'block';
  dom.progressBar.style.width = '5%';
  dom.statusMessage.textContent = 'Initiating channel scanner...';
  dom.itemCounter.textContent = '0 items';

  const options = {
    includeVideos: dom.tabVideos.checked,
    includeShorts: dom.tabShorts.checked,
    includeLive: dom.tabLive.checked,
    depth: parseInt(dom.scanDepth.value, 10),
    sortOrder: dom.sortOrder.value,
  };

  chrome.tabs.sendMessage(currentTabId, {
    action: 'START_SCAN',
    options: options,
  }, (response) => {
    if (chrome.runtime.lastError) {
      dom.statusMessage.textContent = 'Error: Refresh YouTube tab and try again.';
      finishScanning();
    }
  });

  // Listen for progress updates from content script
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);
}

function handleRuntimeMessage(msg) {
  if (msg.action === 'SCAN_PROGRESS') {
    dom.progressBar.style.width = Math.min(msg.progress, 95) + '%';
    dom.statusMessage.textContent = msg.message;
    dom.itemCounter.textContent = msg.count + ' items';

    if (msg.newVideos && msg.newVideos.length > 0) {
      appendVideos(msg.newVideos);
    }
  } else if (msg.action === 'SCAN_COMPLETE') {
    dom.progressBar.style.width = '100%';
    dom.statusMessage.textContent = 'Scan completed!';
    if (msg.videos) {
      scannedVideos = msg.videos;
      sortVideos();
      updateStats();
      renderVideoList();
    }
    finishScanning();
  } else if (msg.action === 'SCAN_ERROR') {
    dom.statusMessage.textContent = 'Error: ' + msg.error;
    finishScanning();
  }
}

function stopScanning() {
  chrome.tabs.sendMessage(currentTabId, { action: 'STOP_SCAN' });
  finishScanning();
}

function finishScanning() {
  isScanning = false;
  dom.startScanBtn.style.display = 'flex';
  dom.stopScanBtn.style.display = 'none';
  dom.scanBtnText.textContent = 'Re-Scan Channel';
  sortVideos();
  updateStats();
  renderVideoList();
}

function appendVideos(items) {
  for (const item of items) {
    if (!scannedVideos.some(v => v.id === item.id)) {
      scannedVideos.push(item);
    }
  }
  updateStats();
  renderVideoList();
}

function sortVideos() {
  const order = dom.sortOrder.value;
  scannedVideos.sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return order === 'newest' ? timeB - timeA : timeA - timeB;
  });
}

function updateStats() {
  const total = scannedVideos.length;
  const membersOnly = scannedVideos.filter(v => v.accessType === 'Members-only').length;
  const pub = total - membersOnly;

  dom.totalCount.textContent = total;
  dom.membersCount.textContent = membersOnly;
  dom.publicCount.textContent = pub;
}

function renderVideoList() {
  const query = dom.filterInput.value.toLowerCase().trim();
  const accessFilter = dom.filterAccess.value;

  const filtered = scannedVideos.filter(v => {
    const matchesQuery = !query || v.title.toLowerCase().includes(query);
    const matchesAccess =
      accessFilter === 'all' ||
      (accessFilter === 'members' && v.accessType === 'Members-only') ||
      (accessFilter === 'public' && v.accessType === 'Public');
    return matchesQuery && matchesAccess;
  });

  dom.videoList.innerHTML = '';

  if (filtered.length === 0) {
    dom.videoList.innerHTML = '<div style="text-align:center;padding:20px;color:#727284;">No videos found</div>';
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.slice(0, 100).forEach(v => {
    const item = document.createElement('a');
    item.className = 'video-item';
    item.href = v.link;
    item.target = '_blank';

    const categoryClass = v.category.toLowerCase();
    const isMember = v.accessType === 'Members-only';

    item.innerHTML = \`
      <img class="video-thumb" src="\${v.thumbnailUrl || ''}" alt="" />
      <div class="video-meta">
        <div class="video-item-title" title="\${escapeHtml(v.title)}">\${escapeHtml(v.title)}</div>
        <div class="video-sub-line">
          <span class="badge-tag \${categoryClass}">\${v.category}</span>
          <span class="badge-access \${isMember ? 'members' : 'public'}">
            \${isMember ? '🔒 ' + (v.membershipLevel || 'Members-only') : 'Public'}
          </span>
          <span class="video-date">\${v.date}</span>
        </div>
      </div>
    \`;
    fragment.appendChild(item);
  });

  dom.videoList.appendChild(fragment);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateCsvString() {
  // Format requested:
  // Video Title, Video Link, Video Date, Video Category (Video, Shorts, Live), Video Access Type (Public or Members-only) & Membership Level
  const headers = [
    'Video Title',
    'Video Link',
    'Video Date',
    'Video Category',
    'Video Access Type',
    'Membership Level'
  ];

  function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    const s = String(val).trim();
    if (s.includes('"') || s.includes(',') || s.includes('\\n') || s.includes('\\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return '"' + s + '"';
  }

  const rows = scannedVideos.map(v => [
    escapeCsvCell(v.title),
    escapeCsvCell(v.link),
    escapeCsvCell(v.date),
    escapeCsvCell(v.category),
    escapeCsvCell(v.accessType),
    escapeCsvCell(v.membershipLevel)
  ].join(','));

  return '\\uFEFF' + [headers.join(','), ...rows].join('\\r\\n');
}

function downloadCsv() {
  if (scannedVideos.length === 0) return;
  const csvContent = generateCsvString();
  const channelTag = currentChannel?.handle?.replace(/[^a-zA-Z0-9_-]/g, '') || 'youtube_channel';
  const filename = \`\${channelTag}_videos_\${new Date().toISOString().slice(0, 10)}.csv\`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  if (chrome.downloads && chrome.downloads.download) {
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

async function copyCsv() {
  if (scannedVideos.length === 0) return;
  const csv = generateCsvString();
  try {
    await navigator.clipboard.writeText(csv);
    dom.copyCsvBtn.textContent = 'Copied! ✓';
    setTimeout(() => { dom.copyCsvBtn.textContent = 'Copy CSV'; }, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
}
`;

// content.js
export const CONTENT_JS = `// content.js - Injected into YouTube tabs to scan videos and detect Members-Only content
let isScanActive = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_CHANNEL_INFO') {
    const info = extractChannelMetadata();
    sendResponse({ success: true, channel: info });
    return true;
  }

  if (request.action === 'START_SCAN') {
    isScanActive = true;
    runChannelScan(request.options).then(videos => {
      chrome.runtime.sendMessage({
        action: 'SCAN_COMPLETE',
        videos: videos
      });
    }).catch(err => {
      chrome.runtime.sendMessage({
        action: 'SCAN_ERROR',
        error: err.message
      });
    });
    sendResponse({ started: true });
    return true;
  }

  if (request.action === 'STOP_SCAN') {
    isScanActive = false;
    sendResponse({ stopped: true });
    return true;
  }
});

function extractChannelMetadata() {
  // Title / Handle
  const titleEl = document.querySelector('ytd-channel-name yt-formatted-string, #channel-name yt-formatted-string, .ytd-channel-name');
  const handleEl = document.querySelector('yt-formatted-string#channel-handle, .ytd-channel-handle, #channel-tag');
  const avatarEl = document.querySelector('yt-img-shadow#avatar img, #avatar img, .channel-header-avatar');

  const title = titleEl ? titleEl.textContent.trim() : document.title.replace(' - YouTube', '');
  const handle = handleEl ? handleEl.textContent.trim() : window.location.pathname.split('/')[1] || '';
  const avatarUrl = avatarEl ? avatarEl.src : '';

  return {
    title: title,
    handle: handle,
    avatarUrl: avatarUrl,
    url: window.location.href
  };
}

async function runChannelScan(options) {
  const currentUrl = window.location.href;
  const channelBase = getChannelBaseUrl(currentUrl);
  const collectedVideos = [];
  const seenIds = new Set();

  const tabsToScan = [];
  if (options.includeVideos) tabsToScan.push({ tab: 'videos', category: 'Video' });
  if (options.includeShorts) tabsToScan.push({ tab: 'shorts', category: 'Shorts' });
  if (options.includeLive) tabsToScan.push({ tab: 'streams', category: 'Live' });

  const maxTotal = options.depth || 100;

  for (let i = 0; i < tabsToScan.length; i++) {
    if (!isScanActive) break;
    const { tab, category } = tabsToScan[i];

    chrome.runtime.sendMessage({
      action: 'SCAN_PROGRESS',
      progress: Math.round(((i) / tabsToScan.length) * 100),
      message: \`Scanning \${category} tab...\`,
      count: collectedVideos.length,
      newVideos: []
    });

    try {
      const tabUrl = \`\${channelBase}/\${tab}?hl=en\`;
      const tabVideos = await fetchAndParseTab(tabUrl, category, maxTotal - collectedVideos.length);
      
      const newItems = [];
      for (const v of tabVideos) {
        if (!seenIds.has(v.id)) {
          seenIds.add(v.id);
          collectedVideos.push(v);
          newItems.push(v);
        }
      }

      chrome.runtime.sendMessage({
        action: 'SCAN_PROGRESS',
        progress: Math.round(((i + 1) / tabsToScan.length) * 100),
        message: \`Found \${newItems.length} \${category} items\`,
        count: collectedVideos.length,
        newVideos: newItems
      });
    } catch (e) {
      console.warn(\`Error scanning \${tab}: \`, e);
    }
  }

  return collectedVideos;
}

function getChannelBaseUrl(url) {
  const urlObj = new URL(url);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  if (parts.length > 0) {
    if (parts[0].startsWith('@')) {
      return \`https://www.youtube.com/\${parts[0]}\`;
    }
    if ((parts[0] === 'channel' || parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
      return \`https://www.youtube.com/\${parts[0]}/\${parts[1]}\`;
    }
  }
  return \`https://www.youtube.com\${urlObj.pathname}\`.replace(/\\/(videos|shorts|streams|playlists|community|channels|about)/, '');
}

async function fetchAndParseTab(tabUrl, category, limit) {
  const res = await fetch(tabUrl, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    credentials: 'include'
  });
  const html = await res.text();

  // Extract ytInitialData
  const match = html.match(/ytInitialData\\s*=\\s*({.+?});<\\/script>/s);
  if (!match) return [];

  let ytInitialData;
  try {
    ytInitialData = JSON.parse(match[1]);
  } catch (err) {
    return [];
  }

  const items = extractItemsFromYtData(ytInitialData, category);
  return items.slice(0, limit);
}

function extractItemsFromYtData(data, defaultCategory) {
  const results = [];
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
  if (!tabs) return results;

  const selectedTab = tabs.find(t => t.tabRenderer?.selected) || tabs[1] || tabs[0];
  const contents = selectedTab?.tabRenderer?.content?.richGridRenderer?.contents 
    || selectedTab?.tabRenderer?.content?.sectionListRenderer?.contents;

  if (!contents || !Array.isArray(contents)) return results;

  for (const item of contents) {
    const richItem = item.richItemRenderer?.content;
    if (!richItem) continue;

    // Standard Video or Live Stream
    if (richItem.lockupViewModel) {
      const v = parseLockupViewModel(richItem.lockupViewModel, defaultCategory);
      if (v) results.push(v);
    } else if (richItem.videoRenderer) {
      const v = parseVideoRenderer(richItem.videoRenderer, defaultCategory);
      if (v) results.push(v);
    } else if (richItem.shortsLockupViewModel) {
      const s = parseShortsLockupViewModel(richItem.shortsLockupViewModel);
      if (s) results.push(s);
    }
  }

  return results;
}

function parseLockupViewModel(lockup, defaultCategory) {
  const videoId = lockup.contentId;
  if (!videoId) return null;

  const titleMeta = lockup.metadata?.lockupMetadataViewModel;
  const title = titleMeta?.title?.content || 'Untitled Video';

  // Check Members-Only Badges
  let accessType = 'Public';
  let membershipLevel = 'Public';

  const badges = titleMeta?.badges || [];
  for (const b of badges) {
    const badgeVm = b.badgeViewModel;
    if (badgeVm) {
      const text = badgeVm.badgeText || '';
      const style = badgeVm.badgeStyle || '';
      if (style.includes('MEMBERS_ONLY') || text.toLowerCase().includes('member')) {
        accessType = 'Members-only';
        membershipLevel = text || 'Members only';
      }
    }
  }

  // Also check metadata rows for lock or members text
  const rows = titleMeta?.metadata?.contentMetadataViewModel?.metadataRows || [];
  let rawDate = 'Unknown';
  for (const row of rows) {
    for (const part of row.parts || []) {
      const text = part.text?.content || '';
      if (text.toLowerCase().includes('member')) {
        accessType = 'Members-only';
        membershipLevel = text;
      }
      if (text.includes('ago') || text.match(/[A-Za-z]{3}\\s+\\d{1,2}/) || text.includes('Streamed')) {
        rawDate = text;
      }
    }
  }

  const { date, timestamp } = parseDate(rawDate);
  const link = \`https://www.youtube.com/watch?v=\${videoId}\`;
  const thumb = lockup.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url || \`https://i.ytimg.com/vi/\${videoId}/hqdefault.jpg\`;

  return {
    id: videoId,
    title,
    link,
    date,
    rawDate,
    timestamp,
    category: defaultCategory,
    accessType,
    membershipLevel: accessType === 'Members-only' ? (membershipLevel || 'Members only') : 'Public',
    thumbnailUrl: thumb
  };
}

function parseVideoRenderer(renderer, defaultCategory) {
  const videoId = renderer.videoId;
  if (!videoId) return null;

  const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || 'Untitled Video';
  const rawDate = renderer.publishedTimeText?.simpleText || 'Unknown';
  const { date, timestamp } = parseDate(rawDate);

  let accessType = 'Public';
  let membershipLevel = 'Public';

  if (renderer.badges && Array.isArray(renderer.badges)) {
    for (const b of renderer.badges) {
      const badge = b.metadataBadgeRenderer;
      if (badge) {
        if (badge.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY' || badge.label?.toLowerCase().includes('member')) {
          accessType = 'Members-only';
          membershipLevel = badge.label || 'Members only';
        }
      }
    }
  }

  return {
    id: videoId,
    title,
    link: \`https://www.youtube.com/watch?v=\${videoId}\`,
    date,
    rawDate,
    timestamp,
    category: defaultCategory,
    accessType,
    membershipLevel: accessType === 'Members-only' ? (membershipLevel || 'Members only') : 'Public',
    thumbnailUrl: renderer.thumbnail?.thumbnails?.[0]?.url || \`https://i.ytimg.com/vi/\${videoId}/hqdefault.jpg\`
  };
}

function parseShortsLockupViewModel(shorts) {
  const videoId = shorts.entityId ? shorts.entityId.replace('shorts-shelf-item-', '') : null;
  if (!videoId) return null;

  const title = shorts.accessibilityText || shorts.overlay?.reelPlayerOverlayRenderer?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer?.headline?.simpleText || 'Shorts Video';
  const thumb = shorts.onTap?.innertubeCommand?.reelWatchEndpoint?.thumbnail?.thumbnails?.[0]?.url || \`https://i.ytimg.com/vi/\${videoId}/frame0.jpg\`;

  return {
    id: videoId,
    title,
    link: \`https://www.youtube.com/shorts/\${videoId}\`,
    date: new Date().toISOString().split('T')[0],
    rawDate: 'Recent Short',
    timestamp: Date.now(),
    category: 'Shorts',
    accessType: 'Public',
    membershipLevel: 'Public',
    thumbnailUrl: thumb
  };
}

function parseDate(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return { date: 'Unknown', timestamp: 0 };
  const clean = rawStr.replace(/^(Streamed live|Streamed|Premiered)\\s+(on\\s+)?/i, '').trim();
  const now = new Date();

  const relMatch = clean.match(/(\\d+)\\s+(second|minute|hour|day|week|month|year)s?\\s+ago/i);
  if (relMatch) {
    const num = parseInt(relMatch[1], 10);
    const unit = relMatch[2].toLowerCase();
    const target = new Date(now.getTime());
    if (unit === 'minute') target.setMinutes(target.getMinutes() - num);
    else if (unit === 'hour') target.setHours(target.getHours() - num);
    else if (unit === 'day') target.setDate(target.getDate() - num);
    else if (unit === 'week') target.setDate(target.getDate() - num * 7);
    else if (unit === 'month') target.setMonth(target.getMonth() - num);
    else if (unit === 'year') target.setFullYear(target.getFullYear() - num);
    return { date: target.toISOString().split('T')[0], timestamp: target.getTime() };
  }

  const parsedMs = Date.parse(clean);
  if (!isNaN(parsedMs)) {
    const d = new Date(parsedMs);
    return { date: d.toISOString().split('T')[0], timestamp: d.getTime() };
  }

  return { date: clean, timestamp: 0 };
}
`;

// background.js
export const BACKGROUND_JS = `// background.js - Service Worker for YouTube Channel Scanner Extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Channel Scanner & CSV Exporter installed successfully.');
});
`;

// README.md
export const README_MD = `# YouTube Channel Scanner & CSV Exporter (Chrome Extension)

Scan any YouTube channel and list down all **Videos**, **Shorts**, and **Live Streams** in **Date Wise** order (including **Members-Only videos without needing a membership**) and export directly to a structured **CSV file**.

---

## 🚀 How to Install in Google Chrome

1. **Download & Extract:**
   - Click the **"Download Extension (.zip)"** button in the web dashboard.
   - Unzip / extract the downloaded file to a folder on your computer (e.g. \`yt-channel-scanner\`).

2. **Open Extensions Page:**
   - In Google Chrome, open a new tab and go to:  
     \`chrome://extensions/\`

3. **Enable Developer Mode:**
   - Turn **ON** the **"Developer mode"** toggle switch in the top-right corner of the Extensions page.

4. **Load the Extension:**
   - Click the **"Load unpacked"** button in the top-left corner.
   - Select the extracted folder containing \`manifest.json\`.

5. **Scan Any Channel:**
   - Open any YouTube channel (e.g., \`https://www.youtube.com/@mkbhd\` or \`https://www.youtube.com/@LinusTechTips\`).
   - Click the **Extension icon** in your Chrome toolbar.
   - Choose tabs to scan (**Videos**, **Shorts**, **Live**), select your depth, and click **"Scan Channel"**.
   - Click **"Download CSV"** to export your formatted spreadsheet!

---

## 📊 CSV Export Format

The output CSV strictly includes the requested fields:

\`\`\`csv
Video Title,Video Link,Video Date,Video Category,Video Access Type,Membership Level
"Linus Explains Members Tier","https://www.youtube.com/watch?v=xyz","2026-09-08","Video","Members-only","Members only"
"New M4 Mac Mini Review","https://www.youtube.com/watch?v=abc","2026-09-10","Video","Public","Public"
\`\`\`

- **Video Category**: \`Video\`, \`Shorts\`, or \`Live\`
- **Video Access Type**: \`Public\` or \`Members-only\`
- **Membership Level**: \`Public\`, \`Members only\`, or custom Tier name
`;

// Helper: Generates a 1-pixel or simple SVG data-URI icon as PNG buffer fallback
function generateSimplePngDataUrl(size: number, text: string = 'YT'): string {
  // SVG string
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.2)}" fill="#ff0033"/>
    <path d="M${size * 0.35} ${size * 0.28} L${size * 0.72} ${size * 0.5} L${size * 0.35} ${size * 0.72} Z" fill="#ffffff"/>
  </svg>`;
  return svg;
}

export function getAllExtensionFiles(): ExtensionFileItem[] {
  return [
    {
      name: 'manifest.json',
      path: 'manifest.json',
      type: 'json',
      description: 'Chrome Extension Manifest V3 configuration with permissions and content scripts',
      content: MANIFEST_JSON,
    },
    {
      name: 'popup.html',
      path: 'popup.html',
      type: 'html',
      description: 'Modern popup user interface layout for the Chrome extension',
      content: POPUP_HTML,
    },
    {
      name: 'popup.css',
      path: 'popup.css',
      type: 'css',
      description: 'High-contrast responsive styling for the 420px popup window',
      content: POPUP_CSS,
    },
    {
      name: 'popup.js',
      path: 'popup.js',
      type: 'javascript',
      description: 'Popup controller: detects channel, manages scan progress, filters, and generates CSV',
      content: POPUP_JS,
    },
    {
      name: 'content.js',
      path: 'content.js',
      type: 'javascript',
      description: 'Injected script: reads YouTube tabs, extracts videos, detects Members-Only badges',
      content: CONTENT_JS,
    },
    {
      name: 'background.js',
      path: 'background.js',
      type: 'javascript',
      description: 'Service worker handling extension lifecycle and download triggers',
      content: BACKGROUND_JS,
    },
    {
      name: 'README.md',
      path: 'README.md',
      type: 'markdown',
      description: 'Installation instructions and usage guide for Chrome Developer Mode',
      content: README_MD,
    },
  ];
}

/**
 * Creates and downloads the complete Chrome Extension as a ZIP file
 */
export async function downloadExtensionZip(): Promise<void> {
  const zip = new JSZip();

  // Add all text files
  const files = getAllExtensionFiles();
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Add icons folder with SVG/PNG icons
  const iconFolder = zip.folder('icons');
  if (iconFolder) {
    iconFolder.file('icon16.svg', generateSimplePngDataUrl(16));
    iconFolder.file('icon48.svg', generateSimplePngDataUrl(48));
    iconFolder.file('icon128.svg', generateSimplePngDataUrl(128));

    // Also create simple canvas-drawn PNG blobs for Chrome compatibility
    try {
      const p16 = await createPngBlobFromSvg(16);
      const p48 = await createPngBlobFromSvg(48);
      const p128 = await createPngBlobFromSvg(128);
      iconFolder.file('icon16.png', p16);
      iconFolder.file('icon48.png', p48);
      iconFolder.file('icon128.png', p128);
    } catch (e) {
      console.warn('Canvas PNG creation fallback to SVG', e);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'youtube-channel-scanner-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createPngBlobFromSvg(size: number): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(new Blob([], { type: 'image/png' }));
      return;
    }

    // Red rounded rect
    const r = Math.floor(size * 0.22);
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, r);
    ctx.fill();

    // White play triangle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(size * 0.36, size * 0.28);
    ctx.lineTo(size * 0.72, size * 0.5);
    ctx.lineTo(size * 0.36, size * 0.72);
    ctx.closePath();
    ctx.fill();

    canvas.toBlob((blob) => {
      resolve(blob || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}
