import Image from "next/image";

export function BrandPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col overflow-hidden shrink-0"
      style={{
        width: "576px",
        minHeight: "849px",
        padding: "48px 24px",
        backgroundColor: "#092168",
      }}
    >
      <div className="flex-1 flex items-center justify-center">
        <Image
          src="/LogoNegativo.png"
          alt="VigiNurse"
          width={528}
          height={528}
          priority
          className="w-full h-auto"
        />
      </div>

      <div className="text-center pb-2">
        <p
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "13px",
            color: "rgba(255,255,255,0.6)",
            margin: 0,
          }}
        >
          © {new Date().getFullYear()} Edintel S.A. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
