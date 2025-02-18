import React, { useState, useEffect, useRef } from 'react';
import parseANSI from '../utils/parseANSI.js';
import archLinuxLogoASCII from '../assets/archLinuxLogoASCII.js';
import './Terminal.css';



const Terminal = () => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [commands, setCommands] = useState([]);
    const [currentPath, setCurrentPath] = useState('~');
    const terminalRef = useRef(null);
    const [userData, setUserData] = useState(null);

	useEffect(() => {
		const fetchUserData = async function() {
			try {
				const response = await fetch('http://localhost:8080/auth/status', {
					credentials: 'include'
				});

				if (!response.ok) {
					throw new Error('Failed to fetch user data');
				}

				const data = await response.json();
				console.log(`User data fetched successfully:`, data.user);
				setUserData(data.user);
			} catch (error) {
				console.error('Error fetching user data:', error);
			}
		};

		fetchUserData();
	}, []);
	useEffect(() => {
		if (!commands.length && userData) {
			const welcomeMessage = {
				input: 'neofetch',
				output: (
					<div className="neofetch">
						{parseANSI(archLinuxLogoASCII)}
						<span>{userData.userName}@Arf</span>
						<span className="separator">------------------------</span>
						<span>{parseANSI('\x1b[1;00mOS: Arch Linux')}</span>
						<span>Shell: Zshty</span>
						<span>Terminal: Blåhaj Bash</span>
						<span>CPU: JavaScript V8</span>
						<span>Memory: {Math.floor(window.performance.memory?.usedJSHeapSize / 1024) || 'Unknown'} KB</span>
						<span>Theme: Twilight Zone</span>
						<span>User: {commands.length}</span>
					</div>
				)
			};
			setCommands([welcomeMessage]);
		}
	}, [userData, commands.length]);

	useEffect(() => {
		terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
	}, [commands]);
    const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            const command = input.trim();
            if (!command) return;
            setHistory(prev => {
                const newHistory = [...prev, command];
                return newHistory.slice(-100);
            });
            setHistoryIndex(-1);
            setInput('');
            try {
                const response = await fetch('http://localhost:8080/api/slack/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ command })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.redirect) {
                    window.location.href = data.redirect;
                    return;
                }

                setCommands(prev => [...prev, {
                    input: command,
                    output: data.result,
                    error: data.error,
                    timestamp: new Date().toISOString()
                }]);
            } catch (error) {
                setCommands(prev => [...prev, {
                    input: command,
                    output: null,
                    error: error.message || 'An error occurred while processing the command',
                    timestamp: new Date().toISOString()
                }]);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHistoryIndex(prev => {
                const newIndex = prev < history.length - 1 ? prev + 1 : prev;
                setInput(history[history.length - 1 - newIndex] || '');
                return newIndex;
            });
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHistoryIndex(prev => {
                const newIndex = prev > 0 ? prev - 1 : -1;
                setInput(newIndex >= 0 ? history[history.length - 1 - newIndex] : '');
                return newIndex;
            });
        }
    };

    return (
        <div className="terminal-container">
            <div ref={terminalRef} className="terminal-output">
                {commands.map((cmd, idx) => (
                    <div key={idx} className="command-line">
                      	<span className="prompt">[{userData?.userName || 'guest'}@arf {currentPath}]$</span>
                        <span className="command">{cmd.input}</span>
                        {(cmd.error) ? (
                            <div className="error">{cmd.error}</div>
                        ) : cmd.output ? (
                            <div className="output">
                                {typeof cmd.output === 'string' ? cmd.output : cmd.output}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            <div className="input-line">
			<span className="prompt">[{userData?.userName || 'guest'}@arf {currentPath}]$</span>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter command..."
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Terminal;
