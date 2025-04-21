import React from 'react';
import { SummaryMetricsProps, TransactionTableProps, Transaction } from "../restapi/types";
import { format, parseISO, subDays } from 'date-fns';
import { it } from 'date-fns/locale'; // Import Italian locale for better formatting
import './TransactionTable.css'; // Import styles for better UI

// Enhanced currency formatter with the same functionality
export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return '€ 0,00';
    }
    // Use Italian locale for formatting (€ 1.234,56)
    return Number(value).toLocaleString('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

// Enhanced Summary Metrics with improved UI and additional metrics
export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ income, expense, savings, savingsRate = 0 }) => {
    // Calculate savings percentage for the progress bar
    const savingsPercentage = Math.min(Math.max((savings / income) * 100, 0), 100) || 0;
    
    return (
        <div className="summary-metrics">
            <div className="metric-card income">
                <h3>Total Income</h3>
                <div className="metric-value">{formatCurrency(income)}</div>
                {income > 0 && (
                    <div className="metric-indicator positive">
                        <i className="metric-icon">↑</i>
                    </div>
                )}
            </div>
            
            <div className="metric-card expense">
                <h3>Total Expenses</h3>
                <div className="metric-value">{formatCurrency(expense)}</div>
                <div className="expense-ratio">
                    {income > 0 ? `${Math.round((expense / income) * 100)}% of income` : '-'}
                </div>
            </div>
            
            <div className="metric-card savings">
                <h3>Net Savings</h3>
                <div className="metric-value">{formatCurrency(savings)}</div>
                {savingsRate > 0 && (
                    <div className="savings-rate">
                        {`${Math.round(savingsRate)}% savings rate`}
                    </div>
                )}
                <div className="savings-progress">
                    <div 
                        className="savings-progress-bar" 
                        style={{ width: `${savingsPercentage}%` }}
                        title={`${Math.round(savingsPercentage)}% of income saved`}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// Helper function to determine the transaction row style based on the value
const getTransactionRowClass = (value: number): string => {
    if (value > 0) return 'income-transaction';
    if (value < 0) return 'expense-transaction';
    return '';
};

// Helper to check if transaction is recent (within last 3 days)
const isRecentTransaction = (date: string): boolean => {
    const txDate = parseISO(date);
    const threeDaysAgo = subDays(new Date(), 3);
    return txDate > threeDaysAgo;
};

// Enhanced Transaction Table with improved UI and responsiveness
export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="no-data-container">
                <div className="no-data-icon">📋</div>
                <p>No transactions found for this period.</p>
            </div>
        );
    }

    // Group transactions by date for better organization
    const transactionsByDate: Record<string, Transaction[]> = {};
    transactions.forEach(tx => {
        const dateKey = tx.date.substring(0, 10); // YYYY-MM-DD
        if (!transactionsByDate[dateKey]) {
            transactionsByDate[dateKey] = [];
        }
        transactionsByDate[dateKey].push(tx);
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(transactionsByDate).sort().reverse();

    return (
        <div className="transaction-container">
            <div className="transaction-header">
                <h2>Transactions</h2>
                <div className="transaction-count">
                    {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
                </div>
            </div>
            
            {/* Desktop version - full table */}
            <div className="desktop-transactions">
                <table className="transaction-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Account</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th className="value-col">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr 
                                key={tx.id} 
                                className={`${getTransactionRowClass(tx.value)} ${isRecentTransaction(tx.date) ? 'recent-transaction' : ''}`}
                            >
                                <td>{format(parseISO(tx.date), 'dd MMM yyyy', { locale: it })}</td>
                                <td>{tx.account}</td>
                                <td>
                                    <span className="category-badge">
                                        {tx.category || 'Uncategorized'}
                                    </span>
                                </td>
                                <td>{tx.description}</td>
                                <td className="value-col">
                                    <span className={tx.value > 0 ? 'positive-value' : tx.value < 0 ? 'negative-value' : ''}>
                                        {formatCurrency(tx.value)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Mobile version - card-based layout */}
            <div className="mobile-transactions">
                {sortedDates.map(date => (
                    <div key={date} className="transaction-date-group">
                        <div className="transaction-date-header">
                            {format(parseISO(date), 'EEEE d MMMM yyyy', { locale: it })}
                        </div>
                        
                        {transactionsByDate[date].map(tx => (
                            <div 
                                key={tx.id} 
                                className={`transaction-card ${getTransactionRowClass(tx.value)} ${isRecentTransaction(tx.date) ? 'recent-transaction' : ''}`}
                            >
                                <div className="transaction-main">
                                    <div className="transaction-info">
                                        <div className="transaction-description">{tx.description}</div>
                                        <div className="transaction-account">{tx.account}</div>
                                    </div>
                                    <div className="transaction-amount">
                                        <span className={tx.value > 0 ? 'positive-value' : tx.value < 0 ? 'negative-value' : ''}>
                                            {formatCurrency(tx.value)}
                                        </span>
                                    </div>
                                </div>
                                <div className="transaction-category">
                                    <span className="category-badge">
                                        {tx.category || 'Uncategorized'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            
            {transactions.length > 100 && (
                <div className="transaction-footer" >
                    <button className="view-all-btn">View All Transactions</button>
                </div>
            )}
        </div>
    );
};