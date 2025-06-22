const apiEndpoint = 'https://yourdomain.com/api/files';
let allFiles = [], filteredFiles = [], visibleCount = 10;

async function fetchFiles() {
    document.getElementById('loader').style.display = 'block';
    try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) throw new Error('Network response not OK');
        const files = await response.json();
        allFiles = files;
        filteredFiles = [...allFiles];
        applySort();
        renderFiles(filteredFiles.slice(0, visibleCount));
    } catch (error) {
        document.getElementById('message').textContent = `Failed to load files: ${error.message}`;
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
}

function getFileIcon(type) {
    switch (type) {
        case 'pdf': return '📄';
        case 'video': return '🎥';
        case 'zip': return '📦';
        case 'doc': return '📝';
        default: return '📁';
    }
}

function formatFileSize(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < sizes.length - 1) { bytes /= 1024; i++; }
    return `${bytes.toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderFiles(files) {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    if (!files.length) {
        document.getElementById('message').textContent = 'No files found.'; return;
    }
    document.getElementById('message').textContent = '';
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'fileItem';
        li.setAttribute('role', 'listitem');

        const infoDiv = document.createElement('div');
        infoDiv.className = 'fileInfo';
        infoDiv.innerHTML = `
            <span class="fileIcon">${getFileIcon(file.filetype)}</span>
            <span class="fileName">${file.filename || 'Unnamed'}</span>
            <span class="fileSize">Size: ${formatFileSize(file.filesize)}</span>
            <span class="fileDate">Date: ${formatDate(file.date)}</span>
        `;

        const downloadBtn = document.createElement('a');
        downloadBtn.href = file.download_url || '#';
        downloadBtn.className = 'downloadBtn';
        downloadBtn.textContent = 'Download';
        downloadBtn.target = '_blank';

        li.appendChild(infoDiv);
        li.appendChild(downloadBtn);
        list.appendChild(li);
    });

    if (visibleCount >= filteredFiles.length) {
        document.getElementById('loadMoreBtn').style.display = 'none';
    } else {
        document.getElementById('loadMoreBtn').style.display = 'block';
    }
}

function applyFilter(type) {
    filteredFiles = type === 'all' ? [...allFiles] : allFiles.filter(f => f.filetype === type);
    applySort();
    visibleCount = 10;
    renderFiles(filteredFiles.slice(0, visibleCount));
}

function applySort() {
    const sortBy = document.getElementById('sortSelect').value;
    document.getElementById('sortIndicator').textContent = `Sorted by ${sortBy}`;
    if (sortBy === 'name') filteredFiles.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
    else if (sortBy === 'size') filteredFiles.sort((a, b) => (a.filesize || 0) - (b.filesize || 0));
    else if (sortBy === 'date') filteredFiles.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function loadMore() {
    visibleCount += 10;
    renderFiles(filteredFiles.slice(0, visibleCount));
}

document.getElementById('searchBar').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    filteredFiles = allFiles.filter(file => (file.filename || '').toLowerCase().includes(query));
    applySort();
    visibleCount = 10;
    renderFiles(filteredFiles.slice(0, visibleCount));
});

document.getElementById('darkModeToggle').addEventListener('click', function() {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

document.addEventListener('DOMContentLoaded', () => {
    const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('theme') || systemPref;
    document.documentElement.setAttribute('data-theme', savedTheme);
    fetchFiles();
});
