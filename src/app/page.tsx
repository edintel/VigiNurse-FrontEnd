import { redirect } from "next/navigation";
// Muestra la pagina de root.
export default function RootPage() {
    redirect("/dashboard");
}
