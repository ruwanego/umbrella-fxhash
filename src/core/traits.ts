import { resolveArtConfig, type ArtConfig, type ThemeId } from "./config.ts";

export interface ArtTraits {
	theme: ThemeId;
	depth: number;
	particles: number;
}

export const traitsForConfig = (config: ArtConfig): ArtTraits => {
	const resolved = resolveArtConfig(config);
	return {
		theme: resolved.themeId,
		depth: resolved.maxDepth,
		particles: resolved.particles.length,
	};
};
