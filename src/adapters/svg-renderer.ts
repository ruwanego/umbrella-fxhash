import type { Scene, SceneAttrs, SceneNode } from "../core/scene";

export const renderSceneToSvg = (scene: Scene): string =>
	[
		`<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}">`,
		renderNode(scene.root, {}),
		"</svg>",
	].join("");

const renderNode = (node: SceneNode, inherited: SceneAttrs): string => {
	const attrs = { ...inherited, ...node.attrs };
	switch (node.type) {
		case "group":
			return `<g${attrsToSvg(attrs)}>${node.children
				.map((child) => renderNode(child, attrs))
				.join("")}</g>`;
		case "rect":
			return `<rect x="${node.pos[0]}" y="${node.pos[1]}" width="${node.size[0]}" height="${node.size[1]}"${attrsToSvg(attrs)}/>`;
		case "polyline":
			return `<polyline points="${node.points
				.map(([x, y]) => `${x},${y}`)
				.join(" ")}"${attrsToSvg(attrs)}/>`;
	}
};

const attrsToSvg = (attrs: SceneAttrs): string => {
	const result: string[] = [];
	if (attrs.fill) result.push(`fill="${escapeAttr(attrs.fill)}"`);
	if (attrs.stroke) result.push(`stroke="${escapeAttr(attrs.stroke)}"`);
	if (attrs.weight != null) result.push(`stroke-width="${attrs.weight}"`);
	if (attrs.lineCap) result.push(`stroke-linecap="${attrs.lineCap}"`);
	return result.length ? ` ${result.join(" ")}` : "";
};

const escapeAttr = (value: string): string =>
	value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

