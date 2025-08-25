import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIO } from '@/lib/io';

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

// Get group by code
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
  const { code } = await context.params;

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

    // Optional notify listeners with a fresh payload
    const io = getIO();
    if (io) {
      io.to(group.id).emit('group-updated', group);
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