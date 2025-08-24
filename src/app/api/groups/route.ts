import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Generate a random 6-character code
function generateGroupCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

// Create a new group
export async function POST(request: NextRequest) {
  try {
    const code = generateGroupCode();
    
    const group = await prisma.group.create({
      data: {
        code
      }
    });
    
    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

// Get all groups (for testing purposes)
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: true
      }
    });
    
    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';