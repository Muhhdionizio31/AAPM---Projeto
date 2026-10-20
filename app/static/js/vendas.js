/* =========================================================
   AAPM SENAI — Módulo de Vendas (PDV)
   Gerenciamento de Carrinho, Modais, Comprovantes e Interações
   ========================================================= */

let vendaAtualId = null;
let vendaAtualCarregada = false;

function obterProdutosPdv() {
  return Array.isArray(window.PRODUTOS_PDV) ? window.PRODUTOS_PDV : [];
}

/* =========================================================
   UTILITÁRIOS DE MODAL
========================================================= */
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.error('Modal não encontrado:', id);
    return;
  }
  modal.style.setProperty('display', 'flex', 'important');
  modal.classList.add('visivel', 'aberto');
  document.body.classList.add('modal-aberto-body');
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.setProperty('display', 'none', 'important');
  modal.classList.remove('visivel', 'aberto');
  document.body.classList.remove('modal-aberto-body');
}

function fecharModalFora(event, id) {
  if (event && event.target && event.target.id === id) {
    fecharModal(id);
  }
}

/* =========================================================
   MENU MOBILE
========================================================= */
function abrirMenuMobile() {
  const lateral = document.getElementById('barraLateral');
  const sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.add('aberta');
  if (sobreposicao) sobreposicao.classList.add('visivel');
}

function fecharMenuMobile() {
  const lateral = document.getElementById('barraLateral');
  const sobreposicao = document.getElementById('barraSobreposicao');
  if (lateral) lateral.classList.remove('aberta');
  if (sobreposicao) sobreposicao.classList.remove('visivel');
}

/* =========================================================
   FORMATAÇÃO E SEGURANÇA
========================================================= */
const fmt = valor =>
  'R$ ' + Number(valor || 0)
    .toFixed(2)
    .replace('.', ',');

function escapeHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
   AUXILIARES DE CLIENTE E DESCONTO
========================================================= */
function atualizarDescontoECliente() {
  const selectCliente = document.getElementById('modalCliente');
  const inputDesconto = document.getElementById('modalDesconto');

  if (selectCliente && inputDesconto) {
    const opcao = selectCliente.options[selectCliente.selectedIndex];
    const desconto = parseFloat(opcao?.getAttribute('data-desconto')) || 0;
    inputDesconto.value = desconto.toFixed(1);
  }

  calcularTotal();
}

/* =========================================================
   ESTADO E GERENCIAMENTO DE FORMAS DE PAGAMENTO
========================================================= */
let totalLiquidoAtual = 0;
let segundoPagamentoAtivo = false;

function sincronizarPagamentos() {
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');

  if (!segundoPagamentoAtivo) {
    if (inputVal1) {
      inputVal1.value = totalLiquidoAtual > 0 ? totalLiquidoAtual.toFixed(2) : '0.00';
    }
  } else {
    let val1 = parseFloat(inputVal1?.value) || 0;
    if (val1 > totalLiquidoAtual) {
      val1 = totalLiquidoAtual;
      if (inputVal1) inputVal1.value = val1.toFixed(2);
    }
    const restante = Math.max(0, Math.round((totalLiquidoAtual - val1) * 100) / 100);
    if (inputVal2) {
      inputVal2.value = restante.toFixed(2);
    }
  }

  atualizarResumoPagamentos();
}

function alternarSegundoPagamento() {
  segundoPagamentoAtivo = true;
  const linha2 = document.getElementById('linhaPagamento2');
  const btnToggle = document.getElementById('btnTogglePagamento2');
  const selectFp2 = document.getElementById('modalFormaPagamento2');
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');

  if (linha2) linha2.style.display = 'flex';
  if (btnToggle) btnToggle.style.display = 'none';

  let val1 = parseFloat(inputVal1?.value) || 0;
  if (val1 >= totalLiquidoAtual && totalLiquidoAtual > 0) {
    val1 = Math.round((totalLiquidoAtual / 2) * 100) / 100;
    if (inputVal1) inputVal1.value = val1.toFixed(2);
  }
  const restante = Math.max(0, Math.round((totalLiquidoAtual - val1) * 100) / 100);
  if (inputVal2) inputVal2.value = restante.toFixed(2);

  atualizarResumoPagamentos();
}

function removerSegundoPagamento() {
  segundoPagamentoAtivo = false;
  const linha2 = document.getElementById('linhaPagamento2');
  const btnToggle = document.getElementById('btnTogglePagamento2');
  const selectFp2 = document.getElementById('modalFormaPagamento2');
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');

  if (linha2) linha2.style.display = 'none';
  if (btnToggle) btnToggle.style.display = 'inline-flex';
  if (selectFp2) selectFp2.value = '';
  if (inputVal2) inputVal2.value = '';
  if (inputVal1) inputVal1.value = totalLiquidoAtual > 0 ? totalLiquidoAtual.toFixed(2) : '0.00';

  atualizarResumoPagamentos();
}

function aoDigitarValorPagamento(opcao) {
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');

  if (segundoPagamentoAtivo) {
    if (opcao === 1) {
      const val1 = parseFloat(inputVal1?.value) || 0;
      if (val1 <= totalLiquidoAtual) {
        const restante = Math.max(0, Math.round((totalLiquidoAtual - val1) * 100) / 100);
        if (inputVal2) inputVal2.value = restante.toFixed(2);
      }
    }
  }

  atualizarResumoPagamentos();
}

function aoMudarFormaPagamento() {
  atualizarResumoPagamentos();
}

function atualizarResumoPagamentos() {
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');
  const selectFp1 = document.getElementById('modalFormaPagamento1');
  const selectFp2 = document.getElementById('modalFormaPagamento2');

  const textoTotalPago = document.getElementById('textoTotalPago');
  const colunaTroco = document.getElementById('colunaTroco');
  const textoTroco = document.getElementById('textoTroco');
  const colunaRestante = document.getElementById('colunaRestante');
  const textoRestante = document.getElementById('textoRestante');

  const val1 = parseFloat(inputVal1?.value) || 0;
  const val2 = segundoPagamentoAtivo ? (parseFloat(inputVal2?.value) || 0) : 0;
  const totalPago = Math.round((val1 + val2) * 100) / 100;

  if (textoTotalPago) {
    textoTotalPago.textContent = fmt(totalPago);
  }

  const diferenca = Math.round((totalPago - totalLiquidoAtual) * 100) / 100;

  if (diferenca < -0.009 && totalLiquidoAtual > 0) {
    if (colunaRestante) colunaRestante.style.display = 'flex';
    if (textoRestante) textoRestante.textContent = fmt(Math.abs(diferenca));
    if (colunaTroco) colunaTroco.style.display = 'none';
  } else if (diferenca > 0.009) {
    const fp1 = selectFp1?.value || '';
    const fp2 = selectFp2?.value || '';
    const aceitaTroco = (fp1 === 'Dinheiro' || (segundoPagamentoAtivo && fp2 === 'Dinheiro'));

    if (aceitaTroco) {
      if (colunaTroco) colunaTroco.style.display = 'flex';
      if (textoTroco) textoTroco.textContent = fmt(diferenca);
      if (colunaRestante) colunaRestante.style.display = 'none';
    } else {
      if (colunaTroco) colunaTroco.style.display = 'none';
      if (colunaRestante) colunaRestante.style.display = 'none';
    }
  } else {
    if (colunaRestante) colunaRestante.style.display = 'none';
    if (colunaTroco) colunaTroco.style.display = 'none';
  }
}

/* =========================================================
   CÁLCULO E ATUALIZAÇÃO DO CARRINHO
========================================================= */
function calcularTotal() {
  const containerItens = document.getElementById('listaItensModal');
  const elementoTotal = document.getElementById('totalModal');
  const selectCliente = document.getElementById('modalCliente');
  const inputDesconto = document.getElementById('modalDesconto');
  const inputCarrinhoJson = document.getElementById('carrinhoJson');

  if (!containerItens || !elementoTotal) return;

  let percentualDesconto = 0;
  if (inputDesconto) {
    const val = parseFloat(inputDesconto.value);
    if (!isNaN(val)) {
      percentualDesconto = Math.max(0, Math.min(100, val));
    }
  }

  let totalBruto = 0;
  const carrinho = [];
  const produtos = obterProdutosPdv();

  const linhas = containerItens.querySelectorAll('.linha-item-modal');
  linhas.forEach(linha => {
    const selectProduto = linha.querySelector('.select-produto');
    const selectVariacao = linha.querySelector('.select-variacao');
    const inputQtd = linha.querySelector('.input-quantidade');
    const spanPreco = linha.querySelector('.preco-unitario');

    const produtoId = parseInt(selectProduto?.value, 10);
    const quantidade = parseInt(inputQtd?.value, 10) || 0;

    if (!produtoId || quantidade <= 0) {
      if (spanPreco) spanPreco.textContent = 'R$ 0,00';
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    let precoUnitario = 0;
    let variacaoId = null;

    if (produto) {
      if (produto.variacoes && produto.variacoes.length > 0) {
        if (selectVariacao && selectVariacao.value) {
          const optVar = selectVariacao.options[selectVariacao.selectedIndex];
          variacaoId = parseInt(selectVariacao.value, 10);
          precoUnitario = parseFloat(optVar.getAttribute('data-preco')) || parseFloat(produto.preco) || 0;
        }
      } else {
        precoUnitario = parseFloat(produto.preco) || 0;
      }
    }

    if (spanPreco) {
      spanPreco.textContent = fmt(precoUnitario * quantidade);
    }

    if (precoUnitario > 0) {
      totalBruto += precoUnitario * quantidade;
      carrinho.push({
        produto_id: produtoId,
        variacao_id: variacaoId,
        quantidade: quantidade,
        preco_unitario: precoUnitario
      });
    }
  });

  const valorDesconto = totalBruto * (percentualDesconto / 100);
  const totalLiquido = Math.max(0, totalBruto - valorDesconto);

  totalLiquidoAtual = Math.round(totalLiquido * 100) / 100;
  elementoTotal.textContent = fmt(totalLiquido);

  const rotuloDesconto = document.getElementById('rotuloDescontoTotal');
  if (rotuloDesconto) {
    if (percentualDesconto > 0) {
      rotuloDesconto.textContent = `Já calculado com ${percentualDesconto.toFixed(1)}% de desconto`;
    } else {
      rotuloDesconto.textContent = 'Sem desconto aplicado';
    }
  }

  sincronizarPagamentos();

  if (inputCarrinhoJson) {
    inputCarrinhoJson.value = JSON.stringify(carrinho);
  }
}

function aoMudarProduto(selectProduto) {
  const linha = selectProduto.closest('.linha-item-modal');
  if (!linha) return;

  const selectVariacao = linha.querySelector('.select-variacao');
  const spanPreco = linha.querySelector('.preco-unitario');
  const inputQtd = linha.querySelector('.input-quantidade');
  const produtoId = parseInt(selectProduto.value, 10);

  const produtos = obterProdutosPdv();
  const produto = produtos.find(p => p.id === produtoId);

  if (selectVariacao) {
    selectVariacao.innerHTML = '<option value="">Selecione o tamanho...</option>';
    selectVariacao.style.display = 'none';
  }

  if (!produto) {
    if (spanPreco) spanPreco.textContent = 'R$ 0,00';
    calcularTotal();
    return;
  }

  if (produto.variacoes && produto.variacoes.length > 0 && selectVariacao) {
    produto.variacoes.forEach(v => {
      const preco = parseFloat(produto.preco) || 0;
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.setAttribute('data-preco', preco);
      opt.setAttribute('data-estoque', v.estoque || 0);
      opt.textContent = `${v.tamanho || 'Tamanho'} (${v.estoque} em estoque) - ${fmt(preco)}`;
      selectVariacao.appendChild(opt);
    });

    selectVariacao.style.display = 'inline-block';
    if (spanPreco) spanPreco.textContent = 'R$ 0,00';
  } else {
    const preco = parseFloat(produto.preco) || 0;
    selectProduto.setAttribute('data-preco', preco);
    if (inputQtd && produto.estoque) {
      inputQtd.max = produto.estoque;
    }
    if (spanPreco) spanPreco.textContent = fmt(preco * (parseInt(inputQtd?.value, 10) || 1));
  }

  calcularTotal();
}

function aoMudarVariacao(selectVariacao) {
  const linha = selectVariacao.closest('.linha-item-modal');
  if (!linha) return;

  const spanPreco = linha.querySelector('.preco-unitario');
  const inputQtd = linha.querySelector('.input-quantidade');
  const optSel = selectVariacao.options[selectVariacao.selectedIndex];

  if (selectVariacao.value && optSel) {
    const preco = parseFloat(optSel.getAttribute('data-preco')) || 0;
    const estoque = parseInt(optSel.getAttribute('data-estoque'), 10);
    if (inputQtd && estoque) {
      inputQtd.max = estoque;
    }
    const qtd = parseInt(inputQtd?.value, 10) || 1;
    if (spanPreco) spanPreco.textContent = fmt(preco * qtd);
  } else {
    if (spanPreco) spanPreco.textContent = 'R$ 0,00';
  }

  calcularTotal();
}

function adicionarLinhaItem() {
  const container = document.getElementById('listaItensModal');
  if (!container) return;

  const divLinha = document.createElement('div');
  divLinha.className = 'linha-item-modal';

  const produtos = obterProdutosPdv();
  let produtosHTML = '<option value="">Selecione um produto...</option>';
  produtos.forEach(p => {
    produtosHTML += `<option value="${p.id}">${escapeHtml(p.nome)} (${fmt(p.preco)})</option>`;
  });

  divLinha.innerHTML = `
    <div class="campo-item-produto" style="flex: 2; min-width: 140px;">
      <select class="select-produto" onchange="aoMudarProduto(this)" style="width: 100%;">
        ${produtosHTML}
      </select>
    </div>
    <div class="campo-item-variacao" style="flex: 1.5; min-width: 120px;">
      <select class="select-variacao" onchange="aoMudarVariacao(this)" style="width: 100%; display: none;">
        <option value="">Selecione o tamanho...</option>
      </select>
    </div>
    <div class="campo-item-qtd" style="width: 70px;">
      <input type="number" class="input-quantidade" value="1" min="1" oninput="calcularTotal()" style="width: 100%; text-align: center;" placeholder="Qtd">
    </div>
    <div class="campo-item-subtotal" style="min-width: 80px; text-align: right;">
      <span class="preco-unitario" style="font-weight: 700; font-size: 0.85rem; color: #111827;">R$ 0,00</span>
    </div>
    <button type="button" class="btn-remover" onclick="removerLinhaItem(this)" title="Remover item">✕</button>
  `;

  container.appendChild(divLinha);
}

function removerLinhaItem(botao) {
  const linha = botao.closest('.linha-item-modal');
  if (linha) {
    linha.remove();
    calcularTotal();
  }
}

/* =========================================================
   MODAL DE NOVA VENDA
========================================================= */
function abrirModalVenda() {
  const listaItens = document.getElementById('listaItensModal');
  const carrinhoJson = document.getElementById('carrinhoJson');
  const modalCliente = document.getElementById('modalCliente');
  const modalObservacao = document.getElementById('modalObservacao');

  if (modalCliente) modalCliente.value = '0';
  if (modalObservacao) modalObservacao.value = '';
  if (listaItens) listaItens.innerHTML = '';
  if (carrinhoJson) carrinhoJson.value = '';

  const selectFp1 = document.getElementById('modalFormaPagamento1');
  if (selectFp1) selectFp1.value = 'PIX';
  removerSegundoPagamento();

  atualizarDescontoECliente();

  const produtos = obterProdutosPdv();
  if (produtos.length > 0) {
    adicionarLinhaItem();
  }

  calcularTotal();
  abrirModal('modalVenda');
}

function prepararEnvioVenda(event) {
  const inputDesconto = document.getElementById('modalDesconto');
  if (inputDesconto) {
    let val = parseFloat(inputDesconto.value);
    if (isNaN(val) || val < 0) {
      inputDesconto.value = '0.0';
    } else if (val > 100) {
      inputDesconto.value = '100.0';
    } else {
      inputDesconto.value = val.toFixed(1);
    }
  }

  calcularTotal();

  const inputCarrinho = document.getElementById('carrinhoJson');
  let itensCarrinho = [];

  try {
    itensCarrinho = JSON.parse(inputCarrinho.value || '[]');
  } catch (err) {
    itensCarrinho = [];
  }

  if (!itensCarrinho || itensCarrinho.length === 0) {
    if (event) event.preventDefault();
    exibirToast('Selecione ao menos um produto válido para finalizar.', false);
    return false;
  }

  // Validação de formas de pagamento
  const inputVal1 = document.getElementById('modalValorPagamento1');
  const inputVal2 = document.getElementById('modalValorPagamento2');
  const selectFp2 = document.getElementById('modalFormaPagamento2');

  const val1 = parseFloat(inputVal1?.value) || 0;
  const val2 = segundoPagamentoAtivo ? (parseFloat(inputVal2?.value) || 0) : 0;
  const totalPago = Math.round((val1 + val2) * 100) / 100;

  if (segundoPagamentoAtivo) {
    if (!selectFp2?.value) {
      if (event) event.preventDefault();
      exibirToast('Selecione o método da 2ª forma de pagamento.', false);
      return false;
    }
    if (val2 <= 0) {
      if (event) event.preventDefault();
      exibirToast('Informe o valor para a 2ª forma de pagamento.', false);
      return false;
    }
  }

  if (totalLiquidoAtual > 0 && totalPago < totalLiquidoAtual - 0.009) {
    if (event) event.preventDefault();
    const faltam = fmt(totalLiquidoAtual - totalPago);
    exibirToast(`Valor informado insuficiente! Faltam ${faltam} para cobrir a venda.`, false);
    return false;
  }

  return true;
}

/* =========================================================
   MODAL DE COMPROVANTE
========================================================= */
async function verDetalhesVenda(id) {
  const conteudo = document.getElementById('conteudoDetalhe');
  const btnBaixar = document.getElementById('btnBaixarComprovante');

  if (!conteudo) return;

  abrirModal('modalDetalhe');
  vendaAtualId = id;
  vendaAtualCarregada = false;

  if (btnBaixar) btnBaixar.disabled = true;

  conteudo.innerHTML = `
    <div class="comprovante-loading" style="padding: 30px; text-align: center; color: #6b7280;">
      <p>Carregando comprovante da venda #${id}...</p>
    </div>
  `;

  try {
    const resposta = await fetch(`/pdv/venda/${id}/json`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resposta.ok) throw new Error(`Erro ${resposta.status}: Não foi possível carregar os dados.`);

    const dados = await resposta.json();
    if (dados.erro) throw new Error(dados.mensagem || 'Venda não encontrada.');

    let itensHtml = '';
    if (dados.itens && dados.itens.length > 0) {
      itensHtml = dados.itens.map(item => `
        <div class="comprovante-item">
          <div class="comprovante-item-nome">
            <strong>${escapeHtml(item.produto_nome)}</strong>
            <small>${item.quantidade}x un. (${fmt(item.preco_unitario)})</small>
          </div>
          <strong class="comprovante-item-preco">${fmt(item.subtotal)}</strong>
        </div>
      `).join('');
    } else {
      itensHtml = `<div style="text-align:center; color:#999; padding:15px;">Nenhum item registrado.</div>`;
    }

    conteudo.innerHTML = `
      <div class="comprovante" id="cupomImpressao">
        <div class="comprovante-topo">
          <div>
            <h3>AAPM SENAI</h3>
            <span>Escola SENAI Francisco Matarazzo</span>
          </div>
          <div class="comprovante-cupom-id">#${dados.id}</div>
        </div>

        <div class="comprovante-info">
          <div><span>Data/Hora:</span> <strong>${escapeHtml(dados.data || '—')}</strong></div>
          <div><span>Cliente:</span> <strong>${escapeHtml(dados.cliente || 'Cliente Balcão')}</strong></div>
          <div><span>Operador:</span> <strong>${escapeHtml(dados.operador || 'Sistema')}</strong></div>
        </div>

        <div class="comprovante-itens">
          <h4>Itens Comprados</h4>
          ${itensHtml}
        </div>

        <div class="comprovante-valores">
          <div><span>Total Bruto:</span> <strong>${fmt(dados.total_bruto)}</strong></div>
          <div><span>Desconto:</span> <strong>${Number(dados.desconto_percentual || 0).toFixed(1)}%</strong></div>
          <div class="comprovante-total">
            <span>TOTAL PAGO:</span>
            <strong>${fmt(dados.total_liquido)}</strong>
          </div>
        </div>

        <div class="comprovante-pagamento">
          <h4>Forma(s) de Pagamento</h4>
          <div>
            <span>${escapeHtml(dados.forma_pagamento_1 || 'Dinheiro')}:</span>
            <strong>${fmt(dados.valor_pagamento_1)}</strong>
          </div>
          ${dados.forma_pagamento_2 ? `
          <div>
            <span>${escapeHtml(dados.forma_pagamento_2)}:</span>
            <strong>${fmt(dados.valor_pagamento_2)}</strong>
          </div>` : ''}
          ${dados.troco && dados.troco > 0 ? `
          <div style="color: #059669; font-weight: 700; margin-top: 4px;">
            <span>Troco:</span>
            <strong>${fmt(dados.troco)}</strong>
          </div>` : ''}
        </div>

        ${dados.observacao ? `
          <div class="comprovante-observacao">
            <strong>Obs:</strong> ${escapeHtml(dados.observacao)}
          </div>` : ''}

        <div class="comprovante-rodape-texto">
          Documento Não Fiscal &middot; Sistema AAPM
        </div>
      </div>
    `;

    vendaAtualCarregada = true;
    if (btnBaixar) btnBaixar.disabled = false;

  } catch (erro) {
    console.error('Erro ao abrir comprovante:', erro);
    conteudo.innerHTML = `
      <div style="padding:24px; text-align:center; color:#dc2626;">
        <strong style="font-size:1rem;">Falha ao carregar o comprovante</strong>
        <p style="margin:8px 0 16px; color:#6b7280; font-size:0.85rem;">${escapeHtml(erro.message)}</p>
        <button type="button" onclick="verDetalhesVenda(${Number(id)})" class="btn-principal" style="margin:0 auto;">
          Tentar novamente
        </button>
      </div>
    `;
  }
}

/* =========================================================
   BAIXAR / IMPRIMIR COMPROVANTE
========================================================= */
async function baixarComprovante() {
  if (!vendaAtualCarregada) return;

  const elemento = document.getElementById('cupomImpressao');
  const btn = document.getElementById('btnBaixarComprovante');
  if (!elemento || !btn) return;

  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Gerando comprovante...';

  try {
    if (typeof html2canvas !== 'undefined') {
      const canvas = await html2canvas(elemento, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `comprovante-venda-${vendaAtualId}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      link.remove();

      exibirToast('Comprovante baixado com sucesso!');
    } else {
      window.print();
    }
  } catch (erro) {
    console.error('Erro ao baixar comprovante:', erro);
    exibirToast('Não foi possível gerar a imagem. Tentando impressão...', false);
    window.print();
  } finally {
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
  }
}

/* =========================================================
   TOAST DE NOTIFICAÇÃO
========================================================= */
function exibirToast(mensagem, sucesso = true) {
  const toast = document.getElementById('toast');
  const mensagemElemento = document.getElementById('toastMensagem');

  if (!toast || !mensagemElemento) return;

  const icone = toast.querySelector('.toast-icone');
  if (icone) {
    icone.style.background = sucesso ? '#059669' : '#dc2626';
  }

  mensagemElemento.textContent = mensagem;
  toast.classList.add('visivel');

  setTimeout(() => {
    toast.classList.remove('visivel');
  }, 4000);
}

/* =========================================================
   INICIALIZAÇÃO E EVENTOS
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Data atual
  const elData = document.getElementById('dataAtual');
  if (elData) {
    const hoje = new Date();
    elData.textContent = hoje.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  // Checar feedback via URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('criado') === 'ok') {
    exibirToast('Venda registrada com sucesso!', true);
    const vendaId = params.get('venda_id');
    if (vendaId) {
      setTimeout(() => verDetalhesVenda(vendaId), 300);
    }
  } else if (params.get('cancelado') === 'ok') {
    exibirToast('Venda cancelada.', true);
  } else if (params.get('erro')) {
    const erro = params.get('erro');
    let msg = 'Erro ao processar venda.';
    if (erro === 'estoque') msg = 'Estoque insuficiente para um ou mais produtos.';
    else if (erro === 'vazio') msg = 'Adicione ao menos um produto.';
    else if (erro === 'quantidade') msg = 'Quantidade inválida informada.';
    exibirToast(msg, false);
  }

  // Formatar campo de desconto ao sair do campo
  const inputDesconto = document.getElementById('modalDesconto');
  if (inputDesconto) {
    inputDesconto.addEventListener('blur', () => {
      let val = parseFloat(inputDesconto.value);
      if (isNaN(val) || val < 0) {
        inputDesconto.value = '0.0';
      } else if (val > 100) {
        inputDesconto.value = '100.0';
      } else {
        inputDesconto.value = val.toFixed(1);
      }
      calcularTotal();
    });
  }

  // Fechar modais com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModal('modalVenda');
      fecharModal('modalDetalhe');
    }
  });
});

/* Exposição global */
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.fecharModalFora = fecharModalFora;
window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;
window.abrirModalVenda = abrirModalVenda;
window.adicionarLinhaItem = adicionarLinhaItem;
window.removerLinhaItem = removerLinhaItem;
window.verDetalhesVenda = verDetalhesVenda;
window.baixarComprovante = baixarComprovante;
window.exibirToast = exibirToast;
window.calcularTotal = calcularTotal;
window.atualizarDescontoECliente = atualizarDescontoECliente;
window.aoMudarProduto = aoMudarProduto;
window.aoMudarVariacao = aoMudarVariacao;
window.prepararEnvioVenda = prepararEnvioVenda;
window.alternarSegundoPagamento = alternarSegundoPagamento;
window.removerSegundoPagamento = removerSegundoPagamento;
window.aoDigitarValorPagamento = aoDigitarValorPagamento;
window.aoMudarFormaPagamento = aoMudarFormaPagamento;