let vendaAtualId = null;
let vendaAtualCarregada = false;
let botaoBaixarComprovante = null;

const produtosPdv = Array.isArray(window.PRODUTOS_PDV)
  ? window.PRODUTOS_PDV
  : [];

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

function getProdutoSelecionado(select) {
  return produtosPdv.find(
    produto => String(produto.id) === String(select.value)
  );
}

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

    const produtoId = parseInt(selectProduto.value, 10);
    const quantidade = parseInt(inputQtd.value, 10) || 0;

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

  selectVariacao.innerHTML = '<option value="">Selecione a variação...</option>';
  selectVariacao.style.display = 'none';

  if (!produto) {
    spanPreco.textContent = 'R$ 0,00';
    calcularTotal();
    return;
  }

  if (produto.variacoes && produto.variacoes.length > 0) {
    produto.variacoes.forEach(v => {
      const preco = v.preco ?? produto.preco;
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.setAttribute('data-preco', preco);
      opt.textContent = `${v.nome || v.tamanho || v.descricao} (${fmt(preco)})`;
      selectVariacao.appendChild(opt);
    });

    selectVariacao.style.display = 'block';
    spanPreco.textContent = 'R$ 0,00';
  } else {
    const preco = parseFloat(produto.preco) || 0;
    selectProduto.setAttribute('data-preco', preco);
    spanPreco.textContent = fmt(preco);
  }

  calcularTotal();
}

function aoMudarVariacao(selectVariacao) {
  const linha = selectVariacao.closest('.linha-item-modal');
  const spanPreco = linha.querySelector('.preco-unitario');
  const optSel = selectVariacao.options[selectVariacao.selectedIndex];

  if (selectVariacao.value && optSel) {
    const preco = parseFloat(optSel.getAttribute('data-preco')) || 0;
    spanPreco.textContent = fmt(preco);
  } else {
    spanPreco.textContent = 'R$ 0,00';
  }

  calcularTotal();
}

function adicionarLinhaItem() {
  const container = document.getElementById('listaItensModal');
  if (!container) return;

  const divLinha = document.createElement('div');
  divLinha.className = 'linha-item-modal';
  divLinha.style.cssText = 'display:flex; gap:10px; align-items:center; margin-bottom:10px;';

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
    <input type="number" class="input-quantidade" value="1" min="1" style="width:70px;" placeholder="Qtd">
    <span class="preco-unitario" style="min-width:70px; font-weight:600; font-size:14px; color:#555;">R$ 0,00</span>
    <button type="button" class="btn-remover" onclick="removerLinhaItem(this)">✕</button>
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
   MODAL DE VENDA & SUBMISSÃO
========================================================= */

function abrirModalVenda() {
  const modalVenda = document.getElementById('modalVenda');
  if (!modalVenda) return;

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
  modalVenda.classList.add('aberto');
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
    exibirToast('Selecione ao menos um produto válido com quantidade e variação (se houver).', false);
    return false;
  }
}

/* =========================================================
   GERENCIAMENTO DE COMPROVANTE
========================================================= */

function posicionarBotaoComprovante() {
  const conteudo = document.getElementById('conteudoDetalhe');
  if (!conteudo) return;

  const totalCorreto = conteudo.querySelector('.comprovante-total');
  if (!totalCorreto) return;

  if (!botaoBaixarComprovante) {
    botaoBaixarComprovante = document.getElementById('btnBaixarComprovante');
  }

  if (!botaoBaixarComprovante) return;

  totalCorreto.appendChild(botaoBaixarComprovante);
  botaoBaixarComprovante.disabled = !vendaAtualCarregada;
}

function removerBotaoDoComprovante() {
  if (!botaoBaixarComprovante) {
    botaoBaixarComprovante = document.getElementById('btnBaixarComprovante');
  }

  if (!botaoBaixarComprovante) return;

  const rodapeOriginal = document.querySelector('.comprovante-rodape-fixo');
  if (rodapeOriginal) {
    rodapeOriginal.appendChild(botaoBaixarComprovante);
  }
}

async function verDetalhesVenda(id) {
  const modal = document.getElementById('modalDetalhe');
  const conteudo = document.getElementById('conteudoDetalhe');

  if (!modal || !conteudo) return;

  if (!botaoBaixarComprovante) {
    botaoBaixarComprovante = document.getElementById('btnBaixarComprovante');
  }

  removerBotaoDoComprovante();
  modal.classList.add('aberto');
  vendaAtualCarregada = false;

  if (botaoBaixarComprovante) {
    botaoBaixarComprovante.disabled = true;
  }

  conteudo.innerHTML = `
    <div class="comprovante-loading">
      <span>Carregando comprovante...</span>
    </div>
  `;

  try {
    const resposta = await fetch(`/pdv/venda/${id}/json`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);

    const dados = await resposta.json();
    if (dados.erro) throw new Error(dados.mensagem || 'Venda não encontrada.');

    let itensHtml = '';
    if (dados.itens && dados.itens.length > 0) {
      itensHtml = dados.itens.map(item => `
        <div class="comprovante-item">
          <div>
            <strong>${escapeHtml(item.produto_nome)}</strong>
            <small>${item.quantidade} x ${fmt(item.preco_unitario)}</small>
          </div>
          <strong>${fmt(item.subtotal)}</strong>
        </div>
      `).join('');
    } else {
      itensHtml = `<div style="text-align:center; color:#999; padding:20px;">Nenhum item encontrado.</div>`;
    }

    conteudo.innerHTML = `
      <div class="comprovante">
        <div class="comprovante-topo">
          <div>
            <h3>Comprovante de Venda</h3>
            <span>AAPM SENAI Francisco Matarazzo</span>
          </div>
          <strong>#${dados.id}</strong>
        </div>
        <div class="comprovante-info">
          <div><span>Cliente</span><strong>${escapeHtml(dados.cliente)}</strong></div>
          <div><span>Operador</span><strong>${escapeHtml(dados.operador)}</strong></div>
          <div><span>Data</span><strong>${escapeHtml(dados.data)}</strong></div>
        </div>
        <div class="comprovante-itens">
          <h4>Itens da venda</h4>
          ${itensHtml}
        </div>
        <div class="comprovante-valores">
          <div><span>Valor bruto</span><strong>${fmt(dados.total_bruto)}</strong></div>
          <div><span>Desconto</span><strong>${Number(dados.desconto_percentual || 0).toFixed(1)}%</strong></div>
          <div class="comprovante-total">
            <span>Total líquido</span>
            <strong>${fmt(dados.total_liquido)}</strong>
          </div>
        </div>
        ${dados.observacao ? `
          <div class="comprovante-observacao">
            <strong>Observação:</strong> ${escapeHtml(dados.observacao)}
          </div>` : ''}
        <div style="margin-top:20px; padding-top:15px; border-top:1px solid #eee; text-align:center; color:#888; font-size:0.8rem;">
          Venda registrada no sistema AAPM SENAI.
        </div>
      </div>
    `;

    vendaAtualId = dados.id;
    vendaAtualCarregada = true;
    posicionarBotaoComprovante();

  } catch (erro) {
    console.error('Erro ao carregar comprovante:', erro);
    conteudo.innerHTML = `
      <div style="padding:30px; text-align:center; color:#991b1b;">
        <div style="font-size:40px; margin-bottom:10px;">⚠️</div>
        <strong>Erro ao carregar o comprovante.</strong>
        <p style="margin-top:10px; color:#666;">${escapeHtml(erro.message)}</p>
        <button type="button" onclick="verDetalhesVenda(${Number(id)})" style="margin-top:15px; padding:10px 18px; border:none; border-radius:8px; background:#c8102e; color:white; cursor:pointer;">
          Tentar novamente
        </button>
      </div>
    `;
  }
}

async function baixarComprovante() {
  if (!vendaAtualCarregada) return;

  const elemento = document.querySelector('#conteudoDetalhe .comprovante');
  const btn = botaoBaixarComprovante || document.getElementById('btnBaixarComprovante');

  if (!elemento || !btn) return;

  const conteudoOriginal = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Gerando...';

  try {
    const displayOriginal = btn.style.display;
    btn.style.display = 'none';

    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });

    btn.style.display = displayOriginal;

    const link = document.createElement('a');
    link.download = `comprovante-venda-${vendaAtualId}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (erro) {
    console.error('Erro ao gerar comprovante:', erro);
    exibirToast('Não foi possível baixar o comprovante.', false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = conteudoOriginal;
    btn.style.display = '';
  }
}

/* =========================================================
   INTERFACE E EVENTOS
========================================================= */

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('aberto');
}

function fecharModalFora(event, id) {
  const modal = document.getElementById(id);
  if (modal && event.target === modal) {
    fecharModal(id);
  }
}

function exibirToast(mensagem, sucesso = true) {
  const toast = document.getElementById('toast');
  const mensagemElemento = document.getElementById('toastMensagem');

  if (!toast || !mensagemElemento) return;

  const icone = toast.querySelector('.toast-icone');
  if (icone) {
    icone.style.background = sucesso ? '#22c55e' : '#ef4444';
  }

  mensagemElemento.textContent = mensagem;
  toast.classList.add('visivel');

  setTimeout(() => {
    toast.classList.remove('visivel');
  }, 3000);
}

/* =========================================================
   INICIALIZAÇÃO ÚNICA DE LISTENERS
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  botaoBaixarComprovante = document.getElementById('btnBaixarComprovante');

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
});

/* Exposição global de funções necessárias no HTML */

window.abrirModalVenda = abrirModalVenda;
window.adicionarLinhaItem = adicionarLinhaItem;
window.removerLinhaItem = removerLinhaItem;
window.verDetalhesVenda = verDetalhesVenda;
window.fecharModal = fecharModal;
window.fecharModalFora = fecharModalFora;
window.exibirToast = exibirToast;
window.baixarComprovante = baixarComprovante;
window.calcularTotal = calcularTotal;