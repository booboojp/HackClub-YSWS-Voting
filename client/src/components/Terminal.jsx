import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';


const Terminal = () => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [commands, setCommands] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const terminalRef = useRef(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [commands]);
    useEffect(() => {
        console.log('[Terminal.jsx] Checking auth status on page load.');
        const checkAuthStatus = async () => {
            try {
                const response = await fetch('http://localhost:8080/auth/status', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Auth status response:', data);
                
                if (data.isAuthenticated) {
                    setIsAuthenticated(true);
                    setUserData(data.user);
                } else {
                    setIsAuthenticated(false);
                    setUserData(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setIsAuthenticated(false);
                setUserData(null);
            }
        };
        checkAuthStatus();
    }, []);

    const handleLogout = async () => {
        console.log('[Terminal.jsx] Logging out...');
        try {
            const response = await fetch('http://localhost:8080/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                console.log('[Terminal.jsx] Logout successful.');
                setIsAuthenticated(false);
            } else {
                console.log('[Terminal.jsx] Logout failed with status:', response.status);
            }
        } catch (error) {
            console.error('[Terminal.jsx] Logout failed:', error);
        }
    };
      const handleKeyPress = async (e) => {
        if (e.key === 'Enter') {
            const command = input.trim();
            if (!command) return;
    
            setHistory(prev => [...prev, command]);
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
            const prevCommand = history[history.length - 1]; 
            if (prevCommand) setInput(prevCommand);
        }
    };

    return (
        <div className="terminal-container">
            <div ref={terminalRef} className="terminal-output">
                {commands.map((cmd, idx) => (
                    <div key={idx} className="command-line">
                        <span className="prompt">{userData?.userId || 'guest'}$</span>
                        <span className="command">{cmd.input}</span>
                        {cmd.error ? (
                            <div className="error">{cmd.error}</div>
                        ) : cmd.output ? (
                            <div className="output">
                                {typeof cmd.output === 'object' && cmd.output.result
                                    ? cmd.output.result
                                    : cmd.output}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            <div className="input-line">
                <span className="prompt">{userData?.userId || 'guest'}$</span>
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