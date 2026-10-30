import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Política de Privacidad",
    description:
        "Cómo VigiNurse trata los datos personales de su personal usuario y de los pacientes del hospital.",
};

const ACTUALIZADO = "18 de setiembre de 2026";

// El correo de contacto del responsable de datos. Google Play exige que sea una
// dirección atendida: la usa para contactar ante consultas de privacidad.
const CORREO_PRIVACIDAD = "REEMPLAZAR@edintel.com";

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">{titulo}</h2>
            <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
        </section>
    );
}

export default function PoliticaPrivacidadPage() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-12">
            <article className="mx-auto max-w-3xl">
                <header className="border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Política de Privacidad de VigiNurse
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Última actualización: {ACTUALIZADO}
                    </p>
                </header>

                <Seccion titulo="1. Quiénes somos y qué alcance tiene esta política">
                    <p>
                        VigiNurse es un sistema de monitoreo hospitalario desarrollado por{" "}
                        <strong>Edintel S.A.</strong>, con domicilio en San José, Costa Rica.
                        Esta política cubre la aplicación móvil VigiNurse y el panel web
                        disponible en <code>viginurse.edintel.com</code>.
                    </p>
                    <p>
                        VigiNurse no es un servicio dirigido al público general. Solo pueden
                        usarlo las personas a las que el hospital contratante les crea una
                        cuenta: personal de enfermería, médico y administrativo.
                    </p>
                </Seccion>

                <Seccion titulo="2. Quién decide sobre los datos">
                    <p>
                        Esta distinción determina a quién debe dirigirse cada solicitud.
                    </p>
                    <p>
                        El <strong>hospital que contrata VigiNurse es el responsable</strong>{" "}
                        del tratamiento de los datos clínicos de sus pacientes. Es quien decide
                        qué se registra, con qué finalidad y por cuánto tiempo.
                    </p>
                    <p>
                        <strong>Edintel actúa como encargado del tratamiento</strong>: opera la
                        plataforma siguiendo las instrucciones del hospital. No usamos los datos
                        clínicos para fines propios, no los cedemos a terceros ni los empleamos
                        para entrenar modelos, elaborar perfiles o cualquier otro fin ajeno a la
                        prestación del servicio.
                    </p>
                </Seccion>

                <Seccion titulo="3. Qué datos se tratan">
                    <p className="font-medium text-slate-900">
                        De las personas usuarias (personal del hospital)
                    </p>
                    <ul className="list-disc space-y-1 pl-6">
                        <li>Nombre, apellidos y correo electrónico institucional.</li>
                        <li>Rol asignado, permisos y hospital al que pertenece.</li>
                        <li>
                            Registro de auditoría: acciones realizadas dentro del sistema, fecha,
                            hora y dirección IP de origen. Sirve para trazabilidad clínica y
                            seguridad, y es un requisito de cualquier sistema que maneje historia
                            clínica.
                        </li>
                    </ul>

                    <p className="mt-4 font-medium text-slate-900">De los pacientes</p>
                    <ul className="list-disc space-y-1 pl-6">
                        <li>Datos de identificación y del episodio de internación.</li>
                        <li>
                            Signos vitales, alertas, notas de enfermería, medicación y demás
                            información clínica que el personal registra.
                        </li>
                        <li>Referencias a estudios de imagen almacenados por el hospital.</li>
                    </ul>
                    <p>
                        Estos datos los ingresa el personal del hospital en ejercicio de su labor
                        asistencial. La aplicación no los obtiene por su cuenta ni los toma del
                        dispositivo.
                    </p>
                </Seccion>

                <Seccion titulo="4. Permisos del dispositivo móvil">
                    <p>La aplicación solicita únicamente dos permisos:</p>
                    <ul className="list-disc space-y-2 pl-6">
                        <li>
                            <strong>Cámara.</strong> Se usa exclusivamente para leer los códigos QR
                            de los activos del hospital. Las imágenes se procesan en el momento y
                            no se almacenan ni se transmiten a ningún servidor.
                        </li>
                        <li>
                            <strong>Notificaciones.</strong> Para avisar de alertas clínicas. Las
                            notificaciones se generan en el propio dispositivo; la aplicación no
                            registra identificadores de envío en servicios de terceros.
                        </li>
                    </ul>
                    <p>
                        La aplicación <strong>bloquea de forma explícita</strong> los permisos de
                        ubicación (precisa y aproximada), micrófono y acceso al almacenamiento del
                        dispositivo. No puede solicitarlos aunque el sistema operativo lo
                        permitiera.
                    </p>
                </Seccion>

                <Seccion titulo="5. Qué se guarda en el dispositivo">
                    <p>
                        Solo la sesión activa: identificación de la persona usuaria, su token de
                        acceso, sus permisos y la fecha de expiración. Se almacena en el
                        almacenamiento seguro del sistema operativo (Keystore en Android, Llavero
                        en iOS), cifrado por el propio dispositivo.
                    </p>
                    <p>
                        Al cerrar sesión esa información se elimina. La aplicación no guarda
                        historias clínicas ni datos de pacientes en el teléfono.
                    </p>
                </Seccion>

                <Seccion titulo="6. Lo que VigiNurse no hace">
                    <ul className="list-disc space-y-1 pl-6">
                        <li>No incluye publicidad ni herramientas de analítica o rastreo.</li>
                        <li>
                            No integra SDK de terceros que recolecten datos (no hay Firebase
                            Analytics, Sentry, Google Ads ni equivalentes).
                        </li>
                        <li>No vende ni comparte datos personales con fines comerciales.</li>
                        <li>No rastrea a las personas usuarias entre aplicaciones o sitios web.</li>
                    </ul>
                </Seccion>

                <Seccion titulo="7. Dónde se alojan los datos">
                    <p>
                        La base de datos y los servicios de la plataforma se alojan en Microsoft
                        Azure, en centros de datos de los Estados Unidos. Microsoft actúa como
                        subencargado y no accede al contenido.
                    </p>
                    <p>
                        Las <strong>imágenes médicas permanecen en la infraestructura del propio
                        hospital</strong>. VigiNurse guarda únicamente la referencia al estudio;
                        las imágenes no se transfieren a la nube.
                    </p>
                </Seccion>

                <Seccion titulo="8. Medidas de seguridad">
                    <ul className="list-disc space-y-1 pl-6">
                        <li>Todo el tráfico viaja cifrado con TLS. No se acepta tráfico sin cifrar.</li>
                        <li>
                            Las contraseñas se guardan con función de derivación de clave; no se
                            almacenan en texto legible ni pueden recuperarse.
                        </li>
                        <li>
                            La sesión del panel web usa una cookie inaccesible desde JavaScript,
                            con política <code>SameSite</code> restrictiva.
                        </li>
                        <li>
                            Control de acceso por rol, con separación estricta entre hospitales:
                            el personal de un hospital no puede ver datos de otro.
                        </li>
                        <li>Registro de auditoría de los accesos y las modificaciones.</li>
                        <li>Límite de intentos de autenticación para contener ataques de fuerza bruta.</li>
                    </ul>
                </Seccion>

                <Seccion titulo="9. Conservación">
                    <p>
                        Los datos clínicos se conservan durante el plazo que determine el hospital
                        conforme a la normativa sanitaria aplicable, que suele exigir la
                        conservación de la historia clínica por varios años.
                    </p>
                    <p>
                        Las cuentas del personal se desactivan cuando el hospital lo solicita. Los
                        registros de auditoría se conservan por el plazo necesario para cumplir con
                        las obligaciones de trazabilidad.
                    </p>
                </Seccion>

                <Seccion titulo="10. Derechos de las personas titulares">
                    <p>
                        Conforme a la Ley N.º 8968 de Protección de la Persona frente al
                        tratamiento de sus datos personales, toda persona puede solicitar acceso,
                        rectificación, actualización o supresión de sus datos, así como revocar el
                        consentimiento cuando corresponda.
                    </p>
                    <p>
                        Si usted es paciente, la solicitud debe dirigirse{" "}
                        <strong>al hospital donde fue atendido</strong>, que es el responsable de
                        sus datos. Edintel no puede modificar ni eliminar información clínica sin
                        instrucción del hospital.
                    </p>
                    <p>
                        Si usted es personal usuario del sistema, puede escribir a{" "}
                        <a
                            className="font-medium text-blue-700 underline"
                            href={`mailto:${CORREO_PRIVACIDAD}`}
                        >
                            {CORREO_PRIVACIDAD}
                        </a>
                        .
                    </p>
                    <p>
                        Asimismo, puede presentar una denuncia ante la Agencia de Protección de
                        Datos de los Habitantes (PRODHAB) de Costa Rica.
                    </p>
                </Seccion>

                <Seccion titulo="11. Datos de personas menores de edad">
                    <p>
                        VigiNurse se utiliza en servicios de neonatología, por lo que trata datos
                        de personas recién nacidas y menores de edad. Ese tratamiento lo realiza el
                        hospital en el marco de la atención sanitaria, bajo su responsabilidad y
                        con las garantías que exige la normativa.
                    </p>
                    <p>
                        La aplicación no está dirigida a menores de edad como usuarios: solo la
                        utiliza personal sanitario autorizado.
                    </p>
                </Seccion>

                <Seccion titulo="12. Cambios en esta política">
                    <p>
                        Si modificamos esta política, actualizaremos la fecha del encabezado. Los
                        cambios relevantes se comunicarán además a los hospitales contratantes.
                    </p>
                </Seccion>

                <Seccion titulo="13. Contacto">
                    <p>
                        Edintel S.A. — San José, Costa Rica.
                        <br />
                        Consultas sobre privacidad:{" "}
                        <a
                            className="font-medium text-blue-700 underline"
                            href={`mailto:${CORREO_PRIVACIDAD}`}
                        >
                            {CORREO_PRIVACIDAD}
                        </a>
                    </p>
                </Seccion>
            </article>
        </main>
    );
}
