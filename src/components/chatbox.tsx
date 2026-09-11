import React, { useState, useEffect, useRef } from 'react';
import { Send, Minimize2, Maximize2, X as CloseIcon } from 'lucide-react';
import useInteractionStore from '../stores/interactionStore';
import useNpcMessageStore from '../stores/npcMessageStore';
import { getApiBase } from '../config/apiConfig';
import { getWorldIdentity } from '../editor/worldTokenClient';

function generateRoomIdFromPath(path: string): string {
  if (!path || typeof path !== 'string') return 'default';
  const cleanPath = path.replace(/^\/+|\/+$/g, '').split('?')[0];

  // if cleanPath is empty, return default room ID
  if (!cleanPath) return 'default';
  return cleanPath.replace(/\//g, '-').toLowerCase();
}

interface Message {
  sender: string;
  text: string;
  timestamp: string;
  error?: boolean;
}

interface ChatBoxProps {
  name?: string;
  defaultMessage?: string;
  personality?: string;
  objectsInRoom?: string[];
  objectAwareness?: string;
  showUI?: boolean;
  initializing?: boolean;
}

/**
 * Mounts ChatBox only while interacting with an NPC. This component owns the
 * interaction-store subscription so that EnvironmentFront does NOT — when
 * EnvironmentFront subscribed directly, pressing E re-rendered the entire
 * Canvas/world tree (the "frame drop on interact" bug).
 */
export function NPCChatGate({
	objectsInRoom = [],
	showUI = true,
	initializing = false
}: {
	objectsInRoom?: string[];
	showUI?: boolean;
	initializing?: boolean;
}) {
	const interactingNpcName = useInteractionStore((s: any) =>
		s.isInteracting && s.interactingWith?.type === 'npc' ? (s.interactingWith?.name || 'NPC') : null
	);
	if (!interactingNpcName) return null;
	return (
		<ChatBox
			name={interactingNpcName}
			personality={''}
			defaultMessage={''}
			objectAwareness={''}
			objectsInRoom={objectsInRoom}
			showUI={showUI}
			initializing={initializing}
		/>
	);
}

export default function ChatBox({
	name = "Assistant",
	personality,
	objectsInRoom = [],
	objectAwareness = "0",
	initializing = false
  }: ChatBoxProps) {
	const [input, setInput] = useState<string>('');
	const [isOpen, setIsOpen] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [currentRoomId] = useState<string>(() =>
	  generateRoomIdFromPath(window.location.pathname)
	);
	const MAX_RETRIES = 2;
	const [sessionData, setSessionData] = useState<{
	  sessionId: string | null;
	  nonce: string | null;
	}>({ sessionId: null, nonce: null });
	// Selectors, not whole-store destructure — a whole-store subscribe
	// re-renders on every store write.
	const stopInteraction = useInteractionStore((s: any) => s.stopInteraction);
	const messages = useNpcMessageStore((s) => s.messages);
	const addMessage = useNpcMessageStore((s) => s.addMessage);
  
	const initializeSession = async () => {
	  try {
		// Character records live under the world author's namespace on the
		// same API worker that serves the world.
		const response = await fetch(`${getApiBase()}/api/character/session`, {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({
			author: getWorldIdentity().author,
			name: name,
			personality: personality,
			roomId: currentRoomId
		  })
		});
  
		const data = await response.json();
		if (!data.error) {
		  // Wait for session state to be updated
		  await new Promise<void>(resolve => {
			setSessionData({
			  sessionId: data.sessionId,
			  nonce: data.nonce
			});
			setTimeout(resolve, 0);
		  });
		  return data;
		}
		throw new Error(data.error);
	  } catch (error) {
		console.error('Session initialization error:', error);
		return null;
	  }
	};
  
	useEffect(() => {
	  if (!sessionData.sessionId || !sessionData.nonce) {
		initializeSession();
	  }
	}, [name]);
  
	const sendMessage = async (userMessage: Message, retryAttempt: number = 0): Promise<any> => {
		if (retryAttempt >= MAX_RETRIES) {
		  throw new Error('Maximum retry attempts reached');
		}
	  
		try {
		  const currentSession = sessionData;
		  if (!currentSession.sessionId || !currentSession.nonce) {
			const newSession = await initializeSession();
			if (!newSession) {
			  throw new Error('No valid session');
			}
			// Wait for session update
			await new Promise<void>(resolve => {
			  setSessionData({
				sessionId: newSession.sessionId,
				nonce: newSession.nonce
			  });
			  setTimeout(resolve, 0);
			});
			return sendMessage(userMessage, retryAttempt + 1);
		  }
	  
		  const response = await fetch(`${getApiBase()}/api/character/message`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
			  roomId: currentRoomId,
			  sessionId: currentSession.sessionId,
			  message: userMessage.text,
			  nonce: currentSession.nonce,
			  context: objectAwareness === "1" ? { objectsInRoom } : undefined
			})
		  });
	  
		  const data = await response.json();
	  
		  if (data.error) {
			if (data.code === 'SESSION_EXPIRED' || data.error.includes('Invalid or expired nonce')) {
			  const newSession = await initializeSession();
			  if (!newSession) {
				throw new Error('Failed to initialize new session');
			  }
			  return sendMessage(userMessage, retryAttempt + 1);
			}
			throw new Error(data.error);
		  }
	  
		  // Important: Update session data with both sessionId and nonce
		  if (data.sessionId || data.nonce) {
			await new Promise<void>(resolve => {
			  setSessionData(current => ({
				sessionId: data.sessionId || current.sessionId,
				nonce: data.nonce || current.nonce
			  }));
			  setTimeout(resolve, 0);
			});
		  }
	  
		  return data;
	  
		} catch (error) {
		  if (retryAttempt >= MAX_RETRIES) {
			throw error;
		  }
		  return sendMessage(userMessage, retryAttempt + 1);
		}
	  };
	  
	
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
	  e.preventDefault();
	  if (isLoading || !input.trim()) return;
	
	  const userMessage: Message = {
		sender: 'You',
		text: input.trim(),
		timestamp: new Date().toISOString()
	  };
	
	  addMessage(userMessage);
	  setInput('');
	  setIsLoading(true);
	
	  try {
		// Ensure we have a valid session
		if (!sessionData.sessionId || !sessionData.nonce) {
		  const newSession = await initializeSession();
		  setSessionData(newSession => ({
			sessionId: newSession.sessionId,
			nonce: newSession.nonce
		  }));
		  if (!newSession) {
			throw new Error('Failed to initialize session');
		  }
		}
	
		const data = await sendMessage(userMessage);
		
		const assistantMessage: Message = {
		  sender: name,
		  text: data.text,
		  timestamp: new Date().toISOString()
		};

		addMessage(assistantMessage);
	  } catch (error) {
		console.error('Chat error:', error);
		addMessage({
		  sender: 'System',
		  text: (error as any).message === 'Maximum retry attempts reached'
			? 'Connection error. Please refresh the page and try again.'
			: 'Sorry, I encountered an error. Please try again.',
		  timestamp: new Date().toISOString(),
		  error: true
		});
	
		// Reset session on terminal errors
		if ((error as any).message === 'Maximum retry attempts reached') {
		  setSessionData({ sessionId: null, nonce: null });
		}
	  } finally {
		setIsLoading(false);
		inputRef.current?.focus();
	  }
	};
			  
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOpen(prev => !prev);
	};

	const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		// Stop interaction and close UI
		stopInteraction();
		setIsOpen(false);
	};

	// pointerdown/mousedown must not escape the chat — they bubble to the
	// canvas container's requestPointerLock handler, which would pointer-lock
	// the chat input on click (Element.prototype.requestPointerLock exists on
	// every element, so the container's typeof guard passes).
	return (
		<div
			className={`absolute bottom-20 right-4 w-96 rounded-lg shadow-xl bg-gray-900/95 backdrop-blur border border-gray-800
    transition-all duration-200 ease-in-out ${isOpen ? 'h-[500px]' : 'h-14'}`}
			style={{ zIndex: 9999, pointerEvents: 'auto' }}
			onClick={e => e.stopPropagation()}
			onPointerDown={e => e.stopPropagation()}
			onMouseDown={e => e.stopPropagation()}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-800">
				<h3 className="text-lg font-semibold text-white">{name}</h3>
				<div className="flex items-center gap-2">
					<button
						onClick={handleToggle}
						className="p-1 hover:bg-gray-800 rounded transition-colors"
					>
						{isOpen ? (
							<Minimize2 className="w-5 h-5 text-gray-400" />
						) : (
							<Maximize2 className="w-5 h-5 text-gray-400" />
						)}
					</button>
					<button
						onClick={handleClose}
						className="p-1 hover:bg-red-900/40 rounded transition-colors"
						aria-label="Close chat"
					>
						<CloseIcon className="w-5 h-5 text-red-300" />
					</button>
				</div>
			</div>

			{isOpen && (
				<>
					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 h-[380px] space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
						{messages.map((message, index) => (
							<div
								key={index}
								className={`flex flex-col ${message.sender === 'You' ? 'items-end' : 'items-start'}`}
							>
								<div className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'You'
									? 'bg-purple-600 text-white'
									: message.error
										? 'bg-red-900/50 text-red-200'
										: 'bg-gray-800 text-white'
									}`}
								>
									<p className="text-sm">{message.text}</p>
								</div>
								<span className="text-xs text-gray-500 mt-1">
									{message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
								</span>
							</div>
						))}
						{isLoading && (
							<div className="flex space-x-2 items-center text-gray-400">
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
								<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:400ms]" />
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input */}
					<form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
						<div className="flex space-x-2">
							<input
								ref={inputRef}
								type="text"
								value={input}
								onChange={handleChange}
								placeholder={initializing ? "Type a message..." : "Type a message..."}
								// disabled={isLoading || initializing || !roomId}
								className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
								autoComplete="off"
								style={{ zIndex: 10000, pointerEvents: 'auto' }}
							/>
							<button
								type="submit"
								// disabled={isLoading || initializing || !roomId || !input.trim()}
								className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Send className="w-5 h-5" />
							</button>
						</div>
					</form>
				</>
			)}
		</div>
	);
}
