export type Vec2 = [number, number];

export interface Rect {
	pos: Vec2;
	size: Vec2;
}

export type LineCap = "butt" | "round" | "square";

export interface SceneAttrs {
	fill?: string;
	stroke?: string;
	weight?: number;
	lineCap?: LineCap;
}

export interface Scene {
	width: number;
	height: number;
	root: GroupNode;
}

export type SceneNode = GroupNode | RectNode | PolylineNode;

export interface GroupNode {
	type: "group";
	attrs?: SceneAttrs;
	children: SceneNode[];
}

export interface RectNode {
	type: "rect";
	pos: Vec2;
	size: Vec2;
	attrs?: SceneAttrs;
}

export interface PolylineNode {
	type: "polyline";
	points: Vec2[];
	attrs?: SceneAttrs;
}

export const rect = (pos: Vec2, size: Vec2, attrs?: SceneAttrs): RectNode => ({
	type: "rect",
	pos,
	size,
	attrs,
});

export const polyline = (
	points: Vec2[],
	attrs?: SceneAttrs
): PolylineNode => ({
	type: "polyline",
	points,
	attrs,
});

export const group = (
	children: SceneNode[],
	attrs?: SceneAttrs
): GroupNode => ({
	type: "group",
	attrs,
	children,
});

export const scaleRect = ({ pos, size }: Rect, scale: Vec2): Rect => ({
	pos: [pos[0] * scale[0], pos[1] * scale[1]],
	size: [size[0] * scale[0], size[1] * scale[1]],
});

export const warpPointsToRect = (points: Vec2[], dest: Rect): Vec2[] =>
	points.map(([x, y]) => [
		dest.pos[0] + dest.size[0] * x,
		dest.pos[1] + dest.size[1] * y,
	]);

