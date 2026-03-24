"use client";
import { useEffect, useState } from "react";
import { getMyProfile } from "@/features/profile/services/userService";
import { ProfileInfo } from "@/features/profile/components/ProfileInfo";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";
import type { UserProfile } from "@/features/profile/types";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
// Muestra la pagina de perfil.
export default function ProfilePage() {
    const currentUser = useAppSelector(selectCurrentUser);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    useEffect(() => {
        if (!currentUser?.id)
            return;
        const userId = currentUser.id;
        // Obtiene datos de perfil.
        async function fetchProfile() {
            setLoadingProfile(true);
            setProfileError(null);
            try {
                const data = await getMyProfile(userId);
                setProfile(data);
            }
            catch {
                setProfileError("No se pudo cargar la información del perfil. Intente nuevamente.");
            }
            finally {
                setLoadingProfile(false);
            }
        }
        fetchProfile();
    }, [currentUser?.id]);
    return (<div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Información de su cuenta
        </p>
      </div>

      
      {loadingProfile ? (<div className="card bg-white shadow-sm border border-slate-200">
          <div className="card-body items-center justify-center py-16">
            <span className="loading loading-spinner loading-lg text-[#09268E]"/>
            <p className="text-sm text-slate-500 mt-3">Cargando perfil...</p>
          </div>
        </div>) : profileError ? (<div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{profileError}</span>
        </div>) : profile ? (<ProfileInfo profile={profile}/>) : null}

      
      <ChangePasswordForm />
    </div>);
}
