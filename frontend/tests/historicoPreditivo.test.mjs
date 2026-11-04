import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resultadoCenario} from '../src/api/historicoPreditivo.js';
test('Cenário mantém custo realizado e varia apenas restante',()=>{assert.equal(resultadoCenario(100,200,10),320);assert.equal(resultadoCenario(100,200,-100),100);});
test('Cenário incompleto não mostra zero como estimativa',()=>{for(const v of [null,undefined,'',NaN])assert.equal(resultadoCenario(v,200,10),null);assert.equal(resultadoCenario(100,'',10),null);});
test('Cenário rejeita negativos e percentuais fora da faixa',()=>{assert.equal(resultadoCenario(-1,200,0),null);assert.equal(resultadoCenario(100,-1,0),null);assert.equal(resultadoCenario(100,200,-101),null);assert.equal(resultadoCenario(100,200,1001),null);});
