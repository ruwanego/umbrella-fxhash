import { FMT_yyyyMMdd_HHmmss } from "@thi.ng/date";
import { downloadCanvas, downloadWithMime } from "@thi.ng/dl-asset";
import { exposeGlobal } from "@thi.ng/expose";
import { renderSceneToCanvas } from "../adapters/canvas-renderer";
import { renderSceneToSvg } from "../adapters/svg-renderer";
import { createArtConfig, type ArtConfig } from "../core/config";
import {
	createGenerationState,
	resizeGenerationState,
	sceneFromGenerationState,
	stepGenerationState,
	type GenerationState,
} from "../core/generate";
import type { Scene } from "../core/scene";
import { traitsForConfig } from "../core/traits";
import {
	createCanvasSurface,
	currentViewport,
	type CanvasSurface,
} from "./canvas";
import { readFxhash, type FxhashContext } from "./fxhash";

const DEBUG = import.meta.env.DEV;

interface AppState {
	fxhash: FxhashContext;
	generator: GenerationState;
	scene: Scene;
	surface: CanvasSurface;
	running: boolean;
	timer: number;
}

let state: AppState | undefined;

export const startApp = () => {
	const fxhash = readFxhash();
	state = createState(fxhash);
	window.onkeydown = onKeyDown;
	window.onresize = onResize;
	fxhash.features(traitsForConfig(state.generator.config));
	update();
	fxhash.isPreview && requestAnimationFrame(fxhash.preview);
	DEBUG && console.log(fxhash.seed, fxhash.getFeatures());
	DEBUG && exposeGlobal("state", state);
};

const createState = (fxhash: FxhashContext): AppState => {
	const config = createConfig(fxhash.seed, 0);
	const generator = createGenerationState(config);
	const surface = createSurface(config);
	return {
		fxhash,
		generator,
		scene: sceneFromGenerationState(generator),
		surface,
		running: true,
		timer: 0,
	};
};

const createConfig = (seed: string, frame: number): ArtConfig => {
	const viewport = currentViewport();
	return createArtConfig({
		seed,
		viewportWidth: viewport.width,
		viewportHeight: viewport.height,
		dpr: viewport.dpr,
		frame,
	});
};

const createSurface = (config: ArtConfig): CanvasSurface =>
	createCanvasSurface({
		width: config.viewportWidth - 2 * config.margin,
		height: config.viewportHeight - 2 * config.margin,
		dpr: config.dpr,
	});

const update = () => {
	if (!state) return;
	state.generator = stepGenerationState(state.generator);
	state.scene = sceneFromGenerationState(state.generator);
	renderSceneToCanvas(state.surface.ctx, state.scene);
	if (state.running) {
		state.timer = requestAnimationFrame(update);
	}
};

const onResize = () => {
	if (!state) return;
	cancelAnimationFrame(state.timer);
	const config = createConfig(state.fxhash.seed, state.generator.frame);
	state.generator = resizeGenerationState(state.generator, config);
	state.surface = createSurface(config);
	update();
};

const onKeyDown = (event: KeyboardEvent) => {
	if (!state) return;
	switch (event.key) {
		case " ":
			state.running = !state.running;
			state.running && update();
			break;
		case "x":
			downloadCanvas(state.surface.canvas, `fxhash-${FMT_yyyyMMdd_HHmmss()}`);
			break;
		case "s":
			downloadWithMime(
				`fxhash-${FMT_yyyyMMdd_HHmmss()}.svg`,
				renderSceneToSvg(state.scene),
				{ mime: "image/svg+xml" }
			);
			break;
	}
};
