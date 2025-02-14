import React, { useState, useEffect } from 'react';
import './Testing.css';

const Testing = () => {
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkSession = async () => {
        try {
            console.log('Checking session status...');
            const response = await fetch('http://localhost:8080/auth/status', {
                method: 'GET',
                credentials: 'include',  // Makes it so cookie monster gets his cookies
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'  // We dont like that new cashing stuff them younglings talk about
            });
            
            const data = await response.json();
            console.log('Session status response:', data);
            setSessionData(data);
            setLoading(false);
        } catch (err) {
            console.error('Session check error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
        const interval = setInterval(checkSession, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="testing-container">
                <div className="loading">Checking session status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="testing-container">
                <div className="error">Error: {error}</div>
                <button onClick={checkSession} className="refresh-button">
                    Retry Check
                </button>
            </div>
        );
    }

    return (
        <div className="testing-container">
            <h2>Session Status</h2>
            <div className="session-info">
                <div className="status">
                    Authentication Status: 
                    <span className={sessionData?.isAuthenticated ? 'authenticated' : 'not-authenticated'}>
                        {sessionData?.isAuthenticated ? ' Authenticated' : ' Not Authenticated'}
                    </span>
                </div>
                {sessionData?.isAuthenticated && sessionData?.user && (
                    <div className="user-data">
                        <h3>User Data:</h3>
                        <pre>{JSON.stringify(sessionData.user, null, 2)}</pre>
                    </div>
                )}
                <div className="session-details">
                    <h3>Session Details:</h3>
                    <pre>{JSON.stringify(sessionData, null, 2)}</pre>
                </div>
            </div>
            <button onClick={checkSession} className="refresh-button">
                Refresh Session Status
            </button>
        </div>
    );
};

export default Testing;