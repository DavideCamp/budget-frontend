// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, getYear, getMonth } from 'date-fns'; // Import date-fns functions
import { it } from 'date-fns/locale'; // Import Italian locale if needed for formatting
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Import Recharts components
import './App.css';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:8000/api/'; // Your Django API base URL

// Helper function to format currency (Italian style)
const formatCurrency = (value) => {
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

// --- Components ---

// Component for selecting Year and Month
function PeriodSelector({ years, currentYear, currentMonth, onYearChange, onMonthChange }) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12

  return (
    <div className="period-selector card">
      <label htmlFor="year-select">Year:</label>
      <select
        id="year-select"
        value={currentYear}
        onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
      >
        {years.map(year => <option key={year} value={year}>{year}</option>)}
      </select>

      <label htmlFor="month-select">Month:</label>
      <select
        id="month-select"
        value={currentMonth}
        onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
      >
        {months.map(month => (
          <option key={month} value={month}>
            {/* Format month name */}
            {format(new Date(currentYear, month - 1), 'MMMM', { locale: it })}
          </option>
        ))}
      </select>
    </div>
  );
}

// Component for Summary Metrics
function SummaryMetrics({ income, expense, savings }) {
  return (
    <div className="summary-metrics card">
      <div className="metric">
        <h3>Total Income</h3>
        <p className="income">{formatCurrency(income)}</p>
      </div>
      <div className="metric">
        <h3>Total Expenses</h3>
        <p className="expense">{formatCurrency(expense)}</p>
      </div>
      <div className="metric">
        <h3>Net Savings</h3>
        <p className="savings">{formatCurrency(savings)}</p>
      </div>
    </div>
  );
}

// Component for Expense Category Pie Chart
function CategoryChart({ data }) {
    // Define some colors for the pie chart segments
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#ff7300'];

    if (!data || data.length === 0) {
        return <div className="card chart-container"><p>No expense data for this period.</p></div>;
    }

    return (
        <div className="card chart-container">
            <h2>Expenses by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// Component for Transaction Table
function TransactionTable({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <div className="card transactions-list"><p>No transactions found for this period.</p></div>;
  }

  return (
    <div className="card transactions-list">
      <h2>Transactions</h2>
      <table className="transactions-table">
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
            <tr key={tx.id}>
              <td>{format(parseISO(tx.date), 'dd/MM/yyyy')}</td>
              <td>{tx.account}</td>
              <td>{tx.category}</td>
              <td>{tx.description}</td>
              <td className="value-col">{formatCurrency(tx.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// --- Main App Component ---
function App() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [availableYears, setAvailableYears] = useState([currentYear]); // Start with current year

  // Fetch available years (could be improved with a dedicated API endpoint)
   useEffect(() => {
    const fetchYears = async () => {
      try {
        // Fetch *all* transactions just to get years - NOT efficient for large datasets!
        // A dedicated API endpoint /api/transactions/years/ would be much better.
        const response = await axios.get(`${API_BASE_URL}transactions/`);
        const years = [...new Set(response.data.map(tx => getYear(parseISO(tx.date))))].sort((a, b) => b - a);
        if (years.length > 0) {
            setAvailableYears(years);
            // Ensure selectedYear is valid
            if (!years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
        } else {
            setAvailableYears([currentYear]); // Fallback
        }
      } catch (err) {
        console.error("Error fetching years:", err);
        // Keep default year if fetch fails
      }
    };
    fetchYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Fetch transactions when year or month changes
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      setTransactions([]); // Clear previous data

      try {
        const response = await axios.get(`${API_BASE_URL}transactions/`, {
          params: {
            date__year: selectedYear,
            date__month: selectedMonth,
          }
        });
        // Sort transactions by date descending (newest first)
        const sortedTransactions = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sortedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(`Failed to load transactions: ${err.message}. Is the backend running?`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedYear, selectedMonth]); // Re-fetch when year or month changes

  // Calculate summary metrics and chart data using useMemo for optimization
  const { summary, categoryExpenses } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categories = {};

    transactions.forEach(tx => {
      const value = parseFloat(tx.value); // Make sure value is a number
      if (isNaN(value)) return; // Skip if value is not a valid number

      if (value > 0) {
        totalIncome += value;
      } else {
        totalExpenses += Math.abs(value); // Expenses are negative, use absolute value for summing
        const category = tx.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + Math.abs(value);
      }
    });

    const netSavings = totalIncome - totalExpenses;

    // Prepare data for Recharts Pie chart
    const categoryChartData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort largest category first

    return {
      summary: { income: totalIncome, expense: totalExpenses, savings: netSavings },
      categoryExpenses: categoryChartData
    };
  }, [transactions]); // Recalculate only when transactions change

  return (
    <div className="App">
      <h1>Budget Dashboard</h1>

      <PeriodSelector
        years={availableYears}
        currentYear={selectedYear}
        currentMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

      {loading && <p className="loading">Loading data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <SummaryMetrics
            income={summary.income}
            expense={summary.expense}
            savings={summary.savings}
          />

          <div className="dashboard-grid">
            <CategoryChart data={categoryExpenses} />
            {/* You could add more charts here (e.g., TrendChart) */}
             <div className="card"> {/* Placeholder for another chart/widget */}
                 <h2>Other Insights</h2>
                 <p>Placeholder for future charts or data points (e.g., income sources, account balances).</p>
            </div>
          </div>

          <TransactionTable transactions={transactions} />
        </>
      )}
    </div>
  );
}

export default App;