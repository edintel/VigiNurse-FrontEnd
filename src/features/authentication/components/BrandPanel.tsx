// Muestra el componente de validacion icon.
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
// Muestra el componente de decor activity.
const DecorActivity = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="96"
    height="96"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
// Muestra el componente de decor heart.
const DecorHeart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
// Muestra el componente de decor clipboard.
const DecorClipboard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="112"
    height="112"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);
const features = [
  "Monitoreo de activos médicos en tiempo real",
  "Gestión clínica de pacientes",
  "Coordinación del personal médico",
];
// Componente de panel de marca que muestra el nombre del producto, una descripción y una lista de características, junto con elementos decorativos relacionados con la salud. Se utiliza en la página de autenticación para resaltar la identidad y los beneficios del sistema de gestión hospitalaria VIGINURSE.
export function BrandPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col justify-between overflow-hidden shrink-0"
      style={{
        width: "576px",
        minHeight: "849px",
        padding: "48px",
        backgroundImage: "linear-gradient(140.34deg, #1A2B5E 0%, #092168 100%)",
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ gap: "80px", padding: "40px", opacity: 0.05 }}
      >
        <DecorActivity />
        <DecorHeart />
        <DecorClipboard />
      </div>

      <div className="relative flex flex-col" style={{ gap: "48px" }}>
        <div>
          <p
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "36px",
              lineHeight: "40px",
              letterSpacing: "-0.9px",
              color: "#ffffff",
              margin: 0,
            }}
          >
            VIGINURSE
          </p>
        </div>

        <div
          className="flex flex-col"
          style={{ gap: "24px", maxWidth: "512px" }}
        >
          <div>
            <p
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: "30px",
                lineHeight: "37.5px",
                color: "#ffffff",
                margin: 0,
              }}
            >
              Sistema de Gestión
              <br />
              Hospitalaria
            </p>
          </div>

          <div>
            <p
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 400,
                fontSize: "18px",
                lineHeight: "28px",
                color: "#dbeafe",
                margin: 0,
              }}
            >
              Plataforma centralizada para la gestión clínica,
              <br />
              monitoreo de activos médicos y coordinación
              <br />
              hospitalaria en tiempo real.
            </p>
          </div>

          <div
            className="flex flex-col"
            style={{ gap: "16px", paddingTop: "24px" }}
          >
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-start"
                style={{ gap: "0" }}
              >
                <div
                  className="flex flex-col items-start shrink-0"
                  style={{ width: "24px", height: "28px", paddingTop: "4px" }}
                >
                  <CheckIcon />
                </div>
                <div style={{ paddingLeft: "12px" }}>
                  <p
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#ffffff",
                      margin: 0,
                    }}
                  >
                    {feature}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
