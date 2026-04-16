"use client";
import { useParams } from "next/navigation";
import EpisodeDetailPage from "@/features/patients/components/episodes/EpisodeDetailPage";

export default function Page() {
  const { id, episodioId } = useParams<{ id: string; episodioId: string }>();
  return (
    <EpisodeDetailPage
      pacienteId={Number(id)}
      episodioId={Number(episodioId)}
    />
  );
}
