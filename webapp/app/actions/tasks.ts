"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type TaskData = {
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: string;
  contactId?: string | null;
  dealId?: string | null;
};

export async function createTask(data: TaskData) {
  const accountId = await requireAccountId();
  const task = await prisma.task.create({
    data: {
      accountId,
      title: data.title.trim(),
      description: data.description?.trim() || "",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "Open",
      contactId: data.contactId || null,
      dealId: data.dealId || null,
    },
  });
  redirect(`/tasks`);
}

export async function updateTask(id: string, data: TaskData) {
  const accountId = await requireAccountId();
  const task = await prisma.task.findFirst({ where: { id, accountId } });
  if (!task) throw new Error("Not found");

  await prisma.task.update({
    where: { id },
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || "",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      ...(data.status && { status: data.status }),
      contactId: data.contactId || null,
      dealId: data.dealId || null,
    },
  });
  revalidatePath("/tasks");
}

export async function toggleTaskStatus(id: string) {
  const accountId = await requireAccountId();
  const task = await prisma.task.findFirst({ where: { id, accountId } });
  if (!task) throw new Error("Not found");

  await prisma.task.update({
    where: { id },
    data: { status: task.status === "Open" ? "Completed" : "Open" },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const accountId = await requireAccountId();
  const task = await prisma.task.findFirst({ where: { id, accountId } });
  if (!task) throw new Error("Not found");
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
}
