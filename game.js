const arena = document.getElementById("arena");
const p1El = document.getElementById("p1");
const p2El = document.getElementById("p2");
const p1HealthEl = document.getElementById("p1-health");
const p2HealthEl = document.getElementById("p2-health");
const timerEl = document.getElementById("timer");
const roundEl = document.getElementById("round-text");
const msgEl = document.getElementById("message");

const FLOOR_Y = 17;
const WIDTH = 88;
const GRAVITY = 0.62;
const GROUND = arena.clientHeight * (1 - FLOOR_Y / 100) - 140;

const keys = new Set();

const controls = {
  p1: {
    left: "KeyA",
    right: "KeyD",
    jump: "KeyW",
    punch: "KeyF",
    kick: "KeyG",
    block: "KeyH",
    special: "KeyR",
  },
  p2: {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    punch: "KeyN",
    kick: "KeyM",
    block: "Comma",
    special: "Slash",
  },
};

const makeFighter = (name, el, x, dir = 1) => ({
  name,
  el,
  x,
  y: GROUND,
  vx: 0,
  vy: 0,
  facing: dir,
  health: 100,
  blocking: false,
  attacking: false,
  canActAt: 0,
  score: 0,
  specialCooldown: 0,
});

let p1;
let p2;
let round = 1;
let timer = 60;
let matchOver = false;
let projectiles = [];
let tickHandle;
let secondHandle;

function resetRound(fullReset = false) {
  if (fullReset) {
    round = 1;
    p1.score = 0;
    p2.score = 0;
    msgEl.textContent = "First to 2 rounds wins!";
  }

  timer = 60;
  roundEl.textContent = `ROUND ${round} · DIVA ${p1.score} - ${p2.score} DAD`;
  timerEl.textContent = String(timer);

  p1.x = 130;
  p2.x = arena.clientWidth - 220;
  p1.y = GROUND;
  p2.y = GROUND;
  p1.vy = 0;
  p2.vy = 0;
  p1.health = 100;
  p2.health = 100;
  p1.specialCooldown = 0;
  p2.specialCooldown = 0;
  projectiles.forEach((p) => p.el.remove());
  projectiles = [];
  matchOver = false;
  syncUI();
}

function syncUI() {
  p1El.style.left = `${p1.x}px`;
  p2El.style.left = `${p2.x}px`;
  p1El.style.top = `${p1.y}px`;
  p2El.style.top = `${p2.y}px`;
  p1El.style.transform = `scaleX(${p1.facing})`;
  p2El.style.transform = `scaleX(${p2.facing})`;

  p1HealthEl.style.width = `${Math.max(0, p1.health)}%`;
  p2HealthEl.style.width = `${Math.max(0, p2.health)}%`;
}

function rangeBetween(a, b) {
  const centerA = a.x + WIDTH / 2;
  const centerB = b.x + WIDTH / 2;
  return Math.abs(centerA - centerB);
}

function hit(target, baseDamage, sourceName) {
  if (target.blocking) {
    target.health -= Math.max(2, Math.floor(baseDamage * 0.35));
  } else {
    target.health -= baseDamage;
  }
  target.el.classList.add("hit");
  setTimeout(() => target.el.classList.remove("hit"), 120);
  msgEl.textContent = `${sourceName} lands a hit!`;
  if (target.health <= 0) {
    endRound();
  }
}

function attack(attacker, defender, type) {
  const now = performance.now();
  if (now < attacker.canActAt || attacker.health <= 0) return;

  const move = type === "punch"
    ? { damage: 9, startup: 160, range: 95, recovery: 280 }
    : { damage: 14, startup: 200, range: 115, recovery: 420 };

  attacker.attacking = true;
  attacker.el.classList.add("attack");
  attacker.canActAt = now + move.recovery;

  setTimeout(() => {
    if (rangeBetween(attacker, defender) <= move.range && Math.sign(defender.x - attacker.x) === attacker.facing) {
      hit(defender, move.damage, attacker.name);
    }
  }, move.startup);

  setTimeout(() => {
    attacker.attacking = false;
    attacker.el.classList.remove("attack");
  }, move.recovery);
}

function fireSpecial(fighter) {
  const now = performance.now();
  if (fighter.specialCooldown > now || fighter.health <= 0) return;
  fighter.specialCooldown = now + 3500;

  const orb = document.createElement("div");
  orb.className = `projectile ${fighter === p1 ? "p1" : "p2"}`;
  const proj = {
    owner: fighter,
    x: fighter.x + (fighter.facing === 1 ? WIDTH : -24),
    y: fighter.y + 48,
    speed: 7 * fighter.facing,
    el: orb,
  };
  orb.style.left = `${proj.x}px`;
  orb.style.top = `${proj.y}px`;
  arena.appendChild(orb);
  projectiles.push(proj);
  msgEl.textContent = `${fighter.name} used ${fighter === p1 ? "Star Blast" : "Snack Shot"}!`;
}

function applyMovement(fighter, ctl) {
  if (fighter.health <= 0) return;
  fighter.blocking = keys.has(ctl.block);
  fighter.el.classList.toggle("block", fighter.blocking);

  if (!fighter.attacking && !fighter.blocking) {
    fighter.vx = 0;
    if (keys.has(ctl.left)) fighter.vx = -4.2;
    if (keys.has(ctl.right)) fighter.vx = 4.2;

    if (fighter.vx !== 0) {
      fighter.facing = fighter.vx > 0 ? 1 : -1;
      fighter.x += fighter.vx;
      fighter.x = Math.max(0, Math.min(arena.clientWidth - WIDTH, fighter.x));
    }
  }
}

function updateJump(fighter) {
  if (fighter.y < GROUND || fighter.vy < 0) {
    fighter.vy += GRAVITY;
    fighter.y += fighter.vy;
    fighter.el.classList.add("jump");
    if (fighter.y >= GROUND) {
      fighter.y = GROUND;
      fighter.vy = 0;
      fighter.el.classList.remove("jump");
    }
  }
}

function tick() {
  if (matchOver) return;

  applyMovement(p1, controls.p1);
  applyMovement(p2, controls.p2);

  updateJump(p1);
  updateJump(p2);

  projectiles = projectiles.filter((proj) => {
    proj.x += proj.speed;
    proj.el.style.left = `${proj.x}px`;

    const target = proj.owner === p1 ? p2 : p1;
    const hitRange = Math.abs((target.x + WIDTH / 2) - (proj.x + 12));

    if (hitRange < 50 && Math.abs(target.y - proj.y + 40) < 110) {
      hit(target, 12, proj.owner.name);
      proj.el.remove();
      return false;
    }

    if (proj.x < -40 || proj.x > arena.clientWidth + 40) {
      proj.el.remove();
      return false;
    }
    return true;
  });

  syncUI();
  tickHandle = requestAnimationFrame(tick);
}

function endRound() {
  matchOver = true;
  cancelAnimationFrame(tickHandle);
  clearInterval(secondHandle);

  let winner;
  if (p1.health === p2.health) {
    winner = timer > 0 ? null : (p1.health > p2.health ? p1 : p2);
  } else {
    winner = p1.health > p2.health ? p1 : p2;
  }

  if (winner) {
    winner.score += 1;
    msgEl.textContent = `${winner.name} wins round ${round}!`;
  } else {
    msgEl.textContent = `Round ${round} is a draw!`;
  }

  if (p1.score >= 2 || p2.score >= 2) {
    const champ = p1.score > p2.score ? p1.name : p2.name;
    roundEl.textContent = `FINAL · ${champ} CHAMPION`;
    msgEl.textContent = `${champ} wins the Rooftop Rumble! Press Restart.`;
    return;
  }

  round += 1;
  setTimeout(() => {
    resetRound();
    startTimers();
    tick();
  }, 1400);
}

function startTimers() {
  secondHandle = setInterval(() => {
    timer -= 1;
    timerEl.textContent = String(timer);
    if (timer <= 0) {
      endRound();
    }
  }, 1000);
}

window.addEventListener("keydown", (e) => {
  keys.add(e.code);

  if (e.code === controls.p1.jump && p1.y === GROUND) p1.vy = -11;
  if (e.code === controls.p2.jump && p2.y === GROUND) p2.vy = -11;

  if (e.code === controls.p1.punch) attack(p1, p2, "punch");
  if (e.code === controls.p1.kick) attack(p1, p2, "kick");
  if (e.code === controls.p2.punch) attack(p2, p1, "punch");
  if (e.code === controls.p2.kick) attack(p2, p1, "kick");

  if (e.code === controls.p1.special) fireSpecial(p1);
  if (e.code === controls.p2.special) fireSpecial(p2);
});

window.addEventListener("keyup", (e) => keys.delete(e.code));

document.getElementById("restart").addEventListener("click", () => {
  resetRound(true);
  clearInterval(secondHandle);
  cancelAnimationFrame(tickHandle);
  startTimers();
  tick();
});

function init() {
  p1 = makeFighter("Diva", p1El, 130, 1);
  p2 = makeFighter("Dad", p2El, arena.clientWidth - 220, -1);
  p1El.textContent = "👧";
  p2El.textContent = "👨";
  resetRound(true);
  startTimers();
  tick();
}

init();
