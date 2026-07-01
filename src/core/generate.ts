import { resolveArtConfig, type ArtConfig, type ParticleConfig } from "./config.ts";
import { createRng, type Rng, type Seed128 } from "./rng.ts";
import {
	group,
	polyline,
	rect,
	scaleRect,
	warpPointsToRect,
	type Rect,
	type Scene,
	type Vec2,
} from "./scene.ts";

const PARTICLE_BOUNDS: Rect = {
	pos: [0.15, 0.15],
	size: [0.7, 0.7],
};

export interface GenerationState {
	config: ArtConfig;
	resolved: ReturnType<typeof resolveArtConfig>;
	particles: ParticleConfig[];
	rngState: Seed128;
	frame: number;
}

export const createGenerationState = (config: ArtConfig): GenerationState => {
	const rng = createRng(config.seed);
	const resolved = resolveArtConfig(config, rng);
	return {
		config,
		resolved,
		particles: resolved.particles.map(cloneParticle),
		rngState: rng.snapshot(),
		frame: 0,
	};
};

export const resizeGenerationState = (
	state: GenerationState,
	config: ArtConfig
): GenerationState => ({
	...state,
	config,
	resolved: resolveArtConfig(config),
});

export const stepGenerationState = (
	state: GenerationState
): GenerationState => {
	const rng = createRng(state.rngState);
	const particles = state.particles.map(cloneParticle);
	for (const particle of particles) updateParticle(particle, rng);
	const frame = state.frame + 1;
	return {
		...state,
		config: { ...state.config, frame },
		particles,
		rngState: rng.snapshot(),
		frame,
	};
};

export const sceneFromGenerationState = (state: GenerationState): Scene => {
	const { resolved, particles } = state;
	const cells = resolved.cells.map((cell) => {
		const scaled = scaleRect(cell, resolved.scaledSize);
		return rect(scaled.pos, scaled.size);
	});
	const particleLines = particles.map((particle, index) => {
		const dest = scaleRect(
			resolved.cells[index >> resolved.clusterScale],
			resolved.scaledSize
		);
		return polyline(warpPointsToRect(particle.tail, dest), {
			fill: "none",
			stroke: particle.color,
			weight: particle.thick,
		});
	});
	return {
		width: resolved.scaledSize[0],
		height: resolved.scaledSize[1],
		root: group(
			[
				rect([0, 0], resolved.scaledSize, { fill: resolved.theme.bg }),
				group(cells, { stroke: "#fff", fill: "none" }),
				...particleLines,
			],
			{ lineCap: "round" }
		),
	};
};

export const generate = (config: ArtConfig): Scene => {
	let state = createGenerationState(config);
	for (let i = 0; i < config.frame; i++) {
		state = stepGenerationState(state);
	}
	return sceneFromGenerationState(state);
};

const cloneParticle = (particle: ParticleConfig): ParticleConfig => ({
	...particle,
	pos: [...particle.pos],
	dir: [...particle.dir],
	targetDir: [...particle.targetDir],
	tail: particle.tail.map((point) => [...point]),
});

const updateParticle = (particle: ParticleConfig, rng: Rng) => {
	const { pos, dir, targetDir, speed, smooth, tail } = particle;
	if (rng.probability(0.005) || !pointInside(PARTICLE_BOUNDS, pos)) {
		const point = scatter(PARTICLE_BOUNDS, rng);
		const next: Vec2 = [point[0] - pos[0], point[1] - pos[1]];
		const mag = Math.sqrt(next[0] * next[0] + next[1] * next[1]);
		targetDir[0] = next[0];
		targetDir[1] = next[1];
		if (mag >= 1e-6) {
			targetDir[0] = (next[0] * speed) / mag;
			targetDir[1] = (next[1] * speed) / mag;
		}
	}
	tail[0] = mix2(tail[0], pos, smooth);
	for (let i = 1; i < tail.length; i++) {
		tail[i] = mix2(tail[i], tail[i - 1], smooth);
	}
	const mixed = mix2(dir, targetDir, 0.1);
	const mag = Math.sqrt(mixed[0] * mixed[0] + mixed[1] * mixed[1]);
	dir[0] = mixed[0];
	dir[1] = mixed[1];
	if (mag >= 1e-6) {
		dir[0] = (mixed[0] * speed) / mag;
		dir[1] = (mixed[1] * speed) / mag;
	}
	pos[0] += dir[0];
	pos[1] += dir[1];
};

const pointInside = ({ pos, size }: Rect, point: Vec2): boolean =>
	point[0] >= pos[0] &&
	point[0] <= pos[0] + size[0] &&
	point[1] >= pos[1] &&
	point[1] <= pos[1] + size[1];

const scatter = (bounds: Rect, rng: Rng): Vec2 => {
	while (true) {
		const point: Vec2 = [
			rng.minmax(bounds.pos[0], bounds.pos[0] + bounds.size[0]),
			rng.minmax(bounds.pos[1], bounds.pos[1] + bounds.size[1]),
		];
		if (pointInside(bounds, point)) return point;
	}
};

const mix2 = (a: Vec2, b: Vec2, t: number): Vec2 => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
];
