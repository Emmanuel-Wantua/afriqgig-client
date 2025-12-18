import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import Contract from '@/models/Contract';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // These params represent the two users involved
        const userA = searchParams.get('freelancer'); 
        const userB = searchParams.get('client');
        const statusParam = searchParams.get('status');

        if (!userA || !userB) {
            return NextResponse.json([], { status: 200 });
        }

        await connectToDB();

        // 1. FLEXIBLE PARTICIPANT QUERY
        // Find contract where (Client is A & Freelancer is B) OR (Client is B & Freelancer is A)
        const participantsQuery = {
            $or: [
                { client: userA, freelancer: userB },
                { client: userB, freelancer: userA }
            ]
        };

        // 2. FLEXIBLE STATUS QUERY
        // If searching for "active", allow any status that implies the contract is live
        let statusQuery = {};
        if (statusParam === 'active') {
            statusQuery = { 
                status: { $in: ['active', 'ongoing', 'hired', 'started', 'in_progress', 'open'] } 
            };
        } else if (statusParam) {
            statusQuery = { status: statusParam };
        }

        // Combine queries
        const finalQuery = {
            ...participantsQuery,
            ...statusQuery
        };

        const contracts = await Contract.find(finalQuery).sort({ createdAt: -1 });

        return NextResponse.json(contracts, { status: 200 });

    } catch (error) {
        console.error("Fetch Contracts Error:", error);
        return NextResponse.json({ message: "Server error fetching contracts" }, { status: 500 });
    }
}