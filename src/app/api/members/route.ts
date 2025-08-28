import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIO } from '@/lib/io';
import { adminAuth } from '@/lib/firebaseAdmin';

// Create a new member
export async function POST(request: NextRequest) {
  try {
  const payload = await request.json();
  const { name, location, budget, groupId, moodTags, firebaseUid: bodyFirebaseUid, email } = payload;

  // Server-side ID token verification
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  let tokenFirebaseUid: string | null = null;
  if (!adminAuth) {
    // Admin SDK not initialized (missing envs) — reject to avoid creating unauthenticated members
    return NextResponse.json({ success: false, error: 'Server not configured for token verification' }, { status: 401 });
  }
  if (!authHeader) {
    return NextResponse.json({ success: false, error: 'Missing Authorization header' }, { status: 401 });
  }
  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  const idToken = match ? match[1] : authHeader;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    tokenFirebaseUid = decoded.uid || null;
  } catch (err) {
    console.error('Token verification failed:', err);
    return NextResponse.json({ success: false, error: 'Invalid ID token' }, { status: 401 });
  }
    
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

    // Determine authoritative firebaseUid (token overrides body)
    const firebaseUidToUse = tokenFirebaseUid || bodyFirebaseUid || null;
    // Check if user is already a member of this group
    if (firebaseUidToUse) {
      const existingMember = await prisma.member.findFirst({
        where: {
          firebaseUid: firebaseUidToUse,
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
        firebaseUid: tokenFirebaseUid || bodyFirebaseUid || null,
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