"use client";

import { useParams } from "next/navigation";
import { AdminMealForm } from "@/components/admin-meal-form";

export default function EditMealPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  if (!id) return null;
  return <AdminMealForm mode="edit" mealId={id} />;
}
