import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Eliminar cuenta",
    description:
        "Cómo solicitar la eliminación de una cuenta de VigiNurse y qué datos se eliminan o se conservan.",
};

const ACTUALIZADO = "26 de noviembre de 2026";

// Mismo correo que la política de privacidad: Google Play exige un canal atendido.
const CORREO_PRIVACIDAD = "edintelvigiapp@gmail.com";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">{titulo}</h2>
            <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
        </section>
    );
}

function Correo() {
    return (
        <a className="font-medium text-blue-700 underline" href={`mailto:${CORREO_PRIVACIDAD}`}>
            {CORREO_PRIVACIDAD}
        </a>
    );
}

// Página pública (sin sesión): Google Play exige una URL donde se pueda pedir la
// eliminación de la cuenta sin tener que instalar la app.
export default function EliminarCuentaPage() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-12">
            <article className="mx-auto max-w-3xl">
                <header className="border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Eliminar su cuenta de VigiNurse
                    </h1>
                    <p className="mt-2 text-slate-600">
                        App VigiNurse y panel web, desarrollados por <strong>Edintel S.A.</strong>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Última actualización: {ACTUALIZADO}</p>
                </header>

                <Seccion titulo="Cómo solicitarlo">
                    <ol className="list-decimal space-y-2 pl-6">
                        <li>
                            Escriba a <Correo /> desde el correo de su cuenta, con el asunto
                            «Eliminar cuenta VigiNurse». También puede pedírselo al administrador de
                            VigiNurse de su hospital.
                        </li>
                        <li>
                            Verificamos la solicitud con el hospital al que pertenece la cuenta, que
                            es quien la creó.
                        </li>
                        <li>
                            Bloqueamos el acceso de inmediato y completamos la eliminación en un plazo
                            máximo de 30 días. Le confirmamos por correo cuando esté hecha.
                        </li>
                    </ol>
                </Seccion>

                <Seccion titulo="Qué datos se eliminan">
                    <ul className="list-disc space-y-1 pl-6">
                        <li>Su acceso: la cuenta queda bloqueada y la contraseña deja de servir.</li>
                        <li>
                            Los datos personales de su perfil: nombre, apellidos, cédula y correo
                            electrónico, que se reemplazan por un identificador anónimo.
                        </li>
                        <li>Su rol, permisos y asignación de hospital y área.</li>
                    </ul>
                </Seccion>

                <Seccion titulo="Qué datos se conservan y por qué">
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            <strong>Información clínica que usted registró</strong> (notas, signos
                            vitales, diagnósticos, órdenes): forma parte de la historia clínica de los
                            pacientes, que el hospital debe conservar durante el plazo que exige la
                            normativa sanitaria.
                        </li>
                        <li>
                            <strong>Registro de auditoría</strong> de sus acciones en el sistema: se
                            conserva por el plazo necesario para cumplir las obligaciones de
                            trazabilidad del hospital.
                        </li>
                        <li>
                            <strong>Mensajes de VigiChat</strong> enviados a otras personas del
                            hospital: se conservan mientras el hospital los mantenga como parte de la
                            coordinación clínica.
                        </li>
                    </ul>
                    <p>
                        Estos registros quedan asociados al identificador anónimo, no a su nombre ni
                        a su correo.
                    </p>
                </Seccion>

                <Seccion titulo="Si usted es paciente">
                    <p>
                        VigiNurse es para el personal de los hospitales; las cuentas de pacientes son
                        de la app VigiCare. Para pedir la corrección o supresión de su información
                        clínica, diríjase al hospital donde fue atendido, que es el responsable de
                        esos datos.
                    </p>
                </Seccion>

                <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    Más detalles en la{" "}
                    <Link className="font-medium text-blue-700 underline" href="/privacidad">
                        Política de Privacidad de VigiNurse
                    </Link>
                    . Edintel S.A. — San José, Costa Rica.
                </p>
            </article>
        </main>
    );
}
