import { NextRequest, NextResponse } from 'next/server';
// Removed invalid import for RouteContext
import { prisma } from '@/lib/prisma';

// Get group by code
export async function GET(
  request: NextRequest,
  context: any // Replace with a more specific type if available
) {
  try {
  const code = context.params.code;

    const group = await prisma.group.findUnique({
      where: { code },
      include: { members: true }
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';