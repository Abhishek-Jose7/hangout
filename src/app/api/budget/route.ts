import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import type { ExpenseCategory } from '@/types/features';

// GET: Get budget tracking dashboard data
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    const includeHistory = url.searchParams.get('includeHistory') === 'true';

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Fetch group with members
    const { data: group, error: groupError } = await supabase
      .from('Group')
      .select(`
        id, totalBudget, actualSpent,
        Member(id, name, budget, clerkUserId)
      `)
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group' },
        { status: 500 }
      );
    }

    // Fetch all expenses for the group
    const { data: expenses, error: expenseError } = await supabase
      .from('Expense')
      .select(`
        id, amount, category, created_at,
        splits:ExpenseSplit(memberId, amount)
      `)
      .eq('groupId', groupId);

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expenses' },
        { status: 500 }
      );
    }

    // Calculate total budget from members
    const totalBudget = group?.Member?.reduce((sum: number, m: { budget: number }) => sum + (m.budget || 0), 0) || 0;
    const totalActual = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Calculate per-person budget and spending
    const memberSpending: Record<string, number> = {};
    expenses?.forEach(expense => {
      expense.splits?.forEach((split: { memberId: string; amount: number }) => {
        memberSpending[split.memberId] = (memberSpending[split.memberId] || 0) + split.amount;
      });
    });

    const perPersonBudget = group?.Member?.map((m: { id: string; name: string; budget: number }) => ({
      memberId: m.id,
      memberName: m.name,
      budget: m.budget || 0,
      spent: memberSpending[m.id] || 0,
      remaining: (m.budget || 0) - (memberSpending[m.id] || 0)
    })) || [];

    // Calculate category breakdown
    const categoryTotals: Record<ExpenseCategory, number> = {
      food: 0,
      transport: 0,
      entertainment: 0,
      accommodation: 0,
      shopping: 0,
      other: 0
    };

    expenses?.forEach(expense => {
      const cat = expense.category as ExpenseCategory;
      if (cat in categoryTotals) {
        categoryTotals[cat] += expense.amount;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, actual]) => ({
        category: category as ExpenseCategory,
        actual,
        percentage: totalActual > 0 ? Math.round(actual / totalActual * 100) : 0
      }))
      .filter(c => c.actual > 0)
      .sort((a, b) => b.actual - a.actual);

    // Fetch historical data if requested
    let historicalComparison: { month: string; avgSpent: number; hangoutCount: number }[] = [];
    
    if (includeHistory) {
      // Get user's groups
      const { data: userGroups } = await supabase
        .from('Member')
        .select('groupId')
        .eq('clerkUserId', userId);

      if (userGroups?.length) {
        // Get completed hangouts from last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: hangouts } = await supabase
          .from('Hangout')
          .select('totalSpent, created_at')
          .in('groupId', userGroups.map(g => g.groupId))
          .eq('status', 'completed')
          .gte('created_at', sixMonthsAgo.toISOString());

        // Group by month
        const monthlyData: Record<string, { total: number; count: number }> = {};
        
        hangouts?.forEach(h => {
          const date = new Date(h.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { total: 0, count: 0 };
          }
          monthlyData[monthKey].total += h.totalSpent || 0;
          monthlyData[monthKey].count++;
        });

        historicalComparison = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            avgSpent: data.count > 0 ? Math.round(data.total / data.count) : 0,
            hangoutCount: data.count
          }))
          .sort((a, b) => a.month.localeCompare(b.month));
      }
    }

    // Calculate budget health indicators
    const budgetUtilization = totalBudget > 0 ? Math.round(totalActual / totalBudget * 100) : 0;
    const isOverBudget = totalActual > totalBudget;
    const remainingBudget = totalBudget - totalActual;

    // Spending trends
    const recentExpenses = expenses?.slice(0, 10).map(e => ({
      amount: e.amount,
      category: e.category,
      date: e.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      summary: {
        groupId,
        totalBudget,
        totalEstimated: totalBudget, // Could be different if we add estimated costs
        totalActual,
        remainingBudget,
        budgetUtilization,
        isOverBudget,
        expenseCount: expenses?.length || 0
      },
      perPersonBudget,
      categoryBreakdown,
      historicalComparison,
      recentExpenses,
      insights: generateInsights(totalBudget, totalActual, categoryBreakdown, perPersonBudget)
    });
  } catch (error) {
    console.error('Error fetching budget data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch budget data' },
      { status: 500 }
    );
  }
}

// Helper function to generate budget insights
function generateInsights(
  totalBudget: number,
  totalActual: number,
  categoryBreakdown: { category: ExpenseCategory; actual: number; percentage: number }[],
  perPersonBudget: { memberName: string; budget: number; spent: number; remaining: number }[]
) {
  const insights: string[] = [];

  // Budget status
  const utilizationPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  
  if (utilizationPercent > 100) {
    insights.push(`⚠️ You're ${Math.round(utilizationPercent - 100)}% over budget. Consider adjusting spending.`);
  } else if (utilizationPercent > 80) {
    insights.push(`📊 You've used ${Math.round(utilizationPercent)}% of your budget. Spend wisely!`);
  } else if (utilizationPercent > 50) {
    insights.push(`✅ Good progress! You've used ${Math.round(utilizationPercent)}% of your budget.`);
  } else if (totalActual > 0) {
    insights.push(`💰 Plenty of budget remaining. ${Math.round(100 - utilizationPercent)}% still available.`);
  }

  // Top spending category
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    insights.push(`🏷️ ${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} is your biggest expense at ${topCategory.percentage}% of total spending.`);
  }

  // Member spending
  const overBudgetMembers = perPersonBudget.filter(m => m.remaining < 0);
  if (overBudgetMembers.length > 0) {
    insights.push(`👥 ${overBudgetMembers.length} member(s) have exceeded their individual budgets.`);
  }

  // Savings opportunity
  const biggestSaver = perPersonBudget.reduce((max, m) => 
    m.remaining > max.remaining ? m : max, 
    { memberName: '', remaining: -Infinity }
  );
  
  if (biggestSaver.remaining > 0) {
    insights.push(`🌟 ${biggestSaver.memberName} has ₹${Math.round(biggestSaver.remaining)} remaining in their budget.`);
  }

  return insights;
}

export const dynamic = 'force-dynamic';
