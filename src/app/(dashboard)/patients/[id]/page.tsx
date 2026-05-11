"use client";
import { useParams, useSearchParams } from "next/navigation";
import PatientRecordPage from "@/features/patients/components/patients/PatientRecordPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const bebeId = searchParams.get("bebeId");
  return <PatientRecordPage id={Number(id)} bebeId={bebeId ? Number(bebeId) : undefined} />;
}
