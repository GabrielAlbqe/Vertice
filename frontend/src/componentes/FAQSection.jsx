import { useId, useState } from 'react';
import './FAQSection.css';

const perguntas = [
 ['O que é a Vértice?', 'A Vértice é uma plataforma digital de gestão voltada à construção civil, desenvolvida para centralizar informações, organizar processos e integrar as atividades administrativas e operacionais de uma obra.'],
 ['Qual problema a Vértice busca resolver?', 'A Vértice busca reduzir a fragmentação das informações e as dificuldades de comunicação e acompanhamento entre escritório e canteiro, proporcionando uma visão mais integrada das operações.'],
 ['Como funciona a integração entre Escritório e Canteiro?', 'A plataforma disponibiliza ambientes específicos para diferentes perfis de usuário. Esses ambientes compartilham uma estrutura central de dados, permitindo que informações autorizadas sejam consultadas e utilizadas conforme as responsabilidades de cada perfil.'],
 ['Quais funcionalidades a Vértice oferece?', 'A plataforma reúne recursos de gestão de obras, equipes, materiais, maquinários, registros operacionais e acompanhamento de indicadores, conforme os módulos disponibilizados na versão atual.'],
 ['O que é o Diário de Obra?', 'É uma funcionalidade destinada ao registro de atividades, acontecimentos e informações relacionadas à execução de uma obra, contribuindo para a organização e o histórico operacional.'],
 ['A Vértice permite acompanhar o andamento das obras?', 'Sim. A plataforma possui recursos para consultar informações de execução e acompanhamento das obras, conforme os registros realizados e as permissões de cada usuário.'],
 ['Como funciona o controle de acesso?', 'A Vértice utiliza autenticação e regras de autorização para restringir o acesso às funcionalidades e aos dados de acordo com o perfil e a construtora vinculada ao usuário.'],
 ['A Vértice pode ser utilizada em dispositivos móveis?', 'A interface foi desenvolvida com foco em responsividade, permitindo sua utilização em diferentes tamanhos de tela. A experiência depende das funcionalidades e condições de acesso disponíveis.'],
 ['A Vértice substitui completamente a gestão tradicional de obras?', 'A Vértice foi desenvolvida para apoiar e organizar a gestão de obras por meio de ferramentas digitais. Sua utilização complementa os processos de planejamento, acompanhamento e tomada de decisão das equipes.'],
 ['Como posso acessar a plataforma?', 'O acesso é realizado pela página de autenticação da Vértice, utilizando uma conta habilitada e as permissões correspondentes ao perfil do usuário.'],
];

export default function FAQSection() {
 const [aberta, setAberta] = useState(null);
 const prefixo = useId();
 return <section id="faq" className="lp-section lp-container lp-faq" aria-labelledby={`${prefixo}-titulo`} data-reveal>
  <div className="lp-section-title">
   <span className="lp-eyebrow"><span>07</span>PERGUNTAS FREQUENTES</span>
   <h2 id={`${prefixo}-titulo`}>Perguntas frequentes</h2>
   <p>Tudo o que você precisa saber sobre a Vértice e como nossa plataforma conecta a gestão do Escritório às operações do Canteiro.</p>
  </div>
  <div className="lp-faq-list">
   {perguntas.map(([pergunta, resposta], indice) => {
    const expandida = aberta === indice;
    const botaoId = `${prefixo}-pergunta-${indice}`;
    const respostaId = `${prefixo}-resposta-${indice}`;
    return <article className="lp-faq-card" key={pergunta}>
     <h3><button type="button" id={botaoId} aria-expanded={expandida} aria-controls={respostaId} onClick={() => setAberta(atual => atual === indice ? null : indice)}>
      <span>{pergunta}</span>
      <svg className="lp-faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={expandida ? 'M5 12h14' : 'M5 12h14M12 5v14'}/></svg>
     </button></h3>
     <div id={respostaId} className="lp-faq-answer" role="region" aria-labelledby={botaoId} aria-hidden={!expandida} inert={!expandida}>
      <div><p>{resposta}</p></div>
     </div>
    </article>;
   })}
  </div>
 </section>;
}