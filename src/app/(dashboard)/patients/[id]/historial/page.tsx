import HistoryPage from "@/features/patients/components/episodes/HistoryPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <HistoryPage pacienteId={Number(id)} />;
}
