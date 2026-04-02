import HistorialPage from "@/features/patients/components/episodios/HistorialPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <HistorialPage pacienteId={Number(id)} />;
}
