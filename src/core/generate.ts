import { add2 } from "@thi.ng/vectors/add";
import { mixN2 } from "@thi.ng/vectors/mixn";
import { normalize2 } from "@thi.ng/vectors/normalize";
import { randMinMax2 } from "@thi.ng/vectors/rand-minmax";
import { sub2 } from "@thi.ng/vectors/sub";
import { resolveArtConfig, type ArtConfig, type ParticleConfig } from "./config.ts";
import {
	createRng,
	rngSnapshot,
	type Rng,
	type Seed128,
} from "./rng.ts";
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
		rngState: rngSnapshot(rng),
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
		rngState: rngSnapshot(rng),
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
		normalize2(null, sub2(targetDir, point, pos), speed);
	}
	mixN2(null, tail[0], pos, smooth);
	for (let i = 1; i < tail.length; i++) {
		mixN2(null, tail[i], tail[i - 1], smooth);
	}
	normalize2(null, mixN2(null, dir, targetDir, 0.1), speed);
	add2(null, pos, dir);
};

const pointInside = ({ pos, size }: Rect, point: Vec2): boolean =>
	point[0] >= pos[0] &&
	point[0] <= pos[0] + size[0] &&
	point[1] >= pos[1] &&
	point[1] <= pos[1] + size[1];

const scatter = (bounds: Rect, rng: Rng): Vec2 => {
	const max: Vec2 = [
		bounds.pos[0] + bounds.size[0],
		bounds.pos[1] + bounds.size[1],
	];
	while (true) {
		const point = randMinMax2([], bounds.pos, max, rng) as Vec2;
		if (pointInside(bounds, point)) return point;
	}
};
