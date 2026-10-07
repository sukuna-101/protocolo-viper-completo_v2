
// ═══════════════════════════════════════════════════════════════
// PROTOCOLO VIPER v3.0 — SUPREME EDITION (CORRIGIDO E EXPANDIDO)
// ═══════════════════════════════════════════════════════════════

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

// ── CONFIG ──────────────────────────────────────────────────────
const CONFIG = { canvas: { width: 0, height: 0 }, difficulty: 'normal', maxWaves: 100, upgradeInterval: 5 };
const Math_PI2 = Math.PI * 2;

const DIFFICULTY_MODS = {
    easy:       { damageMult: 0.6,  healthMult: 1.5, enemySpeedMult: 0.8, scoreMult: 0.7, enemySpawnMult: 0.8 },
    normal:     { damageMult: 1.0,  healthMult: 1.0, enemySpeedMult: 1.0, scoreMult: 1.0, enemySpawnMult: 1.0 },
    hard:       { damageMult: 1.5,  healthMult: 0.8, enemySpeedMult: 1.2, scoreMult: 1.5, enemySpawnMult: 1.2 },
    impossible: { damageMult: 2.0,  healthMult: 0.6, enemySpeedMult: 1.5, scoreMult: 2.5, enemySpawnMult: 1.4 },
    hell:       { damageMult: 2.5,  healthMult: 0.4, enemySpeedMult: 1.8, scoreMult: 3.0, enemySpawnMult: 1.8 }
};

// ── SVG ICONS ────────────────────────────────────────────────────
const UPGRADE_ICONS = {
    power:       '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    fireRate:    '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    pierce:      '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    ricochet:    '<path d="M4 12h4l3-9 3 18 3-9h4"/>',
    explosive:   '<circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3"/>',
    homing:      '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    tesla:       '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    aura:        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    stun:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    armor:       '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    revive:      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    heal:        '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    hpUp:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    speed:       '<polygon points="5 3 19 12 5 21 5 3"/>',
    dashCharge:  '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    dashCooldown:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    blackHole:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    slowField:   '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    comboLock:   '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
};

// ── SHIP ICONS ───────────────────────────────────────────────────
const SHIP_ICONS = {
    viper:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="viperGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00f5ff"/><stop offset="100%" style="stop-color:#0088aa"/></linearGradient></defs><polygon points="50,10 80,85 50,70 20,85" fill="url(#viperGrad)" stroke="#00f5ff" stroke-width="2"/><circle cx="50" cy="45" r="8" fill="#001"/><circle cx="50" cy="45" r="5" fill="#00f5ff" opacity="0.5"/></svg>',
    phantom: '<svg viewBox="0 0 100 100"><defs><linearGradient id="phantomGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff00ff"/><stop offset="100%" style="stop-color:#aa00aa"/></linearGradient></defs><polygon points="50,5 90,80 50,60 10,80" fill="url(#phantomGrad)" stroke="#ff00ff" stroke-width="2"/><ellipse cx="50" cy="35" rx="12" ry="6" fill="#001"/></svg>',
    titan:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="titanGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff8800"/><stop offset="100%" style="stop-color:#aa5500"/></linearGradient></defs><polygon points="50,15 75,85 50,75 25,85" fill="url(#titanGrad)" stroke="#ff8800" stroke-width="3"/><circle cx="50" cy="42" r="6" fill="#ff8800" opacity="0.6"/></svg>',
    specter: '<svg viewBox="0 0 100 100"><defs><linearGradient id="specterGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#aa00ff"/><stop offset="100%" style="stop-color:#6600aa"/></linearGradient></defs><polygon points="50,8 85,70 50,55 15,70" fill="url(#specterGrad)" stroke="#aa00ff" stroke-width="2"/></svg>',
    phoenix: '<svg viewBox="0 0 100 100"><defs><linearGradient id="phoenixGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff4400"/><stop offset="50%" style="stop-color:#ffaa00"/><stop offset="100%" style="stop-color:#ff2200"/></linearGradient></defs><polygon points="50,5 85,80 50,65 15,80" fill="url(#phoenixGrad)" stroke="#ff4400" stroke-width="2"/></svg>',
    raven:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="ravenGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8800ff"/><stop offset="100%" style="stop-color:#5500aa"/></linearGradient></defs><polygon points="50,12 88,75 50,58 12,75" fill="url(#ravenGrad)" stroke="#8800ff" stroke-width="2"/><polygon points="15,75 5,90 25,70" fill="#8800ff" opacity="0.6"/><polygon points="85,75 95,90 75,70" fill="#8800ff" opacity="0.6"/></svg>',
    wraith:  '<svg viewBox="0 0 100 100"><defs><linearGradient id="wraithGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00ff88"/><stop offset="100%" style="stop-color:#00aa55"/></linearGradient></defs><polygon points="50,10 78,75 50,62 22,75" fill="url(#wraithGrad)" stroke="#00ff88" stroke-width="2"/></svg>',
    ares:    '<svg viewBox="0 0 100 100"><defs><linearGradient id="aresGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff2200"/><stop offset="100%" style="stop-color:#aa1100"/></linearGradient></defs><polygon points="50,8 82,80 50,68 18,80" fill="url(#aresGrad)" stroke="#ff2200" stroke-width="2"/></svg>',
    nova:    '<svg viewBox="0 0 100 100"><defs><linearGradient id="novaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ffee00"/><stop offset="100%" style="stop-color:#ffaa00"/></linearGradient></defs><polygon points="50,5 85,75 50,60 15,75" fill="url(#novaGrad)" stroke="#ffee00" stroke-width="2"/><circle cx="50" cy="35" r="8" fill="#ffee00" opacity="0.6"/></svg>',
    cipher:  '<svg viewBox="0 0 100 100"><defs><linearGradient id="cipherGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00ffaa"/><stop offset="100%" style="stop-color:#00aa66"/></linearGradient></defs><polygon points="50,12 82,72 50,58 18,72" fill="url(#cipherGrad)" stroke="#00ffaa" stroke-width="2"/></svg>',
    zerath:  '<svg viewBox="0 0 100 100"><defs><linearGradient id="zerathGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff0088"/><stop offset="100%" style="stop-color:#aa0055"/></linearGradient></defs><polygon points="50,8 88,78 50,62 12,78" fill="url(#zerathGrad)" stroke="#ff0088" stroke-width="2"/></svg>',
    orion:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="orionGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00aaff"/><stop offset="100%" style="stop-color:#0066aa"/></linearGradient></defs><polygon points="50,10 80,80 50,65 20,80" fill="url(#orionGrad)" stroke="#00aaff" stroke-width="2"/><line x1="25" y1="60" x2="10" y2="70" stroke="#00aaff" stroke-width="2"/><line x1="75" y1="60" x2="90" y2="70" stroke="#00aaff" stroke-width="2"/></svg>',
    khaos:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="khaosGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff6600"/><stop offset="100%" style="stop-color:#aa3300"/></linearGradient></defs><polygon points="50,7 85,78 50,62 15,78" fill="url(#khaosGrad)" stroke="#ff6600" stroke-width="2"/><polygon points="50,25 55,40 45,40" fill="#ff6600"/></svg>',
    eclipse: '<svg viewBox="0 0 100 100"><defs><linearGradient id="eclipseGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6600ff"/><stop offset="100%" style="stop-color:#3300aa"/></linearGradient></defs><circle cx="50" cy="45" r="30" fill="url(#eclipseGrad)" stroke="#6600ff" stroke-width="2"/><circle cx="58" cy="45" r="25" fill="#050510"/></svg>',
    omega:   '<svg viewBox="0 0 100 100"><defs><linearGradient id="omegaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ffffff"/><stop offset="100%" style="stop-color:#aaaaff"/></linearGradient></defs><polygon points="50,5 88,85 50,70 12,85" fill="url(#omegaGrad)" stroke="#ffffff" stroke-width="3"/><circle cx="50" cy="40" r="15" fill="none" stroke="#ffffff" stroke-width="2"/><circle cx="50" cy="40" r="8" fill="#ffffff" opacity="0.3"/></svg>'
};

// ── SHIPS ────────────────────────────────────────────────────────
const SHIPS = [
    {
        id:'viper', name:"VIPER MK-I", class:"Equilibrada", color:"#00f5ff", colorRgb:"0, 245, 255",
        icon: SHIP_ICONS.viper,
        stats:{ speed:4.5, health:100, dashCharges:2, dashCooldown:3000, size:18 },
        special:{ name:"Overdrive", description:"Aumenta velocidade e cadencia por 5s", cooldown:25000, duration:5000, type:"buff" },
        weapons:[
            { name:"Pulso Ciano",    fireRate:100, damage:8,  type:"standard",  projectileSpeed:12, count:1, description:"Tiro rapido padrao" },
            { name:"Canhao de Plasma", fireRate:280, damage:35, type:"explosive", projectileSpeed:8, count:1, explosionRadius:45, description:"Disparo explosivo lento" },
            { name:"Rajada Tripla",  fireRate:160, damage:6,  type:"spread",    projectileSpeed:10, count:3, spread:0.18, description:"3 projeteis em leque" }
        ]
    },
    {
        id:'phantom', name:"PHANTOM X", class:"Agil/Stealth", color:"#ff00ff", colorRgb:"255, 0, 255",
        icon: SHIP_ICONS.phantom,
        stats:{ speed:6.0, health:70, dashCharges:3, dashCooldown:2000, size:16 },
        special:{ name:"Phase Shift", description:"Invencibilidade e atravessa inimigos", cooldown:20000, duration:3000, type:"phase" },
        weapons:[
            { name:"Agulha de Fase",    fireRate:70,  damage:6,  type:"penetration", projectileSpeed:18, count:1, pierce:3, description:"Atravessa multiplos inimigos" },
            { name:"Ricochete Espectral", fireRate:180, damage:15, type:"ricochet",  projectileSpeed:11, count:1, bounces:3, description:"Salta entre inimigos" },
            { name:"Relampago Cadeia",  fireRate:220, damage:22, type:"chain",      projectileSpeed:14, count:1, chainRange:130, chains:3, isUnique:true, description:"Dano em cadeia UNICO" }
        ]
    },
    {
        id:'titan', name:"TITAN ZERO", class:"Tanque Pesado", color:"#ff8800", colorRgb:"255, 136, 0",
        icon: SHIP_ICONS.titan,
        stats:{ speed:3.0, health:150, dashCharges:1, dashCooldown:5000, size:22 },
        special:{ name:"Fortress Mode", description:"Escudo impenetravel por 4s", cooldown:30000, duration:4000, type:"shield" },
        weapons:[
            { name:"Auto-Canhao",      fireRate:180, damage:18, type:"standard",  projectileSpeed:11, count:1, description:"Disparo solido e confiavel" },
            { name:"Bombardeio",       fireRate:500, damage:60, type:"explosive", projectileSpeed:6,  count:1, explosionRadius:85, description:"Explosao massiva" },
            { name:"Misseis Teleguiados", fireRate:350, damage:28, type:"homing", projectileSpeed:7,  count:1, homingStrength:0.06, isUnique:true, description:"Perseguem inimigos UNICO" }
        ]
    },
    {
        id:'specter', name:"SPECTER", class:"Assassin", color:"#aa00ff", colorRgb:"170, 0, 255",
        icon: SHIP_ICONS.specter,
        stats:{ speed:5.5, health:65, dashCharges:3, dashCooldown:1800, size:15 },
        special:{ name:"Shadow Step", description:"Teleporta atras do alvo mais proximo", cooldown:15000, duration:0, type:"teleport" },
        weapons:[
            { name:"Laminas Sombrias", fireRate:90,  damage:10, type:"standard", projectileSpeed:15, count:2, description:"Dual blades rapidos" },
            { name:"Void Slash",       fireRate:400, damage:80, type:"wave",     projectileSpeed:10, count:1, waveWidth:60, pierce:999, isUnique:true, description:"Onda que atravessa tudo UNICO" },
            { name:"Mark of Death",    fireRate:800, damage:0,  type:"mark",     projectileSpeed:20, count:1, markDamage:50, markDelay:2000, description:"Marca inimigo para execucao" }
        ]
    },
    {
        id:'phoenix', name:"PHOENIX", class:"Regeneracao", color:"#ff4400", colorRgb:"255, 68, 0",
        icon: SHIP_ICONS.phoenix,
        stats:{ speed:4.0, health:90, dashCharges:2, dashCooldown:3000, size:19 },
        special:{ name:"Rebirth", description:"Revive com 50% HP ao morrer (1x)", cooldown:0, duration:0, type:"passive_revive" },
        weapons:[
            { name:"Incinerador",   fireRate:120, damage:7,  type:"fire",  projectileSpeed:9, count:1, burnDamage:3, burnDuration:3000, description:"Queima inimigos ao longo do tempo" },
            { name:"Nova Solar",    fireRate:600, damage:40, type:"nova",  projectileSpeed:0, count:12, novaRadius:100, isUnique:true, description:"Explosao em todas direcoes UNICO" },
            { name:"Cura Em Area",  fireRate:2000, damage:0, type:"heal", projectileSpeed:0, count:1, healAmount:25, healRadius:80, description:"Recupera HP em area" }
        ]
    },
    {
        id:'raven', name:"RAVEN", class:"Drone Master", color:"#8800ff", colorRgb:"136, 0, 255",
        icon: SHIP_ICONS.raven,
        stats:{ speed:4.2, health:85, dashCharges:2, dashCooldown:2800, size:18 },
        special:{ name:"Drone Swarm", description:"Invoca 4 drones de combate", cooldown:22000, duration:10000, type:"drones" },
        weapons:[
            { name:"Pulso Drone",   fireRate:110, damage:9, type:"standard",     projectileSpeed:13, count:1, description:"Disparo padrao sincronizado" },
            { name:"Drone Escort",  fireRate:0,   damage:5, type:"passive_drone", projectileSpeed:0, count:2, droneFireRate:200, isUnique:true, description:"Drones orbitais atiram automatico UNICO" },
            { name:"Bombardment",   fireRate:700, damage:35, type:"airstrike",   projectileSpeed:15, count:3, airstrikeDelay:500, description:"Bombardeio orbital" }
        ]
    },
    {
        id:'wraith', name:"WRAITH", class:"Lifesteal", color:"#00ff88", colorRgb:"0, 255, 136",
        icon: SHIP_ICONS.wraith,
        stats:{ speed:4.8, health:80, dashCharges:2, dashCooldown:2500, size:17 },
        special:{ name:"Soul Harvest", description:"Drena 20% de vida de todos em area", cooldown:18000, duration:0, type:"lifesteal_aoe" },
        weapons:[
            { name:"Soul Siphon",   fireRate:130, damage:8,  type:"lifesteal",       projectileSpeed:11, count:1, lifestealPercent:0.15, description:"Cura 15% do dano causado" },
            { name:"Spirit Chain",  fireRate:250, damage:18, type:"chain_lifesteal", projectileSpeed:12, count:1, chainRange:100, chains:4, lifestealPercent:0.2, isUnique:true, description:"Cadeia com lifesteal UNICO" },
            { name:"Essence Burst", fireRate:350, damage:25, type:"explosive_lifesteal", projectileSpeed:8, count:1, explosionRadius:50, lifestealPercent:0.25, description:"Explosao com alto lifesteal" }
        ]
    },
    {
        id:'ares', name:"ARES", class:"Berserker", color:"#ff2200", colorRgb:"255, 34, 0",
        icon: SHIP_ICONS.ares,
        stats:{ speed:4.5, health:95, dashCharges:2, dashCooldown:3200, size:19 },
        special:{ name:"Blood Rage", description:"Dano +100% quando HP abaixo de 30%", cooldown:0, duration:0, type:"passive_berserk" },
        weapons:[
            { name:"Fury Cannon", fireRate:95,  damage:10, type:"berserk",          projectileSpeed:14, count:1, berserkMult:2.5, description:"Dano escala com HP perdido" },
            { name:"Rage Burst",  fireRate:450, damage:50, type:"explosive_berserk", projectileSpeed:7, count:1, explosionRadius:70, selfDamage:5, isUnique:true, description:"Poderoso mas causa dano proprio UNICO" },
            { name:"War Cry",     fireRate:3000, damage:0, type:"buff_aoe",          projectileSpeed:0, count:1, buffRadius:150, damageBuff:0.5, buffDuration:5000, description:"Aumenta dano em area" }
        ]
    },
    {
        id:'nova', name:"NOVA", class:"Area Denial", color:"#ffee00", colorRgb:"255, 238, 0",
        icon: SHIP_ICONS.nova,
        stats:{ speed:3.8, health:100, dashCharges:2, dashCooldown:3500, size:20 },
        special:{ name:"Supernova", description:"Explosao massiva em 360 graus", cooldown:25000, duration:0, type:"supernova" },
        weapons:[
            { name:"Solar Flare",  fireRate:140, damage:7,  type:"standard",     projectileSpeed:10, count:2, description:"Tiros gemeos" },
            { name:"Gravity Well", fireRate:800, damage:0,  type:"gravity_trap", projectileSpeed:8,  count:1, trapDuration:5000, pullStrength:2, trapDamage:5, isUnique:true, description:"Cria campo gravitacional UNICO" },
            { name:"Star Shower",  fireRate:550, damage:15, type:"rain",         projectileSpeed:0,  count:8, rainRadius:200, description:"Chuva de projeteis" }
        ]
    },
    {
        id:'cipher', name:"CIPHER", class:"Hacker", color:"#00ffaa", colorRgb:"0, 255, 170",
        icon: SHIP_ICONS.cipher,
        stats:{ speed:5.0, health:75, dashCharges:3, dashCooldown:2200, size:16 },
        special:{ name:"System Crash", description:"Todos inimigos levam dano e ficam stunados", cooldown:20000, duration:0, type:"emp" },
        weapons:[
            { name:"Data Stream",      fireRate:80,  damage:6,  type:"standard", projectileSpeed:16, count:1, description:"Tiro rapido digital" },
            { name:"Glitch Burst",     fireRate:300, damage:12, type:"glitch",   projectileSpeed:12, count:5, glitchChance:0.3, isUnique:true, description:"Tiros aleatorios que atravessam UNICO" },
            { name:"Virus Injection",  fireRate:600, damage:20, type:"virus",    projectileSpeed:9,  count:1, virusDuration:4000, virusDamagePerSec:8, description:"Injeta virus que causa dano continuo" }
        ]
    },
    {
        id:'zerath', name:"ZERATH", class:"Void Walker", color:"#ff0088", colorRgb:"255, 0, 136",
        icon: SHIP_ICONS.zerath,
        stats:{ speed:5.2, health:70, dashCharges:4, dashCooldown:1500, size:15 },
        special:{ name:"Dimension Rift", description:"Cria portal que teleporta projeteis", cooldown:16000, duration:8000, type:"portal" },
        weapons:[
            { name:"Void Bolt",    fireRate:100, damage:9,  type:"standard",  projectileSpeed:14, count:1, description:"Energia do vazio" },
            { name:"Singularity",  fireRate:700, damage:30, type:"blackhole", projectileSpeed:6,  count:1, bhDuration:3000, bhRadius:80, isUnique:true, description:"Cria buraco negro UNICO" },
            { name:"Phase Cannon", fireRate:200, damage:15, type:"phase",     projectileSpeed:18, count:1, pierce:999, description:"Atravessa qualquer coisa" }
        ]
    },
    {
        id:'orion', name:"ORION", class:"Sniper", color:"#00aaff", colorRgb:"0, 170, 255",
        icon: SHIP_ICONS.orion,
        stats:{ speed:4.0, health:80, dashCharges:2, dashCooldown:3500, size:17 },
        special:{ name:"Orbital Strike", description:"Laser orbital de alto dano", cooldown:28000, duration:0, type:"laser" },
        weapons:[
            { name:"Railgun",       fireRate:800, damage:100, type:"sniper",  projectileSpeed:30, count:1, pierce:5, description:"Tiro de altissimo impacto" },
            { name:"Ion Cannon",    fireRate:150, damage:8,   type:"beam",    projectileSpeed:0,  count:1, beamLength:400, beamWidth:4, isUnique:true, description:"Feixe continuo de ion UNICO" },
            { name:"Plasma Cluster",fireRate:500, damage:15,  type:"cluster", projectileSpeed:10, count:1, clusterCount:6, description:"Divide em multiplos projeteis" }
        ]
    },
    {
        id:'khaos', name:"KHAOS", class:"Randomizer", color:"#ff6600", colorRgb:"255, 102, 0",
        icon: SHIP_ICONS.khaos,
        stats:{ speed:4.3, health:88, dashCharges:2, dashCooldown:2500, size:18 },
        special:{ name:"Entropy Wave", description:"Efeito aleatorio poderoso", cooldown:15000, duration:0, type:"random" },
        weapons:[
            { name:"Chaos Bolt",     fireRate:120,  damage:8,  type:"random", projectileSpeed:12, count:1, randomEffects:['explosive','chain','pierce','homing'], description:"Efeito aleatorio a cada tiro" },
            { name:"Anarchy Cannon", fireRate:400,  damage:25, type:"chaos",  projectileSpeed:10, count:1, chaosEffects:true, isUnique:true, description:"Dano e efeitos aleatorios UNICO" },
            { name:"Dice Roll",      fireRate:1000, damage:0,  type:"gamble", projectileSpeed:0,  count:1, possibleOutcomes:['heal','damage','buff','explosion'], description:"Resultado imprevisivel" }
        ]
    },
    {
        id:'eclipse', name:"ECLIPSE", class:"Time Manipulator", color:"#6600ff", colorRgb:"102, 0, 255",
        icon: SHIP_ICONS.eclipse,
        stats:{ speed:4.6, health:85, dashCharges:2, dashCooldown:2800, size:18 },
        special:{ name:"Time Stop", description:"Para o tempo por 3 segundos", cooldown:35000, duration:3000, type:"timestop" },
        weapons:[
            { name:"Chrono Shot",    fireRate:140, damage:10, type:"standard",   projectileSpeed:11, count:1, slowEffect:0.3, description:"Atravessa e desacelera" },
            { name:"Temporal Rift",  fireRate:600, damage:20, type:"slow_field", projectileSpeed:0,  count:1, fieldRadius:120, slowAmount:0.5, fieldDuration:4000, isUnique:true, description:"Campo que desacelera inimigos UNICO" },
            { name:"Time Bomb",      fireRate:900, damage:50, type:"delayed",    projectileSpeed:8,  count:1, delayTime:2000, description:"Explosao atrasada" }
        ]
    },
    {
        id:'omega', name:"OMEGA", class:"Ultimate", color:"#ffffff", colorRgb:"255, 255, 255",
        icon: SHIP_ICONS.omega,
        stats:{ speed:5.0, health:120, dashCharges:3, dashCooldown:2000, size:20 },
        special:{ name:"Omega Protocol", description:"Ativa todos os buff simultaneamente", cooldown:45000, duration:8000, type:"omega" },
        weapons:[
            { name:"Omni Beam",      fireRate:50,   damage:5,   type:"beam",       projectileSpeed:0, count:1, beamLength:500, beamWidth:6, description:"Feixe continuo de poder total" },
            { name:"Genesis Wave",   fireRate:400,  damage:40,  type:"omega_wave", projectileSpeed:8, count:1, waveWidth:200, pierce:999, isUnique:true, description:"Onda que destrui tudo UNICO" },
            { name:"Final Judgment", fireRate:2000, damage:200, type:"nuke",       projectileSpeed:4, count:1, explosionRadius:200, description:"Destrui em massa" }
        ]
    }
];

// ── UPGRADES ─────────────────────────────────────────────────────
const UPGRADES = [
    { id:'power_plus',    name:"Poder+",          description:"+25% de dano em todos os ataques", icon:'power',        category:'offensive', effect:(p)=>{ p.damageMult += 0.25; } },
    { id:'fire_rate',     name:"Cadencia+",        description:"+20% velocidade de disparo",       icon:'fireRate',     category:'offensive', effect:(p)=>{ p.fireRateMult += 0.20; } },
    { id:'pierce',        name:"Penetracao",       description:"Projeteis atravessam +2 inimigos", icon:'pierce',       category:'offensive', effect:(p)=>{ p.pierce += 2; } },
    { id:'ricochet',      name:"Ricochete",        description:"Tiros saltam +2 vezes",            icon:'ricochet',     category:'offensive', effect:(p)=>{ p.ricochet += 2; } },
    { id:'explosive',     name:"Explosivo",        description:"Tiros explodem ao impacto",         icon:'explosive',    category:'offensive', effect:(p)=>{ p.explosiveCount += 1; p.explosionRadius += 35; } },
    { id:'homing',        name:"Teleguiado",       description:"Projeteis perseguem inimigos",      icon:'homing',       category:'offensive', effect:(p)=>{ p.homingStrength += 0.04; } },
    { id:'multishot',     name:"Multi-Tiro",       description:"+1 projetil por disparo",           icon:'power',        category:'offensive', effect:(p)=>{ p.multiShot += 1; } },
    { id:'tesla_chain',   name:"Corrente Tesla",   description:"Dano eletrico em cadeia",           icon:'tesla',        category:'tesla',     effect:(p)=>{ p.teslaChains += 2; p.teslaRange += 60; } },
    { id:'aura',          name:"Campo Eletrico",   description:"Aura de dano passivo",              icon:'aura',         category:'tesla',     effect:(p)=>{ p.hasAura = true; p.auraRadius += 70; p.auraDamage += 6; } },
    { id:'stun',          name:"Paralisia",        description:"15% chance de stun",                icon:'stun',         category:'tesla',     effect:(p)=>{ p.stunChance += 0.15; } },
    { id:'shield',        name:"Escudo",           description:"Absorve 1 hit a cada 20s",          icon:'shield',       category:'defensive', effect:(p)=>{ p.hasShield = true; p.shieldCD = Math.max(p.shieldCD - 5, 12); } },
    { id:'armor',         name:"Blindagem",        description:"-15% dano recebido",                icon:'armor',        category:'defensive', effect:(p)=>{ p.armor += 0.15; } },
    { id:'revive',        name:"Segunda Chance",   description:"Revive com 1 HP (unico)",           icon:'revive',       category:'defensive', effect:(p)=>{ p.extraLives += 1; } },
    { id:'heal',          name:"Reparo+",          description:"Restaura 35 HP",                    icon:'heal',         category:'defensive', effect:(p)=>{ p.hp = Math.min(p.hp + 35, p.maxHp); } },
    { id:'hp_up',         name:"HP+",              description:"+30 HP maximo",                     icon:'hpUp',         category:'defensive', effect:(p)=>{ p.maxHp += 30; p.hp += 30; } },
    { id:'regen',         name:"Regeneracao",      description:"Recupera 1 HP/s",                   icon:'heal',         category:'defensive', effect:(p)=>{ p.regenRate += 1; } },
    { id:'speed',         name:"Velocidade+",      description:"+18% velocidade",                   icon:'speed',        category:'mobility',  effect:(p)=>{ p.speed *= 1.18; } },
    { id:'dash_charge',   name:"Dash Extra",       description:"+1 carga de dash",                  icon:'dashCharge',   category:'mobility',  effect:(p)=>{ p.maxDashCharges += 1; p.dashCharges += 1; } },
    { id:'dash_cooldown', name:"Dash Rapido",      description:"-30% cooldown do dash",             icon:'dashCooldown', category:'mobility',  effect:(p)=>{ p.dashCooldownMult = Math.max(0.1, p.dashCooldownMult - 0.30); } },
    { id:'magnet',        name:"Magnetismo",       description:"Atrai collectibles",                icon:'aura',         category:'mobility',  effect:(p)=>{ p.magnetRange += 100; } },
    { id:'black_hole',    name:"Buraco Negro",     description:"Inimigos mortos geram vortices",    icon:'blackHole',    category:'tactical',  effect:(p)=>{ p.blackHoleChance += 0.18; } },
    { id:'slow_field',    name:"Slow Field",       description:"Desacelera inimigos proximos",      icon:'slowField',    category:'tactical',  effect:(p)=>{ p.hasSlowField = true; p.slowFieldRadius += 90; p.slowAmount += 0.35; } },
    { id:'combo_lock',    name:"Combo Lock",       description:"Combo nao perdido ao tomar dano",   icon:'comboLock',    category:'tactical',  effect:(p)=>{ p.comboLock = true; } },
    { id:'score_mult',    name:"Score x2",         description:"+50% pontuacao",                    icon:'power',        category:'tactical',  effect:(p)=>{ p.scoreMult += 0.5; } }
];

// ── ENEMY TYPES ───────────────────────────────────────────────────
const ENEMY_TYPES = {
    basic:       { hp:25,  speed:2.2, damage:12, color:'#ff4444', size:14, score:10, shootRate:2200, behavior:'chase',        name:'Drone Basico'          },
    kamikaze:    { hp:18,  speed:4.5, damage:30, color:'#ff8800', size:12, score:15, shootRate:0,    behavior:'kamikaze',     name:'Kamikaze'              },
    sniper:      { hp:28,  speed:1.6, damage:22, color:'#aa44ff', size:14, score:25, shootRate:2800, behavior:'keepDistance', projectileSpeed:16, name:'Sniper' },
    tank:        { hp:100, speed:1.0, damage:25, color:'#44ff88', size:24, score:60, shootRate:3500, behavior:'chase',        name:'Tanque'                },
    gravity:     { hp:45,  speed:1.8, damage:8,  color:'#4488ff', size:18, score:35, shootRate:0,    behavior:'gravity',      name:'Poco Gravitacional'    },
    mineLayer:   { hp:35,  speed:2.2, damage:20, color:'#ffff44', size:15, score:30, shootRate:0,    behavior:'mineLayer',    mineInterval:3500, name:'Lancador de Minas' },
    orbitShield: { hp:40,  speed:1.9, damage:15, color:'#44ffff', size:16, score:40, shootRate:2000, behavior:'chase',        hasOrbiters:true, name:'Escudo Orbital' },
    splitter:    { hp:50,  speed:1.5, damage:10, color:'#ff44aa', size:20, score:45, shootRate:0,    behavior:'chase',        splits:true, name:'Divisor'   },
    healer:      { hp:35,  speed:1.8, damage:5,  color:'#88ff88', size:16, score:35, shootRate:0,    behavior:'healer',       healRadius:100, name:'Curandeiro' },
    boss_minion: { hp:15,  speed:3.5, damage:8,  color:'#ff0000', size:10, score:5,  shootRate:1500, behavior:'chase',        name:'Minion'                }
};

// ── BOSSES ────────────────────────────────────────────────────────
const BOSS_DEFS = [
    { name:"Sentinel Core",   wave:10,  hp:600,  color:'#ff0000', pattern:'spiral',    phases:3 },
    { name:"Mecha Serpent",   wave:25,  hp:1200, color:'#00ffff', pattern:'segmented', segments:8, phases:3 },
    { name:"Gravity Overlord",wave:50,  hp:1800, color:'#ff00ff', pattern:'gravity',   phases:4 },
    { name:"Aegis Titan",     wave:75,  hp:2500, color:'#4444ff', pattern:'shield',    phases:4 },
    { name:"NEON TITAN",      wave:100, hp:4000, color:'#ffffff', pattern:'final',     isFinal:true, phases:5 }
];

const ROTATION_BOSSES = [
    { name:"Splitter Prime",  hp:500, color:'#ff6644', pattern:'splitter',   phases:2 },
    { name:"Hive Mind",       hp:550, color:'#44ff44', pattern:'hive',       phases:2 },
    { name:"Phantom Wraith",  hp:480, color:'#aa44ff', pattern:'teleport',   phases:2 },
    { name:"Meteor Lord",     hp:600, color:'#ff8844', pattern:'meteor',     phases:2 },
    { name:"Vortex Master",   hp:520, color:'#4488ff', pattern:'vortex',     phases:2 },
    { name:"Laser Eye",       hp:560, color:'#ff44aa', pattern:'laser',      phases:3 },
    { name:"Vampire Count",   hp:500, color:'#aa0044', pattern:'vampire',    phases:2 },
    { name:"Clone Master",    hp:540, color:'#88ff88', pattern:'clone',      phases:3 },
    { name:"Spiral Guard",    hp:580, color:'#ff44ff', pattern:'spiralFast', phases:2 },
    { name:"Time Keeper",     hp:550, color:'#ffff88', pattern:'timeSlow',   phases:2 }
];

// ── CASSI MESSAGES ────────────────────────────────────────────────
const CASSI_MESSAGES = {
    1:   { text:"Sistemas online. Calibrando sensores. Boa sorte, piloto.", type:"normal" },
    5:   { text:"Primeira ameaca neutralizada. Dados coletados.", type:"normal" },
    10:  { text:"ALERTA - Entidade hostil massiva detectada. Classificacao: SENTINEL.", type:"warning" },
    15:  { text:"Detectando picos de energia anomalos no setor.", type:"normal" },
    20:  { text:"Os padroes de ataque estao... evoluindo. Isso nao deveria acontecer.", type:"warning" },
    25:  { text:"ALERTA MAXIMO - Mecha Serpent detectada. Estrutura segmentada.", type:"warning" },
    40:  { text:"P-piloto... meus sistemas estao sendo... comprometidos...", type:"danger" },
    50:  { text:"GRAVITY OVERLORD. Inversao gravitacional iminente.", type:"danger" },
    70:  { text:"N4O H4 C0D1G0 D3 3XTR4C40. R3P1T0: N4O H4 S41D4.", type:"danger" },
    85:  { text:"A escuridao... ela consome tudo. Nem a luz escapa.", type:"danger" },
    90:  { text:"AEGIS TITAN. Defesa absoluta detectada. Procure pontos fracos.", type:"warning" },
    100: { text:"...PROTOCOLO FINAL ATIVADO. DESTRUICAO IMINENTE.", type:"danger" }
};

