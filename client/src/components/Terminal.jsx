import React, { useState, useEffect, useRef } from 'react';
import parseANSI from '../utils/parseANSI.js';
import archLinuxLogoASCII from '../assets/archLinuxLogoASCII.js';
import { supabase, getSession } from '../utils/supabase';
import './Terminal.css';



const Terminal = () => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [commands, setCommands] = useState([]);
    const [currentPath, setCurrentPath] = useState('~');
    const terminalRef = useRef(null);
    const [userData, setUserData] = useState(null);
	const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

	const unauthenticatedClientName = (`Anonymous`) || (null);
	const mockLinuxDistributionName = (`Arf Linux`) || (null);
	const mockLinuxDistributionNameShortHand_Upper = (`Arf`) || (null);
	const mockLinuxDistributionNameShortHand_Lower = (`arf`) || (null);
	useEffect(() => {
        const setupAuth = async () => {
            // Check for existing session
            const session = await getSession()
            setSession(session)
            setLoading(false)

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session)
            })
        }

        setupAuth()
    }, [])
	const executeCommand = async (command, params) => {
        if (!session && command !== 'login' && command !== 'help') {
            return {
                success: false,
                error: 'Please login first'
            }
        }

        try {
            const response = await fetch(`/api/commands/${command}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ params })
            })

            const data = await response.json()

            if (data.redirect) {
                window.location.href = data.redirect
                return { success: true, result: 'Redirecting...' }
            }

            return data
        } catch (error) {
            return {
                success: false,
                error: 'Command execution failed'
            }
        }
    }
	useEffect(() => {
		const handleAuthCallback = async() => {
			const hash = window.location.hash;
			if (hash) {
				const { data, error } = await supabase.auth.getSession();
				if (error) console.error('Auth callback error:', error);
				if (data?.session) {
					setUserData(data.session.user);
					window.location.href = '/';
				}
			}
		};

		handleAuthCallback();
	}, []);
	useEffect(function() {
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
	}, [])
	useEffect(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			(event, session) => {
				if (event === `SIGNED_IN`) {
					setUserData(session?.user);
				} else if (event === `SIGNED_OUT`) {
					setUserData(null);
				}
			}
		);

		return () => subscription?.unsubscribe();
	}, []);
	useEffect(function() {
		if (!commands.length && userData) {
			const welcomeMessage = {
				input: 'neofetch',
				output: (
					<div className="neofetch">
						{parseANSI(archLinuxLogoASCII)}
						<span>{userData?.userName || unauthenticatedClientName }@{mockLinuxDistributionNameShortHand_Upper}</span>
						<span className="separator">------------------------</span>
						<span>{parseANSI(`\x1b[1mOS:\x1b[0m ${mockLinuxDistributionName}`)}</span>
						<span>{parseANSI('\x1b[1;01mShell:\x1b[1;00m Zshty')}</span>
						<span>{parseANSI('\x1b[1;01mTerminal:\x1b[1;00mBlåhaj Bash')}</span>
						<span>{parseANSI(`\x1b[1;01mMemory:\x1b[1;00m${Math.floor(window.performance.memory?.usedJSHeapSize / 1024) || 'Unknown'} KB`)}</span>
						<span>{parseANSI(`\x1b[1;01mUser:\x1b[1;00m ${userData?.userName || unauthenticatedClientName}`)}</span>
					</div>
				)
			};
			setCommands([welcomeMessage]);
		}
	}, [userData, commands.length, unauthenticatedClientName, mockLinuxDistributionNameShortHand_Upper, mockLinuxDistributionName])

	useEffect(() => {
		terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
	}, [commands]);
    const handleKeyPress = async (keystrokeEnterInput) => {
        if (keystrokeEnterInput.key === 'Enter') {
            const command = input.trim();
            if (!command) return;
            setHistory(prev => {
                const newHistory = [...prev, command];
                return newHistory.slice(-100);
            });
            setHistoryIndex(-1);
            setInput('');
            try {
                const response = await fetch('http://localhost:8080/api/command', {
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
        } else if (keystrokeEnterInput.key === 'ArrowUp') {
            keystrokeEnterInput.preventDefault();
            setHistoryIndex(prev => {
                const newIndex = prev < history.length - 1 ? prev + 1 : prev;
                setInput(history[history.length - 1 - newIndex] || '');
                return newIndex;
            });
        } else if (keystrokeEnterInput.key === 'ArrowDown') {
            keystrokeEnterInput.preventDefault();
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
                      	<span className="prompt">[{userData?.userName || unauthenticatedClientName}@{mockLinuxDistributionNameShortHand_Lower} {currentPath}]$</span>
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
			<span className="prompt">[{userData?.userName || unauthenticatedClientName}@{mockLinuxDistributionNameShortHand_Lower} {currentPath}]$</span>
                <input
                    value={input}
                    onChange={(keystrokeInput) => setInput(keystrokeInput.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter command..."
                    autoFocus
                />
            </div>
        </div>
    );
};

export default Terminal;
