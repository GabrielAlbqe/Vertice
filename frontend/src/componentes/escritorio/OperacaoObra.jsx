import { useState } from 'react';
import { requisitar } from '../../api/api';
import { carregarApontamentos,formatarData } from '../../canteiro/dados';
import useConsultaObra from '../../canteiro/useConsultaObra';
import DiarioDetalhes from '../canteiro/DiarioDetalhes';
import GaleriaFotos from '../canteiro/GaleriaFotos';
import OcorrenciasObra from '../canteiro/OcorrenciasObra';
import HistoricoMateriais from '../canteiro/HistoricoMateriais';
import ProgressoAtividades from '../canteiro/ProgressoAtividades';
import '../../canteiro/canteiro.css';
import ResumoGestao from './ResumoGestao';
async function carregar(id,signal) {
  const [diarios,atividades]=await Promise.all([requisitar(`/diarios-obra?obrax_id=${id}`,{signal}),requisitar(`/atividades-eap?idx_obra=${id}`,{signal})]);
  if(!Array.isArray(diarios)||!Array.isArray(atividades))throw new Error('Resposta inválida do servidor.');
  const apontamentos=await carregarApontamentos(diarios,signal);return [{diarios,atividades,apontamentos}];
}
export default function OperacaoObra({obra}) {
  const r=useConsultaObra(obra,carregar),[selecionado,setSelecionado]=useState('');
  const data=r.dados[0];
  return <div className="ct-embedded ct-stack"><ResumoGestao obra={obra} /><div className="ct-row"><h2>Operação do Canteiro</h2><button type="button" className="ct-link" onClick={r.atualizar}>Atualizar diários e atividades</button></div>{r.carregando && <p role="status">Carregando operação…</p>}{r.erro && <p className="ct-message ct-error" role="alert">{r.erro}</p>}{data && <><label className="ct-field">Diário registrado<select value={selecionado} onChange={e=>setSelecionado(e.target.value)}><option value="">Selecione um diário</option>{data.diarios.map(d=><option key={d.id_diario} value={d.id_diario}>{formatarData(d.data)} · {d.turno} · #{d.id_diario}</option>)}</select></label>{selecionado && <DiarioDetalhes id={selecionado} />}<ProgressoAtividades atividades={data.atividades} apontamentos={data.apontamentos} /></>}<HistoricoMateriais obra={obra} /><GaleriaFotos atividades={data?.atividades||[]} obra={obra} /><OcorrenciasObra key={obra} obra={obra} /></div>;
}
