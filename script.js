/* ============================================
   THEME TOGGLE
   ============================================ */
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const root = document.documentElement;

function applyTheme(t) {
  if (t === 'light') {
    root.setAttribute('data-theme', 'light');
    themeIcon.textContent = '○';
  } else {
    root.removeAttribute('data-theme');
    themeIcon.textContent = '●';
  }
}
let currentTheme = 'dark';
applyTheme(currentTheme);

themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
});

/* ============================================
   CUSTOM CURSOR
   ============================================ */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const cursorGlow = document.getElementById('cursorGlow');
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let ringX = mouseX, ringY = mouseY;

if (isFinePointer) {
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    cursorGlow.style.opacity = '1';
    cursorGlow.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
  });

  window.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });

  function ringLoop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(ringLoop);
  }
  ringLoop();

  document.querySelectorAll('a, button, [data-tilt], [data-tilt-strong]').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
  });
}

/* ============================================
   PARTICLE FIELD (ambient, mouse-reactive)
   ============================================ */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let pw, ph;

function resizeCanvas() {
  pw = canvas.width = window.innerWidth;
  ph = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PARTICLE_COUNT = window.innerWidth < 860 ? 26 : 56;
function initParticles() {
  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * pw,
    y: Math.random() * ph,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    r: Math.random() * 1.4 + 0.6,
  }));
}
initParticles();

function getAccentRGB() {
  const isLight = root.getAttribute('data-theme') === 'light';
  return isLight ? '79,122,69' : '124,154,111';
}

function drawParticles() {
  ctx.clearRect(0, 0, pw, ph);
  const rgb = getAccentRGB();

  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = pw; if (p.x > pw) p.x = 0;
    if (p.y < 0) p.y = ph; if (p.y > ph) p.y = 0;

    // mouse repulsion
    if (isFinePointer) {
      const dx = p.x - mouseX, dy = p.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        const force = (130 - dist) / 130;
        p.x += (dx / dist) * force * 1.6;
        p.y += (dy / dist) * force * 1.6;
      }
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rgb}, 0.45)`;
    ctx.fill();
  });

  // connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${rgb}, ${0.12 * (1 - dist / 130)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(drawParticles);
}
drawParticles();

/* ============================================
   3D TILT (mouse-reactive)
   ============================================ */
function attachTilt(el, strength) {
  let rect;
  el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
  el.addEventListener('mousemove', (e) => {
    if (!rect) rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * strength}deg) rotateX(${-py * strength}deg) scale3d(1.01,1.01,1.01)`;

    // glow position for cards that use it
    el.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(py + 0.5) * 100}%`);
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  });
}

if (isFinePointer) {
  document.querySelectorAll('[data-tilt]').forEach(el => attachTilt(el, 12));
  document.querySelectorAll('[data-tilt-strong]').forEach(el => attachTilt(el, 7));
}

/* ============================================
   MAGNETIC BUTTONS
   ============================================ */
function attachMagnetic(el, strength = 0.35) {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0,0)';
  });
}
if (isFinePointer) {
  document.querySelectorAll('.magnetic').forEach(el => attachMagnetic(el));
}

/* ============================================
   TYPING ANIMATION — hero code editor
   ============================================ */
const codeLines = [
  [{ t: 'tok-kw', s: 'class ' }, { t: 'tok-cls', s: 'Haresh' }, { t: '', s: ' : ' }, { t: 'tok-cls', s: 'AndroidEngineer' }, { t: '', s: '() {' }],
  [{ t: '', s: '' }],
  [{ t: 'tok-com', s: '    // 4+ years shipping native Android apps' }],
  [{ t: 'tok-kw', s: '    val ' }, { t: 'tok-prop', s: 'location ' }, { t: '', s: '= ' }, { t: 'tok-str', s: '"Ahmedabad, India"' }],
  [{ t: 'tok-kw', s: '    val ' }, { t: 'tok-prop', s: 'role ' }, { t: '', s: '= ' }, { t: 'tok-str', s: '"Software Engineer, Android"' }],
  [{ t: 'tok-kw', s: '    val ' }, { t: 'tok-prop', s: 'stack ' }, { t: '', s: '= ' }, { t: 'tok-fn', s: 'listOf' }, { t: '', s: '(' }, { t: 'tok-str', s: '"Kotlin"' }, { t: '', s: ', ' }, { t: 'tok-str', s: '"Compose"' }, { t: '', s: ', ' }, { t: 'tok-str', s: '"Coroutines"' }, { t: '', s: ')' }],
  [{ t: '', s: '' }],
  [{ t: 'tok-kw', s: '    fun ' }, { t: 'tok-fn', s: 'philosophy' }, { t: '', s: '(): ' }, { t: 'tok-cls', s: 'String ' }, { t: '', s: '{' }],
  [{ t: 'tok-kw', s: '        return ' }, { t: 'tok-str', s: '"ship fast, profile often, sleep well"' }],
  [{ t: '', s: '    }' }],
  [{ t: '', s: '}' }],
];

const editorCode = document.getElementById('editorCode');
const editorGutter = document.getElementById('editorGutter');
const typeCursor = document.getElementById('typeCursor');

function typeEditor() {
  let lineIdx = 0;
  let charIdx = 0;
  let gutterHTML = '';

  function typeNextChar() {
    if (lineIdx >= codeLines.length) {
      typeCursor.style.display = 'none';
      return;
    }
    const line = codeLines[lineIdx];
    const fullLineText = line.map(seg => seg.s).join('');

    if (charIdx === 0) {
      // start new line container
      const lineSpan = document.createElement('div');
      lineSpan.id = `line-${lineIdx}`;
      editorCode.appendChild(lineSpan);
      gutterHTML += `<div>${lineIdx + 1}</div>`;
      editorGutter.innerHTML = gutterHTML;
    }

    if (charIdx <= fullLineText.length) {
      const lineSpan = document.getElementById(`line-${lineIdx}`);
      // build up rich text progressively
      let consumed = 0;
      let html = '';
      for (const seg of line) {
        if (consumed >= charIdx) break;
        const take = Math.min(seg.s.length, charIdx - consumed);
        const visible = seg.s.slice(0, take);
        html += seg.t ? `<span class="${seg.t}">${escapeHTML(visible)}</span>` : escapeHTML(visible);
        consumed += seg.s.length;
      }
      lineSpan.innerHTML = html || '\u00A0';

      // position blinking cursor at end of current typed text
      lineSpan.appendChild(typeCursor);
      typeCursor.style.display = 'inline-block';

      charIdx++;
      const speed = fullLineText.length === 0 ? 0 : 14 + Math.random() * 22;
      setTimeout(typeNextChar, speed);
    } else {
      lineIdx++;
      charIdx = 0;
      setTimeout(typeNextChar, 90);
    }
  }
  typeNextChar();
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

setTimeout(typeEditor, 2600);

/* ============================================
   SCROLL REVEAL (IntersectionObserver)
   ============================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      barObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('.stack-bar').forEach(el => barObserver.observe(el));

/* ============================================
   ACTIVE NAV LINK ON SCROLL
   ============================================ */
const sections = ['about', 'stack', 'work', 'connect'].map(id => document.getElementById(id));
const navLinks = document.querySelectorAll('.rail-link');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === id);
      });
    }
  });
}, { threshold: 0.4, rootMargin: '-10% 0px -50% 0px' });

sections.forEach(s => s && navObserver.observe(s));
