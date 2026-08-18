// ============================================================
// FILTRO DE STATUS
// ============================================================

function filtrar(status, botao) {

    document
        .querySelectorAll('.btn-filtro')
        .forEach(b => b.classList.remove('ativo'));

    botao.classList.add('ativo');

    const linhas = document.querySelectorAll(
        '#corpoTabela tr[data-status]'
    );

    let visiveis = 0;

    linhas.forEach(tr => {

        const mostrar =
            status === 'todos' ||
            tr.dataset.status === status;

        tr.style.display = mostrar ? '' : 'none';

        if (mostrar) {
            visiveis++;
        }
    });

    const info = document.getElementById('infoTabela');

    if (info) {
        info.textContent =
            visiveis +
            ' categoria' +
            (visiveis !== 1 ? 's' : '');
    }
}


// ============================================================
// MODAL — NOVA CATEGORIA
// ============================================================

function abrirModalCategoriaNova() {

    const modal = document.getElementById('catModalCategoria');

    if (!modal) {
        console.error('Modal de categoria não encontrado.');
        return;
    }

    const titulo = document.getElementById('catModalTitulo');
    const form = document.getElementById('catForm');
    const nome = document.getElementById('nome');
    const ativa = document.getElementById('ativa');
    const botaoSalvar = document.getElementById('catBtnSalvar');
    const dica = document.getElementById('catDica');

    if (titulo) {
        titulo.textContent = 'Nova categoria';
    }

    if (form) {
        form.action = '/categorias/nova';
    }

    if (nome) {
        nome.value = '';
    }

    if (ativa) {
        ativa.checked = true;
    }

    if (botaoSalvar) {
        botaoSalvar.textContent = 'Criar categoria';
    }

    if (dica) {
        dica.innerHTML =
            '<strong>Dica:</strong> após criar a categoria, ' +
            'você pode vinculá-la a produtos no painel de estoque.';
    }

    preencherProdutosVinculados([]);

    abrirOverlayCategoria();

    // Coloca o cursor automaticamente no campo
    setTimeout(() => {
        if (nome) {
            nome.focus();
        }
    }, 100);
}


// ============================================================
// MODAL — EDITAR CATEGORIA
// ============================================================

function abrirModalCategoriaEditar(botao) {

    const modal = document.getElementById('catModalCategoria');

    if (!modal) {
        console.error('Modal de categoria não encontrado.');
        return;
    }

    const id = botao.dataset.id;
    const nome = botao.dataset.nome;
    const ativa = botao.dataset.ativa === 'true';

    let produtos = [];

    try {

        produtos = JSON.parse(
            botao.dataset.produtos || '[]'
        );

    } catch (erro) {

        console.error(
            'Erro ao ler produtos da categoria:',
            erro
        );

        produtos = [];
    }


    const titulo =
        document.getElementById('catModalTitulo');

    const form =
        document.getElementById('catForm');

    const campoNome =
        document.getElementById('nome');

    const campoAtiva =
        document.getElementById('ativa');

    const botaoSalvar =
        document.getElementById('catBtnSalvar');

    const dica =
        document.getElementById('catDica');


    if (titulo) {
        titulo.textContent = 'Editar categoria';
    }

    if (form) {
        form.action =
            '/categorias/' + id + '/editar';
    }

    if (campoNome) {
        campoNome.value = nome || '';
    }

    if (campoAtiva) {
        campoAtiva.checked = ativa;
    }

    if (botaoSalvar) {
        botaoSalvar.textContent =
            'Salvar alterações';
    }

    if (dica) {

        dica.innerHTML =
            '<strong>Atenção:</strong> desativar uma categoria ' +
            'que possui produtos ativos vinculados não é permitido. ' +
            'Desative ou mova os produtos primeiro.';

    }

    preencherProdutosVinculados(produtos);

    abrirOverlayCategoria();

    setTimeout(() => {

        if (campoNome) {
            campoNome.focus();
        }

    }, 100);
}


// ============================================================
// ABRIR MODAL DE CATEGORIA
// ============================================================

function abrirOverlayCategoria() {

    const modal =
        document.getElementById('catModalCategoria');

    if (!modal) {
        console.error('catModalCategoria não encontrado.');
        return;
    }

    modal.classList.add('ativo');

    document.body.style.overflow = 'hidden';
}


// ============================================================
// FECHAR MODAL DE CATEGORIA
// ============================================================

function fecharModalCategoria() {

    const modal =
        document.getElementById('catModalCategoria');

    if (!modal) {
        return;
    }

    modal.classList.remove('ativo');

    document.body.style.overflow = '';

    // Limpa possíveis erros/estado antigo
    const form =
        document.getElementById('catForm');

    if (form) {
        form.classList.remove('erro');
    }
}


// ============================================================
// PRODUTOS VINCULADOS
// ============================================================

const ICONE_PRODUTO_SVG = `
<svg
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
    />
</svg>
`;


function preencherProdutosVinculados(produtos) {

    const bloco =
        document.getElementById('catBlocoProdutos');

    const lista =
        document.getElementById('catListaProdutos');

    const badge =
        document.getElementById('catBadgeCount');


    if (!bloco || !lista || !badge) {
        return;
    }


    if (produtos && produtos.length > 0) {

        bloco.style.display = 'block';

        badge.textContent =
            produtos.length +
            ' ativo' +
            (produtos.length !== 1 ? 's' : '');


        lista.innerHTML =
            produtos.map(p => `

                <a
                    class="cat-item-produto"
                    target="_blank"
                >

                    <span class="cat-produto-nome">

                        ${ICONE_PRODUTO_SVG}

                        ${escapeHtml(p.nome || 'Produto')}

                    </span>

                    <span class="cat-produto-preco">

                        R$ ${Number(
                            p.preco || 0
                        ).toFixed(2).replace('.', ',')}

                    </span>

                </a>

            `).join('');

    } else {

        bloco.style.display = 'none';

        lista.innerHTML = '';

        badge.textContent = '0 ativos';
    }
}


// ============================================================
// PROTEÇÃO CONTRA HTML NO NOME DO PRODUTO
// ============================================================

function escapeHtml(text) {

    const div = document.createElement('div');

    div.textContent = text;

    return div.innerHTML;
}


// ============================================================
// MODAIS DE CONFIRMAÇÃO
// ============================================================

function confirmarToggle(botao, nome) {

    const form = botao.closest('form');

    if (!form) {
        console.error(
            'Formulário de desativação não encontrado.'
        );
        return;
    }

    const nomeElemento =
        document.getElementById('nomeDesativar');

    const botaoConfirmar =
        document.getElementById(
            'btnConfirmarDesativar'
        );

    const modal =
        document.getElementById('modalDesativar');


    if (nomeElemento) {

        nomeElemento.textContent =
            '"' + nome + '"';

    }


    if (botaoConfirmar) {

        botaoConfirmar.onclick = function () {
            form.submit();
        };

    }


    if (modal) {
        modal.classList.add('aberto');
    }

    document.body.style.overflow = 'hidden';
}


function confirmarExclusao(botao, nome) {

    const form = botao.closest('form');

    if (!form) {
        console.error(
            'Formulário de exclusão não encontrado.'
        );
        return;
    }

    const nomeElemento =
        document.getElementById('nomeExcluir');

    const botaoConfirmar =
        document.getElementById(
            'btnConfirmarExcluir'
        );

    const modal =
        document.getElementById('modalExcluir');


    if (nomeElemento) {

        nomeElemento.textContent =
            '"' + nome + '"';

    }


    if (botaoConfirmar) {

        botaoConfirmar.onclick = function () {
            form.submit();
        };

    }


    if (modal) {
        modal.classList.add('aberto');
    }

    document.body.style.overflow = 'hidden';
}


// ============================================================
// FECHAR MODAIS DE CONFIRMAÇÃO
// ============================================================

function fecharModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove('aberto');

    document.body.style.overflow = '';
}


// ============================================================
// FECHAR MODAIS CLICANDO FORA
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

    document
        .querySelectorAll('.sobreposicao-modal')
        .forEach(modal => {

            modal.addEventListener(
                'click',
                function (e) {

                    if (e.target === modal) {

                        modal.classList.remove(
                            'aberto'
                        );

                        document.body.style.overflow =
                            '';

                    }

                }
            );

        });


    // Modal Nova/Editar Categoria

    const modalCategoria =
        document.getElementById(
            'catModalCategoria'
        );

    if (modalCategoria) {

        modalCategoria.addEventListener(
            'click',
            function (e) {

                if (e.target === modalCategoria) {

                    fecharModalCategoria();

                }

            }
        );

    }

});


// ============================================================
// TECLA ESC
// ============================================================

document.addEventListener(
    'keydown',
    function (e) {

        if (e.key !== 'Escape') {
            return;
        }


        // Fecha Nova/Editar

        const modalCategoria =
            document.getElementById(
                'catModalCategoria'
            );

        if (
            modalCategoria &&
            modalCategoria.classList.contains('ativo')
        ) {

            fecharModalCategoria();

            return;
        }


        // Fecha desativar

        const modalDesativar =
            document.getElementById(
                'modalDesativar'
            );

        if (
            modalDesativar &&
            modalDesativar.classList.contains('aberto')
        ) {

            fecharModal('modalDesativar');

            return;
        }


        // Fecha excluir

        const modalExcluir =
            document.getElementById(
                'modalExcluir'
            );

        if (
            modalExcluir &&
            modalExcluir.classList.contains('aberto')
        ) {

            fecharModal('modalExcluir');

        }

    }
);