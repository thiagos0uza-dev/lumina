import { palette } from '../config/birthday';
import { clamp, damp, gaussian, hexToRgb, rgba, seeded, type RGB } from '../utils/math';
import type { Point } from '../utils/constellation';

/**
 * Motor do céu de LUMINA — um único <canvas> em tela cheia que desenha:
 * nebulosas, campo de estrelas em três profundidades, poeira cósmica,
 * galáxia espiral, estrelas cadentes, faíscas, clarões e o nome formado por partículas.
 *
 * Os capítulos não desenham nada aqui diretamente: eles apenas definem uma "cena"
 * (valores-alvo) e o motor interpola suavemente até ela. Isso mantém as transições
 * entre capítulos contínuas, como um único plano de câmera.
 */

export interface SceneState {
  /** Visibilidade do campo de estrelas (0–1). */
  stars: number;
  /** Intensidade das nebulosas (0–1). */
  nebula: number;
  /** Quantidade visível de poeira cósmica (0–1). */
  dust: number;
  /** Visibilidade da galáxia espiral (0–1+). */
  galaxy: number;
  /** Zoom da câmera: >1 aproxima, <1 afasta. */
  zoom: number;
  /** Brilho ambiente âmbar ao redor do foco (0–1). */
  glow: number;
  /** Foco da luz/galáxia em coordenadas normalizadas da tela. */
  focusX: number;
  focusY: number;
}

const DEFAULT_SCENE: SceneState = {
  stars: 0,
  nebula: 0,
  dust: 0,
  galaxy: 0,
  zoom: 1,
  glow: 0,
  focusX: 0.5,
  focusY: 0.5,
};

const C = {
  obsidian: hexToRgb(palette.obsidian),
  charcoal: hexToRgb(palette.charcoal),
  rust: hexToRgb(palette.rust),
  amber: hexToRgb(palette.amber),
  gold: hexToRgb(palette.gold),
  champagne: hexToRgb(palette.champagne),
  ivory: hexToRgb(palette.ivory),
  copper: hexToRgb(palette.copper),
};

type SpriteKey = 'ivory' | 'champagne' | 'gold' | 'amber' | 'copper';

interface Star {
  x: number; // normalizado, pode extrapolar a tela para cobrir zoom-out
  y: number;
  depth: number; // 0.15 (longe) – 1 (perto)
  size: number;
  alpha: number;
  phase: number;
  twinkle: number;
  sprite: SpriteKey;
}

interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  depth: number;
}

interface GalaxyParticle {
  r: number; // 0–1 do raio
  theta: number;
  size: number;
  alpha: number;
  color: number; // índice em GALAXY_COLORS
}

interface NameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  phase: number;
  alpha: number;
  delay: number;
  free: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  width: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sprite: SpriteKey;
}

const GALAXY_COLORS: RGB[] = [C.ivory, C.champagne, C.gold, C.amber, C.copper, C.rust];

export interface EngineOptions {
  reducedMotion: boolean;
}

export class SpaceEngine {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private compact = false;
  private reduced: boolean;

  private scene: SceneState = { ...DEFAULT_SCENE };
  private target: SceneState = { ...DEFAULT_SCENE };
  private sceneRate = 1.1;

  private stars: Star[] = [];
  private dust: Dust[] = [];
  private galaxy: GalaxyParticle[] = [];
  private nameParticles: NameParticle[] = [];
  private meteors: Meteor[] = [];
  private sparks: Spark[] = [];

  private sprites = new Map<SpriteKey, HTMLCanvasElement>();
  private nebulaLayer: HTMLCanvasElement | null = null;

  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  private warp = 0;
  private warpTarget = 0;
  private flashAmount = 0;
  private nextAmbientMeteor = 6;

  private pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999 };

  constructor(
    private canvas: HTMLCanvasElement,
    options: EngineOptions,
  ) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D indisponível');
    this.ctx = ctx;
    this.reduced = options.reducedMotion;
    this.buildSprites();
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  // ---------------------------------------------------------------- API pública

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
  }

  /** Define a cena-alvo. `rate` controla a velocidade da transição (maior = mais rápido). */
  setScene(partial: Partial<SceneState>, rate = 1.1) {
    Object.assign(this.target, partial);
    this.sceneRate = rate;
    if (this.reduced) Object.assign(this.scene, partial);
  }

  /** Salto imediato (sem interpolação), útil para posicionar a câmera antes de um movimento. */
  jumpScene(partial: Partial<SceneState>) {
    Object.assign(this.scene, partial);
    Object.assign(this.target, partial);
  }

  /** Viagem pela luz: as estrelas se esticam em rastros por `ms` milissegundos. */
  warpPulse(ms = 1400) {
    if (this.reduced) return;
    this.warpTarget = 1;
    window.setTimeout(() => (this.warpTarget = 0), ms);
  }

  /** Clarão âmbar em tela cheia, que se dissipa sozinho. */
  flash(amount = 0.6) {
    this.flashAmount = Math.max(this.flashAmount, this.reduced ? amount * 0.4 : amount);
  }

  /** Estrela cadente. Sem parâmetros, atravessa a tela em diagonal. */
  shootingStar(opts: { big?: boolean; from?: Point; angle?: number } = {}) {
    const big = opts.big ?? false;
    const angle = opts.angle ?? (Math.PI * (0.78 + Math.random() * 0.08));
    const speed = (big ? 1.25 : 0.9) * Math.max(this.width, this.height);
    const from = opts.from ?? {
      x: this.width * (0.75 + Math.random() * 0.35),
      y: this.height * (-0.05 + Math.random() * 0.25),
    };
    this.meteors.push({
      x: from.x,
      y: from.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: big ? 1.6 : 0.9 + Math.random() * 0.5,
      length: big ? 320 : 140 + Math.random() * 90,
      width: big ? 2.6 : 1.4,
    });
  }

  /** Explosão de faíscas douradas em (x, y) em pixels de tela. */
  burst(x: number, y: number, count = 140) {
    const n = Math.round(this.reduced ? count * 0.25 : count);
    const keys: SpriteKey[] = ['champagne', 'gold', 'amber', 'ivory'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * (this.compact ? 260 : 380);
      this.sparks.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0,
        maxLife: 1.2 + Math.random() * 1.6,
        size: 1 + Math.random() * 2.6,
        sprite: keys[i % keys.length],
      });
    }
  }

  /**
   * Faz partículas se reunirem nos pontos dados (pixels de tela) — o nome LUISA.
   * `null` liberta as partículas, que se dispersam e somem.
   */
  formName(points: (Point & { weight: number })[] | null) {
    if (!points) {
      this.nameParticles.forEach((p) => {
        p.free = true;
        const a = Math.random() * Math.PI * 2;
        p.vx += Math.cos(a) * 120;
        p.vy += Math.sin(a) * 120;
      });
      return;
    }
    const existing = this.nameParticles.filter((p) => !p.free);
    const next: NameParticle[] = points.map((pt, i) => {
      const reuse = existing[i];
      if (reuse) {
        reuse.tx = pt.x;
        reuse.ty = pt.y;
        return reuse;
      }
      // Nasce espalhada pelo céu, ao redor do foco, e viaja até o seu lugar.
      const a = Math.random() * Math.PI * 2;
      const r = Math.max(this.width, this.height) * (0.35 + Math.random() * 0.5);
      const fx = this.scene.focusX * this.width;
      const fy = this.scene.focusY * this.height;
      const p: NameParticle = {
        x: this.reduced ? pt.x : fx + Math.cos(a) * r,
        y: this.reduced ? pt.y : fy + Math.sin(a) * r,
        vx: 0,
        vy: 0,
        tx: pt.x,
        ty: pt.y,
        size: pt.weight ? 2.6 + Math.random() * 0.8 : 0.9 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        alpha: 0,
        delay: this.reduced ? 0 : Math.random() * 1.2,
        free: false,
      };
      return p;
    });
    // As que sobraram se libertam.
    existing.slice(points.length).forEach((p) => (p.free = true));
    this.nameParticles = [...next, ...this.nameParticles.filter((p) => p.free)];
  }

  // ---------------------------------------------------------------- Ciclo

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
    } else if (this.running) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.pointer.tx = (e.clientX / this.width) * 2 - 1;
    this.pointer.ty = (e.clientY / this.height) * 2 - 1;
    this.pointer.px = e.clientX;
    this.pointer.py = e.clientY;
  };

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.compact = Math.min(w, h) < 600;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.compact ? 2 : 1.5);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.populate();
    this.buildNebula();
  };

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  // ---------------------------------------------------------------- Construção

  private buildSprites() {
    const make = (color: RGB) => {
      const size = 64;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, rgba(C.ivory, 1));
      grd.addColorStop(0.12, rgba(color, 0.95));
      grd.addColorStop(0.32, rgba(color, 0.28));
      grd.addColorStop(1, rgba(color, 0));
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return c;
    };
    (['ivory', 'champagne', 'gold', 'amber', 'copper'] as SpriteKey[]).forEach((k) =>
      this.sprites.set(k, make(C[k])),
    );
  }

  private populate() {
    const area = this.width * this.height;
    const rand = seeded(20251101);

    const starCount = Math.round(clamp(area / 2300, 260, 760) * (this.compact ? 0.8 : 1));
    this.stars = Array.from({ length: starCount }, () => {
      const depth = 0.15 + Math.pow(rand(), 2.2) * 0.85;
      const roll = rand();
      const sprite: SpriteKey =
        roll < 0.5 ? 'ivory' : roll < 0.78 ? 'champagne' : roll < 0.9 ? 'gold' : roll < 0.97 ? 'amber' : 'copper';
      return {
        x: -0.3 + rand() * 1.6,
        y: -0.3 + rand() * 1.6,
        depth,
        size: 0.5 + depth * 1.9 + (rand() < 0.04 ? 1.8 : 0),
        alpha: 0.25 + rand() * 0.75,
        phase: rand() * Math.PI * 2,
        twinkle: 0.4 + rand() * 1.6,
        sprite,
      };
    });

    const dustCount = Math.round(clamp(area / 14000, 40, 150));
    this.dust = Array.from({ length: dustCount }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 6,
      size: 0.6 + Math.random() * 1.6,
      alpha: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      depth: 0.3 + Math.random() * 0.7,
    }));

    const grand = seeded(7);
    const galaxyCount = this.compact ? 1100 : 2200;
    const arms = 2;
    this.galaxy = Array.from({ length: galaxyCount }, (_, i) => {
      const arm = i % arms;
      const r = Math.pow(grand(), 0.65);
      const spread = (0.42 * (1 - r) + 0.14) * gaussian(grand) * 0.5;
      const theta = (arm / arms) * Math.PI * 2 + r * 3.6 + spread;
      const color =
        r < 0.12 ? 0 : r < 0.28 ? 1 : r < 0.5 ? (grand() < 0.6 ? 2 : 3) : grand() < 0.45 ? 3 : grand() < 0.6 ? 4 : 5;
      return {
        r,
        theta,
        size: 0.6 + grand() * (r < 0.2 ? 1.6 : 1.2),
        alpha: 0.25 + grand() * 0.6,
        color,
      };
    });
    // Agrupa por cor para trocar fillStyle o mínimo possível.
    this.galaxy.sort((a, b) => a.color - b.color);
  }

  private buildNebula() {
    const scale = 0.25;
    const w = Math.max(2, Math.round(this.width * scale));
    const h = Math.max(2, Math.round(this.height * scale));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d')!;
    const rand = seeded(1312);
    const blobs: [RGB, number][] = [
      [C.rust, 0.34],
      [C.amber, 0.16],
      [C.copper, 0.22],
      [C.rust, 0.26],
      [C.charcoal, 0.9],
      [C.amber, 0.1],
      [C.rust, 0.2],
      [C.copper, 0.14],
    ];
    blobs.forEach(([color, alpha]) => {
      const x = (0.1 + rand() * 0.8) * w;
      const y = (0.1 + rand() * 0.8) * h;
      const r = (0.25 + rand() * 0.45) * Math.max(w, h);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, rgba(color, alpha));
      grd.addColorStop(0.55, rgba(color, alpha * 0.35));
      grd.addColorStop(1, rgba(color, 0));
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    // Faixa de poeira escura, como uma via láctea atravessando.
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-0.42);
    const band = g.createLinearGradient(0, -h * 0.25, 0, h * 0.25);
    band.addColorStop(0, rgba(C.obsidian, 0));
    band.addColorStop(0.5, rgba(C.obsidian, 0.55));
    band.addColorStop(1, rgba(C.obsidian, 0));
    g.fillStyle = band;
    g.fillRect(-w, -h * 0.25, w * 2, h * 0.5);
    g.restore();
    this.nebulaLayer = c;
  }

  // ---------------------------------------------------------------- Atualização

  private update(dt: number) {
    const s = this.scene;
    const t = this.target;
    const rate = this.sceneRate;
    (Object.keys(t) as (keyof SceneState)[]).forEach((k) => {
      s[k] = damp(s[k], t[k], rate, dt);
    });

    this.warp = damp(this.warp, this.warpTarget, this.warpTarget > this.warp ? 3 : 1.6, dt);
    this.flashAmount = Math.max(0, this.flashAmount - dt * 0.9);

    const p = this.pointer;
    p.x = damp(p.x, this.reduced ? 0 : p.tx, 2.2, dt);
    p.y = damp(p.y, this.reduced ? 0 : p.ty, 2.2, dt);

    if (!this.reduced) {
      // Poeira cósmica: deriva lenta, com leve desvio do cursor.
      for (const d of this.dust) {
        d.x += d.vx * dt * d.depth;
        d.y += d.vy * dt * d.depth;
        const dx = d.x - p.px;
        const dy = d.y - p.py;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 14400 && dist2 > 1) {
          const f = (1 - dist2 / 14400) * 40 * dt;
          const dist = Math.sqrt(dist2);
          d.x += (dx / dist) * f;
          d.y += (dy / dist) * f;
        }
        if (d.y < -10) d.y = this.height + 10;
        if (d.x < -10) d.x = this.width + 10;
        if (d.x > this.width + 10) d.x = -10;
      }

      // Estrelas cadentes ambientes, raras.
      if (s.stars > 0.6) {
        this.nextAmbientMeteor -= dt;
        if (this.nextAmbientMeteor <= 0) {
          this.shootingStar();
          this.nextAmbientMeteor = 9 + Math.random() * 12;
        }
      }
    }

    for (const m of this.meteors) {
      m.life += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
    }
    this.meteors = this.meteors.filter((m) => m.life < m.maxLife);

    for (const sp of this.sparks) {
      sp.life += dt;
      sp.vx *= Math.exp(-1.6 * dt);
      sp.vy = sp.vy * Math.exp(-1.6 * dt) + 22 * dt;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
    }
    this.sparks = this.sparks.filter((sp) => sp.life < sp.maxLife);

    for (const n of this.nameParticles) {
      if (n.free) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        n.alpha = Math.max(0, n.alpha - dt * 0.8);
        continue;
      }
      if (n.delay > 0) {
        n.delay -= dt;
        continue;
      }
      // Mola amortecida até o alvo: chegada suave, sem oscilar demais.
      const k = 5.5;
      const c = 3.8;
      n.vx += ((n.tx - n.x) * k - n.vx * c) * dt;
      n.vy += ((n.ty - n.y) * k - n.vy * c) * dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.alpha = Math.min(1, n.alpha + dt * 0.7);
    }
    this.nameParticles = this.nameParticles.filter((n) => !n.free || n.alpha > 0.01);
  }

  // ---------------------------------------------------------------- Desenho

  private draw() {
    const { ctx, width: w, height: h } = this;
    const s = this.scene;
    const time = this.reduced ? 0 : this.time;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.obsidian;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const zoom = s.zoom + this.warp * 0.5;
    const parX = this.pointer.x * 22;
    const parY = this.pointer.y * 16;

    // Nebulosas
    if (this.nebulaLayer && s.nebula > 0.01) {
      const nz = 1 + (zoom - 1) * 0.25;
      const dw = w * 1.25 * nz;
      const dh = h * 1.25 * nz;
      const driftX = Math.sin(time * 0.02) * w * 0.03 - parX * 0.3;
      const driftY = Math.cos(time * 0.017) * h * 0.03 - parY * 0.3;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = clamp(s.nebula, 0, 1);
      ctx.drawImage(this.nebulaLayer, cx - dw / 2 + driftX, cy - dh / 2 + driftY, dw, dh);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Luz ambiente âmbar ao redor do foco
    const fx = s.focusX * w;
    const fy = s.focusY * h;
    if (s.glow > 0.01) {
      const r = Math.max(w, h) * 0.7;
      const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
      grd.addColorStop(0, rgba(C.amber, 0.32 * s.glow));
      grd.addColorStop(0.35, rgba(C.rust, 0.14 * s.glow));
      grd.addColorStop(1, rgba(C.rust, 0));
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    if (s.galaxy > 0.01) this.drawGalaxy(fx, fy, zoom, time, s.galaxy);
    if (s.stars > 0.01) this.drawStars(cx, cy, zoom, parX, parY, time, s.stars);
    if (s.dust > 0.01) this.drawDust(time, s.dust);

    ctx.globalCompositeOperation = 'lighter';
    this.drawNameParticles(time);
    this.drawMeteors();
    this.drawSparks();
    ctx.globalCompositeOperation = 'source-over';

    if (this.flashAmount > 0.005) {
      const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(w, h));
      grd.addColorStop(0, rgba(C.ivory, Math.min(1, this.flashAmount)));
      grd.addColorStop(0.3, rgba(C.champagne, this.flashAmount * 0.6));
      grd.addColorStop(1, rgba(C.amber, this.flashAmount * 0.15));
      ctx.globalAlpha = 1;
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  }

  private drawStars(cx: number, cy: number, zoom: number, parX: number, parY: number, time: number, vis: number) {
    const { ctx, width: w, height: h } = this;
    const warp = this.warp;
    ctx.globalCompositeOperation = 'lighter';

    for (const st of this.stars) {
      const z = 1 + (zoom - 1) * (0.35 + st.depth * 0.9);
      const x = cx + (st.x * w - cx) * z + parX * st.depth;
      const y = cy + (st.y * h - cy) * z + parY * st.depth;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;

      const tw = 0.72 + 0.28 * Math.sin(time * st.twinkle + st.phase);
      const a = st.alpha * tw * vis;
      if (a < 0.02) continue;

      if (warp > 0.02) {
        const dx = x - cx;
        const dy = y - cy;
        const len = warp * st.depth * 0.32;
        ctx.globalAlpha = a;
        ctx.strokeStyle = rgba(C.champagne, 0.9);
        ctx.lineWidth = Math.max(0.6, st.size * 0.6);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - dx * len, y - dy * len);
        ctx.stroke();
      }

      const size = st.size * (0.9 + (z - 1) * 0.3);
      if (size < 1.4) {
        ctx.globalAlpha = a;
        ctx.fillStyle = rgba(C[st.sprite], 1);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      } else {
        const d = size * 5;
        ctx.globalAlpha = a;
        ctx.drawImage(this.sprites.get(st.sprite)!, x - d / 2, y - d / 2, d, d);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawDust(time: number, vis: number) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(C.amber, 1);
    for (const d of this.dust) {
      const a = d.alpha * (0.6 + 0.4 * Math.sin(time * 0.8 + d.phase)) * vis;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawGalaxy(fx: number, fy: number, zoom: number, time: number, vis: number) {
    const { ctx, width: w, height: h } = this;
    const R = Math.min(w, h) * (this.compact ? 0.62 : 0.5) * (0.7 + zoom * 0.3) * 1.4;
    const tilt = -0.38;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const flatten = 0.42;

    // Núcleo luminoso
    const core = ctx.createRadialGradient(fx, fy, 0, fx, fy, R * 0.45);
    core.addColorStop(0, rgba(C.champagne, 0.35 * Math.min(1, vis)));
    core.addColorStop(0.3, rgba(C.amber, 0.18 * Math.min(1, vis)));
    core.addColorStop(1, rgba(C.rust, 0));
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    ctx.fillStyle = core;
    ctx.fillRect(fx - R, fy - R, R * 2, R * 2);

    let lastColor = -1;
    for (const g of this.galaxy) {
      if (g.color !== lastColor) {
        ctx.fillStyle = rgba(GALAXY_COLORS[g.color], 1);
        lastColor = g.color;
      }
      // Rotação diferencial: o centro gira mais rápido que as bordas.
      const ang = g.theta + time * (0.05 / (0.25 + g.r));
      const lx = Math.cos(ang) * g.r * R;
      const ly = Math.sin(ang) * g.r * R * flatten;
      const x = fx + lx * cosT - ly * sinT;
      const y = fy + lx * sinT + ly * cosT;
      ctx.globalAlpha = clamp(g.alpha * vis, 0, 1);
      ctx.fillRect(x, y, g.size, g.size);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawNameParticles(time: number) {
    const ctx = this.ctx;
    for (const n of this.nameParticles) {
      if (n.alpha <= 0.01) continue;
      const tw = 0.75 + 0.25 * Math.sin(time * 2.2 + n.phase);
      const d = n.size * 6;
      ctx.globalAlpha = n.alpha * tw;
      ctx.drawImage(this.sprites.get(n.size > 2 ? 'champagne' : 'gold')!, n.x - d / 2, n.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  private drawMeteors() {
    const ctx = this.ctx;
    for (const m of this.meteors) {
      const k = m.life / m.maxLife;
      const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      const speed = Math.hypot(m.vx, m.vy);
      const tx = m.x - (m.vx / speed) * m.length;
      const ty = m.y - (m.vy / speed) * m.length;
      const grd = ctx.createLinearGradient(m.x, m.y, tx, ty);
      grd.addColorStop(0, rgba(C.ivory, 0.95 * fade));
      grd.addColorStop(0.25, rgba(C.champagne, 0.55 * fade));
      grd.addColorStop(1, rgba(C.amber, 0));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grd;
      ctx.lineWidth = m.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      const d = m.width * 10;
      ctx.globalAlpha = fade;
      ctx.drawImage(this.sprites.get('ivory')!, m.x - d / 2, m.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  private drawSparks() {
    const ctx = this.ctx;
    for (const sp of this.sparks) {
      const k = sp.life / sp.maxLife;
      const d = sp.size * 6 * (1 - k * 0.5);
      ctx.globalAlpha = (1 - k) * (1 - k);
      ctx.drawImage(this.sprites.get(sp.sprite)!, sp.x - d / 2, sp.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }
}
