import React, { useState, useEffect, useRef } from 'react';
import { Send, Minimize2, Maximize2 } from 'lucide-react';
import { set } from 'lodash';

function generateRoomIdFromPath(path: string): string {
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

export default function ChatBox({
	name = "Assistant",
	defaultMessage,
	personality,
	objectsInRoom = [],
	objectAwareness = "0",
	showUI = true,
	messages = [],
	setMessages,
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
  
	const initializeSession = async () => {
	  try {
		const response = await fetch('https://xr-publisher.sxpdigital.workers.dev/api/character/session', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({
			author: 'antpb',
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
	  
		  const response = await fetch('https://xr-publisher.sxpdigital.workers.dev/api/character/message', {
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
  
	  setMessages(prev => [...prev, userMessage]);
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
		
		setMessages(prev => [...prev, assistantMessage]);
	  } catch (error) {
		console.error('Chat error:', error);
		setMessages(prev => [...prev, {
		  sender: 'System',
		  text: error.message === 'Maximum retry attempts reached'
			? 'Connection error. Please refresh the page and try again.'
			: 'Sorry, I encountered an error. Please try again.',
		  timestamp: new Date().toISOString(),
		  error: true
		}]);
  
		// Reset session on terminal errors
		if (error.message === 'Maximum retry attempts reached') {
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

	return (
		<div
			className={`absolute bottom-20 right-4 w-96 rounded-lg shadow-xl bg-gray-900/95 backdrop-blur border border-gray-800 
    transition-all duration-200 ease-in-out ${isOpen ? 'h-[500px]' : 'h-14'}`}
			style={{ zIndex: 9999, pointerEvents: 'auto' }}
			onClick={e => e.stopPropagation()}
		>
			{/* Header */}
			<div className="flex items-center justify-between p-4 border-b border-gray-800">
				<h3 className="text-lg font-semibold text-white">{name}</h3>
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
									}`}>
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
