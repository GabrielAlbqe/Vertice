const caminhos = {
  inicio: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9",
  diario: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5",
  pendencias: "m12 3 10 18H2L12 3ZM12 9v5M12 17h.01",
  historico: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",
  perfil: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  atividade: "m5 12 4 4L19 6", material: "m3 7 9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10",
  foto: "M8 5 10 2h4l2 3h5v16H3V5h5ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  seta: "m9 5 7 7-7 7", obra: "M4 21V7h10v14M14 12h6v9M7 10h4M7 14h4M7 18h4"
};
export default function Icone({ nome }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={caminhos[nome] || caminhos.diario} /></svg>;
}
