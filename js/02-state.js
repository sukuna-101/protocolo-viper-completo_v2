// ── GAME STATE ────────────────────────────────────────────────────
let gameState = 'menu';
let selectedShipIndex = 0;
let selectedWeaponIndex = 0;
let difficulty = 'normal';
let lastTime = 0;
let gameSpeed = 1;
let globalTime = 0;
let animationId = null;

let player = null;
let enemies = [];
let projectiles = [];
let enemyProjectiles = [];
let particles = [];
let floatingTexts = [];
let blackHoles = [];
let mines = [];
let traps = [];
let drones = [];
let chainEffects = [];
let beams = [];

let wave = 1;
let score = 0;
let kills = 0;
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
let waveTimer = 0;
let waveDelay = 3500;
let betweenWaves = false;
let currentBoss = null;
let bossSpawned = false;
let gameTime = 0;
let minimapVisible = false;

let mouse = { x: 0, y: 0 };
let keys = {};
let shooting = false;

let screenShake = { x: 0, y: 0, intensity: 0 };
let bgStars = [];
let bgNebulas = [];

// FPS tracking
let fpsFrames = 0;
let fpsLastTime = performance.now();
let fpsDisplay = 0;

// Kill feed
let killFeedEntries = [];
const MAX_KILL_FEED = 6;

// Music Player
let audioContext = null;
let gainNode = null;
let currentSong = null;
let currentSongSource = null;
let playlist = [];
let currentSongIndex = 0;
let isPlaying = false;
let volume = 0.7;

