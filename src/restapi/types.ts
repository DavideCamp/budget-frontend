// --- Types ---
interface Transaction {
    id: number;
    date: string;
    account: string;
    category: string;
    description: string;
    value: number;
}

interface SummaryMetricsProps {
    income: number;
    expense: number;
    savings: number;
    savingsRate?: number;
}

interface PeriodSelectorProps {
    years: number[];
    currentYear: number;
    currentMonth: number;
    onYearChange: (year: number) => void;
    onMonthChange: (month: number) => void;
}

interface CategoryChartProps {
    data: CategoryData[];
}

interface CategoryData {
    name: string;
    value: number;
}

interface TransactionTableProps {
    transactions: Transaction[];
}


export type {
    Transaction,
    SummaryMetricsProps,
    PeriodSelectorProps,
    CategoryChartProps,
    CategoryData,
    TransactionTableProps
}