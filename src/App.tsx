// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { parseISO, getYear, format } from 'date-fns'; // Added format for better date handling
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';
import { formatCurrency, SummaryMetrics, TransactionTable } from './components/TransactionTable';
import { CategoryChartProps, CategoryData, Transaction } from './restapi/types';
import { PeriodSelector } from './components/PeriodSelector';
import Chatbot from './components/chatbot/Chat';

// Configuration
const API_BASE_URL = 'http://localhost:8000/api/';

// Enhanced Category Chart Component with better responsiveness
const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  // Vibrant color palette that works well together
  const COLORS = [
    '#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6',
    '#1abc9c', '#f39c12', '#d35400', '#8e44ad', '#16a085'
  ];

  if (!data || data.length === 0) {
    return (
      <div className="card chart-container flex-center">
        <p>No expense data for this period.</p>
      </div>
    );
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
            labelLine={true}
            outerRadius={80}
            innerRadius={30} // Adding an inner radius for a donut chart look
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }: { name: string, percent: number }) =>
              // Only show label for larger segments to avoid clutter
              percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
            }
            paddingAngle={2} // Add spacing between segments
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// New component for savings trend (placeholder for now)
const SavingsTrend: React.FC = () => {
  return (
    <div className="card chart-container">
      <h2>Monthly Savings</h2>
      <div className="placeholder-chart flex-center">
        <p>Future enhancement: Savings trend over time</p>
      </div>
    </div>
  );
};

// Main App Component with improved layout and responsiveness
const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 768);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch available years
  useEffect(() => {
    const fetchYears = async (): Promise<void> => {
      try {
        const response = await axios.get<Transaction[]>(`${API_BASE_URL}transactions/`);
        const years = Array.from(new Set(response.data.map(tx => getYear(parseISO(tx.date))))).sort((a, b) => b - a);
        if (years.length > 0) {
          setAvailableYears(years);
          if (!years.includes(selectedYear)) {
            setSelectedYear(years[0]);
          }
        } else {
          setAvailableYears([currentYear]);
        }
      } catch (err) {
        console.error("Error fetching years:", err);
      }
    };
    fetchYears();
  }, []);

  // Fetch transactions for selected period
  useEffect(() => {
    const fetchTransactions = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      setTransactions([]);

      try {
        const response = await axios.get<Transaction[]>(`${API_BASE_URL}transactions/`, {
          params: {
            date__year: selectedYear,
            date__month: selectedMonth,
          }
        });
        const sortedTransactions = response.data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(sortedTransactions);
      } catch (err: any) {
        console.error("Error fetching transactions:", err);
        setError(`Failed to load transactions: ${err.message}. Is the backend running?`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedYear, selectedMonth]);

  // Calculate summary metrics and chart data
  const { summary, categoryExpenses } = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categories: Record<string, number> = {};

    transactions.forEach(tx => {
      const value = parseFloat(tx.value.toString());
      if (isNaN(value)) return;

      if (value > 0) {
        totalIncome += value;
      } else {
        totalExpenses += Math.abs(value);
        const category = tx.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + Math.abs(value);
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const categoryChartData: CategoryData[] = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      summary: {
        income: totalIncome,
        expense: totalExpenses,
        savings: netSavings,
        savingsRate: savingsRate
      },
      categoryExpenses: categoryChartData
    };
  }, [transactions]);

  // Format date for display
  const formattedPeriod = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, 1);
    return format(date, 'MMMM yyyy');
  }, [selectedYear, selectedMonth]);

  return (
    <div className="app-container">

      <header className="app-header">
        <h1>Budget Dashboard</h1>
        <div className="period-display">{formattedPeriod}</div>
      </header>

      <div>
        <PeriodSelector
          years={availableYears}
          currentYear={selectedYear}
          currentMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </div>


      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your financial data...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <i className="error-icon">⚠️</i>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="transactions-container">
            <h2>Recent Transactions</h2>
            <TransactionTable transactions={transactions} />
          </div>
          <div>
            <Chatbot />
          </div>

          <div className="summary-section">
            <SummaryMetrics
              income={summary.income}
              expense={summary.expense}
              savings={summary.savings}
            />
          </div>

          <div className={`dashboard-grid ${isSmallScreen ? 'single-column' : ''}`}>
            <CategoryChart data={categoryExpenses} />
            <SavingsTrend />
          </div>



        </>
      )}

      <footer className="app-footer">
        <p>Budget Dashboard © {currentYear}</p>
      </footer>
    </div>
  );
};

export default App;