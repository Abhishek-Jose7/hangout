import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create a new member
export async function POST(request: NextRequest) {
  try {
  const { name, location, budget, groupId, moodTags } = await request.json();
    
    // Validate required fields
    if (!name || !location || budget === undefined || !groupId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });
    
    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Create member
    const member = await prisma.member.create({
      data: {
        name,
        location,
        budget: parseFloat(budget.toString()),
        moodTags: Array.isArray(moodTags) ? moodTags.join(',') : '',
        groupId
      }
    });
    
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';