import { useEffect, useState } from "react";
export default function FotoPreview() {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => {
    if (!arquivo) { setPreview(""); return; }
    const url = URL.createObjectURL(arquivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  function escolher(evento) {
    const foto = evento.target.files?.[0];
    evento.target.value = "";
    setErro("");
    if (!foto) return;
    if (!foto.type.startsWith("image/") || foto.size > 10 * 1024 * 1024) { setErro("Selecione uma imagem de até 10 MB."); return; }
    setArquivo(foto);
  }
  return <section className="ct-card"><h2>Foto no dispositivo</h2><p>A imagem é apenas uma prévia local. O sistema atual não permite enviar arquivos; ela não será salva no diário e será descartada ao sair desta tela.</p><div className="ct-stack"><label className="ct-field">Selecionar imagem<input type="file" accept="image/*" onChange={escolher} /></label><label className="ct-field">Abrir câmera<input type="file" accept="image/*" capture="environment" onChange={escolher} /></label></div>{erro && <p role="alert" className="ct-message ct-error">{erro}</p>}{preview && <div className="ct-photo"><img src={preview} alt="Prévia da imagem selecionada" /><button type="button" className="ct-button ct-secondary" onClick={() => setArquivo(null)}>Remover imagem</button></div>}</section>;
}
