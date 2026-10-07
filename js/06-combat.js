// ── PROJECTILES ───────────────────────────────────────────────────
function updateProjectiles(dt) {
    // Player projectiles
    for (let i = projectiles.length-1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p) continue;
        // Homing
        if (p.homing > 0 && enemies.length > 0) {
            let closest = null, closestDist = 300;
            for (const e of enemies) { if (!e || e.hp <= 0) continue; const d = dist(p.x, p.y, e.x, e.y); if (d < closestDist) { closestDist = d; closest = e; } }
            if (closest) {
                const tA = angle(p.x, p.y, closest.x, closest.y);
                const cA = Math.atan2(p.vy, p.vx);
                let diff = tA - cA;
                while (diff >  Math.PI) diff -= Math.PI*2;
                while (diff < -Math.PI) diff += Math.PI*2;
                const nA = cA + diff * p.homing;
                const spd = Math.max(1, Math.sqrt(p.vx*p.vx + p.vy*p.vy));
                p.vx = Math.cos(nA)*spd; p.vy = Math.sin(nA)*spd;
            }
        }
        p.x += p.vx * gameSpeed; p.y += p.vy * gameSpeed;
        if (p.x < -50 || p.x > canvas.width+50 || p.y < -50 || p.y > canvas.height+50) { projectiles.splice(i, 1); continue; }

        let consumed = false;
        for (let j = enemies.length-1; j >= 0; j--) {
            const e = enemies[j];
            if (!e || e.hp <= 0) continue;
            if (p.hitEnemies && p.hitEnemies.indexOf(e) !== -1) continue;
            const hitDist = p.waveWidth ? (e.size + p.waveWidth/2) : (e.size + (p.size||6));
            if (dist(p.x, p.y, e.x, e.y) < hitDist) {
                e.takeDamage(p.damage, p.x, p.y);
                createParticles(p.x, p.y, p.color, 4, 0.8, 0.5);
                if (p.lifesteal > 0 && player) player.hp = Math.min(player.maxHp, player.hp + p.damage*p.lifesteal);
                if (player && player.burnDamage > 0) { e.burnDamage = player.burnDamage; e.burnTimer = player.burnDuration; }
                if (p.explosive > 0) {
                    createExplosion(p.x, p.y, '#ffaa00', (p.explosionRadius||40)/40);
                    for (const en of enemies) { if (en && en.hp > 0 && dist(p.x, p.y, en.x, en.y) < (p.explosionRadius||40)) en.takeDamage(p.damage*0.5, p.x, p.y); }
                }
                if (p.pierce > 0) { p.pierce--; if (!p.hitEnemies) p.hitEnemies = []; p.hitEnemies.push(e); }
                else if (p.ricochet > 0) {
                    p.ricochet--;
                    let next = null, nextDist = 250;
                    for (const en of enemies) { if (en && en !== e && en.hp > 0 && (!p.hitEnemies || p.hitEnemies.indexOf(en) === -1)) { const d = dist(p.x,p.y,en.x,en.y); if (d < nextDist) { nextDist = d; next = en; } } }
                    if (next) { const a = angle(p.x,p.y,next.x,next.y); const spd = Math.max(1, Math.sqrt(p.vx*p.vx+p.vy*p.vy)); p.vx = Math.cos(a)*spd; p.vy = Math.sin(a)*spd; if (!p.hitEnemies) p.hitEnemies = []; p.hitEnemies.push(e); }
                    else consumed = true;
                } else { consumed = true; }
                break;
            }
        }
        if (consumed) { projectiles.splice(i, 1); continue; }

        // Boss hit
        if (currentBoss && !currentBoss.entering && projectiles[i]) {
            const pp = projectiles[i];
            let bossHit = false;
            if (currentBoss.segments.length > 0) {
                for (const seg of currentBoss.segments) { if (dist(pp.x,pp.y,seg.x,seg.y) < currentBoss.size) { currentBoss.takeDamage(pp.damage); bossHit = true; break; } }
            } else if (dist(pp.x,pp.y,currentBoss.x,currentBoss.y) < currentBoss.size+(pp.size||6)) {
                currentBoss.takeDamage(pp.damage); createParticles(pp.x,pp.y,pp.color,4,0.8,0.5); bossHit = true;
            }
            if (bossHit && (pp.pierce||0) <= 0 && (pp.ricochet||0) <= 0) projectiles.splice(i, 1);
        }
    }

    // Enemy projectiles
    for (let i = enemyProjectiles.length-1; i >= 0; i--) {
        const p = enemyProjectiles[i];
        if (!p) continue;
        p.x += p.vx * gameSpeed; p.y += p.vy * gameSpeed;
        if (p.x < -50 || p.x > canvas.width+50 || p.y < -50 || p.y > canvas.height+50) { enemyProjectiles.splice(i, 1); continue; }
        if (player && dist(p.x,p.y,player.x,player.y) < player.size+p.size) { player.takeDamage(p.damage); enemyProjectiles.splice(i, 1); }
    }
}

function drawProjectiles() {
    for (const p of projectiles) {
        if (!p) continue;
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
        if (p.waveWidth) { ctx.beginPath(); ctx.ellipse(p.x, p.y, (p.size||6), p.waveWidth/2, Math.atan2(p.vy,p.vx), 0, Math.PI*2); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size||6, 0, Math.PI*2); ctx.fill(); }
        // Rastro
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*2, p.y-p.vy*2);
        ctx.strokeStyle = p.color; ctx.lineWidth = (p.size||6)*0.8; ctx.lineCap = 'round'; ctx.stroke();
        ctx.globalAlpha = 1;
    }
    for (const p of enemyProjectiles) {
        if (!p) continue;
        ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        // Rastro dos projeteis inimigos
        ctx.globalAlpha = 0.2;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-p.vx*1.5, p.y-p.vy*1.5);
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size*0.6; ctx.lineCap = 'round'; ctx.stroke();
        ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
}


// ── MINES / BLACKHOLES / DRONES / BEAMS / CHAINS ──────────────────
function updateMines(dt) {
    for (let i = mines.length-1; i >= 0; i--) {
        const m = mines[i]; m.timer -= dt;
        // Animacao de piscar quando proximo de explodir
        if (m.timer <= 0) { createExplosion(m.x,m.y,m.color,0.8); if (player && dist(m.x,m.y,player.x,player.y) < 60) player.takeDamage(m.damage); mines.splice(i,1); }
    }
}

function drawMines() {
    for (const m of mines) {
        const pulse = m.timer < 1000 ? (Math.sin(Date.now()/30)*3) : 0;
        ctx.fillStyle = m.color; ctx.shadowColor = m.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(m.x,m.y,m.size+pulse,0,Math.PI*2); ctx.fill();
        if (m.timer < 1000) {
            ctx.strokeStyle = '#ff0044'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(m.x,m.y,m.size+5+pulse,0,Math.PI*2); ctx.stroke();
        }
    }
    ctx.shadowBlur = 0;
}

function updateBlackHoles(dt) {
    for (let i = blackHoles.length-1; i >= 0; i--) {
        const bh = blackHoles[i]; bh.timer -= dt;
        if (bh.enemy && player) { const d = dist(bh.x,bh.y,player.x,player.y); if (d < 150 && d > 5) { const f = 2.5/d; player.x += (bh.x-player.x)*f; player.y += (bh.y-player.y)*f; } }
        if (Math.random() < 0.08) createParticles(bh.x+rand(-20,20),bh.y+rand(-20,20),'#aa00ff',1,0.8,0.3);
        if (bh.timer <= 0) { createParticles(bh.x,bh.y,'#aa00ff',15,1.5,1); blackHoles.splice(i,1); }
    }
}

function drawBlackHoles() {
    const t = Date.now()/80;
    for (const bh of blackHoles) {
        ctx.strokeStyle = '#aa00ff'; ctx.lineWidth = 2; ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 15;
        for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(bh.x,bh.y,bh.size+j*8+Math.sin(t+j)*3,0,Math.PI*2); ctx.stroke(); }
        ctx.fillStyle = '#000'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(bh.x,bh.y,bh.size*0.4,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function updateDrones(dt) {
    for (let i = drones.length-1; i >= 0; i--) {
        const dr = drones[i];
        if (!dr.owner || !player) { drones.splice(i,1); continue; }
        dr.angle += dt * 0.003;
        dr.x = dr.owner.x + Math.cos(dr.angle)*dr.orbitRadius;
        dr.y = dr.owner.y + Math.sin(dr.angle)*dr.orbitRadius;
        if (Date.now() - dr.lastShot > dr.fireRate) {
            dr.lastShot = Date.now();
            let closest = null, closestDist = 400;
            for (const e of enemies) { if (!e || e.hp <= 0) continue; const d = dist(dr.x,dr.y,e.x,e.y); if (d < closestDist) { closestDist = d; closest = e; } }
            if (closest) { const a = angle(dr.x,dr.y,closest.x,closest.y); projectiles.push({ x: dr.x, y: dr.y, vx: Math.cos(a)*10, vy: Math.sin(a)*10, damage: dr.damage, size: 4, color: '#8800ff', owner: 'player', hitEnemies: [] }); }
        }
    }
}

function drawDrones() {
    for (const dr of drones) {
        ctx.fillStyle = '#8800ff'; ctx.shadowColor = '#8800ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(dr.x,dr.y,6,0,Math.PI*2); ctx.fill();
        // Linha de conexao ao jogador
        if (dr.owner) {
            ctx.strokeStyle = 'rgba(136,0,255,0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(dr.x,dr.y); ctx.lineTo(dr.owner.x,dr.owner.y); ctx.stroke();
        }
    }
    ctx.shadowBlur = 0;
}

function updateBeams(dt) {
    for (let i = beams.length-1; i >= 0; i--) {
        const b = beams[i]; b.duration -= dt;
        if (b.duration <= 0) { beams.splice(i,1); continue; }
        if (b.owner === player || (b.owner && b.owner instanceof Player)) {
            for (const e of enemies) {
                if (!e || e.hp <= 0) continue;
                const dx = e.x-b.x, dy = e.y-b.y;
                const bA = b.angle || Math.PI/2;
                if (Math.sqrt(dx*dx+dy*dy) < (b.length||400)) {
                    if (Math.abs(dx*Math.sin(bA) - dy*Math.cos(bA)) < (b.width||6)+e.size) e.takeDamage(b.damage, b.x, b.y);
                }
            }
            if (currentBoss && !currentBoss.entering) {
                const dx = currentBoss.x-b.x, dy = currentBoss.y-b.y, bA = b.angle||Math.PI/2;
                if (Math.sqrt(dx*dx+dy*dy) < (b.length||400)) {
                    if (Math.abs(dx*Math.sin(bA) - dy*Math.cos(bA)) < (b.width||6)+currentBoss.size) currentBoss.takeDamage(b.damage);
                }
            }
        }
    }
}

function drawBeams() {
    for (const b of beams) {
        ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.angle||0);
        ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 20; ctx.globalAlpha = 0.8;
        ctx.fillRect(0, -(b.width||6)/2, b.length||400, b.width||6);
        ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6;
        ctx.fillRect(0, -(b.width||6)/4, b.length||400, (b.width||6)/2);
        ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function updateChainEffects(dt) { for (let i = chainEffects.length-1; i >= 0; i--) { chainEffects[i].life -= dt/300; if (chainEffects[i].life <= 0) chainEffects.splice(i,1); } }

function drawChainEffects() {
    for (const c of chainEffects) {
        ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.shadowColor = c.color; ctx.shadowBlur = 10; ctx.globalAlpha = c.life;
        // Efeito zigzag para raio
        const dx = c.x2-c.x1, dy = c.y2-c.y1;
        const steps = 5;
        ctx.beginPath(); ctx.moveTo(c.x1, c.y1);
        for (let s = 1; s < steps; s++) {
            const t = s/steps;
            const mx = c.x1 + dx*t + (Math.random()-0.5)*10;
            const my = c.y1 + dy*t + (Math.random()-0.5)*10;
            ctx.lineTo(mx, my);
        }
        ctx.lineTo(c.x2, c.y2); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}


