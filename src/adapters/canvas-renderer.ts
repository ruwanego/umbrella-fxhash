import type { Scene, SceneAttrs, SceneNode } from "../core/scene";

export const renderSceneToCanvas = (
	ctx: CanvasRenderingContext2D,
	scene: Scene
) => {
	for (const child of scene.root.children) {
		renderNode(ctx, child, scene.root.attrs ?? {});
	}
};

const renderNode = (
	ctx: CanvasRenderingContext2D,
	node: SceneNode,
	inherited: SceneAttrs
) => {
	const attrs = { ...inherited, ...node.attrs };
	switch (node.type) {
		case "group":
			for (const child of node.children) renderNode(ctx, child, attrs);
			break;
		case "rect":
			applyAttrs(ctx, attrs);
			if (attrs.fill && attrs.fill !== "none") {
				ctx.fillRect(node.pos[0], node.pos[1], node.size[0], node.size[1]);
			}
			if (attrs.stroke && attrs.stroke !== "none") {
				ctx.strokeRect(node.pos[0], node.pos[1], node.size[0], node.size[1]);
			}
			break;
		case "polyline":
			if (node.points.length < 2 || !attrs.stroke || attrs.stroke === "none") {
				return;
			}
			applyAttrs(ctx, attrs);
			ctx.beginPath();
			ctx.moveTo(node.points[0][0], node.points[0][1]);
			for (let i = 1; i < node.points.length; i++) {
				ctx.lineTo(node.points[i][0], node.points[i][1]);
			}
			ctx.stroke();
			break;
	}
};

const applyAttrs = (
	ctx: CanvasRenderingContext2D,
	attrs: SceneAttrs
) => {
	if (attrs.fill) ctx.fillStyle = attrs.fill;
	if (attrs.stroke) ctx.strokeStyle = attrs.stroke;
	if (attrs.weight != null) ctx.lineWidth = attrs.weight;
	if (attrs.lineCap) ctx.lineCap = attrs.lineCap;
};

