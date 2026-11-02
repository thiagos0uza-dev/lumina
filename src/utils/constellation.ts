/**
 * Geometria da constelação L-U-I-S-A.
 *
 * Cada letra é desenhada à mão numa caixa de 50 × 100 unidades,
 * como um traçado de mapa celeste: poucas estrelas, ligadas por linhas finas.
 * `special` indica a estrela de cada letra que guarda uma mensagem.
 */

export interface Point {
  x: number;
  y: number;
}

interface LetterShape {
  char: string;
  points: Point[];
  edges: [number, number][];
  special: number;
}

export const LETTER_WIDTH = 50;
export const LETTER_HEIGHT = 100;
export const LETTER_GAP = 32;

const chain = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [i, i + 1] as [number, number]);

const LETTERS: LetterShape[] = [
  {
    char: 'L',
    points: [
      { x: 2, y: 0 },
      { x: 0, y: 48 },
      { x: 1, y: 100 },
      { x: 26, y: 98 },
      { x: 50, y: 100 },
    ],
    edges: chain(5),
    special: 2,
  },
  {
    char: 'U',
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 60 },
      { x: 10, y: 88 },
      { x: 25, y: 100 },
      { x: 40, y: 88 },
      { x: 49, y: 60 },
      { x: 50, y: 0 },
    ],
    edges: chain(7),
    special: 3,
  },
  {
    char: 'I',
    points: [
      { x: 12, y: 0 },
      { x: 25, y: 0 },
      { x: 38, y: 0 },
      { x: 25, y: 50 },
      { x: 12, y: 100 },
      { x: 25, y: 100 },
      { x: 38, y: 100 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 5],
      [4, 5],
      [5, 6],
    ],
    special: 3,
  },
  {
    char: 'S',
    points: [
      { x: 48, y: 12 },
      { x: 32, y: 0 },
      { x: 11, y: 4 },
      { x: 1, y: 22 },
      { x: 11, y: 41 },
      { x: 36, y: 55 },
      { x: 50, y: 75 },
      { x: 42, y: 94 },
      { x: 21, y: 100 },
      { x: 2, y: 89 },
    ],
    edges: chain(10),
    special: 5,
  },
  {
    char: 'A',
    points: [
      { x: 0, y: 100 },
      { x: 12, y: 54 },
      { x: 25, y: 0 },
      { x: 38, y: 54 },
      { x: 50, y: 100 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 3],
    ],
    special: 2,
  },
];

export interface WordStar extends Point {
  id: string;
  letter: number;
  /** Índice da mensagem (0–4) se esta estrela guarda uma; caso contrário, -1. */
  message: number;
}

export interface WordEdge {
  letter: number;
  from: WordStar;
  to: WordStar;
}

export interface WordLayout {
  stars: WordStar[];
  edges: WordEdge[];
  width: number;
  height: number;
}

/** Composição completa do nome em unidades de mapa (origem no canto superior esquerdo). */
export function layoutWord(): WordLayout {
  const stars: WordStar[] = [];
  const edges: WordEdge[] = [];

  LETTERS.forEach((shape, letter) => {
    const offsetX = letter * (LETTER_WIDTH + LETTER_GAP);
    const local = shape.points.map((p, i) => {
      const star: WordStar = {
        id: `${shape.char}${i}`,
        letter,
        x: offsetX + p.x,
        y: p.y,
        message: i === shape.special ? letter : -1,
      };
      stars.push(star);
      return star;
    });
    shape.edges.forEach(([a, b]) => edges.push({ letter, from: local[a], to: local[b] }));
  });

  return {
    stars,
    edges,
    width: LETTERS.length * LETTER_WIDTH + (LETTERS.length - 1) * LETTER_GAP,
    height: LETTER_HEIGHT,
  };
}

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SampledPoint extends Point {
  /** 1 = vértice (estrela principal), 0 = poeira ao longo da linha. */
  weight: number;
}

/**
 * Converte a constelação em pontos de tela dentro de `rect`, preservando a proporção.
 * Usado pela celebração final, quando as partículas se reúnem para escrever o nome.
 */
export function sampleWord(rect: ScreenRect, spacing: number): SampledPoint[] {
  const word = layoutWord();
  const scale = Math.min(rect.width / word.width, rect.height / word.height);
  const ox = rect.x + (rect.width - word.width * scale) / 2;
  const oy = rect.y + (rect.height - word.height * scale) / 2;
  const toScreen = (p: Point) => ({ x: ox + p.x * scale, y: oy + p.y * scale });

  const points: SampledPoint[] = word.stars.map((s) => ({ ...toScreen(s), weight: 1 }));

  word.edges.forEach(({ from, to }) => {
    const a = toScreen(from);
    const b = toScreen(to);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.floor(len / spacing));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, weight: 0 });
    }
  });

  return points;
}
