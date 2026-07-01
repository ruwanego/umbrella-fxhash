import assert from "node:assert/strict";
import test from "node:test";
import { createArtConfig } from "../core/config.ts";
import { generate } from "../core/generate.ts";

const baseConfig = createArtConfig({
	seed: `oo${"1".repeat(49)}`,
	viewportWidth: 1024,
	viewportHeight: 768,
	dpr: 1,
	frame: 24,
});

test("same config gives identical scene JSON", () => {
	const first = JSON.stringify(generate(baseConfig));
	const second = JSON.stringify(generate(baseConfig));
	assert.equal(second, first);
});

test("different seed gives different scene JSON", () => {
	const first = JSON.stringify(generate(baseConfig));
	const second = JSON.stringify(
		generate({
			...baseConfig,
			seed: `oo${"2".repeat(49)}`,
		})
	);
	assert.notEqual(second, first);
});

