/* =========================================================
   AAPM SENAI — Módulo de Vendas (PDV)
   Gerenciamento de Carrinho, Modais e Comprovante
   ========================================================= */

let vendaAtualId = null;
let vendaAtualCarregada = false;

const produtosPdv = Array.isArray(window.PRODUTOS_PDV)
  ? window.PRODUTOS_PDV
  : [];

/* =========================================================
   UTILITÁRIOS DE MODAL (PADRÃO ROBUSTO)
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
   AUXILIARES DE PRODUTO E DESCONTO
========================================================= */
function atualizarDesconto() {
  const cliente = document.getElementById('modalCliente');
  const desconto = cliente?.selectedOptions?.[0]?.dataset?.desconto || '0';
  const campoDesconto = document.getElementById('modalDesconto');

  if (campoDesconto) {
    campoDesconto.value = Number(desconto).toFixed(1);
  }
}

/* =========================================================
   CÁLCULO E ATUALIZAÇÃO DOS ITENS DA VENDA
========================================================= */
function calcularTotal() {
  const containerItens = document.getElementById('listaItensModal');
  const elementoTotal = document.getElementById('totalModal');
  const selectCliente = document.getElementById('modalCliente');
  const inputDesconto = document.getElementById('modalDesconto');
  const inputCarrinhoJson = document.getElementById('carrinhoJson');

  if (!containerItens || !elementoTotal) return;

  let percentualDesconto = 0;
  if (selectCliente && selectCliente.selectedIndex >= 0) {
    const opcaoSelecionada = selectCliente.options[selectCliente.selectedIndex];
    percentualDesconto = parseFloat(opcaoSelecionada.getAttribute('data-desconto')) || 0;
  }
  if (inputDesconto) {
    inputDesconto.value = percentualDesconto.toFixed(1);
  }

  let totalBruto = 0;
  const carrinho = [];

  const linhas = containerItens.querySelectorAll('.linha-item-modal');
  linhas.forEach(linha => {
    const selectProduto = linha.querySelector('.select-produto');
    const selectVariacao = linha.querySelector('.select-variacao');
    const inputQtd = linha.querySelector('.input-quantidade');

    const produtoId = parseInt(selectProduto?.value, 10);
    const quantidade = parseInt(inputQtd?.value, 10) || 0;

    if (!produtoId || quantidade <= 0) return;

    const produto = produtosPdv.find(p => p.id === produtoId);
    let precoUnitario = 0;
    let variacaoId = null;

    if (produto) {
      if (produto.variacoes && produto.variacoes.length > 0) {
        if (selectVariacao && selectVariacao.value) {
          const optVar = selectVariacao.options[selectVariacao.selectedIndex];
          variacaoId = parseInt(selectVariacao.value, 10);
          precoUnitario = parseFloat(optVar.getAttribute('data-preco')) || 0;
        }
      } else {
        precoUnitario = parseFloat(produto.preco) || 0;
      }
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
  const totalLiquido = totalBruto - valorDesconto;

  elementoTotal.textContent = fmt(totalLiquido);

  if (inputCarrinhoJson) {
    inputCarrinhoJson.value = JSON.stringify(carrinho);
  }
}

function aoMudarProduto(selectProduto) {
  const linha = selectProduto.closest('.linha-item-modal');
  const selectVariacao = linha.querySelector('.select-variacao');
  const spanPreco = linha.querySelector('.preco-unitario');
  const produtoId = parseInt(selectProduto.value, 10);

  const produto = produtosPdv.find(p => p.id === produtoId);

  if (selectVariacao) {
    selectVariacao.innerHTML = '<option value="">Selecione a variação...</option>';
    selectVariacao.style.display = 'none';
  }

  if (!produto) {
    if (spanPreco) spanPreco.textContent = 'R$ 0,00';
    calcularTotal();
    return;
  }

  if (produto.variacoes && produto.variacoes.length > 0 && selectVariacao) {
    produto.variacoes.forEach(v => {
      const preco = v.preco ?? produto.preco;
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.setAttribute('data-preco', preco);
      opt.textContent = `${v.nome || v.tamanho || v.descricao} (${fmt(preco)})`;
      selectVariacao.appendChild(opt);
    });

    selectVariacao.style.display = 'block';
    if (spanPreco) spanPreco.textContent = 'R$ 0,00';
  } else {
    const preco = parseFloat(produto.preco) || 0;
    selectProduto.setAttribute('data-preco', preco);
    if (spanPreco) spanPreco.textContent = fmt(preco);
  }

  calcularTotal();
}

function aoMudarVariacao(selectVariacao) {
  const linha = selectVariacao.closest('.linha-item-modal');
  const spanPreco = linha.querySelector('.preco-unitario');
  const optSel = selectVariacao.options[selectVariacao.selectedIndex];

  if (selectVariacao.value && optSel) {
    const preco = parseFloat(optSel.getAttribute('data-preco')) || 0;
    if (spanPreco) spanPreco.textContent = fmt(preco);
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

  let produtosHTML = '<option value="">Selecione um produto...</option>';
  produtosPdv.forEach(p => {
    produtosHTML += `<option value="${p.id}">${escapeHtml(p.nome)}</option>`;
  });

  divLinha.innerHTML = `
    <select class="select-produto" style="flex:2;">
      ${produtosHTML}
    </select>
    <select class="select-variacao" style="flex:2; display:none;">
      <option value="">Selecione a variação...</option>
    </select>
    <input type="number" class="input-quantidade" value="1" min="1" style="width:75px;" placeholder="Qtd">
    <span class="preco-unitario" style="min-width:80px; font-weight:700; font-size:13px; color:#111;">R$ 0,00</span>
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

  atualizarDesconto();

  if (produtosPdv.length > 0) {
    adicionarLinhaItem();
  }

  calcularTotal();
  abrirModal('modalVenda');
}

function prepararEnvioVenda(event) {
  calcularTotal();

  const inputCarrinho = document.getElementById('carrinhoJson');
  let itensCarrinho = [];

  try {
    itensCarrinho = JSON.parse(inputCarrinho.value || '[]');
  } catch (err) {
    itensCarrinho = [];
  }

  if (itensCarrinho.length === 0) {
    event.preventDefault();
    exibirToast('Adicione pelo menos um produto com quantidade válida.', false);
    return false;
  }
}

/* =========================================================
   MODAL DE COMPROVANTE (CORRIGIDO)
========================================================= */
async function verDetalhesVenda(id) {
  const conteudo = document.getElementById('conteudoDetalhe');
  const btnBaixar = document.getElementById('btnBaixarComprovante');

  if (!conteudo) return;

  // 1. Abre o modal imediatamente
  abrirModal('modalDetalhe');
  vendaAtualId = id;
  vendaAtualCarregada = false;

  if (btnBaixar) btnBaixar.disabled = true;

  // 2. Estado de Loading
  conteudo.innerHTML = `
    <div class="comprovante-loading">
      <div class="spinner"></div>
      <span>Carregando comprovante #${id}...</span>
    </div>
  `;

  try {
    // 3. Busca os dados no backend
    const resposta = await fetch(`/pdv/venda/${id}/json`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resposta.ok) throw new Error(`Erro ${resposta.status}: Não foi possível carregar os dados.`);

    const dados = await resposta.json();
    if (dados.erro) throw new Error(dados.mensagem || 'Venda não encontrada.');

    // 4. Renderiza os itens
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

    // 5. Monta o cupom fiscal completo
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

        ${dados.observacao ? `
          <div class="comprovante-observacao">
            <strong>Obs:</strong> ${escapeHtml(dados.observacao)}
          </div>` : ''}

        <div class="comprovante-rodape-texto">
          Documento Não Fiscal · Sistema AAPM
        </div>
      </div>
    `;

    vendaAtualCarregada = true;
    if (btnBaixar) btnBaixar.disabled = false;

  } catch (erro) {
    console.error('Erro ao abrir comprovante:', erro);
    conteudo.innerHTML = `
      <div style="padding:24px; text-align:center; color:#dc2626;">
        <div style="font-size:36px; margin-bottom:8px;">⚠️</div>
        <strong style="font-size:1rem;">Falha ao carregar o comprovante</strong>
        <p style="margin:8px 0 16px; color:#6b7280; font-size:0.85rem;">${escapeHtml(erro.message)}</p>
        <button type="button" onclick="verDetalhesVenda(${Number(id)})" class="btn-novo" style="margin:0 auto;">
          Tentar novamente
        </button>
      </div>
    `;
  }
}

/* =========================================================
   BAIXAR COMPROVANTE (IMAGEM PNG)
========================================================= */
async function baixarComprovante() {
  if (!vendaAtualCarregada) return;

  const elemento = document.getElementById('cupomImpressao');
  const btn = document.getElementById('btnBaixarComprovante');
  if (!elemento || !btn) return;

  const textoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Gerando imagem...';

  try {
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
  } catch (erro) {
    console.error('Erro ao baixar comprovante:', erro);
    exibirToast('Não foi possível gerar a imagem.', false);
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
  }, 3500);
}

/* =========================================================
   INICIALIZAÇÃO E EVENTOS
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnNovaVenda')?.addEventListener('click', abrirModalVenda);

  const modalVenda = document.getElementById('modalVenda');
  if (modalVenda) {
    modalVenda.addEventListener('change', (e) => {
      if (e.target.classList.contains('select-produto')) {
        aoMudarProduto(e.target);
      } else if (e.target.classList.contains('select-variacao')) {
        aoMudarVariacao(e.target);
      } else if (e.target.id === 'modalCliente' || e.target.classList.contains('input-quantidade')) {
        atualizarDesconto();
        calcularTotal();
      }
    });

    modalVenda.addEventListener('input', (e) => {
      if (e.target.classList.contains('input-quantidade')) {
        calcularTotal();
      }
    });
  }

  document.getElementById('formNovaVenda')?.addEventListener('submit', prepararEnvioVenda);

  // Fecha modais com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharModal('modalVenda');
      fecharModal('modalDetalhe');
    }
  });
});

/* Exposição no escopo global */
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.fecharModalFora = fecharModalFora;
window.abrirModalVenda = abrirModalVenda;
window.adicionarLinhaItem = adicionarLinhaItem;
window.removerLinhaItem = removerLinhaItem;
window.verDetalhesVenda = verDetalhesVenda;
window.baixarComprovante = baixarComprovante;
window.exibirToast = exibirToast;
window.calcularTotal = calcularTotal;