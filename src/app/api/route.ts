// app/api/request/route.ts

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { NextRequest, NextResponse } from 'next/server';

dotenv.config();

// ————————————————
// Environment & Wallet Setup
// ————————————————
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY!;
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || '0.1';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

// ————————————————
// Simple In-Memory Rate Limiter
// ————————————————
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const ipTimestamps = new Map<string, number>();

// ————————————————
// POST /api/request
// ————————————————
export async function POST(request: NextRequest) {
  // Only allow POST
  if (request.method !== 'POST') {
    return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract client IP (Vercel / Cloudflare style header or socket)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Rate-limit check
  const last = ipTimestamps.get(ip);
  const now = Date.now();
  if (last && now - last < WINDOW_MS) {
    return new NextResponse(
      JSON.stringify({ error: 'Only one request per 24h allowed.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse JSON body
  let body: { address?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { address } = body;
  if (!address || !ethers.isAddress(address)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send faucet transaction
  try {
    const tx = await ownerWallet.sendTransaction({
      to: address,
      value: ethers.parseEther(FAUCET_AMOUNT),
    });
    await tx.wait();

    // mark this IP as having used the faucet
    ipTimestamps.set(ip, now);

    return new NextResponse(
      JSON.stringify({ success: true, txHash: tx.hash }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Faucet error:', err);
    return new NextResponse(
      JSON.stringify({ error: err.message || 'Transaction failed.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
