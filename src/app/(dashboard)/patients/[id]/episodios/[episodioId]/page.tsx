"use client";
import { useParams, useSearchParams } from "next/navigation";
import EpisodeDetailPage from "@/features/patients/components/episodes/EpisodeDetailPage";

export default function Page() {
  const { id, episodioId } = useParams<{ id: string; episodioId: string }>();
  const searchParams = useSearchParams();
  const bebeId = searchParams.get("bebeId");
  return (
    <EpisodeDetailPage
      pacienteId={Number(id)}
      episodioId={Number(episodioId)}
      bebeId={bebeId ? Number(bebeId) : undefined}
    />
  );
}
