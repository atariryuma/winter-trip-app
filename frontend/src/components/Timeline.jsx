import React from 'react';
import './Timeline.css';

const Timeline = ({ tripData }) => {
    if (!tripData || !tripData.schedules) {
        return <div className="loading">旅程データを読み込み中...</div>;
    }

    return (
        <div className="timeline-container">
            <header className="trip-header">
                <h1>{tripData.tripInfo.title}</h1>
                <p className="trip-period">{tripData.tripInfo.period}</p>
                <div className="trip-tags">
                    <span className="tag">{tripData.tripInfo.travelers}</span>
                </div>
            </header>

            <div className="days-container">
                {tripData.schedules.map((day, index) => (
                    <div key={index} className="day-card">
                        <div className="day-header">
                            <div className="date-badge">
                                <span className="month">{day.date.split('-')[1]}</span>
                                <span className="day">{day.date.split('-')[2]}</span>
                                <span className={`weekday ${day.day === '日' || day.day === '土' ? 'red' : ''}`}>{day.day}</span>
                            </div>
                            <div className="location-info">
                                <h2>{day.location}</h2>
                                <span className="day-number">Day {index + 1}</span>
                            </div>
                        </div>

                        <div className="events-list">
                            {day.events.map((event, idx) => (
                                <div key={idx} className={`event-item type-${event.type}`}>
                                    <div className="event-time">{event.time}</div>
                                    <div className="event-content">
                                        <h3 className="event-title">{event.title}</h3>
                                        <p className="event-detail">{event.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Timeline;
