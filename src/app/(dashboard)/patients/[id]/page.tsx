"use client";
import { useParams } from "next/navigation";
import PatientRecordPage from "@/features/patients/components/patients/PatientRecordPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <PatientRecordPage id={Number(id)} />;
}
