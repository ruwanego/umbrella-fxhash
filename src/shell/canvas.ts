export interface CanvasSurface {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
}

export interface CanvasSurfaceOptions {
	mountId?: string;
	canvasId?: string;
	width: number;
	height: number;
	dpr: number;
}

export const createCanvasSurface = ({
	mountId = "app",
	canvasId = "main",
	width,
	height,
	dpr,
}: CanvasSurfaceOptions): CanvasSurface => {
	const mount = document.getElementById(mountId);
	if (!mount) throw new Error(`Missing #${mountId}`);
	let canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = canvasId;
		mount.appendChild(canvas);
	}
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("2D context unavailable");
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.dataset.origWidth = String(width);
	canvas.dataset.origHeight = String(height);
	canvas.dataset.dpr = String(dpr);
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	return { canvas, ctx };
};

export const currentViewport = () => ({
	width: window.innerWidth,
	height: window.innerHeight,
	dpr: window.devicePixelRatio || 1,
});

