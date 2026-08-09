import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/server/query";
import { customerSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return Response.json({ error: "Customer not found" }, { status: 404 });
    return Response.json({ data: customer });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const c = parsed.data;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(c.name !== undefined ? { name: c.name } : {}),
        ...(c.company !== undefined ? { company: c.company || null } : {}),
        ...(c.address !== undefined ? { address: c.address || null } : {}),
        ...(c.contact !== undefined ? { contact: c.contact || null } : {}),
        ...(c.email !== undefined ? { email: c.email || null } : {}),
        ...(c.tin !== undefined ? { tin: c.tin || null } : {}),
        ...(c.terms !== undefined ? { terms: c.terms } : {}),
      },
    });
    return Response.json({ data: customer });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tripCount = await prisma.trip.count({ where: { customerId: id } });
    if (tripCount > 0) {
      return Response.json(
        { error: "Cannot delete a customer with recorded trips." },
        { status: 409 }
      );
    }
    await prisma.customer.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
