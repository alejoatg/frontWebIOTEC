export interface FlujoCard {
  id: string;
  title: string;
  description: string;
  icon: "Flower2" | "ClipboardList";
  path: string;
  color: string;
}

export const ATENCION_PATH = "/dashboard/flujos/atencion";

export const FLUJOS_CARDS: FlujoCard[] = [
  {
    id: "atencion-abejas",
    title: "Atención de abejas",
    description: "Programación, visitas de campo y radicado consecutivo ATN.",
    icon: "Flower2",
    path: ATENCION_PATH,
    color: "#d97706",
  },
];
