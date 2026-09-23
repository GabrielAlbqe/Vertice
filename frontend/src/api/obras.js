import { requisitar } from "../api";

const ID_CONSTRUTORA = 1;

export function listarObras() {
  return requisitar(`/obras?id_construtora=${ID_CONSTRUTORA}`);
}