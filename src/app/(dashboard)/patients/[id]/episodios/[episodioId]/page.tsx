"use client";
import { useParams } from "next/navigation";
import EpisodioDetailPage from "@/features/patients/components/episodios/EpisodioDetailPage";

export default function Page() {
  const { id, episodioId } = useParams<{ id: string; episodioId: string }>();
  return (
    <EpisodioDetailPage
      pacienteId={Number(id)}
      episodioId={Number(episodioId)}
    />
  );
}
