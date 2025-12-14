import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { Play, Pause, Square, Plus, Trash2, Clock, DollarSign } from 'lucide-react';
import { formatDuration, formatDate, formatCurrency, getInitials } from '../utils/helpers';
import './TimeTracking.css';

function TimeTracking() {
    const { state, dispatch } = useApp();
    const { clients, timeEntries, settings } = state;

    const [isRunning, setIsRunning] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentEntry, setCurrentEntry] = useState({
        clientId: '',
        project: '',
        description: '',
        billable: true,
        rate: 100,
    });

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const handleStart = () => {
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleStop = () => {
        if (elapsedTime > 0) {
            dispatch({
                type: 'ADD_TIME_ENTRY',
                payload: {
                    ...currentEntry,
                    duration: elapsedTime,
                    date: new Date().toISOString().split('T')[0],
                },
            });
        }
        setIsRunning(false);
        setElapsedTime(0);
        setCurrentEntry({
            clientId: '',
            project: '',
            description: '',
            billable: true,
            rate: 100,
        });
    };

    const handleDelete = (entryId) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            dispatch({ type: 'DELETE_TIME_ENTRY', payload: entryId });
        }
    };

    const todayEntries = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return timeEntries.filter(entry => entry.date === today);
    }, [timeEntries]);

    const totalToday = useMemo(() => {
        return todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    }, [todayEntries]);

    const totalBillableToday = useMemo(() => {
        return todayEntries
            .filter(entry => entry.billable)
            .reduce((sum, entry) => sum + (entry.duration / 3600 * entry.rate), 0);
    }, [todayEntries]);

    const recentEntries = useMemo(() => {
        return [...timeEntries]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
    }, [timeEntries]);

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client?.name || 'No Client';
    };

    return (
        <div className="time-tracking-page">
            <Header title="Time Tracking" />

            <div className="page-container">
                <div className="page-header">
                    <h2 className="page-title">Time Tracking</h2>
                </div>

                {/* Timer Section */}
                <div className="glass-card timer-section">
                    <div className="timer-display">
                        <span className="timer-time">{formatDuration(elapsedTime)}</span>
                        <div className="timer-controls">
                            {!isRunning ? (
                                <button className="timer-btn start" onClick={handleStart}>
                                    <Play size={24} />
                                </button>
                            ) : (
                                <button className="timer-btn pause" onClick={handlePause}>
                                    <Pause size={24} />
                                </button>
                            )}
                            <button
                                className="timer-btn stop"
                                onClick={handleStop}
                                disabled={elapsedTime === 0}
                            >
                                <Square size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="timer-form">
                        <input
                            type="text"
                            className="input timer-description"
                            placeholder="What are you working on?"
                            value={currentEntry.description}
                            onChange={(e) => setCurrentEntry({ ...currentEntry, description: e.target.value })}
                        />
                        <div className="timer-options">
                            <select
                                className="input"
                                value={currentEntry.clientId}
                                onChange={(e) => setCurrentEntry({ ...currentEntry, clientId: e.target.value })}
                            >
                                <option value="">Select Client</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                className="input"
                                placeholder="Project"
                                value={currentEntry.project}
                                onChange={(e) => setCurrentEntry({ ...currentEntry, project: e.target.value })}
                            />
                            <div className="input-group-inline">
                                <span>$</span>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Rate"
                                    value={currentEntry.rate}
                                    onChange={(e) => setCurrentEntry({ ...currentEntry, rate: parseFloat(e.target.value) || 0 })}
                                />
                                <span>/hr</span>
                            </div>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={currentEntry.billable}
                                    onChange={(e) => setCurrentEntry({ ...currentEntry, billable: e.target.checked })}
                                />
                                <span>Billable</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Today's Summary */}
                <div className="summary-grid">
                    <div className="glass-card summary-stat">
                        <Clock size={20} className="summary-icon-small" />
                        <div>
                            <p className="summary-stat-value">{formatDuration(totalToday)}</p>
                            <p className="summary-stat-label">Tracked Today</p>
                        </div>
                    </div>
                    <div className="glass-card summary-stat">
                        <DollarSign size={20} className="summary-icon-small" />
                        <div>
                            <p className="summary-stat-value">{formatCurrency(totalBillableToday)}</p>
                            <p className="summary-stat-label">Billable Today</p>
                        </div>
                    </div>
                </div>

                {/* Time Entries */}
                <div className="glass-card">
                    <div className="glass-card-header">
                        <h3 className="glass-card-title">Recent Entries</h3>
                    </div>

                    {recentEntries.length === 0 ? (
                        <div className="empty-state-small">
                            <Clock size={32} />
                            <p>No time entries yet. Start tracking!</p>
                        </div>
                    ) : (
                        <div className="time-entries-list">
                            {recentEntries.map(entry => (
                                <div key={entry.id} className="time-entry">
                                    <div className="time-entry-client">
                                        <div className="avatar sm">{getInitials(getClientName(entry.clientId))}</div>
                                    </div>
                                    <div className="time-entry-info">
                                        <p className="time-entry-description">{entry.description || 'No description'}</p>
                                        <p className="time-entry-meta">
                                            <span>{getClientName(entry.clientId)}</span>
                                            {entry.project && <span>• {entry.project}</span>}
                                            <span>• {formatDate(entry.date)}</span>
                                        </p>
                                    </div>
                                    <div className="time-entry-duration">
                                        {formatDuration(entry.duration)}
                                    </div>
                                    {entry.billable && (
                                        <div className="time-entry-amount">
                                            {formatCurrency(entry.duration / 3600 * entry.rate)}
                                        </div>
                                    )}
                                    <span className={`badge ${entry.billable ? 'badge-success' : 'badge-default'}`}>
                                        {entry.billable ? 'Billable' : 'Non-billable'}
                                    </span>
                                    <button className="btn-icon sm" onClick={() => handleDelete(entry.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TimeTracking;
