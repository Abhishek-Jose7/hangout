import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIO } from '@/lib/io';

// Create a new member
export async function POST(request: NextRequest) {
  try {
  const { name, location, budget, groupId, moodTags, firebaseUid, email } = await request.json();
    
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

    // Check if user is already a member of this group
    if (firebaseUid) {
      const existingMember = await prisma.member.findFirst({
        where: {
          firebaseUid,
          groupId
        }
      });

      if (existingMember) {
        return NextResponse.json(
          { success: true, member: existingMember, message: 'Already a member of this group' },
          { status: 200 }
        );
      }
    }
    
    // Create member
    const member = await prisma.member.create({
      data: {
        name,
        location,
        budget: parseFloat(budget.toString()),
        moodTags: Array.isArray(moodTags) ? moodTags.join(',') : '',
        firebaseUid: firebaseUid || null,
        email: email || null,
        groupId
      }
    });

    // Emit member-joined with updated group payload
    const io = getIO();
    if (io) {
      const updatedGroup = await prisma.group.findUnique({
        where: { id: groupId },
        include: { members: true }
      });
      if (updatedGroup) {
        io.to(groupId).emit('member-joined', updatedGroup);
      }
    }
    
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