const produtosPdv = Array.isArray(window.PRODUTOS_PDV) ? window.PRODUTOS_PDV : [];

const fmt = valor =>
  'R$ ' + Number(valor || 0).toFixed(2).replace('.', ',');

function getProdutoSelecionado(select) {
  return produtosPdv.find(produto => String(produto.id) === String(select.value));
}

function atualizarDesconto() {
  const cliente = document.getElementById('modalCliente');
  const desconto = cliente?.selectedOptions?.[0]?.dataset?.desconto || '0';
  document.getElementById('modalDesconto').value = Number(desconto).toFixed(1);
}

function abrirModalVenda() {
  document.getElementById('modalTitulo').textContent = 'Nova Venda';
  document.getElementById('modalCliente').value = '0';
  document.getElementById('modalObservacao').value = '';
  document.getElementById('listaItensModal').innerHTML = '';
  document.getElementById('carrinhoJson').value = '';
  atualizarDesconto();

  if (produtosPdv.length > 0) {
    adicionarLinhaItem();
  }

  calcularTotal();
  document.getElementById('modalVenda').classList.add('aberto');
}

function adicionarLinhaItem(item = null) {
  const lista = document.getElementById('listaItensModal');

  if (produtosPdv.length === 0) {
    lista.innerHTML = '<div style="padding:12px;color:#991b1b;">Nenhum produto ativo com estoque disponivel.</div>';
    return;
  }

  const div = document.createElement('div');
  div.className = 'item-modal-linha';

  const opcoes = produtosPdv.map(produto => {
    const selected = item && String(item.produto_id) === String(produto.id) ? 'selected' : '';
    return `<option value="${produto.id}" data-preco="${produto.preco}" data-estoque="${produto.estoque}" ${selected}>${produto.nome} (${produto.estoque} un.)</option>`;
  }).join('');

  div.innerHTML = `
    <select class="item-produto">${opcoes}</select>
    <input class="item-quantidade" type="number" value="${item ? item.quantidade : 1}" min="1" placeholder="Qtd" />
    <input class="item-preco" type="number" value="0.00" min="0" step="0.01" placeholder="Preco" readonly />
    <button type="button" class="btn-remover-item">x</button>
  `;

  div.querySelector('.item-produto').addEventListener('change', () => {
    atualizarPrecoLinha(div);
    calcularTotal();
  });
  div.querySelector('.item-quantidade').addEventListener('input', calcularTotal);
  div.querySelector('.btn-remover-item').addEventListener('click', () => {
    div.remove();
    calcularTotal();
  });

  lista.appendChild(div);
  atualizarPrecoLinha(div);
  calcularTotal();
}

function atualizarPrecoLinha(linha) {
  const produto = getProdutoSelecionado(linha.querySelector('.item-produto'));
  linha.querySelector('.item-preco').value = produto ? Number(produto.preco).toFixed(2) : '0.00';
}

function calcularTotal() {
  let totalBruto = 0;

  document.querySelectorAll('.item-modal-linha').forEach(linha => {
    const qtd = parseInt(linha.querySelector('.item-quantidade').value, 10) || 0;
    const preco = parseFloat(linha.querySelector('.item-preco').value) || 0;
    totalBruto += qtd * preco;
  });

  const desconto = parseFloat(document.getElementById('modalDesconto').value) || 0;
  const totalLiquido = totalBruto - (totalBruto * desconto / 100);
  document.getElementById('totalModal').textContent = fmt(totalLiquido);
}

function prepararEnvioVenda(event) {
  const linhas = Array.from(document.querySelectorAll('.item-modal-linha'));

  if (linhas.length === 0) {
    event.preventDefault();
    exibirToast('Adicione ao menos um item.', false);
    return;
  }

  const carrinho = [];

  for (const linha of linhas) {
    const select = linha.querySelector('.item-produto');
    const produto = getProdutoSelecionado(select);
    const quantidade = parseInt(linha.querySelector('.item-quantidade').value, 10) || 0;

    if (!produto || quantidade <= 0) {
      event.preventDefault();
      exibirToast('Confira os produtos e quantidades.', false);
      return;
    }

    if (quantidade > Number(produto.estoque)) {
      event.preventDefault();
      exibirToast(`Estoque insuficiente para ${produto.nome}.`, false);
      return;
    }

    carrinho.push({
      produto_id: produto.id,
      nome: produto.nome,
      preco: Number(produto.preco),
      quantidade
    });
  }

  document.getElementById('carrinhoJson').value = JSON.stringify(carrinho);
}

function verDetalhesVenda(id) {
  window.location.href = `/pdv/venda/${id}`;
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('aberto');
}

function fecharModalFora(event, id) {
  if (event.target === document.getElementById(id)) {
    fecharModal(id);
  }
}

function exibirToast(mensagem, sucesso = true) {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-icone').style.background = sucesso ? '#22c55e' : '#ef4444';
  document.getElementById('toastMensagem').textContent = mensagem;
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnNovaVenda')?.addEventListener('click', abrirModalVenda);

  document.getElementById('modalCliente')?.addEventListener('change', () => {
    atualizarDesconto();
    calcularTotal();
  });

  document.getElementById('formNovaVenda')?.addEventListener('submit', prepararEnvioVenda);
});

window.abrirModalVenda = abrirModalVenda;
window.adicionarLinhaItem = adicionarLinhaItem;
window.verDetalhesVenda = verDetalhesVenda;
window.fecharModal = fecharModal;
window.fecharModalFora = fecharModalFora;
