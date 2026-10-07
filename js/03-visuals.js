// ── UTILS ─────────────────────────────────────────────────────────
const lerp  = (a,b,t) => a + (b-a)*t;
const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
const dist  = (x1,y1,x2,y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
const angle = (x1,y1,x2,y2) => Math.atan2(y2-y1, x2-x1);
const rand  = (min,max) => Math.random()*(max-min)+min;
const randInt = (min,max) => Math.floor(rand(min,max+1));
const choose  = arr => arr[randInt(0,arr.length-1)];

// ── PARTICLES & VISUALS ───────────────────────────────────────────
function addScreenShake(intensity) { screenShake.intensity = Math.min(screenShake.intensity + intensity, 25); }

function updateScreenShake() {
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random()-0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random()-0.5) * screenShake.intensity * 2;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.5) screenShake.intensity = 0;
    } else { screenShake.x = 0; screenShake.y = 0; }
}

function createParticles(x, y, color, count, speedMult, sizeMult) {
    count = count || 10; speedMult = speedMult || 1; sizeMult = sizeMult || 1;
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = (1 + Math.random() * 4) * speedMult;
        particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, color, size: (1+Math.random()*3)*sizeMult, life: 1, decay: 0.02+Math.random()*0.02 });
    }
}

function createExplosion(x, y, color, size) {
    size = size || 1;
    createParticles(x, y, color, Math.floor(30*size), 2.5, 1.5);
    createParticles(x, y, '#ffffff', Math.floor(10*size), 3, 0.5);
    addScreenShake(10*size);
}

function createFloatingText(x, y, text, color, size) {
    floatingTexts.push({ x, y, text, color: color||'#fff', size: size||14, vy: -1.5, life: 1 });
}

function updateParticles() {
    for (let i = particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98; p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.size*p.life), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length-1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy; ft.life -= dt/1000;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts() {
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
        ctx.globalAlpha = ft.life;
        ctx.font = 'bold ' + ft.size + 'px Orbitron';
        ctx.fillStyle = ft.color; ctx.shadowColor = ft.color; ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

// ── KILL FEED ─────────────────────────────────────────────────────
function addKillFeedEntry(enemyName, weaponName, scoreGained, isBoss) {
    const container = document.getElementById('killFeed');
    const entry = document.createElement('div');
    entry.className = 'kill-feed-entry' + (isBoss ? ' boss-kill' : '');
    entry.innerHTML = '<span class="kf-weapon">' + weaponName + '</span> &#x2192; <span class="kf-enemy">' + enemyName + '</span><span class="kf-score">+' + Math.floor(scoreGained) + '</span>';
    container.appendChild(entry);
    killFeedEntries.push(entry);
    // Remover entradas antigas
    while (killFeedEntries.length > MAX_KILL_FEED) {
        const old = killFeedEntries.shift();
        if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    // Auto-remover apos animacao
    setTimeout(() => {
        if (entry && entry.parentNode) entry.parentNode.removeChild(entry);
        const idx = killFeedEntries.indexOf(entry);
        if (idx > -1) killFeedEntries.splice(idx, 1);
    }, 3500);
}

// ── WAVE ANNOUNCEMENT ────────────────────────────────────────────
function showWaveAnnounce(waveNum) {
    const el = document.getElementById('waveAnnounce');
    document.getElementById('waveAnnounceText').textContent = 'WAVE ' + waveNum;
    const subs = ['PREPARE-SE', 'AMEACA DETECTADA', 'AUMENTANDO INTENSIDADE', 'PERIGO IMINENTE', 'SOBREVIVA', 'NAO HA RETORNO'];
    document.getElementById('waveAnnounceSub').textContent = subs[Math.min(Math.floor(waveNum / 20), subs.length - 1)];
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
}

// ── MINIMAP ───────────────────────────────────────────────────────
function drawMinimap() {
    if (!minimapVisible || !player) return;
    const mw = 180, mh = 180;
    const scaleX = mw / canvas.width;
    const scaleY = mh / canvas.height;

    minimapCtx.fillStyle = 'rgba(2, 2, 10, 0.9)';
    minimapCtx.fillRect(0, 0, mw, mh);

    // Grid
    minimapCtx.strokeStyle = 'rgba(0, 245, 255, 0.08)';
    minimapCtx.lineWidth = 0.5;
    for (let x = 0; x < mw; x += 20) { minimapCtx.beginPath(); minimapCtx.moveTo(x, 0); minimapCtx.lineTo(x, mh); minimapCtx.stroke(); }
    for (let y = 0; y < mh; y += 20) { minimapCtx.beginPath(); minimapCtx.moveTo(0, y); minimapCtx.lineTo(mw, y); minimapCtx.stroke(); }

    // Inimigos
    for (const e of enemies) {
        if (!e || e.hp <= 0) continue;
        minimapCtx.fillStyle = e.color;
        minimapCtx.globalAlpha = 0.8;
        const ex = e.x * scaleX, ey = e.y * scaleY;
        const eSize = Math.max(2, e.size * scaleX);
        minimapCtx.beginPath(); minimapCtx.arc(ex, ey, eSize, 0, Math.PI*2); minimapCtx.fill();
    }

    // Boss
    if (currentBoss) {
        minimapCtx.fillStyle = currentBoss.color;
        minimapCtx.globalAlpha = 1;
        minimapCtx.shadowColor = currentBoss.color;
        minimapCtx.shadowBlur = 6;
        const bx = currentBoss.x * scaleX, by = currentBoss.y * scaleY;
        minimapCtx.beginPath(); minimapCtx.arc(bx, by, 5, 0, Math.PI*2); minimapCtx.fill();
        minimapCtx.shadowBlur = 0;
    }

    // Black holes
    for (const bh of blackHoles) {
        minimapCtx.fillStyle = '#aa00ff';
        minimapCtx.globalAlpha = 0.6;
        minimapCtx.beginPath(); minimapCtx.arc(bh.x*scaleX, bh.y*scaleY, 3, 0, Math.PI*2); minimapCtx.fill();
    }

    // Minas
    for (const m of mines) {
        minimapCtx.fillStyle = '#ffff44';
        minimapCtx.globalAlpha = 0.5;
        minimapCtx.fillRect(m.x*scaleX - 1, m.y*scaleY - 1, 2, 2);
    }

    // Jogador
    minimapCtx.globalAlpha = 1;
    minimapCtx.fillStyle = player.color;
    minimapCtx.shadowColor = player.color;
    minimapCtx.shadowBlur = 4;
    const px = player.x * scaleX, py = player.y * scaleY;
    minimapCtx.beginPath(); minimapCtx.arc(px, py, 3, 0, Math.PI*2); minimapCtx.fill();

    // Linha de mira
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.2)';
    minimapCtx.lineWidth = 0.5;
    minimapCtx.shadowBlur = 0;
    minimapCtx.beginPath(); minimapCtx.moveTo(px, py);
    minimapCtx.lineTo(mouse.x * scaleX, mouse.y * scaleY); minimapCtx.stroke();

    minimapCtx.globalAlpha = 1;
    minimapCtx.shadowBlur = 0;
}

// ── LOW HP VIGNETTE ──────────────────────────────────────────────
function updateLowHpVignette() {
    const el = document.getElementById('lowHpVignette');
    if (!player) { el.classList.remove('active'); return; }
    const pct = player.hp / player.maxHp;
    if (pct < 0.3) el.classList.add('active');
    else el.classList.remove('active');
}

// ── FPS COUNTER ───────────────────────────────────────────────────
function updateFPS(now) {
    fpsFrames++;
    if (now - fpsLastTime >= 1000) {
        fpsDisplay = fpsFrames;
        fpsFrames = 0;
        fpsLastTime = now;
    }
    document.getElementById('fpsCounter').textContent = 'FPS: ' + fpsDisplay;
}

// ── BACKGROUND ────────────────────────────────────────────────────
function initBackground() {
    bgStars = []; bgNebulas = [];
    for (let i = 0; i < 150; i++) {
        bgStars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+0.5, speed: Math.random()*0.5+0.1, color: choose(['#00f5ff','#ff00ff','#00ff88','#ffffff','#ffaa00']) });
    }
    for (let i = 0; i < 5; i++) {
        bgNebulas.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: 100+Math.random()*200, color: choose(['#ff00ff','#aa00ff','#00f5ff','#ff8800']), speed: 0.1+Math.random()*0.2, alpha: 0.02+Math.random()*0.03 });
    }
}

function drawBackground() {
    for (const n of bgNebulas) {
        n.y += n.speed;
        if (n.y > canvas.height + n.radius) { n.y = -n.radius; n.x = Math.random()*canvas.width; }
        if (n.radius > 0) {
            const grad = ctx.createRadialGradient(n.x,n.y,0, n.x,n.y,n.radius);
            grad.addColorStop(0, n.color); grad.addColorStop(1, 'transparent');
            ctx.globalAlpha = n.alpha; ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(n.x,n.y,n.radius,0,Math.PI*2); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,245,255,0.03)'; ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (Date.now()/50) % gridSize;
    for (let x = -offsetX; x < canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
    for (const s of bgStars) {
        s.y += s.speed;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; }
        ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
}

