import { useEffect, useRef } from 'react';
// import { useJoystickControls } from "ecctrl";
// import { useFrame } from '@react-three/fiber';

export function useKeyboardControls() {

const movement = useRef({ 
	forward: false, 
	backward: false, 
	left: false, 
	right: false,
	shift: false,
	space: false,
	mouseDown: false,
	respawn: false
});
const spacebarDebounceTime = 100; // Adjust this value as needed
let lastSpacebarTime = 0;

useEffect(() => {
	const handleKeyDown = (e: KeyboardEvent) => {
	let element = e.target;
	// if the element is an input, dont move
	if ((element as HTMLElement).tagName === 'INPUT' || (element as HTMLElement).tagName === 'TEXTAREA') return;
	if (e.key === 'w' || e.key === 'W' && ! movement.current.forward) movement.current.forward = true;
	else if (e.key === 's' || e.key === 'S' && ! movement.current.backward) movement.current.backward = true;
	else if (e.key === 'a' || e.key === 'A' && ! movement.current.left) movement.current.left = true;
	else if (e.key === 'd' || e.key === 'D' && ! movement.current.right) movement.current.right = true;
	else if (e.code === 'Space') {
		const currentTime = Date.now();
		if (currentTime - lastSpacebarTime > spacebarDebounceTime) {
			movement.current.space = true;
			lastSpacebarTime = currentTime;
		}
	}	
	else if (e.key === 'Shift') movement.current.shift = true;
	else if (e.key === 'r' || e.key === 'R'){
		if (e.metaKey || e.ctrlKey){
		movement.current.respawn = false;
		} else {
		movement.current.respawn = true;
		}

	}      
	}

	const handleKeyUp = (e: KeyboardEvent) => {
	if (e.key === 'w' || e.key === 'W') movement.current.forward = false;
	else if (e.key === 's' || e.key === 'S') movement.current.backward = false;
	else if (e.key === 'a' || e.key === 'A') movement.current.left = false;
	else if (e.key === 'd' || e.key === 'D') movement.current.right = false;
	else if (e.code === 'Space') movement.current.space = false;
	else if (e.key === 'Shift') movement.current.shift = false;
	else if (e.key === 'r' || e.key === 'R') movement.current.respawn = false;
	}

	const handleMouseDown = (e: MouseEvent) => {
		movement.current.mouseDown = true;
	}

	const handleMouseUp = (e: MouseEvent) => {
		movement.current.mouseDown = false;
	}

	window.addEventListener('keydown', handleKeyDown);
	window.addEventListener('keyup', handleKeyUp);
	window.addEventListener('mousedown', handleMouseDown);
	window.addEventListener('mouseup', handleMouseUp);
	return () => {
	window.removeEventListener('keydown', handleKeyDown);
	window.removeEventListener('keyup', handleKeyUp);
	window.removeEventListener('mousedown', handleMouseDown);
	window.removeEventListener('mouseup', handleMouseUp);
	}
}, []);

return movement;
}
