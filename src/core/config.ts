import { randNorm2 } from "@thi.ng/vectors/rand-norm";
import { createRng, pick, weightedKey, type Rng } from "./rng.ts";
import type { Rect, Vec2 } from "./scene.ts";

export const THEMES = {
	cold: { bg: "#09c", fg: ["#fff", "#8ff", "#80f"] },
	dark: { bg: "#333", fg: ["#ff0", "#0f0", "#0ff"] },
	hot: { bg: "#f80", fg: ["#f0c", "#ff0", "#fcc", "#0ff", "#433"] },
	mono: { bg: "#000", fg: ["#fff", "#aaa", "#555", "#333"] },
} as const;

export type ThemeId = keyof typeof THEMES;

export interface Theme {
	bg: string;
	fg: readonly string[];
}

export interface ArtConfig {
	seed: string;
	viewportWidth: number;
	viewportHeight: number;
	dpr: number;
	frame: number;
	margin: number;
}

export interface ParticleConfig {
	color: string;
	speed: number;
	smooth: number;
	thick: number;
	tailLength: number;
	pos: Vec2;
	dir: Vec2;
	targetDir: Vec2;
	tail: Vec2[];
}

export interface ResolvedArtConfig extends ArtConfig {
	width: number;
	height: number;
	scaledSize: Vec2;
	aspect: number;
	themeId: ThemeId;
	theme: Theme;
	strokeWeight: number;
	minMaxSpeed: [number, number];
	minMaxSmooth: [number, number];
	minMaxTail: [number, number];
	maxDepth: number;
	clusterScale: number;
	cells: Rect[];
	particles: ParticleConfig[];
}

export const createArtConfig = (
	config: Partial<ArtConfig> &
		Pick<ArtConfig, "seed" | "viewportWidth" | "viewportHeight">
): ArtConfig => ({
	dpr: 1,
	frame: 1,
	margin: 10,
	...config,
});

export const resolveArtConfig = (
	config: ArtConfig,
	rng: Rng = createRng(config.seed)
): ResolvedArtConfig => {
	const minMaxSpeed: [number, number] = [0.002, 0.004];
	const minMaxSmooth: [number, number] = [1 / 10, 1 / 3];
	const minMaxTail: [number, number] = [10, 20];
	const themeId = weightedKey(
		{
			cold: 3,
			dark: 1,
			hot: 4,
			mono: 2,
		},
		rng
	) as ThemeId;
	const theme = THEMES[themeId];
	const strokeWeight = { cold: 10, dark: 30, hot: 40, mono: 20 }[themeId];
	const maxDepth = rng.probability(0.8) ? 4 : 3;
	const clusterScale = maxDepth > 3 ? 4 : 5;
	const cells = subdivideGrid(maxDepth, rng);
	const particles = createParticles(
		rng,
		cells.length << clusterScale,
		minMaxSpeed,
		minMaxSmooth,
		minMaxTail,
		strokeWeight,
		theme
	);
	const width = config.viewportWidth - 2 * config.margin;
	const height = config.viewportHeight - 2 * config.margin;
	return {
		...config,
		width,
		height,
		scaledSize: [width * config.dpr, height * config.dpr],
		aspect: width / height,
		themeId,
		theme,
		strokeWeight,
		minMaxSpeed,
		minMaxSmooth,
		minMaxTail,
		maxDepth,
		clusterScale,
		cells,
		particles,
	};
};

const subdivideGrid = (maxDepth: number, rng: Rng): Rect[] => {
	const subdiv = (cell: Rect, acc: Rect[], depth: number): Rect[] => {
		if (depth >= maxDepth) {
			acc.push(cell);
			return acc;
		}
		const t = rng.minmax(0.25, 0.75);
		const [w, h] = cell.size;
		const nextDepth = depth + 1;
		if (nextDepth & 1) {
			subdiv({ pos: cell.pos, size: [w * t, h] }, acc, nextDepth);
			subdiv(
				{
					pos: [cell.pos[0] + w * t, cell.pos[1]],
					size: [w * (1 - t), h],
				},
				acc,
				nextDepth
			);
		} else {
			subdiv({ pos: cell.pos, size: [w, h * t] }, acc, nextDepth);
			subdiv(
				{
					pos: [cell.pos[0], cell.pos[1] + h * t],
					size: [w, h * (1 - t)],
				},
				acc,
				nextDepth
			);
		}
		return acc;
	};
	return subdiv({ pos: [0, 0], size: [1, 1] }, [], 0);
};

const createParticles = (
	rng: Rng,
	count: number,
	minMaxSpeed: [number, number],
	minMaxSmooth: [number, number],
	minMaxTail: [number, number],
	strokeWeight: number,
	theme: Theme
): ParticleConfig[] =>
	Array.from({ length: count }, () => {
		const color = pick([...theme.fg], rng);
		const speed = rng.minmax(...minMaxSpeed);
		const smooth = rng.minmax(...minMaxSmooth);
		const thick = rng.minmax(0.5, 1) ** 1.5 * strokeWeight;
		const tailLength = rng.minmaxInt(...minMaxTail);
		const pos: Vec2 = [rng.minmax(0, 1), rng.minmax(0, 1)];
		const dir = randNorm2([], speed, rng) as Vec2;
		const targetDir = randNorm2([], speed, rng) as Vec2;
		const tail = Array.from({ length: tailLength }, () => [...pos] as Vec2);
		return {
			color,
			speed,
			smooth,
			thick,
			tailLength,
			pos,
			dir,
			targetDir,
			tail,
		};
	});
