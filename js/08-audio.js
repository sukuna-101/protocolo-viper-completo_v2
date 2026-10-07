// --- Music Player UI ---
function updateMusicPlayerUI() {
    const songTitle = document.getElementById('currentSongTitle');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevSongBtn = document.getElementById('prevSongBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const playlistSongs = document.getElementById('playlistSongs');

    if (playlist.length === 0) {
        songTitle.textContent = "Nenhuma musica carregada";
        playPauseBtn.innerHTML = '&#9654;';
        prevSongBtn.disabled = true;
        nextSongBtn.disabled = true;
        volumeSlider.disabled = true;
        playlistSongs.innerHTML = '<p class="no-songs">Nenhuma musica carregada.</p>';
        return;
    }

    if (currentSong) {
        songTitle.textContent = currentSong.name.replace('.mp3', '');
        playPauseBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;';
        prevSongBtn.disabled = false;
        nextSongBtn.disabled = false;
        volumeSlider.disabled = false;
    }

    volumeSlider.value = volume * 100;

    playlistSongs.innerHTML = '';
    playlist.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'playlist-item' + (index === currentSongIndex ? ' current' : '');
        item.textContent = song.name.replace('.mp3', '');
        item.onclick = () => {
            if (index !== currentSongIndex) { playSong(index); }
            else if (isPlaying) { pauseSong(); }
            else { playSong(currentSongIndex); }
        };
        playlistSongs.appendChild(item);
    });
}

function showMusicPlayer() { document.getElementById('musicPlayer').classList.add('show'); }
function hideMusicPlayer() { document.getElementById('musicPlayer').classList.remove('show'); }
function showPlaylistMenu() { document.getElementById('playlistMenu').classList.add('show'); }
function hidePlaylistMenu() { document.getElementById('playlistMenu').classList.remove('show'); }

// --- Music Player Logic ---
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioContext.destination);
        const volumeControl = document.getElementById('volumeSlider');
        volumeControl.addEventListener('input', (e) => {
            volume = parseFloat(e.target.value) / 100;
            if (gainNode) gainNode.gain.value = volume;
        });
        volumeControl.value = volume * 100;
    }
}

function loadSong(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            audioContext.decodeAudioData(e.target.result, (buffer) => {
                resolve({ buffer, name: file.name });
            }, reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function playSong(index) {
    if (!audioContext) initAudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    if (index < 0 || index >= playlist.length) return;

    // Parar musica anterior
    if (currentSongSource) {
        try { currentSongSource.stop(); } catch(e) {}
    }

    currentSongIndex = index;
    currentSong = playlist[currentSongIndex];

    currentSongSource = audioContext.createBufferSource();
    currentSongSource.buffer = currentSong.buffer;
    currentSongSource.connect(gainNode);
    currentSongSource.start(0);
    isPlaying = true;
    currentSongSource.onended = () => {
        isPlaying = false;
        if (currentSongIndex < playlist.length - 1) { playSong(currentSongIndex + 1); }
        else { playSong(0); }
        updateMusicPlayerUI();
    };
    updateMusicPlayerUI();
}

function pauseSong() {
    if (!currentSongSource || !isPlaying) return;
    audioContext.suspend();
    isPlaying = false;
    updateMusicPlayerUI();
}

function resumeSong() {
    if (!currentSongSource || isPlaying) return;
    audioContext.resume();
    isPlaying = true;
    updateMusicPlayerUI();
}

function playNextSong() {
    if (playlist.length === 0) return;
    playSong((currentSongIndex + 1) % playlist.length);
}

function playPrevSong() {
    if (playlist.length === 0) return;
    playSong((currentSongIndex - 1 + playlist.length) % playlist.length);
}

