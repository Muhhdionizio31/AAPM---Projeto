let vendaAtualId = null;
let vendaAtualCarregada = false;

const produtosPdv = Array.isArray(window.PRODUTOS_PDV)
  ? window.PRODUTOS_PDV
  : [];


/* =========================================================
   REFERÊNCIA DO BOTÃO DE BAIXAR COMPROVANTE

   O botão é guardado em memória porque ele é movido para
   dentro do comprovante, ao lado do Total Líquido.
========================================================= */

let botaoBaixarComprovante = null;


/* =========================================================
   FORMATAÇÃO DE VALORES
========================================================= */

const fmt = valor =>
  'R$ ' + Number(valor || 0)
    .toFixed(2)
    .replace('.', ',');


/* =========================================================
   SEGURANÇA
   Evita que dados vindos do banco sejam inseridos
   diretamente como HTML.
========================================================= */

function escapeHtml(valor) {

  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


/* =========================================================
   PRODUTOS
========================================================= */

function getProdutoSelecionado(select) {

  return produtosPdv.find(
    produto => String(produto.id) === String(select.value)
  );

}


/* =========================================================
   DESCONTO
========================================================= */

function atualizarDesconto() {

  const cliente =
    document.getElementById('modalCliente');

  const desconto =
    cliente?.selectedOptions?.[0]?.dataset?.desconto || '0';

  const campoDesconto =
    document.getElementById('modalDesconto');

  if (campoDesconto) {

    campoDesconto.value =
      Number(desconto).toFixed(1);

  }

}


/* =========================================================
   ABRIR MODAL DE NOVA VENDA
========================================================= */

function abrirModalVenda() {

  const modalTitulo =
    document.getElementById('modalTitulo');

  const modalCliente =
    document.getElementById('modalCliente');

  const modalObservacao =
    document.getElementById('modalObservacao');

  const listaItens =
    document.getElementById('listaItensModal');

  const carrinhoJson =
    document.getElementById('carrinhoJson');

  const modalVenda =
    document.getElementById('modalVenda');

  if (!modalVenda) {

    console.error('Modal de venda não encontrado.');

    return;

  }

  if (modalTitulo) {

    modalTitulo.textContent = 'Nova Venda';

  }

  if (modalCliente) {

    modalCliente.value = '0';

  }

  if (modalObservacao) {

    modalObservacao.value = '';

  }

  if (listaItens) {

    listaItens.innerHTML = '';

  }

  if (carrinhoJson) {

    carrinhoJson.value = '';

  }

  atualizarDesconto();

  if (produtosPdv.length > 0) {

    adicionarLinhaItem();

  }

  calcularTotal();

  modalVenda.classList.add('aberto');

}


/* =========================================================
   ADICIONAR LINHA DE ITEM
========================================================= */

function adicionarLinhaItem(item = null) {

  const lista =
    document.getElementById('listaItensModal');

  if (!lista) {

    console.error('Lista de itens não encontrada.');

    return;

  }

  if (produtosPdv.length === 0) {

    lista.innerHTML = `
      <div style="
        padding:12px;
        color:#991b1b;
      ">
        Nenhum produto ativo com estoque disponível.
      </div>
    `;

    return;

  }

  const div = document.createElement('div');

  div.className = 'item-modal-linha';

  const opcoes = produtosPdv
    .map(produto => {

      const selected =
        item &&
        String(item.produto_id) === String(produto.id)
          ? 'selected'
          : '';

      return `
        <option
          value="${produto.id}"
          data-preco="${produto.preco}"
          data-estoque="${produto.estoque}"
          ${selected}
        >
          ${escapeHtml(produto.nome)}
          (${produto.estoque} un.)
        </option>
      `;

    })
    .join('');

  div.innerHTML = `
    <select class="item-produto">
      ${opcoes}
    </select>

    <input
      class="item-quantidade"
      type="number"
      value="${item ? item.quantidade : 1}"
      min="1"
      placeholder="Qtd"
    />

    <input
      class="item-preco"
      type="number"
      value="0.00"
      min="0"
      step="0.01"
      placeholder="Preço"
      readonly
    />

    <button
      type="button"
      class="btn-remover-item"
    >
      x
    </button>
  `;


  div
    .querySelector('.item-produto')
    .addEventListener('change', () => {

      atualizarPrecoLinha(div);

      calcularTotal();

    });


  div
    .querySelector('.item-quantidade')
    .addEventListener(
      'input',
      calcularTotal
    );


  div
    .querySelector('.btn-remover-item')
    .addEventListener('click', () => {

      div.remove();

      calcularTotal();

    });


  lista.appendChild(div);

  atualizarPrecoLinha(div);

  calcularTotal();

}


/* =========================================================
   ATUALIZAR PREÇO DO ITEM
========================================================= */

function atualizarPrecoLinha(linha) {

  const select =
    linha.querySelector('.item-produto');

  const campoPreco =
    linha.querySelector('.item-preco');

  const produto =
    getProdutoSelecionado(select);

  if (campoPreco) {

    campoPreco.value =
      produto
        ? Number(produto.preco).toFixed(2)
        : '0.00';

  }

}


/* =========================================================
   CALCULAR TOTAL DA VENDA
========================================================= */

function calcularTotal() {

  let totalBruto = 0;

  document
    .querySelectorAll('.item-modal-linha')
    .forEach(linha => {

      const qtd =
        parseInt(
          linha.querySelector('.item-quantidade').value,
          10
        ) || 0;

      const preco =
        parseFloat(
          linha.querySelector('.item-preco').value
        ) || 0;

      totalBruto += qtd * preco;

    });


  const campoDesconto =
    document.getElementById('modalDesconto');

  const desconto =
    parseFloat(
      campoDesconto?.value
    ) || 0;


  const totalLiquido =
    totalBruto -
    (totalBruto * desconto / 100);


  const totalModal =
    document.getElementById('totalModal');

  if (totalModal) {

    totalModal.textContent =
      fmt(totalLiquido);

  }

}


/* =========================================================
   PREPARAR ENVIO DA VENDA
========================================================= */

function prepararEnvioVenda(event) {

  const linhas =
    Array.from(
      document.querySelectorAll('.item-modal-linha')
    );


  if (linhas.length === 0) {

    event.preventDefault();

    exibirToast(
      'Adicione ao menos um item.',
      false
    );

    return;

  }


  const carrinho = [];


  for (const linha of linhas) {

    const select =
      linha.querySelector('.item-produto');

    const produto =
      getProdutoSelecionado(select);

    const quantidade =
      parseInt(
        linha.querySelector('.item-quantidade').value,
        10
      ) || 0;


    if (!produto || quantidade <= 0) {

      event.preventDefault();

      exibirToast(
        'Confira os produtos e quantidades.',
        false
      );

      return;

    }


    if (
      quantidade >
      Number(produto.estoque)
    ) {

      event.preventDefault();

      exibirToast(
        `Estoque insuficiente para ${produto.nome}.`,
        false
      );

      return;

    }


    carrinho.push({

      produto_id: produto.id,

      nome: produto.nome,

      preco: Number(produto.preco),

      quantidade: quantidade

    });

  }


  const campoCarrinho =
    document.getElementById('carrinhoJson');


  if (campoCarrinho) {

    campoCarrinho.value =
      JSON.stringify(carrinho);

  }

}


/* =========================================================
   POSICIONAR BOTÃO NO TOTAL LÍQUIDO CORRETO
========================================================= */

function posicionarBotaoComprovante() {

  const conteudo =
    document.getElementById('conteudoDetalhe');

  if (!conteudo) {

    return;

  }


  const totalCorreto =
    conteudo.querySelector('.comprovante-total');

  if (!totalCorreto) {

    return;

  }


  if (!botaoBaixarComprovante) {

    botaoBaixarComprovante =
      document.getElementById('btnBaixarComprovante');

  }


  if (!botaoBaixarComprovante) {

    return;

  }


  /*
    Move o MESMO botão para dentro do Total Líquido.
    Não cria outro botão.
  */

  totalCorreto.appendChild(
    botaoBaixarComprovante
  );


  botaoBaixarComprovante.disabled =
    !vendaAtualCarregada;

}


/* =========================================================
   RETIRAR BOTÃO DO COMPROVANTE ANTIGO

   Isso é importante antes de trocar o innerHTML.
   Sem isso, o botão seria apagado junto com o comprovante.
========================================================= */

function removerBotaoDoComprovante() {

  if (!botaoBaixarComprovante) {

    botaoBaixarComprovante =
      document.getElementById('btnBaixarComprovante');

  }


  if (!botaoBaixarComprovante) {

    return;

  }


  const rodapeOriginal =
    document.querySelector(
      '.comprovante-rodape-fixo'
    );


  if (rodapeOriginal) {

    rodapeOriginal.appendChild(
      botaoBaixarComprovante
    );

  }

}


/* =========================================================
   COMPROVANTE DA VENDA
========================================================= */

async function verDetalhesVenda(id) {

  const modal =
    document.getElementById('modalDetalhe');

  const conteudo =
    document.getElementById('conteudoDetalhe');


  if (!modal || !conteudo) {

    console.error(
      'Modal de comprovante não encontrado.'
    );

    return;

  }


  /*
    Guarda o botão antes de trocar o conteúdo.
  */

  if (!botaoBaixarComprovante) {

    botaoBaixarComprovante =
      document.getElementById('btnBaixarComprovante');

  }


  /*
    Remove o botão do comprovante anterior antes
    de limpar o conteúdo.
  */

  removerBotaoDoComprovante();


  modal.classList.add('aberto');

  vendaAtualCarregada = false;


  if (botaoBaixarComprovante) {

    botaoBaixarComprovante.disabled = true;

  }


  conteudo.innerHTML = `
    <div class="comprovante-loading">

      <span>
        Carregando comprovante...
      </span>

    </div>
  `;


  try {

    const resposta =
      await fetch(`/pdv/venda/${id}/json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });


    if (!resposta.ok) {

      throw new Error(
        `Erro HTTP ${resposta.status}`
      );

    }


    const dados =
      await resposta.json();


    if (dados.erro) {

      throw new Error(
        dados.mensagem ||
        'Venda não encontrada.'
      );

    }


    let itensHtml = '';


    if (
      dados.itens &&
      dados.itens.length > 0
    ) {

      itensHtml =
        dados.itens
          .map(item => {

            return `
              <div class="comprovante-item">

                <div>

                  <strong>
                    ${escapeHtml(
                      item.produto_nome
                    )}
                  </strong>

                  <small>
                    ${item.quantidade}
                    x
                    ${fmt(
                      item.preco_unitario
                    )}
                  </small>

                </div>

                <strong>
                  ${fmt(
                    item.subtotal
                  )}
                </strong>

              </div>
            `;

          })
          .join('');

    } else {

      itensHtml = `
        <div style="
          text-align:center;
          color:#999;
          padding:20px;
        ">
          Nenhum item encontrado.
        </div>
      `;

    }


    conteudo.innerHTML = `

      <div class="comprovante">


        <div class="comprovante-topo">

          <div>

            <h3>
              Comprovante de Venda
            </h3>

            <span>
              AAPM SENAI Francisco Matarazzo
            </span>

          </div>

          <strong>
            #${dados.id}
          </strong>

        </div>


        <div class="comprovante-info">


          <div>

            <span>
              Cliente
            </span>

            <strong>
              ${escapeHtml(
                dados.cliente
              )}
            </strong>

          </div>


          <div>

            <span>
              Operador
            </span>

            <strong>
              ${escapeHtml(
                dados.operador
              )}
            </strong>

          </div>


          <div>

            <span>
              Data
            </span>

            <strong>
              ${escapeHtml(
                dados.data
              )}
            </strong>

          </div>


        </div>


        <div class="comprovante-itens">

          <h4>
            Itens da venda
          </h4>

          ${itensHtml}

        </div>


        <div class="comprovante-valores">


          <div>

            <span>
              Valor bruto
            </span>

            <strong>
              ${fmt(
                dados.total_bruto
              )}
            </strong>

          </div>


          <div>

            <span>
              Desconto
            </span>

            <strong>
              ${Number(
                dados.desconto_percentual || 0
              ).toFixed(1)}%
            </strong>

          </div>


          <div class="comprovante-total">

            <span>
              Total líquido
            </span>

            <strong>
              ${fmt(
                dados.total_liquido
              )}
            </strong>

          </div>


        </div>


        ${dados.observacao
          ? `
              <div class="comprovante-observacao">

                <strong>
                  Observação:
                </strong>

                ${escapeHtml(
                  dados.observacao
                )}

              </div>
            `
          : ''
        }


        <div
          style="
            margin-top:20px;
            padding-top:15px;
            border-top:1px solid #eee;
            text-align:center;
            color:#888;
            font-size:0.8rem;
          "
        >

          Venda registrada no sistema AAPM SENAI.

        </div>


      </div>

    `;


    vendaAtualId = dados.id;

    vendaAtualCarregada = true;


    /*
      Agora que o comprovante foi criado,
      coloca o botão ao lado do Total Líquido correto.
    */

    posicionarBotaoComprovante();


  } catch (erro) {

    console.error(
      'Erro ao carregar comprovante:',
      erro
    );


    conteudo.innerHTML = `

      <div
        style="
          padding:30px;
          text-align:center;
          color:#991b1b;
        "
      >

        <div
          style="
            font-size:40px;
            margin-bottom:10px;
          "
        >
          ⚠️
        </div>


        <strong>
          Erro ao carregar o comprovante.
        </strong>


        <p
          style="
            margin-top:10px;
            color:#666;
          "
        >
          ${escapeHtml(
            erro.message
          )}
        </p>


        <button
          type="button"
          onclick="verDetalhesVenda(${Number(id)})"
          style="
            margin-top:15px;
            padding:10px 18px;
            border:none;
            border-radius:8px;
            background:#c8102e;
            color:white;
            cursor:pointer;
          "
        >
          Tentar novamente
        </button>

      </div>

    `;

  }

}


/* =========================================================
   BAIXAR COMPROVANTE COMO IMAGEM
========================================================= */

async function baixarComprovante() {

  if (!vendaAtualCarregada) {

    return;

  }


  const elemento =
    document.querySelector(
      '#conteudoDetalhe .comprovante'
    );


  const btn =
    botaoBaixarComprovante ||
    document.getElementById(
      'btnBaixarComprovante'
    );


  if (!elemento || !btn) {

    return;

  }


  const conteudoOriginal =
    btn.innerHTML;


  btn.disabled = true;

  btn.innerHTML =
    'Gerando...';


  try {

    /*
      Esconde temporariamente o botão para ele
      não aparecer dentro da imagem baixada.
    */

    const displayOriginal =
      btn.style.display;

    btn.style.display = 'none';


    const canvas =
      await html2canvas(elemento, {

        scale: 2,

        backgroundColor: '#ffffff',

        useCORS: true

      });


    btn.style.display =
      displayOriginal;


    const link =
      document.createElement('a');


    link.download =
      `comprovante-venda-${vendaAtualId}.png`;


    link.href =
      canvas.toDataURL(
        'image/png',
        1.0
      );


    document.body.appendChild(link);

    link.click();

    link.remove();


  } catch (erro) {

    console.error(
      'Erro ao gerar comprovante:',
      erro
    );


    exibirToast(
      'Não foi possível baixar o comprovante.',
      false
    );

  } finally {

    btn.disabled = false;

    btn.innerHTML =
      conteudoOriginal;

    /*
      Garante que o botão volte a aparecer
      caso ocorra algum erro durante a geração.
    */

    btn.style.display = '';

  }

}


/* =========================================================
   FECHAR MODAL
========================================================= */

function fecharModal(id) {

  const modal =
    document.getElementById(id);

  if (modal) {

    modal.classList.remove('aberto');

  }

}


/* =========================================================
   FECHAR MODAL CLICANDO FORA
========================================================= */

function fecharModalFora(event, id) {

  const modal =
    document.getElementById(id);


  if (
    modal &&
    event.target === modal
  ) {

    fecharModal(id);

  }

}


/* =========================================================
   TOAST
========================================================= */

function exibirToast(
  mensagem,
  sucesso = true
) {

  const toast =
    document.getElementById('toast');

  const mensagemElemento =
    document.getElementById('toastMensagem');


  if (!toast || !mensagemElemento) {

    return;

  }


  const icone =
    toast.querySelector('.toast-icone');


  if (icone) {

    icone.style.background =
      sucesso
        ? '#22c55e'
        : '#ef4444';

  }


  mensagemElemento.textContent =
    mensagem;


  toast.classList.add('visivel');


  setTimeout(() => {

    toast.classList.remove('visivel');

  }, 3000);

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {


    /*
      Guarda a referência original do botão.
    */

    botaoBaixarComprovante =
      document.getElementById(
        'btnBaixarComprovante'
      );


    // Botão Nova Venda

    document
      .getElementById('btnNovaVenda')
      ?.addEventListener(
        'click',
        abrirModalVenda
      );


    // Cliente / desconto

    document
      .getElementById('modalCliente')
      ?.addEventListener(
        'change',
        () => {

          atualizarDesconto();

          calcularTotal();

        }
      );


    // Formulário da venda

    document
      .getElementById('formNovaVenda')
      ?.addEventListener(
        'submit',
        prepararEnvioVenda
      );


  }
);


/* =========================================================
   DISPONIBILIZA FUNÇÕES PARA O HTML
========================================================= */

window.abrirModalVenda =
  abrirModalVenda;

window.adicionarLinhaItem =
  adicionarLinhaItem;

window.verDetalhesVenda =
  verDetalhesVenda;

window.fecharModal =
  fecharModal;

window.fecharModalFora =
  fecharModalFora;

window.exibirToast =
  exibirToast;

window.baixarComprovante =
  baixarComprovante;