'use client';

import { useState, useEffect, useCallback } from 'react';

interface BudgetDashboardProps {
  groupId: string;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

interface MemberSpending {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwes: number;
  netBalance: number;
}

interface BudgetData {
  totalSpent: number;
  averagePerHangout: number;
  categoryBreakdown: CategoryBreakdown[];
  memberSpending: MemberSpending[];
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    paidBy: string;
  }>;
}

export default function BudgetDashboard({ groupId }: BudgetDashboardProps) {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const fetchBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        groupId,
        timeframe: selectedTimeframe,
      });

      const response = await fetch(`/api/budget?${params}`);
      const data = await response.json();

      if (data.success) {
        setBudgetData(data.data);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, selectedTimeframe]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: '🍔',
      drinks: '🍺',
      entertainment: '🎬',
      transportation: '🚗',
      accommodation: '🏨',
      activities: '🎯',
      shopping: '🛍️',
      other: '📦',
    };
    return icons[category.toLowerCase()] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      food: 'bg-amber-500',
      drinks: 'bg-purple-500',
      entertainment: 'bg-pink-500',
      transportation: 'bg-blue-500',
      accommodation: 'bg-teal-500',
      activities: 'bg-green-500',
      shopping: 'bg-red-500',
      other: 'bg-slate-500',
    };
    return colors[category.toLowerCase()] || 'bg-slate-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Budget Dashboard</h3>
              <p className="text-emerald-100 text-sm">Track group spending</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-white/80 hover:text-white"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex border-b border-slate-200">
        {[
          { value: 'week' as const, label: 'Week' },
          { value: 'month' as const, label: 'Month' },
          { value: 'year' as const, label: 'Year' },
          { value: 'all' as const, label: 'All' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedTimeframe(value)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              selectedTimeframe === value
                ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Total Spent */}
      <div className="p-6 text-center border-b border-slate-200">
        <p className="text-sm text-slate-500 mb-1">Total Spent</p>
        <p className="text-4xl font-bold text-slate-900">
          {budgetData ? formatCurrency(budgetData.totalSpent) : '$0.00'}
        </p>
        {budgetData && budgetData.averagePerHangout > 0 && (
          <p className="text-sm text-slate-500 mt-1">
            ~{formatCurrency(budgetData.averagePerHangout)} per hangout
          </p>
        )}
      </div>

      {/* Category Breakdown */}
      {budgetData && budgetData.categoryBreakdown.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Spending by Category</h4>
          
          {/* Category Bar */}
          <div className="h-4 rounded-full overflow-hidden flex mb-3">
            {budgetData.categoryBreakdown.map((cat) => (
              <div
                key={cat.category}
                className={`${getCategoryColor(cat.category)} transition-all`}
                style={{ width: `${cat.percentage}%` }}
                title={`${cat.category}: ${formatCurrency(cat.total)}`}
              />
            ))}
          </div>

          {/* Category Legend */}
          <div className="grid grid-cols-2 gap-2">
            {budgetData.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2 text-sm">
                <span>{getCategoryIcon(cat.category)}</span>
                <span className="text-slate-600 flex-1">{cat.category}</span>
                <span className="font-medium">{formatCurrency(cat.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Spending */}
      {showDetails && budgetData && budgetData.memberSpending.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-900 mb-3">Member Balances</h4>
          <div className="space-y-2">
            {budgetData.memberSpending.map((member) => (
              <div 
                key={member.memberId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-medium text-slate-600">
                    {member.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{member.memberName}</p>
                    <p className="text-xs text-slate-500">Paid: {formatCurrency(member.totalPaid)}</p>
                  </div>
                </div>
                <div className={`font-bold ${
                  member.netBalance > 0 ? 'text-green-600' :
                  member.netBalance < 0 ? 'text-red-600' :
                  'text-slate-600'
                }`}>
                  {member.netBalance > 0 ? '+' : ''}{formatCurrency(member.netBalance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      {showDetails && budgetData && budgetData.recentExpenses.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium text-slate-900 mb-3">Recent Expenses</h4>
          <div className="space-y-2">
            {budgetData.recentExpenses.slice(0, 5).map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                    <p className="text-xs text-slate-500">
                      Paid by {expense.paidBy} • {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-slate-900">{formatCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!budgetData || (budgetData.totalSpent === 0 && budgetData.categoryBreakdown.length === 0)) && (
        <div className="p-8 text-center text-slate-500">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-slate-600">No expenses yet</p>
          <p className="text-sm">Add expenses to see your spending breakdown</p>
        </div>
      )}
    </div>
  );
}
