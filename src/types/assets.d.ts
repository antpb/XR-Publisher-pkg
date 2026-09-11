declare module '*.glsl' {
	const content: string;
	export default content;
}

declare module '*.glb' {
	const src: string;
	export default src;
}

declare module '*.vrm' {
	const src: string;
	export default src;
}

declare module '*.fbx' {
	const src: string;
	export default src;
}

declare module '*.png' {
	const src: string;
	export default src;
}

declare module '*.jpg' {
	const src: string;
	export default src;
}

declare module '*.svg' {
	const src: string;
	export default src;
}

declare module '*.woff' {
	const src: string;
	export default src;
}

// Vite's `?worker&inline` query: the module's default export is a
// zero-arg constructor that returns a live Web Worker instance.
declare module '*?worker&inline' {
	const WorkerFactory: new () => Worker;
	export default WorkerFactory;
}
