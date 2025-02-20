import React, { useState, useEffect, useRef } from 'react';
import parseANSI from '../utils/parseANSI.js';
import archLinuxLogoASCII from '../assets/archLinuxLogoASCII.js';
import { useAuth } from './AuthProvider';
import './Terminal.css';

const Terminal = () => {
    const { session: authSession } = useAuth();
    const [input, setInput] = useState(``);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [commands, setCommands] = useState([]);
    const [currentPath, setCurrentPath] = useState(`~`);
    const terminalRef = useRef(null);

    // Terminal display constants
    const unauthenticatedClientName = `Anonymous`;
    const mockLinuxDistributionName = `Arf Linux`;
    const mockLinuxDistributionNameShortHand_Upper = `Arf`;
    const mockLinuxDistributionNameShortHand_Lower = `arf`;

    // Display welcome message on first load or auth change
    useEffect(() => {
        if (!commands.length && authSession) {
            const welcomeMessage = {
                input: `neofetch`,
                output: (
                    <div className="neofetch">
                        {parseANSI(archLinuxLogoASCII)}
                        <span>{authSession?.user?.user_metadata?.name || unauthenticatedClientName}@{mockLinuxDistributionNameShortHand_Upper}</span>
                        <span className="separator">------------------------</span>
                        <span>{parseANSI(`\x1b[1mOS:\x1b[0m ${mockLinuxDistributionName}`)}</span>
                        <span>{parseANSI(`\x1b[1;01mShell:\x1b[1;00m Zshty`)}</span>
                        <span>{parseANSI(`\x1b[1;01mTerminal:\x1b[1;00mBlåhaj Bash`)}</span>
                        <span>{parseANSI(`\x1b[1;01mMemory:\x1b[1;00m${Math.floor(window.performance.memory?.usedJSHeapSize / 1024) || `Unknown`} KB`)}</span>
                        <span>{parseANSI(`\x1b[1;01mUser:\x1b[1;00m ${authSession?.user?.user_metadata?.name || unauthenticatedClientName}`)}</span>
                    </div>
                )
            };
            setCommands([welcomeMessage]);
        }
    }, [authSession, commands.length]);

    // Auto-scroll to bottom when commands update
    useEffect(() => {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [commands]);

    const handleKeyPress = async (keystrokeEnterInput) => {
        if (keystrokeEnterInput.key === `Enter`) {
            const command = input.trim();
            if (!command) return;

            try {
                const response = await fetch(`http://localhost:8080/api/command`, {
                    method: `POST`,
                    headers: {
                        'Content-Type': `application/json`,
                        ...(authSession?.access_token && {
                            'Authorization': `Bearer ${authSession.access_token}`
                        })
                    },
                    body: JSON.stringify({ command })
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
                setInput(``);
                setHistory(prev => [...prev, command]);
                setHistoryIndex(-1);
            } catch (error) {
                setCommands(prev => [...prev, {
                    input: command,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }]);
            }
        } else if (keystrokeEnterInput.key === `ArrowUp`) {
            keystrokeEnterInput.preventDefault();
            setHistoryIndex(prev => {
                const newIndex = prev < history.length - 1 ? prev + 1 : prev;
                setInput(history[history.length - 1 - newIndex] || ``);
                return newIndex;
            });
        } else if (keystrokeEnterInput.key === `ArrowDown`) {
            keystrokeEnterInput.preventDefault();
            setHistoryIndex(prev => {
                const newIndex = prev > 0 ? prev - 1 : -1;
                setInput(newIndex >= 0 ? history[history.length - 1 - newIndex] : ``);
                return newIndex;
            });
        }
    };

    const userName = authSession?.user?.user_metadata?.name || unauthenticatedClientName;

    return (
        <div className="terminal-container">
            <div ref={terminalRef} className="terminal-output">
                {commands.map((cmd, idx) => (
                    <div key={idx} className="command-line">
                        <span className="prompt">[{userName}@{mockLinuxDistributionNameShortHand_Lower} {currentPath}]$</span>
                        <span className="command">{cmd.input}</span>
                        {cmd.error ? (
                            <div className="error">{cmd.error}</div>
                        ) : cmd.output ? (
                            <div className="output">
                                {typeof cmd.output === `string` ? cmd.output : cmd.output}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            <div className="input-line">
                <span className="prompt">[{userName}@{mockLinuxDistributionNameShortHand_Lower} {currentPath}]$</span>
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
