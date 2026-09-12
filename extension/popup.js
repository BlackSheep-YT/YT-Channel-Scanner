// popup.js - Controller for YouTube Channel Scanner Extension
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

    chrome.tabs.sendMessage(currentTabId, { action: 'GET_CHANNEL_INFO' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
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
    
    const handleMatch = pathname.match(/\/(@[^\/]+)/);
    if (handleMatch) {
      updateChannelUI({
        title: handleMatch[1],
        handle: handleMatch[1],
        url: 'https://www.youtube.com/' + handleMatch[1],
      });
      dom.startScanBtn.disabled = false;
      return;
    }

    const channelMatch = pathname.match(/\/(channel|c|user)\/([^\/]+)/);
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

    item.innerHTML = `
      <img class="video-thumb" src="${v.thumbnailUrl || ''}" alt="" />
      <div class="video-meta">
        <div class="video-item-title" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</div>
        <div class="video-sub-line">
          <span class="badge-tag ${categoryClass}">${v.category}</span>
          <span class="badge-access ${isMember ? 'members' : 'public'}">
            ${isMember ? '🔒 ' + (v.membershipLevel || 'Members-only') : 'Public'}
          </span>
          <span class="video-date">${v.date}</span>
        </div>
      </div>
    `;
    fragment.appendChild(item);
  });

  dom.videoList.appendChild(fragment);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateCsvString() {
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
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
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

  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

function downloadCsv() {
  if (scannedVideos.length === 0) return;
  const csvContent = generateCsvString();
  const channelTag = currentChannel?.handle?.replace(/[^a-zA-Z0-9_-]/g, '') || 'youtube_channel';
  const filename = `${channelTag}_videos_${new Date().toISOString().slice(0, 10)}.csv`;

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
