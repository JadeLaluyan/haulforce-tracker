import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { driverSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) return Response.json({ error: "Driver not found" }, { status: 404 });
    return Response.json({ data: driver });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = driverSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.licenseNo !== undefined ? { licenseNo: d.licenseNo || null } : {}),
        ...(d.contact !== undefined ? { contact: d.contact || null } : {}),
        ...(d.address !== undefined ? { address: d.address || null } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
      },
    });
    return Response.json({ data: driver });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tripCount = await prisma.trip.count({ where: { driverId: id } });
    if (tripCount > 0) {
      return Response.json(
        { error: "Cannot delete a driver with recorded trips. Mark them inactive instead." },
        { status: 409 }
      );
    }
    await prisma.driver.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
