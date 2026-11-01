import { NextResponse } from "next/server";

const GET = async () => {
    const url = process.env.BETTER_AUTH_URL;
    return NextResponse.json({
        BETTER_AUTH_URL: url,
        envKeys: Object.keys(process.env).filter(k => k.startsWith("BETTER"))
    });
}