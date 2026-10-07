// ── MENU FUNCTIONS ────────────────────────────────────────────────
function showShipSelect() { document.getElementById('mainMenu').classList.add('hidden'); document.getElementById('shipSelectMenu').classList.remove('hidden'); renderShipGrid(); }
function showControls() { document.getElementById('mainMenu').classList.add('hidden'); document.getElementById('controlsMenu').classList.remove('hidden'); }
function backToMenu() { document.getElementById('shipSelectMenu').classList.add('hidden'); document.getElementById('controlsMenu').classList.add('hidden'); document.getElementById('mainMenu').classList.remove('hidden'); }

function renderShipGrid() {
    const grid = document.getElementById('shipGrid'); grid.innerHTML = '';
    for (let i = 0; i < SHIPS.length; i++) {
        const ship = SHIPS[i];
        const card = document.createElement('div');
        card.className = 'ship-card' + (i === selectedShipIndex ? ' selected' : '');
        card.style.setProperty('--ship-color', ship.color);
        let weaponHTML = '';
        for (let wi = 0; wi < ship.weapons.length; wi++) {
            const w = ship.weapons[wi];
            const isSel = (i === selectedShipIndex && wi === selectedWeaponIndex);
            const isUni = w.isUnique ? ' weapon-btn-unique' : '';
            weaponHTML += '<button class="weapon-btn'+(isSel?' selected':'')+isUni+'" data-ship="'+i+'" data-weapon="'+wi+'">'+w.name+(w.isUnique?' <span class="unique-badge">UNICO</span>':'')+'</button>';
        }
        card.innerHTML =
            '<div class="ship-icon-container"><div class="ship-icon">'+ship.icon+'</div></div>' +
            '<div class="ship-name">'+ship.name+'</div><div class="ship-class">'+ship.class+'</div>' +
            '<div class="ship-stats"><div class="ship-stat-item"><div class="ship-stat-label">SPD</div><div class="ship-stat-value">'+ship.stats.speed+'</div></div>' +
            '<div class="ship-stat-item"><div class="ship-stat-label">HP</div><div class="ship-stat-value">'+ship.stats.health+'</div></div></div>' +
            '<div class="ship-special">'+ship.special.name+'</div>' +
            '<div class="weapon-select"><div class="weapon-label">Armas</div>'+weaponHTML+'</div>';
        card.onclick = (e) => {
            if (e.target.classList.contains('weapon-btn') || e.target.closest('.weapon-btn')) {
                const btn = e.target.closest('.weapon-btn') || e.target;
                selectedShipIndex = parseInt(btn.dataset.ship);
                selectedWeaponIndex = parseInt(btn.dataset.weapon);
            } else { selectedShipIndex = i; selectedWeaponIndex = 0; }
            renderShipGrid();
        };
        grid.appendChild(card);
    }
}

// Selecao de dificuldade - ERRO CORRIGIDO: "।click" -> "click"
document.querySelectorAll('.difficulty-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        difficulty = card.dataset.diff;
    });
});

// ── GAME FLOW ─────────────────────────────────────────────────────
function startGame() {
    document.getElementById('shipSelectMenu').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('minimapContainer').classList.add('show');
    document.getElementById('killFeed').classList.add('show');
    gameState = 'playing';

    player = new Player(selectedShipIndex, selectedWeaponIndex);
    enemies = []; projectiles = []; enemyProjectiles = []; particles = [];
    floatingTexts = []; blackHoles = []; mines = []; traps = [];
    chainEffects = []; drones = []; beams = []; killFeedEntries = [];
    currentBoss = null; bossSpawned = false;
    wave = 1; score = 0; kills = 0; combo = 0; comboTimer = 0; maxCombo = 0;
    betweenWaves = false; gameTime = 0; gameSpeed = 1; minimapVisible = true;

    initBackground();
    updateHealthUI(); updateDashUI(); updateWaveUI(); updateScoreUI(); updateWeaponUI();
    document.getElementById('bossHpContainer').style.display = 'none';
    document.getElementById('killFeed').innerHTML = '';
    spawnWave();
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);

    showMusicPlayer();
    if (playlist.length > 0) playSong(0);
}

function pauseGame() {
    if (gameState !== 'playing') return;
    gameState = 'paused';
    document.getElementById('pauseMenu').style.display = 'flex';
    if (audioContext && audioContext.state === 'running') audioContext.suspend();
    if (animationId) cancelAnimationFrame(animationId);
}

function resumeGame() {
    gameState = 'playing';
    document.getElementById('pauseMenu').style.display = 'none';
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('upgradePanel').style.display = 'none';
    startGame();
}

function quitToMenu() {
    gameState = 'menu';
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('bossHpContainer').style.display = 'none';
    document.getElementById('upgradePanel').style.display = 'none';
    document.getElementById('minimapContainer').classList.remove('show');
    document.getElementById('killFeed').classList.remove('show');
    document.getElementById('lowHpVignette').classList.remove('active');
    hideMusicPlayer();
    hidePlaylistMenu();
    document.getElementById('mainMenu').classList.remove('hidden');
    player = null; enemies = []; projectiles = []; enemyProjectiles = []; currentBoss = null;
    if (currentSongSource) { try { currentSongSource.stop(); } catch(e) {} }
    isPlaying = false;
    updateMusicPlayerUI();
    initBackground(); lastTime = performance.now();
    animationId = requestAnimationFrame(menuLoop);
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('finalWave').textContent = wave;
    document.getElementById('finalScore').textContent = Math.floor(score).toLocaleString();
    document.getElementById('finalKills').textContent = kills;
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('lowHpVignette').classList.remove('active');
    if (audioContext && audioContext.state === 'running') audioContext.suspend();
    if (animationId) cancelAnimationFrame(animationId);
    // Manter loop de render para background
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameOverLoop);
}

function victory() {
    gameState = 'victory';
    document.getElementById('victoryScore').textContent = Math.floor(score).toLocaleString();
    document.getElementById('victoryKills').textContent = kills;
    const mins = Math.floor(gameTime/60000), secs = Math.floor((gameTime%60000)/1000);
    document.getElementById('victoryTime').textContent = (mins<10?'0':'')+mins+':'+(secs<10?'0':'')+secs;
    document.getElementById('victoryScreen').style.display = 'flex';
    document.getElementById('lowHpVignette').classList.remove('active');
    showRadioMessage({ text:"...piloto? Voce... conseguiu. Protocolo completo. A humanidade esta salva.", type:"normal" });
    if (audioContext && audioContext.state === 'running') audioContext.suspend();
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameOverLoop);
}

// Loop para telas de fim manterem o background animado
function gameOverLoop(timestamp) {
    if (gameState !== 'gameover' && gameState !== 'victory') return;
    const dt = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    ctx.fillStyle = '#020206'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updateParticles();
    drawParticles();
    animationId = requestAnimationFrame(gameOverLoop);
}

// ── INPUT ─────────────────────────────────────────────────────────
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', e => { if (e.button === 0 && gameState === 'playing') shooting = true; });
window.addEventListener('mouseup',   e => { if (e.button === 0) shooting = false; });
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Escape') { if (gameState === 'playing') pauseGame(); else if (gameState === 'paused') resumeGame(); }
    if (e.key === ' ' && gameState === 'playing') { e.preventDefault(); if (player) player.dash(); }
    if (gameState === 'playing' && player && ['1','2','3'].includes(e.key)) player.switchWeapon(parseInt(e.key)-1);
    if (e.key.toLowerCase() === 'q' && gameState === 'playing') { if (player) player.useSpecial(); }
    if (e.key.toLowerCase() === 'm') { document.getElementById('musicPlayer').classList.toggle('show'); }
    if (e.key === 'Tab' && gameState === 'playing') { e.preventDefault(); minimapVisible = !minimapVisible; document.getElementById('minimapContainer').classList.toggle('show', minimapVisible); }
    if (document.getElementById('musicPlayer').classList.contains('show')) {
        if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'k') { if (isPlaying) pauseSong(); else resumeSong(); }
        if (e.key.toLowerCase() === 'n') { playNextSong(); }
        if (e.key.toLowerCase() === 'b') { playPrevSong(); }
    }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Music player buttons
document.getElementById('playPauseBtn').addEventListener('click', () => {
    if (!playlist.length) return;
    if (isPlaying) pauseSong(); else resumeSong();
});
document.getElementById('nextSongBtn').addEventListener('click', () => { if (playlist.length > 0) playNextSong(); });
document.getElementById('prevSongBtn').addEventListener('click', () => { if (playlist.length > 0) playPrevSong(); });
document.getElementById('playlistBtn').addEventListener('click', showPlaylistMenu);

// File input para playlist
document.getElementById('fileInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    let loadedCount = 0;
    for (const file of files) {
        if (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')) {
            try {
                if (!audioContext) initAudioContext();
                const songData = await loadSong(file);
                playlist.push(songData);
                loadedCount++;
            } catch (error) { console.error("Erro ao carregar musica:", file.name, error); }
        }
    }
    e.target.value = '';
    if (loadedCount > 0) {
        updateMusicPlayerUI();
        if (gameState === 'menu' && playlist.length > 0 && !isPlaying) playSong(0);
    }
});

function resizeCanvas() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    if (bgStars.length === 0) initBackground();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── MENU LOOP ─────────────────────────────────────────────────────
function menuLoop(timestamp) {
    if (gameState !== 'menu' && gameState !== 'shipselect' && gameState !== 'controls') return;
    const now = performance.now();
    const dt = Math.min(now - lastTime, 50);
    lastTime = now;
    updateFPS(now);
    ctx.fillStyle = '#020206'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    animationId = requestAnimationFrame(menuLoop);
}

// ── MAIN GAME LOOP ────────────────────────────────────────────────
function gameLoop(timestamp) {
    if (gameState !== 'playing' && gameState !== 'upgrade') return;

    const dt = Math.min(timestamp - lastTime, 50);
    lastTime = timestamp;
    if (gameState === 'playing') gameTime += dt;
    updateFPS(timestamp);

    // Screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Clear
    ctx.fillStyle = '#020206';
    ctx.fillRect(-20, -20, canvas.width+40, canvas.height+40);

    // Background
    drawBackground();

    if (gameState === 'playing') {
        // Update
        player.update(dt);
        if (shooting) player.shoot();

        for (let i = enemies.length-1; i >= 0; i--) {
            if (enemies[i]) enemies[i].update(dt);
        }
        // Remover inimigos mortos
        for (let i = enemies.length-1; i >= 0; i--) {
            if (enemies[i] && enemies[i].hp <= 0) enemies.splice(i, 1);
        }

        if (currentBoss) { currentBoss.update(dt); updateBossUI(); }

        updateProjectiles(dt);
        updateParticles();
        updateBlackHoles(dt);
        updateMines(dt);
        updateChainEffects(dt);
        updateFloatingTexts(dt);
        updateDrones(dt);
        updateBeams(dt);
        updateScreenShake();

        // Combo decay
        if (Date.now() - comboTimer > 3000 && combo > 0) { combo = Math.max(0, combo-1); comboTimer = Date.now(); }

        // Colisao jogador-inimigo
        if (player && !player.invincible && !player.isDashing) {
            for (const e of enemies) {
                if (e && e.hp > 0 && dist(player.x, player.y, e.x, e.y) < player.size + e.size) player.takeDamage(e.damage*0.5);
            }
        }

        // Draw ordem correta
        drawBlackHoles();
        drawMines();
        drawBeams();
        drawProjectiles();
        for (const e of enemies) { if (e && e.hp > 0) e.draw(); }
        if (currentBoss) currentBoss.draw();
        if (player) player.draw();
        drawDrones();
        drawParticles();
        drawChainEffects();
        drawFloatingTexts();

        // HUD
        updateScoreUI();
        updateComboUI();
        checkWaveComplete();
        drawMinimap();
        updateLowHpVignette();

        // Ability UI
        if (player && player.shipData.special.cooldown > 0) {
            const pct = Math.max(0, 100 - (player.specialTimer / player.shipData.special.cooldown)*100);
            document.getElementById('abilityFill').style.width = pct + '%';
        }
    } else {
        // Estado upgrade: desenhar mundo congelado
        drawBlackHoles(); drawMines(); drawBeams(); drawProjectiles();
        for (const e of enemies) { if (e && e.hp > 0) e.draw(); }
        if (currentBoss) currentBoss.draw();
        if (player) player.draw();
        drawDrones(); drawParticles(); drawChainEffects(); drawFloatingTexts();
        drawMinimap();
    }

    ctx.restore();
    animationId = requestAnimationFrame(gameLoop);
}

// ── INIT ──────────────────────────────────────────────────────────
window.addEventListener('load', () => {
    resizeCanvas();
    initBackground();
    lastTime = performance.now();
    animationId = requestAnimationFrame(menuLoop);

    // Inicializar AudioContext na primeira interacao
    const interactionHandler = () => {
        initAudioContext();
        document.removeEventListener('click', interactionHandler);
        document.removeEventListener('keydown', interactionHandler);
        document.removeEventListener('touchstart', interactionHandler);
    };
    document.addEventListener('click', interactionHandler);
    document.addEventListener('keydown', interactionHandler);
    document.addEventListener('touchstart', interactionHandler);

    updateMusicPlayerUI();
    document.getElementById('musicPlayer').style.display = 'block';
});
