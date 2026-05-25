"use client";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import StaffHomePage from "./StaffHomePage";
import AdminHospitalDashboard from "./AdminHospitalDashboard";

const STAFF_ROLES = new Set(["SUPERVISOR", "ENFERMERO", "TECNICO", "GESTOR", "DOCTOR"]);

export default function DashboardHome() {
  const user = useAppSelector(selectCurrentUser);
  if (!user) return null;
  if (STAFF_ROLES.has(user.role)) return <StaffHomePage />;
  if (user.role === "ADMIN") return <AdminHospitalDashboard />;
  return <AdminHospitalDashboard />;
}
