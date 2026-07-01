import { B58_CHARS_LC } from "@thi.ng/base-n/chars/58";
import { pickRandom } from "@thi.ng/random/pick-random";
import { SFC32 } from "@thi.ng/random/sfc32";
import { weightedRandomKey } from "@thi.ng/random/weighted-random";

const DEFAULT_SEED: Seed128 = [0x6d2b79f5, 0x1b56c4e9, 0x85ebca6b, 0xc2b2ae35];

export type Seed128 = [number, number, number, number];

export type Rng = SFC32;

export const seedFromHash = (hash: string): Seed128 => {
	const src = hash.length > 2 ? hash.slice(2) : hash;
	const chunk = src.length >> 2;
	if (chunk <= 0) return [...DEFAULT_SEED];
	const seed = src.match(new RegExp(`.{${chunk}}`, "g"))?.slice(0, 4);
	if (!seed || seed.length < 4) return [...DEFAULT_SEED];
	return seed.map((part) =>
		[...part].reduce(
			(acc, char) => (acc * 58 + B58_CHARS_LC.indexOf(char)) >>> 0,
			0
		)
	) as Seed128;
};

export const createRng = (seed: string | Seed128): Rng =>
	new SFC32(typeof seed === "string" ? seedFromHash(seed) : seed);

export const rngSnapshot = (rng: Rng): Seed128 => [
	rng.buffer[0],
	rng.buffer[1],
	rng.buffer[2],
	rng.buffer[3],
];

export const pick = <T>(choices: T[], rng: Rng): T =>
	pickRandom(choices, rng);

export const weightedKey = <T extends Record<string, number>>(
	weights: T,
	rng: Rng
): keyof T => weightedRandomKey(weights, rng)();
