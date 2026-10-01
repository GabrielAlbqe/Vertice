import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const base = "http://127.0.0.1:5174";
const porta = 9333;
const profile = path.resolve("node_modules/.cache/canteiro-browser-" + Date.now());
await mkdir(profile, { recursive: true });
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=" + porta, "--user-data-dir=" + profile, "about:blank"
], { windowsHide: true, stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
try {
  let alvo;
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch("http://127.0.0.1:" + porta + "/json/new?about:blank", { method: "PUT" }); alvo = await r.json(); break; } catch { await sleep(150); }
  }
  assert.ok(alvo?.webSocketDebuggerUrl, "Chrome não iniciou");
  ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", reject); });
  let seq = 0;
  const pendentes = new Map(), excecoes = [], errosReact = [], requests = [], resultados = [];
  const usuario = { id_usuario: 7, nome: "Equipe de Teste", email: "canteiro@teste.local", ocupacao: "Engenheiro", ambiente: "Canteiro", status: "Ativo", idconstrutora: 1 };
  const obras = [
    { id_obra: 1, nome: "Obra de teste com nome longo para validar responsividade", status: "Em andamento", id_construtora: 1, data_inicio_planejada: "2026-09-01", data_termino_planejada: "2026-12-31" },
    { id_obra: 2, nome: "Segunda obra de teste", status: "Em andamento", id_construtora: 1 },
    { id_obra: 99, nome: "Outra construtora", status: "Em andamento", id_construtora: 99 }
  ];
  const diarios = [{ id_diario: 11, data: "2026-09-30", clima: "Ensolarado", turno: "Manhã", etapa_atuacao: "Infraestrutura", equipe_interna: "A", equipe_terceirizada: "B", paralisacoes: "Nenhuma", origem_paralisacoes: "", atrasos: "Entrega atrasada", origem_atrasos: "Fornecedor", obrax_id: 1, usuario_id: 7 }];
  let falha = "", falhaPost = false;
  function cmd(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++seq, timeout = setTimeout(() => { pendentes.delete(id); reject(new Error("Timeout " + method)); }, 15000);
      pendentes.set(id, { resolve, reject, timeout });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async function responder(params) {
    const req = params.request, url = new URL(req.url), rota = url.pathname.replace("/api", "");
    requests.push({ rota, method: req.method, params: Object.fromEntries(url.searchParams), body: req.postData ? JSON.parse(req.postData) : null });
    const headers = [{ name: "Content-Type", value: "application/json" }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Access-Control-Allow-Headers", value: "Content-Type" }, { name: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" }];
    let status = 200, data = [];
    if (req.method === "OPTIONS") status = 204;
    else if (rota === falha || (falhaPost && req.method === "POST")) { status = 500; data = { error: "Falha simulada" }; }
    else if (req.method === "POST") {
      assert.ok(["/usuarios/login", "/diarios-obra/insert", "/apontamentos-fisicos/insert", "/apropriacoes/insert"].includes(rota), "POST desconhecido " + rota);
      if (rota === "/usuarios/login") data = { usuario };
      else { status = 201; data = { insertId: 20 };
        if (rota === "/diarios-obra/insert") diarios.push({ ...JSON.parse(req.postData), id_diario: 20 });
      }
    } else if (rota === "/obras") data = obras;
    else if (/^\/obras\/\d+$/.test(rota)) data = obras.find(o => String(o.id_obra) === rota.split("/").pop());
    else if (/^\/usuarios\/\d+$/.test(rota)) data = usuario;
    else if (rota === "/diarios-obra") data = diarios.filter(d => String(d.obrax_id) === url.searchParams.get("obrax_id"));
    else if (rota === "/atividades-eap") data = [{ id_atividade: 8, descricao: "Concretagem de teste", idx_obra: Number(url.searchParams.get("idx_obra")) }];
    else if (rota === "/apontamentos-fisicos") data = [{ id_apontamento: 1, percentual_dia: 12, url_foto: "", diario_id: Number(url.searchParams.get("diario_id")), atividade_eap_id: 8 }];
    else if (rota === "/equipes") data = [{ id_cadastro_equipes: 3, nome_equipe: "Equipe interna teste", idobra: 1, quantidade_profissionais: 5 }];
    else if (rota === "/insumos") data = [{ id_insumos: 4, nome: "Cimento teste", quantidade_disponivel: 20, idobra: 1 }];
    else if (rota === "/maquinarios") data = [{ id_maquina: 5, nome: "Betoneira teste", quantidade: 1, idobra: 1, status: "Ativo" }];
    await cmd("Fetch.fulfillRequest", { requestId: params.requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(status === 204 ? "" : JSON.stringify(data)).toString("base64") });
  }
  ws.addEventListener("message", async ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id) {
      const p = pendentes.get(msg.id);
      if (!p) return;
      clearTimeout(p.timeout); pendentes.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
    } else if (msg.method === "Fetch.requestPaused") {
      try { await responder(msg.params); } catch (e) { if (!e.message.includes("Invalid InterceptionId")) excecoes.push(e.message); }
    } else if (msg.method === "Runtime.exceptionThrown") excecoes.push(msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description || ""));
    else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      const text = msg.params.args.map(a => a.value || a.description || "").join(" ");
      if (/React|Warning:|Maximum update|unmounted|unique.*key/i.test(text)) errosReact.push(text);
    }
  });
  await cmd("Runtime.enable"); await cmd("Page.enable");
  await cmd("Fetch.enable", { patterns: [{ urlPattern: "*localhost:3000/api/*" }] });
  async function evaluate(expression) {
    const r = await cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async function esperar(expression) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100); }
    throw new Error("Não encontrado: " + expression + "\n" + await evaluate("document.body.innerText"));
  }
  async function click(texto) {
    await evaluate("(() => { const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===" + JSON.stringify(texto) + "); if(!b) throw new Error('Botão ausente'); b.click(); })()");
    await sleep(120);
  }
  async function input(seletor, valor) {
    await evaluate("(() => { const el=document.querySelector(" + JSON.stringify(seletor) + "); if(!el)throw new Error('Input ausente'); const setter=Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set; setter.call(el," + JSON.stringify(String(valor)) + "); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); })()");
    await sleep(50);
  }
  async function sessao(ambiente, pagina = "dashboard", obra = null) {
    usuario.ambiente = ambiente;
    await evaluate("localStorage.clear(); localStorage.setItem('usuario'," + JSON.stringify(JSON.stringify({ ...usuario, ambiente })) + "); localStorage.setItem('id_usuario','7'); localStorage.setItem('idconstrutora','1'); localStorage.setItem('ambiente'," + JSON.stringify(ambiente) + "); localStorage.setItem('pagina_atual'," + JSON.stringify(pagina) + ");" + (obra ? "localStorage.setItem('obra_selecionada'," + JSON.stringify(JSON.stringify(obra)) + ");" : ""));
    await cmd("Page.reload"); await sleep(250);
  }
  await cmd("Page.navigate", { url: base }); await esperar("!!document.querySelector('#email')");
  await input("#email", "canteiro@teste.local"); await input("#senha", "teste");
  await click("Entrar"); await esperar("!!document.querySelector('.ct-app') && document.querySelector('#ct-obra')?.options.length===3");
  assert.equal(await evaluate("localStorage.getItem('pagina_atual')"), "canteiro-home");
  assert.equal(await evaluate("document.querySelector('#ct-obra').value"), "");
  await input("#ct-obra", 1); await esperar("document.body.innerText.includes('Entrega atrasada')");
  resultados.push("Login Canteiro e seleção explícita da obra; outra construtora excluída");
  const paginas = [["Início", "Olá"], ["Diário", "Diário de Obra"], ["Pendências", "Rascunhos aguardando"], ["Histórico", "Buscar nos diários"], ["Perfil", "MINHA CONTA"]];
  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    for (const [botao, marcador] of paginas) {
      await click(botao); await esperar("document.body.innerText.includes(" + JSON.stringify(marcador) + ")");
      const overflow = await evaluate("document.documentElement.scrollWidth > innerWidth + 1");
      assert.equal(overflow, false, "Scroll horizontal em " + botao + " / " + width);
    }
    for (const botao of ["Consultar obra", "Registrar atividade", "Registrar ocorrência", "Registrar material"]) {
      await click("Início"); await click(botao);
      assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth + 1"), false, "Scroll horizontal em " + botao + " / " + width);
    }
    await click("Perfil"); await click("Prévia local de fotos");
    assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth + 1"), false, "Scroll horizontal nas fotos / " + width);
    if ([390, 1024].includes(width)) {
      await click("Início");
      await mkdir("tests/screenshots", { recursive: true });
      const foto = await cmd("Page.captureScreenshot", { format: "png" });
      await writeFile("tests/screenshots/canteiro-" + width + ".png", Buffer.from(foto.data, "base64"));
    }
    resultados.push("Todas as telas: navegação e ausência de scroll horizontal em " + width + "px");
  }
  await click("Diário"); await input("#ct-clima", "Ensolarado"); await input("#ct-turno", "Manhã"); await input("#ct-etapa_atuacao", "Infraestrutura");
  await click("Próximo"); await input("#ct-equipe_interna", "A"); await click("Próximo"); await input("#ct-paralisacoes", "Chuva no período"); await input("#ct-origem_paralisacoes", "Clima");
  await cmd("Network.enable"); await cmd("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await esperar("document.body.innerText.includes('Você está offline')");
  await click("Salvar rascunho");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('vertice:canteiro:rascunhos:7')).length"), 1);
  await click("Pendências"); await cmd("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await click("Revisar e enviar"); await esperar("document.querySelector('#ct-clima')?.value==='Ensolarado'");
  await esperar("![...document.querySelectorAll('button')].find(b=>b.textContent==='Enviar registro').disabled");
  await click("Enviar registro"); await esperar("document.body.innerText.includes('Registro enviado com sucesso')");
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('vertice:canteiro:rascunhos:7')).length"), 0);
  const diarioPost = requests.find(r => r.method === "POST" && r.rota === "/diarios-obra/insert");
  assert.deepEqual(Object.keys(diarioPost.body).sort(), ["data","clima","turno","etapa_atuacao","equipe_interna","equipe_terceirizada","paralisacoes","origem_paralisacoes","atrasos","origem_atrasos","obrax_id","usuario_id"].sort());
  assert.equal(diarioPost.body.obrax_id, 1); assert.equal(diarioPost.body.usuario_id, 7);
  resultados.push("Offline real: rascunho, restauração na mesma obra, envio manual e remoção após sucesso");
  await click("Início"); await esperar("document.body.innerText.includes('Registrar atividade')"); await click("Registrar atividade");
  await esperar("document.querySelector('select') && !document.body.innerText.includes('Carregando dados da obra')");
  await input("form select", 11); await input("form select:nth-of-type(1)", 11);
  await evaluate("document.querySelectorAll('form select')[1].value='8'; document.querySelectorAll('form select')[1].dispatchEvent(new Event('change',{bubbles:true}))");
  await input("#ct-percentual_dia", 12.5); await click("Enviar registro");
  await esperar("document.body.innerText.includes('Registro enviado com sucesso')");
  const atividadePost = requests.find(r => r.method === "POST" && r.rota === "/apontamentos-fisicos/insert");
  assert.equal(atividadePost.body.percentual_dia, 12.5); assert.equal(atividadePost.body.atividade_eap_id, 8);
  resultados.push("Apontamento físico: progresso e IDs conforme contrato");
  await click("Início"); await click("Registrar material"); await esperar("!!document.querySelector('#ct-quantidade_consumida')");
  await input("form select", 4);
  await evaluate("document.querySelectorAll('form select')[1].value='8'; document.querySelectorAll('form select')[1].dispatchEvent(new Event('change',{bubbles:true}))");
  await input("#ct-quantidade_consumida", 2);
  falhaPost = true; await click("Enviar registro"); await esperar("document.body.innerText.includes('Não foi possível enviar o registro')");
  assert.equal(await evaluate("document.querySelector('#ct-quantidade_consumida').value"), "2");
  falhaPost = false; await click("Enviar registro"); await esperar("document.body.innerText.includes('Registro enviado com sucesso')");
  const materialPost = requests.find(r => r.method === "POST" && r.rota === "/apropriacoes/insert");
  assert.equal(materialPost.body.id_insumo, 4); assert.equal(materialPost.body.id_usuario, 7);
  resultados.push("Material: contrato de apropriação; falha preserva formulário e permite novo envio");
  await click("Histórico"); await click("Ver registro completo"); await esperar("document.body.innerText.includes('Executado no dia:')");
  await input('input[type="search"]', "não existe"); assert.equal(await evaluate("document.querySelectorAll('.ct-card h3').length"), 1);
  resultados.push("Histórico com detalhes e consulta sob demanda dos apontamentos");
  await click("Perfil"); await click("Prévia local de fotos");
  assert.equal(await evaluate("!!document.querySelector('input[capture=environment]')"), true);
  await evaluate("(() => { const file=new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJekAAAAASUVORK5CYII='),c=>c.charCodeAt(0))],'teste.png',{type:'image/png'}); const dt=new DataTransfer(); dt.items.add(file); const input=document.querySelector('input[type=file]'); input.files=dt.files; input.dispatchEvent(new Event('change',{bubbles:true})); })()");
  await esperar("!!document.querySelector('.ct-photo img')"); await click("Remover imagem"); assert.equal(await evaluate("!!document.querySelector('.ct-photo img')"), false);
  resultados.push("Foto: seleção, captura e remoção local, sem upload");
  falha = "/diarios-obra"; await input("#ct-obra", 2); await esperar("document.body.innerText.includes('Não foi possível carregar diários')");
  assert.equal(await evaluate("!!document.querySelector('.ct-nav')"), true);
  falha = ""; await click("Tentar novamente"); await esperar("!document.body.innerText.includes('Não foi possível carregar diários')");
  resultados.push("Falha de carregamento, interface íntegra e recuperação");
  await sessao("Escritório", "canteiro-home"); await esperar("!!document.querySelector('.layout')"); assert.equal(await evaluate("!!document.querySelector('.ct-app')"), false);
  await cmd("Emulation.setDeviceMetricsOverride", { width: 360, height: 900, deviceScaleFactor: 1, mobile: true });
  await cmd("Page.reload"); await esperar("!!document.querySelector('.layout')");
  resultados.push("Escritório preservado em desktop e celular, sem troca por largura");
  await sessao("Canteiro", "dashboard", obras[0]); await esperar("!!document.querySelector('.ct-app')"); assert.equal(await evaluate("localStorage.getItem('pagina_atual')"), "canteiro-home");
  await click("Perfil"); await click("Sair da conta"); await esperar("!!document.querySelector('#email')"); assert.equal(await evaluate("localStorage.getItem('obra_selecionada')"), null);
  resultados.push("Restauração por ambiente e logout");
  assert.deepEqual(excecoes, [], "Exceções no navegador");
  assert.deepEqual(errosReact, [], "Erros React");
  await writeFile("tests/canteiro-browser-result.json", JSON.stringify({ passou: true, resultados, excecoes, errosReact, posts: requests.filter(r => r.method === "POST") }, null, 2));
  console.log(resultados.join("\n"));
  console.log("PASSOU: sem exceções no navegador ou erros React.");
} finally {
  if (ws?.readyState === WebSocket.OPEN) { ws.send(JSON.stringify({ id: 999999, method: "Browser.close" })); ws.close(); }
  chrome.kill();
}
