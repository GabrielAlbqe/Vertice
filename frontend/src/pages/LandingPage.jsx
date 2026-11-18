import { useEffect, useRef, useState } from 'react';
import Icone from '../componentes/canteiro/Icone';
import simbolo from '../assets/icone-vertice.png';
import './landing.css';
import FAQSection from '../componentes/FAQSection';

const links = [['inicio','Início'],['problema','O Problema'],['solucao','A Solução'],['funcionalidades','Funcionalidades'],['como-funciona','Como Funciona'],['sobre','Sobre'],['faq','Perguntas Frequentes']];
const problemas = [
 ['material','Informações descentralizadas','Planilhas, documentos e canais separados tornam a consulta e a organização mais difíceis.'],
 ['perfil','Falhas na comunicação','A distância entre a administração e a execução pode comprometer o alinhamento das equipes.'],
 ['obra','Dificuldade de acompanhamento','Sem uma visão integrada, acompanhar obras, recursos e ocorrências exige mais esforço.'],
 ['pendencias','Decisões com pouca visibilidade','Informações fragmentadas dificultam a leitura da situação operacional.'],
];
const recursos = [
 ['obra','Gestão de Obras','Informações, etapas e acompanhamento da execução em um ambiente centralizado.'],
 ['perfil','Gestão de Equipes','Cadastro de equipes, vínculos com obras e consulta de recursos próprios e terceiros.'],
 ['material','Gestão de Materiais','Cadastro de insumos, registros de consumo e acompanhamento das movimentações.'],
 ['atividade','Gestão de Maquinários','Cadastro e acompanhamento dos equipamentos utilizados nas obras.'],
 ['diario','Diário de Obra','Atividades, observações e registros da rotina do canteiro reunidos por obra.'],
 ['historico','Gestão Financeira','Custos planejados e realizados, lançamentos e indicadores para consulta.'],
 ['pendencias','Inteligência Operacional','Indicadores, filtros e análise de ocorrências para acompanhar a operação.'],
 ['historico','Histórico Preditivo','Evolução dos registros, tendências e comparação de cenários de custo.'],
];
const ambientes = {
 escritorio:{titulo:'Uma visão ampla para decidir.',texto:'Do acompanhamento das obras à organização dos recursos, as informações do campo ganham contexto para a gestão.',itens:['Obras e etapas','Equipes e recursos','Custos e indicadores'],icone:'obra',nome:'Escritório'},
 canteiro:{titulo:'A obra acontece. A informação acompanha.',texto:'Registre o dia a dia da execução no ambiente direcionado à operação, respeitando as obras e ações permitidas ao seu perfil.',itens:['Diário de obra','Atividades e consumo','Fotos e ocorrências'],icone:'diario',nome:'Canteiro'},
};
function Brand(){return <span className="lp-brand"><img src={simbolo} alt="" width="40" height="40"/><span>Vértice<span className="lp-brand-label">GESTÃO INTELIGENTE DE OBRAS</span></span></span>;}
function Arrow(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;}
function Access({children='Acessar Sistema',secondary=false}){return <a className={'lp-button'+(secondary?' lp-button-secondary':'')} href="/login">{children}<Arrow/></a>;}
function Title({number,label,title,children}){return <div className="lp-section-title"><span className="lp-eyebrow"><span>{number}</span>{label}</span><h2>{title}</h2>{children&&<p>{children}</p>}</div>;}
function Blueprint(){return <figure className="lp-blueprint" aria-label="Representação conceitual da integração entre Escritório e Canteiro">
 <div className="lp-drawing-top"><span>VÉRTICE / CONEXÃO ENTRE AMBIENTES</span><span>V.</span></div>
 <svg className="lp-building" viewBox="0 0 560 440" fill="none" aria-hidden="true">
 <defs><linearGradient id="lp-wall" x1="160" y1="80" x2="440" y2="380" gradientUnits="userSpaceOnUse"><stop stopColor="#1678ff" stopOpacity=".32"/><stop offset="1" stopColor="#0069ff" stopOpacity=".02"/></linearGradient></defs>
 <g stroke="#315076"><path d="M15 328 280 175 545 328 280 480Z M15 278 280 125 545 278 M15 228 280 75 545 228" strokeDasharray="3 8"/><path d="M75 363 340 210M135 398 400 245M195 433 460 280M75 293 340 446M135 258 400 411M195 223 460 376" opacity=".5"/></g>
 <path d="m150 170 130-75 130 75v170l-130 75-130-75Z" fill="url(#lp-wall)" stroke="#569aff" strokeWidth="1.5"/>
 <path d="m150 170 130 75 130-75M280 245v170M150 212l130 75 130-75M150 254l130 75 130-75M150 296l130 75 130-75M193 195v170M237 220v170M323 220v170M367 195v170" stroke="#4b8ce0" strokeWidth="1.2"/>
 <path d="m150 170 130-75 130 75-130 75Z" fill="#0069ff" fillOpacity=".15" stroke="#86b5ff"/>
 <path d="M280 95V45m-22 13 22-13 22 13M93 359l187 108 187-108M110 348l-17 11 18 10M449 348l18 11-18 10" stroke="#669ce3" strokeDasharray="4 5"/>
 <path d="M333 151V63h133M333 80l-63-36h196M333 64l-63-20v32M440 64v85m-5 0h10v12h-10Z" stroke="#a6caff" strokeWidth="2"/>
 <circle cx="150" cy="170" r="5" fill="#0069ff" stroke="#aacfff"/><circle cx="410" cy="340" r="5" fill="#0069ff" stroke="#aacfff"/>
 <path d="M150 170H73v-47M410 340h70v-42" stroke="#83b6ff" strokeWidth="1.5"/>
 </svg>
 <div className="lp-drawing-tag lp-tag-office"><Icone nome="obra"/><span>ESCRITÓRIO<strong>Planejamento e análise</strong></span></div>
 <div className="lp-drawing-tag lp-tag-field"><Icone nome="diario"/><span>CANTEIRO<strong>Registros da operação</strong></span></div>
 <figcaption><span className="lp-signal"/>Dois ambientes. Uma gestão integrada.<small>Fluxo conceitual da plataforma</small></figcaption>
 </figure>;}
export default function LandingPage(){
 const [menu,setMenu]=useState(false),[scrolled,setScrolled]=useState(false),[ambiente,setAmbiente]=useState('escritorio');
 const root=useRef(null),toggle=useRef(null),atual=ambientes[ambiente];
 useEffect(()=>{
  const oldTitle=document.title;document.title='Vértice — Gestão Inteligente para a Construção Civil';
  const scroll=()=>setScrolled(window.scrollY>20);
  const key=e=>{if(e.key==='Escape'){setMenu(false);toggle.current?.focus();}};
  scroll();window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('keydown',key);
  const media=window.matchMedia('(min-width: 1101px)'),close=()=>{if(media.matches)setMenu(false);};media.addEventListener('change',close);
  let observer;
  if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('lp-visible');observer.unobserve(entry.target);}}),{threshold:.08});
   root.current.querySelectorAll('[data-reveal]').forEach(el=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('lp-waiting');observer.observe(el);}});
  }
  return()=>{document.title=oldTitle;window.removeEventListener('scroll',scroll);window.removeEventListener('keydown',key);media.removeEventListener('change',close);observer?.disconnect();};
 },[]);
 return <div className="lp" ref={root}>
 <a href="#conteudo" className="lp-skip">Ir para o conteúdo</a>
 <header className={'lp-nav'+(scrolled?' lp-nav-scrolled':'')}><div className="lp-container lp-nav-inner">
 <a className="lp-home" href="#inicio" aria-label="Vértice — início" onClick={()=>setMenu(false)}><Brand/></a>
 <button className="lp-menu-toggle" ref={toggle} aria-expanded={menu} aria-controls="lp-navigation" aria-label={menu?'Fechar menu':'Abrir menu'} onClick={()=>setMenu(!menu)}><span/><span/><span/></button>
 <nav id="lp-navigation" className={'lp-navigation'+(menu?' lp-menu-open':'')} aria-label="Navegação principal">{links.map(([id,label])=><a key={id} href={'#'+id} onClick={()=>setMenu(false)}>{label}</a>)}<Access/></nav>
 </div></header>
 <main id="conteudo">
 <section id="inicio" className="lp-hero lp-container"><div className="lp-hero-copy"><span className="lp-eyebrow"><span className="lp-signal"/>GESTÃO INTELIGENTE PARA A CONSTRUÇÃO CIVIL</span><p className="lp-hero-brand">VÉRTICE</p><h1>Sua obra conectada.<br/><em>Sua gestão em<br className="lp-desktop-break"/> outro nível.</em></h1><p className="lp-lead">Do escritório ao canteiro, uma visão mais clara de cada obra.</p><p className="lp-hero-description">A Vértice conecta equipes, centraliza informações e transforma dados operacionais em uma visão integrada da construção.</p><div className="lp-actions"><a className="lp-button" href="#solucao">Conhecer a Plataforma<Arrow/></a><Access secondary/></div><div className="lp-hero-note"><span/>Planejamento, execução e informação no mesmo caminho.</div></div><Blueprint/></section>
 <div className="lp-foundation"><div className="lp-container"><span>DA ROTINA DA OBRA À VISÃO DA GESTÃO</span><p>Informações conectadas.<span/>Equipes alinhadas.<span/>Decisões com contexto.</p><a href="#como-funciona" aria-label="Conheça como funciona"><Arrow/></a></div></div>
 <section id="problema" className="lp-section lp-container" data-reveal><Title number="01" label="O DESAFIO" title={<>A construção civil evolui.<br/><span>A gestão precisa acompanhar.</span></>}>Equipes, materiais, equipamentos e prazos fazem parte da mesma obra. Quando as informações ficam separadas, enxergar o todo se torna mais difícil.</Title><div className="lp-problems">{problemas.map(([icon,title,text],i)=><article key={title}><div className="lp-card-top"><Icone nome={icon}/><span>0{i+1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
 <section id="solucao" className="lp-solution" data-reveal><div className="lp-container lp-solution-grid"><div><Title number="02" label="A SOLUÇÃO" title={<>Uma plataforma.<br/>Toda a gestão <span>conectada.</span></>}>A Vértice aproxima as atividades do Escritório e do Canteiro em um ambiente digital integrado. Menos fragmentação, mais contexto para acompanhar as obras.</Title><ul className="lp-checks">{['Centralização de informações','Acompanhamento operacional','Histórico de registros e indicadores','Controle de acesso por perfil'].map(t=><li key={t}><Icone nome="atividade"/>{t}</li>)}</ul><a href="#ambientes" className="lp-text-link">Conheça os dois ambientes<Arrow/></a></div><div className="lp-flow" role="img" aria-label="Fluxo conceitual: Escritório e Canteiro compartilham registros, recursos e indicadores com permissões por perfil"><span className="lp-flow-caption">INFORMAÇÃO QUE CONECTA A OBRA</span><div className="lp-flow-end"><Icone nome="obra"/><strong>Escritório</strong><span>Planejar · acompanhar · analisar</span></div><div className="lp-flow-line"/><div className="lp-flow-center"><img src={simbolo} alt="" width="48" height="48"/><div><strong>Vértice</strong><span>Registros · recursos · indicadores</span></div></div><div className="lp-flow-line"/><div className="lp-flow-end"><Icone nome="diario"/><strong>Canteiro</strong><span>Executar · registrar · informar</span></div><p>Uma estrutura central de dados.<br/>Acesso conforme as permissões de cada perfil.</p><small>Representação conceitual da integração</small></div></div></section>
 <section id="funcionalidades" className="lp-section lp-container" data-reveal><div className="lp-section-row"><Title number="03" label="RECURSOS DA PLATAFORMA" title={<>Tudo o que sua obra precisa,<br/><span>em um só lugar.</span></>}/><p>Ferramentas para organizar a rotina e construir uma visão mais completa da operação.</p></div><div className="lp-features">{recursos.map(([icon,title,text])=><article key={title}><span className="lp-feature-icon"><Icone nome={icon}/></span><h3>{title}</h3><p>{text}</p></article>)}</div><p className="lp-feature-note">As análises partem dos registros disponíveis. Tendências e cenários apoiam a avaliação, sem garantir resultados futuros.</p></section>
 <section id="ambientes" className="lp-environments" data-reveal><div className="lp-container"><Title number="04" label="ESCRITÓRIO + CANTEIRO" title={<>Do planejamento à execução,<br/><span>tudo conectado.</span></>}/><div className="lp-env-grid"><div><div className="lp-env-select" role="group" aria-label="Conheça os ambientes">{Object.entries(ambientes).map(([key,item])=><button key={key} type="button" aria-pressed={ambiente===key} aria-controls="lp-env-detail" onClick={()=>setAmbiente(key)}><Icone nome={item.icone}/>{item.nome}</button>)}</div><div id="lp-env-detail" className="lp-env-detail" aria-live="polite"><span className="lp-eyebrow">{atual.nome.toUpperCase()}</span><h3>{atual.titulo}</h3><p>{atual.texto}</p><ul>{atual.itens.map(t=><li key={t}><Icone nome="atividade"/>{t}</li>)}</ul></div></div><div className="lp-environment-pair"><article><span>VISÃO ESTRATÉGICA</span><Icone nome="obra"/><h3>Escritório</h3><p>Controle administrativo,<br/>recursos e indicadores.</p></article><div className="lp-pair-connection"><span/><img src={simbolo} alt="Vértice" width="44" height="44"/><span/></div><article><span>VISÃO OPERACIONAL</span><Icone nome="diario"/><h3>Canteiro</h3><p>Diário, atividades e registros<br/>da execução.</p></article><p className="lp-pair-caption">Dois ambientes. Uma gestão integrada.</p></div></div></div></section>
 <section id="como-funciona" className="lp-section lp-container" data-reveal><Title number="05" label="COMO FUNCIONA" title={<>Uma gestão mais organizada,<br/><span>do início ao acompanhamento.</span></>}/><ol className="lp-steps">{[['Organize','Cadastre e organize obras, equipes e recursos.'],['Conecte','Aproxime os processos administrativos e operacionais.'],['Acompanhe','Consulte atividades, registros e o andamento das obras.'],['Analise','Use indicadores e históricos para apoiar suas decisões.']].map(([title,text],i)=><li key={title}><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>
 <section className="lp-benefits" data-reveal><div className="lp-container lp-benefits-grid"><div><span className="lp-eyebrow">CONSTRUIR COM MAIS CONTEXTO</span><h2>Mais clareza<br/>para quem <em>constrói.</em></h2><p>Tecnologia a serviço de uma rotina mais organizada, do registro em campo à consulta no escritório.</p></div><ul>{['Informações mais organizadas','Melhor integração entre equipes','Maior visibilidade operacional','Acompanhamento centralizado','Facilidade na consulta de históricos','Apoio à tomada de decisões'].map((t,i)=><li key={t}><span>0{i+1}</span>{t}<Icone nome="atividade"/></li>)}</ul></div></section>
 <section id="sobre" className="lp-section lp-container lp-about" data-reveal><span className="lp-eyebrow">06 / SOBRE A VÉRTICE</span><div><h2>Tecnologia desenvolvida para<br/><span>conectar a construção civil.</span></h2><div className="lp-about-copy"><p>A Vértice nasce da proposta de tornar a gestão de obras mais integrada, organizada e acessível por meio da tecnologia.</p><p>Com ambientes direcionados às necessidades do Escritório e do Canteiro, a plataforma reúne ferramentas administrativas e operacionais para apoiar diferentes etapas da gestão.</p></div></div></section>
 <FAQSection/>
 <section className="lp-cta lp-container" data-reveal><div className="lp-cta-lines" aria-hidden="true"/><span className="lp-eyebrow">CONSTRUA UMA NOVA VISÃO DA SUA OBRA</span><h2>O próximo nível da gestão<br/>de obras começa aqui.</h2><p>Conecte informações, equipes e processos da construção civil.</p><Access>Acessar a Vértice</Access></section>
 </main><footer className="lp-footer lp-container"><div className="lp-footer-top"><div><a href="#inicio" aria-label="Vértice — voltar ao início"><Brand/></a><p>Escritório e Canteiro.<br/>Uma gestão inteligente de obras.</p></div><nav aria-label="Navegação do rodapé">{links.slice(1).map(([id,label])=><a href={'#'+id} key={id}>{label}</a>)}</nav><a href="/login" className="lp-text-link">Acessar Sistema<Arrow/></a></div><div className="lp-footer-bottom"><span>© {new Date().getFullYear()} Vértice.</span><span>Gestão Inteligente para a Construção Civil</span><a href="#inicio">Voltar ao início ↑</a></div></footer>
 </div>;
}
