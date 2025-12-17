import { NextResponse } from "next/server";

export async function GET() {
    console.log("---------------- ENV CHECK ----------------");
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("CURRENCY_API_KEY Exists:", !!process.env.CURRENCY_API_KEY);
    console.log("GOOGLE_CLIENT_ID Exists:", !!process.env.GOOGLE_CLIENT_ID);
    console.log("-------------------------------------------");

    return NextResponse.json({ status: "Check Server Logs" });
}