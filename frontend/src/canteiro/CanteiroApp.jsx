import CanteiroLayout from "../layouts/CanteiroLayout";
import HomeCanteiro from "../pages/canteiro/HomeCanteiro";
import DetalheObra from "../pages/canteiro/DetalheObra";
import Registrar from "../pages/canteiro/Registrar";
import RegistrarAtividade from "../pages/canteiro/RegistrarAtividade";
import RegistrarMaterial from "../pages/canteiro/RegistrarMaterial";
import RegistrarOcorrencia from "../pages/canteiro/RegistrarOcorrencia";
import RegistrarFoto from "../pages/canteiro/RegistrarFoto";
import HistoricoObras from "../pages/canteiro/HistoricoObras";
import CanteiroPendencias from "../pages/canteiro/CanteiroPendencias";
import CanteiroPerfil from "../pages/canteiro/CanteiroPerfil";
import DiarioObra from "../pages/canteiro/DiarioObra";
import RegistrosObra from "../pages/canteiro/RegistrosObra";
const telas = {
  "canteiro-home": HomeCanteiro, "canteiro-obra": DetalheObra, "canteiro-diario": DiarioObra, "canteiro-registrar": Registrar, "canteiro-registros": RegistrosObra,
  "canteiro-atividade": RegistrarAtividade, "canteiro-material": RegistrarMaterial, "canteiro-ocorrencia": RegistrarOcorrencia,
  "canteiro-foto": RegistrarFoto, "canteiro-historico": HistoricoObras, "canteiro-pendencias": CanteiroPendencias, "canteiro-perfil": CanteiroPerfil
};
export default function CanteiroApp({ pagina, onNavegar }) {
  const Tela = telas[pagina] || HomeCanteiro;
  return <CanteiroLayout pagina={pagina} onNavegar={onNavegar}><Tela key={pagina} /></CanteiroLayout>;
}
