// Dựa trên công thức và luật chiến đấu trong file JavaScript ban đầu.
const $ = (id) => document.getElementById(id);
const originalName = 'Nguyễn Thị Khánh Ngọc';
let hero, dragon, playing = false, busy = false, soundOn = true, audio;
let battleId = 0;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sound(type) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = type === 'fire' ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(type === 'fire' ? 170 : type === 'win' ? 660 : 550, now);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'fire' ? 55 : 180, now + 0.18);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(now); oscillator.stop(now + 0.2);
  } catch (error) { console.warn('Trình duyệt không hỗ trợ âm thanh.', error); }
}
function message(text) {
  const p = document.createElement('p');
  p.textContent = text; $('log').appendChild(p); $('log').scrollTop = $('log').scrollHeight;
}
function update() {
  $('heroHP').textContent = `${Math.max(0, hero.health)} / 105`;
  $('dragonHP').textContent = `${Math.max(0, dragon.health)} / 600`;
  $('heroBar').style.width = `${Math.max(0, hero.health) / 105 * 100}%`;
  $('dragonBar').style.width = `${Math.max(0, dragon.health) / 600 * 100}%`;
}
function animate(id, className) {
  const element = $(id); element.classList.remove(className); void element.offsetWidth; element.classList.add(className);
  element.addEventListener('animationend', () => element.classList.remove(className), { once: true });
}
function damage(id, text) {
  const el = $(id); el.textContent = text; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function projectile(kind) {
  const el = $('projectile'); el.className = ''; void el.offsetWidth;
  el.textContent = kind === 'fire' ? '🔥' : '⚔️'; el.className = `projectile ${kind}`;
  el.addEventListener('animationend', () => { el.className = ''; el.textContent = ''; }, { once: true });
}
function start() {
  battleId++; busy = false; playing = true;
  // Code gốc: level 2, XP 350, điểm kỹ năng 40; sau đó lên cấp 5.
  let xp = 150 * (2 - 1) + 200, skillPoint = 5 + xp / 10;
  let strength = 0.6 * skillPoint + 0.1 * xp;
  let agility = 0.2 * skillPoint + 0.2 * xp;
  let intel = 0.2 * skillPoint + 10 * 2;
  const name = $('name').value.trim() || 'Anh hùng';
  intel += name === originalName ? 5 : -5;
  const role = $('role').value;
  if (role === 'a') { strength += 15; agility -= 10; intel -= 5; }
  else if (role === 'b') { strength -= 15; agility += 10; intel += 5; }
  else { strength -= 15; intel += 15; }
  hero = { name, strength, agility, intel, health: 105 };
  dragon = { health: 600, strength: 100, agility: 15, intel: 80 };
  $('heroName').textContent = name; $('stats').textContent = `Sức mạnh: ${strength} | Nhanh nhẹn: ${agility} | Trí tuệ: ${intel}`;
  $('log').textContent = ''; message(`${name} đã sẵn sàng! Nhấn Tấn công để bắt đầu.`);
  $('hero').classList.remove('defeated'); $('dragon').classList.remove('defeated');
  $('projectile').className = ''; $('projectile').textContent = '';
  $('attack').disabled = false; update();
}
async function attack() {
  if (!playing || busy) return;
  busy = true; $('attack').disabled = true; const turn = battleId;
  animate('hero', 'attack-hero'); projectile('slash'); sound('attack'); await wait(400);
  if (turn !== battleId) return;
  if (Math.random() * 100 > dragon.agility) {
    let amount = hero.strength; const critical = Math.random() * 100 < hero.intel;
    if (critical) amount += hero.strength * 2; // Giống code gốc: thêm 2 lần sát thương.
    dragon.health -= amount; animate('dragon', 'hurt'); damage('dragonDamage', `-${amount}`); sound('hit');
    message(`⚔️ Trảm long: gây ${amount} sát thương${critical ? ' (chí mạng!)' : '.'}`);
  } else { damage('dragonDamage', 'NÉ!'); message('💨 Rồng né được đòn tấn công!'); }
  update();
  if (dragon.health <= 0) { playing = false; $('dragon').classList.add('defeated'); message('🏆 CHIẾN THẮNG! Bạn đã đánh bại rồng!'); sound('win'); busy = false; return; }
  await wait(650); if (turn !== battleId) return;
  animate('dragon', 'attack-dragon'); projectile('fire'); sound('fire'); await wait(400);
  if (turn !== battleId) return;
  if (Math.random() * 100 > hero.agility) {
    let amount = dragon.strength; const critical = Math.random() * 100 < dragon.intel;
    if (critical) amount += dragon.strength * 2;
    hero.health -= amount; animate('hero', 'hurt'); damage('heroDamage', `-${amount}`); sound('hit');
    message(`🔥 Hỏa cầu: rồng gây ${amount} sát thương${critical ? ' (chí mạng!)' : '.'}`);
  } else { damage('heroDamage', 'NÉ!'); message('💨 Bạn đã né được hỏa cầu!'); }
  update();
  if (hero.health <= 0) { playing = false; $('hero').classList.add('defeated'); message('💀 THẤT BẠI! Nhấn Chơi lại để thử lần nữa.'); }
  busy = false; $('attack').disabled = !playing;
}
$('start').addEventListener('click', start);
$('reset').addEventListener('click', start);
$('attack').addEventListener('click', attack);
$('sound').addEventListener('click', () => { soundOn = !soundOn; $('sound').textContent = soundOn ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt'; $('sound').setAttribute('aria-pressed', soundOn); if (soundOn) sound('attack'); });
