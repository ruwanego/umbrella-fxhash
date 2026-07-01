const B58 =
	"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const DEFAULT_SEED: Seed128 = [0x6d2b79f5, 0x1b56c4e9, 0x85ebca6b, 0xc2b2ae35];

export type Seed128 = [number, number, number, number];

export interface Rng {
	int(): number;
	float(norm?: number): number;
	probability(p: number): boolean;
	minmax(min: number, max: number): number;
	minmaxInt(min: number, max: number): number;
	snapshot(): Seed128;
}

export const seedFromHash = (hash: string): Seed128 => {
	const src = hash.length > 2 ? hash.slice(2) : hash;
	const chunk = src.length >> 2;
	if (chunk <= 0) return [...DEFAULT_SEED];
	const seed = src.match(new RegExp(`.{${chunk}}`, "g"))?.slice(0, 4);
	if (!seed || seed.length < 4) return [...DEFAULT_SEED];
	return seed.map((part) =>
		[...part].reduce((acc, char) => (acc * 58 + B58.indexOf(char)) >>> 0, 0)
	) as Seed128;
};

export const createRng = (seed: string | Seed128): Rng => {
	const state =
		typeof seed === "string" ? new Uint32Array(seedFromHash(seed)) : new Uint32Array(seed);
	return {
		int() {
			const t = (((state[0] + state[1]) >>> 0) + state[3]) >>> 0;
			state[3] = (state[3] + 1) >>> 0;
			state[0] = state[1] ^ (state[1] >>> 9);
			state[1] = (state[2] + (state[2] << 3)) >>> 0;
			state[2] = (((state[2] << 21) | (state[2] >>> 11)) + t) >>> 0;
			return t;
		},
		float(norm = 1) {
			return this.int() * (1 / 2 ** 32) * norm;
		},
		probability(p: number) {
			return this.float() < p;
		},
		minmax(min: number, max: number) {
			return this.float() * (max - min) + min;
		},
		minmaxInt(min: number, max: number) {
			const start = min | 0;
			const range = (max | 0) - start;
			return range ? start + (this.int() % range) : start;
		},
		snapshot() {
			return [state[0], state[1], state[2], state[3]];
		},
	};
};

export const pick = <T>(choices: T[], rng: Rng): T =>
	choices[rng.minmax(0, choices.length) | 0];

export const weightedKey = <T extends Record<string, number>>(
	weights: T,
	rng: Rng
): keyof T => {
	const ranked = Object.keys(weights)
		.map((key) => [weights[key], key] as const)
		.sort((a, b) => b[0] - a[0]);
	const total = ranked.reduce((sum, [weight]) => sum + weight, 0);
	const threshold = rng.float(total);
	let remaining = total;
	for (const [weight, key] of ranked) {
		remaining -= weight;
		if (remaining <= threshold) return key;
	}
	return ranked[ranked.length - 1][1];
};
