'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface Member {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
  paidBy?: { name: string };
  splits?: { memberId: string; amount: number; member?: { name: string } }[];
}

interface MemberBalance {
  memberId: string;
  member: { name: string };
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

interface SimplifiedDebt {
  from: { name: string };
  to: { name: string };
  amount: number;
}

interface ExpenseTrackerProps {
  groupId: string;
  members: Member[];
  currentMemberId?: string | null;
}

const CATEGORIES = [
  { value: 'food', label: '🍔 Food', color: 'bg-orange-100 text-orange-700' },
  { value: 'transport', label: '🚗 Transport', color: 'bg-blue-100 text-blue-700' },
  { value: 'entertainment', label: '🎬 Entertainment', color: 'bg-purple-100 text-purple-700' },
  { value: 'accommodation', label: '🏨 Accommodation', color: 'bg-green-100 text-green-700' },
  { value: 'shopping', label: '🛍️ Shopping', color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: '📦 Other', color: 'bg-slate-100 text-slate-700' },
];

export default function ExpenseTracker({ groupId, members, currentMemberId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([]);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [summary, setSummary] = useState({ totalSpent: 0, totalBudget: 0, remaining: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/expenses?groupId=${groupId}`);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.expenses || []);
        setMemberBalances(data.memberBalances || []);
        setSimplifiedDebts(data.simplifiedDebts || []);
        setSummary(data.summary || { totalSpent: 0, totalBudget: 0, remaining: 0 });
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          description: description.trim(),
          amount: parseFloat(amount),
          category,
          splitType: 'equal'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setDescription('');
        setAmount('');
        setShowAddForm(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORIES.find(c => c.value === cat) || CATEGORIES[5];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Expense Tracker</h3>
              <p className="text-emerald-100 text-sm">Split bills easily</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">₹{summary.totalSpent.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Spent</p>
        </div>
        <div className="text-center border-x border-slate-200">
          <p className="text-2xl font-bold text-slate-900">₹{summary.totalBudget.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Total Budget</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${summary.remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{Math.abs(summary.remaining).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">{summary.remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="p-4 bg-emerald-50 border-b border-emerald-200">
          <div className="space-y-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you pay for?"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              required
            />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  min="1"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Add Expense
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Simplified Debts */}
      {simplifiedDebts.length > 0 && (
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Who Owes Whom
          </h4>
          <div className="space-y-2">
            {simplifiedDebts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{debt.from.name}</span>
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-medium text-slate-900">{debt.to.name}</span>
                </div>
                <span className="font-bold text-amber-700">₹{debt.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="p-4">
        <h4 className="font-semibold text-slate-900 mb-3">Recent Expenses</h4>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
            <p>No expenses yet</p>
            <p className="text-sm">Add your first expense above!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {expenses.slice(0, 10).map((expense) => {
              const catInfo = getCategoryInfo(expense.category);
              return (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${catInfo.color}`}>
                      {catInfo.label.split(' ')[0]}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{expense.description}</p>
                      <p className="text-xs text-slate-500">Paid by {expense.paidBy?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">₹{expense.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Balances */}
      {memberBalances.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">Balance Summary</h4>
          <div className="grid grid-cols-2 gap-2">
            {memberBalances.map((mb) => (
              <div key={mb.memberId} className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-medium text-slate-900 text-sm truncate">{mb.member.name}</p>
                <p className={`text-lg font-bold ${mb.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {mb.balance >= 0 ? '+' : ''}₹{mb.balance.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
