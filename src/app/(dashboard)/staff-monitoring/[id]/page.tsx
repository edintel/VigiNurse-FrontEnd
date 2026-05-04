"use client";
import { useParams } from "next/navigation";
import { PersonalDetailPage } from "@/features/staff-monitoring/components/PersonalDetailPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <PersonalDetailPage id={Number(id)} />;
}
