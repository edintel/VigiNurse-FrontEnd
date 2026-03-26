"use client";
import { useParams } from "next/navigation";
import AssetDetailPage from "@/features/assets-managment/inventory/components/AssetDetailPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <AssetDetailPage id={Number(id)} />;
}
