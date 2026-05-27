import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
  }

  const { createdAt, ...rest } = job;
  return NextResponse.json(rest);
}
