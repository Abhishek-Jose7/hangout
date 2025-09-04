import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import type { Group } from '@prisma/client';
import { getIO } from '@/lib/io';

// Generate a random 6-character code
function generateGroupCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

// Create a new group
export async function POST() {
  try {
    console.log('Creating new group...');
    const code = generateGroupCode();
    console.log('Generated code:', code);
    // Retry loop: Prisma + PgBouncer can intermittently return
    // PostgresError 42P05 "prepared statement \"sX\" already exists".
    // Retry a few times before failing to reduce user-facing errors.
    const maxAttempts = 3;
    let attempt = 0;
    let group = null;
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    while (attempt < maxAttempts) {
      try {
        attempt++;
        group = await prisma.group.create({ data: { code } });
        break; // success
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err ?? '');
        // If this is the prepared-statement already exists error (42P05), retry.
        if (message.includes('prepared statement') || message.includes('42P05')) {
          console.warn(`Prisma create attempt ${attempt} failed with prepared-statement error; retrying...`);
          // small backoff
          await sleep(150 * attempt);
          continue;
        }
        // Non-retryable error, rethrow
        throw err;
      }
    }
    if (!group) throw new Error('Failed to create group after retries');
    console.log('Group created successfully:', group);

    // Emit group-updated for the new group room
    const io = getIO();
    if (io) {
      io.to(group.id).emit('group-updated', group);
    }
    
    return NextResponse.json({ success: true, group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create group' },
      { status: 500 }
    );
  }
}

// Get all groups (for testing purposes)
export async function GET() {
  try {
    // This endpoint is a security risk and should not return all groups.
    // Returning an empty array to mitigate the data leak.
    // A proper fix would be to implement authentication and authorization,
    // or remove this endpoint if it's only for debugging.
    const groups: Group[] = [];
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