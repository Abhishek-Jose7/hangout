import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import type { CreateExpenseRequest } from '@/types/features';

// GET: Fetch expenses for a group with balances
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

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Fetch all expenses for the group
    const { data: expenses, error: expenseError } = await supabase
      .from('Expense')
      .select(`
        *,
        paidBy:Member!paidById(id, name, clerkUserId),
        splits:ExpenseSplit(
          id, memberId, amount, percentage, isPaid,
          member:Member(id, name, clerkUserId)
        )
      `)
      .eq('groupId', groupId)
      .order('created_at', { ascending: false });

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expenses' },
        { status: 500 }
      );
    }

    // Fetch all members
    const { data: members, error: memberError } = await supabase
      .from('Member')
      .select('id, name, clerkUserId, budget')
      .eq('groupId', groupId);

    if (memberError) {
      console.error('Error fetching members:', memberError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Calculate balances for each member
    const balances: Record<string, { paid: number; owes: number }> = {};
    members?.forEach(m => {
      balances[m.id] = { paid: 0, owes: 0 };
    });

    expenses?.forEach(expense => {
      // Add to paid amount for the payer
      if (balances[expense.paidById]) {
        balances[expense.paidById].paid += expense.amount;
      }
      
      // Add to owed amount for each split
      expense.splits?.forEach((split: { memberId: string; amount: number }) => {
        if (balances[split.memberId]) {
          balances[split.memberId].owes += split.amount;
        }
      });
    });

    // Calculate simplified debts
    const memberBalances = members?.map(m => ({
      memberId: m.id,
      member: m,
      totalPaid: balances[m.id]?.paid || 0,
      totalOwed: balances[m.id]?.owes || 0,
      balance: (balances[m.id]?.paid || 0) - (balances[m.id]?.owes || 0)
    })) || [];

    // Simplify debts
    const simplifiedDebts = calculateSimplifiedDebts(memberBalances);

    // Calculate total spent
    const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const totalBudget = members?.reduce((sum, m) => sum + (m.budget || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      expenses: expenses || [],
      memberBalances,
      simplifiedDebts,
      summary: {
        totalSpent,
        totalBudget,
        remaining: totalBudget - totalSpent,
        expenseCount: expenses?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST: Create a new expense
export async function POST(request: NextRequest) {
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

    const body: CreateExpenseRequest = await request.json();
    const { groupId, description, amount, category, splitType, splits, receipt_url } = body;

    if (!groupId || !description || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current member
    const { data: currentMember, error: memberError } = await supabase
      .from('Member')
      .select('id')
      .eq('clerkUserId', userId)
      .eq('groupId', groupId)
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { success: false, error: 'You must be a member of this group' },
        { status: 403 }
      );
    }

    // Get all members for equal split
    const { data: members, error: membersError } = await supabase
      .from('Member')
      .select('id')
      .eq('groupId', groupId);

    if (membersError || !members?.length) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch group members' },
        { status: 500 }
      );
    }

    // Create the expense
    const expenseId = randomUUID();
    const { data: expense, error: expenseError } = await supabase
      .from('Expense')
      .insert({
        id: expenseId,
        groupId,
        paidById: currentMember.id,
        description,
        amount,
        category: category || 'other',
        splitType: splitType || 'equal',
        receipt_url
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return NextResponse.json(
        { success: false, error: 'Failed to create expense' },
        { status: 500 }
      );
    }

    // Create splits based on split type
    let splitRecords: { id: string; expenseId: string; memberId: string; amount: number; percentage: number }[] = [];

    if (splitType === 'equal' || !splits?.length) {
      // Equal split among all members
      const splitAmount = amount / members.length;
      const splitPercentage = 100 / members.length;
      
      splitRecords = members.map(m => ({
        id: randomUUID(),
        expenseId,
        memberId: m.id,
        amount: Math.round(splitAmount * 100) / 100,
        percentage: Math.round(splitPercentage * 100) / 100
      }));
    } else if (splitType === 'custom' && splits) {
      // Custom amounts
      splitRecords = splits.map(s => ({
        id: randomUUID(),
        expenseId,
        memberId: s.memberId,
        amount: s.amount || 0,
        percentage: (s.amount || 0) / amount * 100
      }));
    } else if (splitType === 'percentage' && splits) {
      // Percentage-based split
      splitRecords = splits.map(s => ({
        id: randomUUID(),
        expenseId,
        memberId: s.memberId,
        amount: amount * (s.percentage || 0) / 100,
        percentage: s.percentage || 0
      }));
    }

    // Insert splits
    if (splitRecords.length > 0) {
      const { error: splitError } = await supabase
        .from('ExpenseSplit')
        .insert(splitRecords);

      if (splitError) {
        console.error('Error creating splits:', splitError);
        // Rollback expense
        await supabase.from('Expense').delete().eq('id', expenseId);
        return NextResponse.json(
          { success: false, error: 'Failed to create expense splits' },
          { status: 500 }
        );
      }
    }

    // Update group's actual spent
    await supabase
      .from('Group')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    return NextResponse.json({
      success: true,
      expense: { ...expense, splits: splitRecords }
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// DELETE: Delete an expense
export async function DELETE(request: NextRequest) {
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
    const expenseId = url.searchParams.get('expenseId');

    if (!expenseId) {
      return NextResponse.json(
        { success: false, error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: expense, error: expenseError } = await supabase
      .from('Expense')
      .select('*, paidBy:Member!paidById(clerkUserId)')
      .eq('id', expenseId)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json(
        { success: false, error: 'Expense not found' },
        { status: 404 }
      );
    }

    if (expense.paidBy?.clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'You can only delete your own expenses' },
        { status: 403 }
      );
    }

    // Delete expense (cascades to splits)
    const { error: deleteError } = await supabase
      .from('Expense')
      .delete()
      .eq('id', expenseId);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete expense' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

// Helper function to calculate simplified debts
function calculateSimplifiedDebts(
  memberBalances: { memberId: string; member: { id: string; name: string }; balance: number }[]
) {
  const debts: { from: { id: string; name: string }; to: { id: string; name: string }; amount: number }[] = [];
  
  // Separate creditors and debtors
  const creditors = memberBalances
    .filter(m => m.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const debtors = memberBalances
    .filter(m => m.balance < 0)
    .sort((a, b) => a.balance - b.balance);

  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
    
    if (amount > 0.01) { // Ignore tiny amounts
      debts.push({
        from: { id: debtor.member.id, name: debtor.member.name },
        to: { id: creditor.member.id, name: creditor.member.name },
        amount: Math.round(amount * 100) / 100
      });
    }
    
    creditor.balance -= amount;
    debtor.balance += amount;
    
    if (creditor.balance < 0.01) i++;
    if (debtor.balance > -0.01) j++;
  }
  
  return debts;
}

export const dynamic = 'force-dynamic';
