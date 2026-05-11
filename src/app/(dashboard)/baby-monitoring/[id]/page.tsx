"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBabyById } from "@/features/baby-monitoring/services/babyService";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    getBabyById(Number(id))
      .then((bebe) => {
        router.replace(`/patients/${bebe.pacienteId}?bebeId=${bebe.id}`);
      })
      .catch(() => {
        router.replace("/baby-monitoring");
      });
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="loading loading-spinner loading-lg text-[#09268E]" />
    </div>
  );
}
