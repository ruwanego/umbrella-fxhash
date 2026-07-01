export interface FxProjectSDK {
	hash: string;
	preview: () => void;
	isPreview: boolean;
	features: (features: object) => void;
	getFeatures: () => Record<string, unknown>;
}

export interface FxhashContext {
	seed: string;
	isPreview: boolean;
	preview: () => void;
	features: (features: object) => void;
	getFeatures: () => Record<string, unknown>;
}

declare global {
	interface Window {
		$fx?: FxProjectSDK;
	}
}

const DEFAULT_SEED =
	"ookorwLedQrCTPesBcUPrR2oRbPHgsAxe9xgCSNq4XAuZSaCvaB";

export const readFxhash = (): FxhashContext => {
	const fx = window.$fx;
	return {
		seed: fx?.hash ?? DEFAULT_SEED,
		isPreview: fx?.isPreview ?? false,
		preview: fx?.preview ?? (() => undefined),
		features: fx?.features ?? (() => undefined),
		getFeatures: fx?.getFeatures ?? (() => ({})),
	};
};
