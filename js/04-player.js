// ── PLAYER CLASS ──────────────────────────────────────────────────
class Player {
    constructor(shipIndex, weaponIndex) {
        this.shipData = SHIPS[shipIndex];
        this.weaponData = this.shipData.weapons[weaponIndex] || this.shipData.weapons[0];

        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = 0; this.vy = 0;
        this.angle = 0;

        const dm = DIFFICULTY_MODS[difficulty];
        this.maxHp = this.shipData.stats.health * dm.healthMult;
        this.hp = this.maxHp;
        this.speed = this.shipData.stats.speed;
        this.size = this.shipData.stats.size;
        this.color = this.shipData.color;

        this.currentWeapon = weaponIndex;
        this.fireRate = this.weaponData.fireRate;
        this.lastShot = 0;
        this.damage = this.weaponData.damage * dm.damageMult;
        this.weaponType = this.weaponData.type;

        this.damageMult = 1;
        this.fireRateMult = 1;
        this.scoreMult = 1 * dm.scoreMult;

        this.pierce = this.weaponData.pierce || 0;
        this.ricochet = this.weaponData.bounces || 0;
        this.explosiveCount = this.weaponData.explosionRadius ? 1 : 0;
        this.explosionRadius = this.weaponData.explosionRadius || 0;
        this.homingStrength = this.weaponData.homingStrength || 0;
        this.multiShot = this.weaponData.count || 1;

        this.teslaChains = this.weaponData.chains || 0;
        this.teslaRange = this.weaponData.chainRange || 0;
        this.lifestealPercent = this.weaponData.lifestealPercent || 0;
        this.burnDamage = this.weaponData.burnDamage || 0;
        this.burnDuration = this.weaponData.burnDuration || 0;

        this.maxDashCharges = this.shipData.stats.dashCharges;
        this.dashCharges = this.maxDashCharges;
        this.dashCooldown = this.shipData.stats.dashCooldown;
        this.dashCooldownMult = 1;
        this.dashRecharge = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDir = { x: 0, y: 0 };

        this.armor = 0;
        this.hasShield = false;
        this.shieldCD = 20;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldRecharge = 0;
        this.extraLives = 0;
        this.phoenixUsed = false;

        this.hasAura = false;
        this.auraRadius = 0;
        this.auraDamage = 0;
        this.auraTimer = 0;
        this.stunChance = 0;
        this.blackHoleChance = 0;
        this.hasSlowField = false;
        this.slowFieldRadius = 0;
        this.slowAmount = 0;
        this.comboLock = false;
        this.magnetRange = 0;
        this.regenRate = 0;
        this.regenTimer = 0;

        this.specialCooldown = this.shipData.special.cooldown;
        this.specialTimer = 0;
        this.specialActive = false;
        this.specialDuration = this.shipData.special.duration;
        this.specialDurationTimer = 0;

        this.invincible = false;
        this.iFrameTimer = 0;
        this.flickerTimer = 0;
        this.engineTimer = 0;
        this.lastKillEnemyName = '';
        this.lastKillWeaponName = '';
        this.lastKillScore = 0;
        this.lastKillWasBoss = false;
    }

    switchWeapon(index) {
        if (index < 0 || index >= this.shipData.weapons.length || index === this.currentWeapon) return;
        this.currentWeapon = index;
        this.weaponData = this.shipData.weapons[index];
        this.fireRate = this.weaponData.fireRate;
        this.damage = this.weaponData.damage * DIFFICULTY_MODS[difficulty].damageMult;
        this.weaponType = this.weaponData.type;
        this.pierce = this.weaponData.pierce || 0;
        this.ricochet = this.weaponData.bounces || 0;
        this.explosiveCount = this.weaponData.explosionRadius ? 1 : 0;
        this.explosionRadius = this.weaponData.explosionRadius || 0;
        this.homingStrength = this.weaponData.homingStrength || 0;
        this.multiShot = this.weaponData.count || 1;
        this.teslaChains = this.weaponData.chains || 0;
        this.teslaRange = this.weaponData.chainRange || 0;
        this.lifestealPercent = this.weaponData.lifestealPercent || 0;
        this.burnDamage = this.weaponData.burnDamage || 0;
        this.burnDuration = this.weaponData.burnDuration || 0;
        createParticles(this.x, this.y, this.color, 10, 0.5, 0.5);
        updateWeaponUI();
    }

    useSpecial() {
        const type = this.shipData.special.type;
        if (this.specialTimer > 0 || type === 'passive_revive' || type === 'passive_berserk') return;
        this.specialTimer = this.specialCooldown;
        this.specialActive = true;
        this.specialDurationTimer = this.specialDuration;
        createParticles(this.x, this.y, this.color, 40, 2, 1);
        addScreenShake(15);

        switch (type) {
            case 'buff': break;
            case 'phase': this.invincible = true; break;
            case 'shield': this.invincible = true; break;
            case 'teleport': {
                let closest = null, closestDist = 500;
                for (const e of enemies) {
                    const d = dist(this.x, this.y, e.x, e.y);
                    if (d < closestDist) { closestDist = d; closest = e; }
                }
                if (closest) {
                    const bAngle = closest.angle + Math.PI;
                    this.x = clamp(closest.x + Math.cos(bAngle) * 40, this.size, canvas.width - this.size);
                    this.y = clamp(closest.y + Math.sin(bAngle) * 40, this.size, canvas.height - this.size);
                    this.invincible = true; this.iFrameTimer = 1000;
                    createExplosion(this.x, this.y, this.color, 1.5);
                }
                this.specialActive = false; break;
            }
            case 'drones':
                for (let i = 0; i < 4; i++) {
                    drones.push({ x: this.x, y: this.y, angle: (i/4)*Math.PI*2, orbitRadius: 60, damage: 8, fireRate: 300, lastShot: 0, owner: this });
                }
                break;
            case 'lifesteal_aoe': {
                let totalHeal = 0;
                for (const e of enemies) {
                    if (dist(this.x, this.y, e.x, e.y) < 200) {
                        const dmg = e.maxHp * 0.2;
                        e.takeDamage(dmg, this.x, this.y);
                        totalHeal += dmg * 0.5;
                        chainEffects.push({ x1: this.x, y1: this.y, x2: e.x, y2: e.y, life: 0.3, color: '#00ff88' });
                    }
                }
                this.hp = Math.min(this.maxHp, this.hp + totalHeal);
                this.specialActive = false; break;
            }
            case 'supernova':
                for (let i = 0; i < 36; i++) {
                    const a = (i/36)*Math.PI*2;
                    projectiles.push({ x: this.x, y: this.y, vx: Math.cos(a)*8, vy: Math.sin(a)*8, damage: 40*this.damageMult, size: 8, color: this.color, pierce: 5, owner: 'player', hitEnemies: [] });
                }
                this.specialActive = false; break;
            case 'emp':
                for (const e of enemies) { e.takeDamage(30*this.damageMult, this.x, this.y); e.stunned = true; e.stunTimer = 3000; }
                enemyProjectiles = []; this.specialActive = false; break;
            case 'portal':
                traps.push({ x: this.x, y: this.y, type: 'portal', duration: 8000, owner: this }); break;
            case 'laser':
                beams.push({ x: this.x, y: 0, angle: Math.PI/2, width: 30, length: canvas.height, damage: 200*this.damageMult, duration: 1000, color: '#00aaff', owner: this });
                addScreenShake(20); this.specialActive = false; break;
            case 'random': {
                const effects = ['damage_all','heal','nuke','invincible'];
                const chosen = choose(effects);
                if (chosen === 'damage_all') { for (const e of enemies) e.takeDamage(100, this.x, this.y); }
                else if (chosen === 'heal') { this.hp = this.maxHp; }
                else if (chosen === 'nuke') {                createExplosion(this.x, this.y, '#ff6600', 5); }
                else if (chosen === 'invincible') { this.invincible = true; this.iFrameTimer = 5000; }
                this.specialActive = false; break;
            }
            case 'timestop':
                gameSpeed = 0.1;
                setTimeout(() => { gameSpeed = 1; }, this.specialDuration); break;
            case 'omega':
                this.damageMult *= 2; this.speed *= 1.5; this.fireRateMult *= 2;
                setTimeout(() => { this.damageMult /= 2; this.speed /= 1.5; this.fireRateMult /= 2; }, this.specialDuration);
                break;
        }
    }

    update(dt) {
        // Regen
        if (this.regenRate > 0) {
            this.regenTimer += dt;
            if (this.regenTimer >= 1000) { this.regenTimer = 0; this.hp = Math.min(this.maxHp, this.hp + this.regenRate); updateHealthUI(); }
        }
        // Special timers
        if (this.specialTimer > 0) this.specialTimer -= dt;
        if (this.specialActive && this.specialDuration > 0) {
            this.specialDurationTimer -= dt;
            if (this.specialDurationTimer <= 0) {
                this.specialActive = false;
                const t = this.shipData.special.type;
                if (t === 'phase' || t === 'shield') this.invincible = false;
            }
        }
        // Movement
        let mx = 0, my = 0;
        if (keys['w'] || keys['arrowup'])    my -= 1;
        if (keys['s'] || keys['arrowdown'])  my += 1;
        if (keys['a'] || keys['arrowleft'])  mx -= 1;
        if (keys['d'] || keys['arrowright']) mx += 1;
        const len = Math.sqrt(mx*mx + my*my);
        if (len > 0) { mx /= len; my /= len; }

        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) this.isDashing = false;
            this.vx = this.dashDir.x * this.speed * 7;
            this.vy = this.dashDir.y * this.speed * 7;
            if (Math.random() < 0.4) createParticles(this.x, this.y, this.color, 1, 0.2, 0.3);
        } else {
            let spd = this.speed;
            if (this.specialActive && this.shipData.special.type === 'buff') spd *= 1.5;
            this.vx = mx * spd; this.vy = my * spd;
        }

        this.x += this.vx * gameSpeed; this.y += this.vy * gameSpeed;
        this.x = clamp(this.x, this.size, canvas.width - this.size);
        this.y = clamp(this.y, this.size, canvas.height - this.size);
        this.angle = angle(this.x, this.y, mouse.x, mouse.y);

        // Dash recharge
        if (this.dashCharges < this.maxDashCharges) {
            this.dashRecharge += dt;
            const cd = this.dashCooldown * this.dashCooldownMult;
            if (this.dashRecharge >= cd) { this.dashCharges++; this.dashRecharge = 0; updateDashUI(); }
        }

        // I-frames
        if (this.invincible) {
            this.iFrameTimer -= dt; this.flickerTimer += dt;
            if (this.iFrameTimer <= 0 && !this.specialActive) this.invincible = false;
        }

        // Shield recharge
        if (this.hasShield && !this.shieldActive) {
            this.shieldRecharge += dt / 1000;
            if (this.shieldRecharge >= this.shieldCD) { this.shieldActive = true; this.shieldRecharge = 0; createParticles(this.x, this.y, '#00ffff', 15, 1.2, 0.5); }
        }

        // Aura
        if (this.hasAura) {
            this.auraTimer += dt;
            if (this.auraTimer >= 500) {
                this.auraTimer = 0;
                for (const e of enemies) {
                    if (dist(this.x, this.y, e.x, e.y) < this.auraRadius) e.takeDamage(this.auraDamage * this.damageMult, this.x, this.y);
                }
            }
        }

        // Engine trail
        if (Math.hypot(this.vx, this.vy) > 0.5) {
            this.engineTimer += dt;
            if (this.engineTimer > 30) { this.engineTimer = 0; createParticles(this.x - Math.cos(this.angle)*15, this.y - Math.sin(this.angle)*15, this.color, 1, 0.2, 0.5); }
        }

        // Passive drone
        if (this.weaponType === 'passive_drone' && drones.length < (this.weaponData.count || 2)) {
            drones.push({ x: this.x, y: this.y, angle: Math.random()*Math.PI*2, orbitRadius: 50, damage: this.weaponData.damage, fireRate: this.weaponData.droneFireRate || 200, lastShot: 0, owner: this });
        }
    }

    shoot() {
        const now = Date.now();
        const effectiveFireRate = this.fireRate / this.fireRateMult;
        const finalFireRate = (this.specialActive && this.shipData.special.type === 'buff') ? effectiveFireRate * 0.5 : effectiveFireRate;
        if (now - this.lastShot < finalFireRate) return;
        this.lastShot = now;

        const baseDamage = this.damage * this.damageMult;
        const projSpeed = this.weaponData.projectileSpeed || 12;
        const spread = this.weaponData.spread || 0;

        createParticles(this.x + Math.cos(this.angle)*20, this.y + Math.sin(this.angle)*20, this.color, 3, 0.4, 0.3);

        switch (this.weaponType) {
            case 'beam':
                beams.push({ x: this.x, y: this.y, angle: this.angle, width: this.weaponData.beamWidth||6, length: this.weaponData.beamLength||400, damage: baseDamage*0.1, duration: 200, color: this.color, owner: this });
                break;
            case 'nova':
                for (let i = 0; i < this.multiShot; i++) {
                    const a = (i/this.multiShot)*Math.PI*2;
                    projectiles.push({ x: this.x, y: this.y, vx: Math.cos(a)*projSpeed, vy: Math.sin(a)*projSpeed, damage: baseDamage, size: 6, color: this.color, pierce: this.pierce, owner: 'player', explosive: this.explosiveCount, explosionRadius: 50, hitEnemies: [] });
                }
                break;
            case 'wave': case 'omega_wave':
                projectiles.push({ x: this.x, y: this.y, vx: Math.cos(this.angle)*projSpeed, vy: Math.sin(this.angle)*projSpeed, damage: baseDamage, size: 15, color: this.color, pierce: 999, waveWidth: this.weaponData.waveWidth||60, owner: 'player', hitEnemies: [] });
                break;
            case 'sniper':
                projectiles.push({ x: this.x, y: this.y, vx: Math.cos(this.angle)*projSpeed, vy: Math.sin(this.angle)*projSpeed, damage: baseDamage, size: 4, color: this.color, pierce: this.pierce, owner: 'player', trail: true, hitEnemies: [] });
                addScreenShake(3); break;
            case 'heal':
                this.hp = Math.min(this.maxHp, this.hp + (this.weaponData.healAmount||25));
                createParticles(this.x, this.y, '#00ff88', 20, 1, 0.8);
                createFloatingText(this.x, this.y-30, '+'+(this.weaponData.healAmount||25), '#00ff88', 16);
                updateHealthUI(); break;
            case 'nuke':
                projectiles.push({ x: this.x, y: this.y, vx: Math.cos(this.angle)*projSpeed, vy: Math.sin(this.angle)*projSpeed, damage: baseDamage, size: 12, color: this.color, owner: 'player', explosive: 1, explosionRadius: this.weaponData.explosionRadius||200, hitEnemies: [] });
                addScreenShake(5); break;
            case 'passive_drone': break;
            default: {
                for (let i = 0; i < this.multiShot; i++) {
                    const offset = this.multiShot > 1 ? (i-(this.multiShot-1)/2)*spread : 0;
                    const a = this.angle + offset;
                    const p = {
                        x: this.x + Math.cos(a)*20, y: this.y + Math.sin(a)*20,
                        vx: Math.cos(a)*projSpeed, vy: Math.sin(a)*projSpeed,
                        damage: baseDamage, size: 6, color: this.color,
                        pierce: this.pierce, ricochet: this.ricochet,
                        explosive: this.explosiveCount, explosionRadius: this.explosionRadius,
                        homing: this.homingStrength, chainRange: this.teslaRange,
                        chains: this.teslaChains, lifesteal: this.lifestealPercent,
                        owner: 'player', hitEnemies: []
                    };
                    if (this.weaponType === 'random' || this.weaponType === 'chaos') {
                        const effect = choose(['explosive','chain','pierce','homing','split']);
                        if (effect === 'explosive') { p.explosive = 1; p.explosionRadius = 50; }
                        if (effect === 'chain')     { p.chains = 3; p.chainRange = 100; }
                        if (effect === 'pierce')    { p.pierce = 5; }
                        if (effect === 'homing')    { p.homing = 0.05; }
                        p.color = choose(['#ff6600','#ffff00','#ff00ff','#00ffff']);
                    }
                    projectiles.push(p);
                }
                break;
            }
        }
    }

    dash() {
        if (this.dashCharges <= 0 || this.isDashing) return;
        this.dashCharges--; updateDashUI();
        let mx = 0, my = 0;
        if (keys['w'] || keys['arrowup'])    my -= 1;
        if (keys['s'] || keys['arrowdown'])  my += 1;
        if (keys['a'] || keys['arrowleft'])  mx -= 1;
        if (keys['d'] || keys['arrowright']) mx += 1;
        const len = Math.sqrt(mx*mx + my*my);
        if (len === 0) { mx = Math.cos(this.angle); my = Math.sin(this.angle); }
        else { mx /= len; my /= len; }
        this.dashDir = { x: mx, y: my };
        this.isDashing = true; this.invincible = true; this.iFrameTimer = 150; this.dashTimer = 120;
        if (this.shipData.id === 'zerath') {
            createParticles(this.x, this.y, this.color, 15, 1, 0.5);
            this.x = clamp(this.x + mx*200, this.size, canvas.width - this.size);
            this.y = clamp(this.y + my*200, this.size, canvas.height - this.size);
            createParticles(this.x, this.y, this.color, 15, 1, 0.5);
        } else {
            createParticles(this.x, this.y, this.color, 12, 1, 0.5);
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.isDashing) return;
        if (this.shieldActive) {
            this.shieldActive = false; this.shieldRecharge = 0;
            createParticles(this.x, this.y, '#00ffff', 20, 1.5, 0.8); addScreenShake(6); return;
        }
        let finalDamage = amount * (1 - this.armor) * DIFFICULTY_MODS[difficulty].damageMult;
        this.hp -= finalDamage;
        this.invincible = true; this.iFrameTimer = 1200;
        if (!this.comboLock) combo = 0;
        createParticles(this.x, this.y, '#ff0044', 15, 1.5, 0.8); addScreenShake(12);
        createFloatingText(this.x, this.y-20, '-'+Math.floor(finalDamage), '#ff0044');
        updateHealthUI();
        if (this.hp <= 0) {
            if (this.shipData.special.type === 'passive_revive' && !this.phoenixUsed) {
                this.phoenixUsed = true; this.hp = this.maxHp*0.5; this.invincible = true; this.iFrameTimer = 3000;
                createExplosion(this.x, this.y, '#ff4400', 2); showRadioMessage({ text:"Protocolo Fenix ativado. Renascendo das cinzas.", type:"warning" }); updateHealthUI();
            } else if (this.extraLives > 0) {
                this.extraLives--; this.hp = 1; this.invincible = true; this.iFrameTimer = 3000;
                createParticles(this.x, this.y, '#00ff88', 30, 2, 1); showRadioMessage({ text:"Sistema de emergencia ativado. Segunda chance concedida.", type:"warning" }); updateHealthUI();
            } else { gameOver(); }
        }
    }

    draw() {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.invincible && Math.floor(this.flickerTimer/60) % 2 === 0) ctx.globalAlpha = 0.4;
        if (this.hasSlowField && this.slowFieldRadius > 0) {
            ctx.strokeStyle = 'rgba(0,255,136,0.15)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(0,0,this.slowFieldRadius,0,Math.PI*2); ctx.stroke();
            // Anel pulsante
            const pulseR = this.slowFieldRadius * (0.8 + Math.sin(Date.now()/300)*0.2);
            ctx.strokeStyle = 'rgba(0,255,136,0.08)'; ctx.beginPath(); ctx.arc(0,0,pulseR,0,Math.PI*2); ctx.stroke();
        }
        if (this.hasAura && this.auraRadius > 0) {
            ctx.strokeStyle = 'rgba(0,255,255,'+(0.15+Math.sin(Date.now()/150)*0.05)+')'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0,0,this.auraRadius,0,Math.PI*2); ctx.stroke();
            // Particulas de aura orbitando
            for (let i = 0; i < 4; i++) {
                const aA = Date.now()/500 + (i/4)*Math.PI*2;
                const ax = Math.cos(aA)*this.auraRadius, ay = Math.sin(aA)*this.auraRadius;
                ctx.fillStyle = 'rgba(0,255,255,0.4)'; ctx.beginPath(); ctx.arc(ax,ay,2,0,Math.PI*2); ctx.fill();
            }
        }
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 20;
        ctx.beginPath();
        const id = this.shipData.id;
        if (id === 'titan') { ctx.moveTo(25,0); ctx.lineTo(-18,-18); ctx.lineTo(-8,0); ctx.lineTo(-18,18); }
        else if (id === 'phantom') { ctx.moveTo(28,0); ctx.lineTo(-12,-16); ctx.lineTo(-4,0); ctx.lineTo(-12,16); ctx.lineTo(-20,0); }
        else if (id === 'specter') { ctx.moveTo(24,0); ctx.lineTo(-14,-20); ctx.lineTo(-6,0); ctx.lineTo(-14,20); }
        else { ctx.moveTo(24,0); ctx.lineTo(-16,-16); ctx.lineTo(-6,0); ctx.lineTo(-16,16); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#000'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.ellipse(6,0,6,4,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.arc(-12, 0, 5+Math.sin(Date.now()/40)*2, 0, Math.PI*2); ctx.fill();
        if (this.shieldActive) {
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(0,0,35,0,Math.PI*2); ctx.stroke();
            // Hexagonos decorativos no escudo
            for (let i = 0; i < 6; i++) {
                const ha = (i/6)*Math.PI*2 + Date.now()/800;
                ctx.strokeStyle = 'rgba(0,255,255,0.3)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(Math.cos(ha)*30, Math.sin(ha)*30, 4, 0, Math.PI*2); ctx.stroke();
            }
        }
        // Indicador de especial ativa
        if (this.specialActive) {
            ctx.strokeStyle = this.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100)*0.3;
            ctx.beginPath(); ctx.arc(0,0,40+Math.sin(Date.now()/200)*5,0,Math.PI*2); ctx.stroke();
        }
        ctx.restore();
    }
}

