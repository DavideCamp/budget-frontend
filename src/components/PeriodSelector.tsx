import React from 'react';
import { PeriodSelectorProps } from "../restapi/types";
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale'; // Import Italian locale
import './PeriodSelector.css'; // Import styles for better UI

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
    years, 
    currentYear, 
    currentMonth, 
    onYearChange, 
    onMonthChange 
}) => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
    const currentDate = new Date();
    const isCurrentPeriod = currentYear === currentDate.getFullYear() && currentMonth === currentDate.getMonth() + 1;
  
    // Create options for custom select styling
    const renderMonthOptions = () => {
        return months.map(month => (
            <option key={month} value={month}>
                {format(new Date(currentYear, month - 1), 'MMMM', { locale: it })}
            </option>
        ));
    };

    const renderYearOptions = () => {
        return years.map(year => (
            <option key={year} value={year}>{year}</option>
        ));
    };

    // Handle quick navigation
    const handleQuickNav = (direction: 'prev' | 'next') => {
        let newYear = currentYear;
        let newMonth = currentMonth;

        if (direction === 'prev') {
            if (newMonth === 1) {
                newMonth = 12;
                newYear--;
            } else {
                newMonth--;
            }
        } else {
            if (newMonth === 12) {
                newMonth = 1;
                newYear++;
            } else {
                newMonth++;
            }
        }

        // Check if the new year is in the available years
        if (years.includes(newYear)) {
            onYearChange(newYear);
            onMonthChange(newMonth);
        }
    };

    // Go to current month/year
    const goToCurrent = () => {
        onYearChange(currentDate.getFullYear());
        onMonthChange(currentDate.getMonth() + 1);
    };
  
    return (
        <div className="period-selector">
            <div className="period-selector-controls">
                <div className="period-nav-buttons">
                    <button 
                        className="period-nav-btn" 
                        onClick={() => handleQuickNav('prev')}
                        aria-label="Previous month"
                    >
                        <span className="nav-icon">←</span>
                    </button>
                    
                    {!isCurrentPeriod && (
                        <button 
                            className="period-today-btn" 
                            onClick={goToCurrent}
                            aria-label="Go to current month"
                        >
                            Today
                        </button>
                    )}
                    
                    <button 
                        className="period-nav-btn" 
                        onClick={() => handleQuickNav('next')}
                        aria-label="Next month"
                        disabled={isCurrentPeriod}
                    >
                        <span className="nav-icon">→</span>
                    </button>
                </div>
                
                <div className="period-selectors">
                    <div className="select-container">
                        <label htmlFor="month-select">Month</label>
                        <div className="custom-select">
                            <select
                                id="month-select"
                                value={currentMonth}
                                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                                className="month-select"
                            >
                                {renderMonthOptions()}
                            </select>
                            <span className="select-arrow">▼</span>
                        </div>
                    </div>
                    
                    <div className="select-container">
                        <label htmlFor="year-select">Year</label>
                        <div className="custom-select">
                            <select
                                id="year-select"
                                value={currentYear}
                                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                                className="year-select"
                            >
                                {renderYearOptions()}
                            </select>
                            <span className="select-arrow">▼</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="period-display-mini">
                {format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy', { locale: it })}
            </div>
        </div>
    );
};