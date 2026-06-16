// ==========================================
// VARIÁVEIS GLOBAIS DE CONTROLE
// ==========================================
let produtoIdStatus = null;
let acaoStatus = "desativar";
let produtoIdExcluir = null;

// ==========================================
// FUNÇÕES DOS MODAIS GERAIS (NOVO PRODUTO)
// ==========================================
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

function fecharModalFora(event, id) {
    if (event.target.id === id) {
        fecharModal(id);
    }
}

async function salvarProduto() {
    const nome = document.getElementById("produtoNome").value.trim();
    const categoria = document.getElementById("produtoCategoria").value;
    const precoInput = document.getElementById("produtoPreco").value;
    const estoqueInput = document.getElementById("produtoEstoque").value;
    const imagem = document.getElementById("produtoImagem").files[0];

    if (!nome) {
        alert("O nome do produto é obrigatório.");
        return;
    }
    if (!categoria) {
        alert("Por favor, selecione uma categoria. Ela é obrigatória.");
        return;
    }

    const preco = parseFloat(precoInput) || 0.0;
    const estoqueAtual = parseInt(estoqueInput) || 0;
    const categoriaId = parseInt(categoria);

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("categoria_id", categoriaId);
    formData.append("preco", preco);
    formData.append("estoque_atual", estoqueAtual); 
    formData.append("descricao", ""); 

    if (imagem) {
        formData.append("imagem", imagem);
    }

    try {
        const resposta = await fetch("/produtos/novo", {
            method: "POST",
            body: formData
        });

        if (resposta.ok) {
            window.location.reload();
        } else {
            const erroDetalhado = await resposta.json();
            console.error("Detalhes do erro enviados pelo servidor:", erroDetalhado);
            alert("Erro ao cadastrar produto. Verifique os detalhes no console.");
        }
    } catch (erro) {
        console.error("Erro na conexão:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}

// ==========================================
// FUNÇÃO DE EDITAR PRODUTO
// ==========================================
function abrirModalEditar(botao) {
    if (window.event) window.event.stopPropagation();

    document.getElementById("editNome").value = botao.dataset.nome;
    document.getElementById("editPreco").value = botao.dataset.preco;
    document.getElementById("editEstoque").value = botao.dataset.estoque;
    document.getElementById("editCategoria").value = botao.dataset.categoria;

    const form = document.getElementById("formEditarProduto");
    if (form) {
        form.action = `/produtos/${botao.dataset.id}/editar`;
    }
    
    abrirModal("modalEditarProduto");
}

// ==========================================
// CONTROLE DE STATUS (ATIVAR / DESATIVAR)
// ==========================================
function abrirModalStatus(botao) {
    if (window.event) window.event.stopPropagation();
    
    produtoIdStatus = botao.dataset.id;
    acaoStatus = botao.dataset.acao;
    const nomeProduto = botao.dataset.nome;

    const tituloModal = document.querySelector("#overlay h2");
    const textoModal = document.querySelector("#overlay p");
    const botaoConfirmar = document.querySelector("#overlay button:last-child");

    if (tituloModal && textoModal && botaoConfirmar) {
        if (acaoStatus === "ativar") {
            tituloModal.textContent = "Ativar produto";
            textoModal.innerHTML = `Tem certeza que deseja ativar <strong style="color: #111; font-weight: 700;">${nomeProduto}</strong>? Ele voltará a ficar visível no catálogo.`;
            botaoConfirmar.textContent = "Ativar";
            botaoConfirmar.style.background = "#2ecc71";
        } else {
            tituloModal.textContent = "Desativar produto";
            textoModal.innerHTML = `Tem certeza que deseja desativar <strong style="color: #111; font-weight: 700;">${nomeProduto}</strong>? O produto não estará mais disponível no catálogo.`;
            botaoConfirmar.textContent = "Desativar";
            botaoConfirmar.style.background = "#e67e22";
        }
    }

    const modal = document.getElementById("overlay");
    if (modal) modal.style.display = "flex";
}

function desativarProduto() {
    if (!produtoIdStatus) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/${produtoIdStatus}/${acaoStatus}`;

    document.body.appendChild(form);
    form.submit();
}

// ==========================================
// CONTROLE DE EXCLUSÃO DE PRODUTO
// ==========================================
function abrirModalExcluir(botao) {
    if (window.event) window.event.stopPropagation();

    produtoIdExcluir = botao.dataset.id;
    const nomeProduto = botao.dataset.nome;

    const elementoTexto = document.getElementById("nome-produto-excluir");
    if (elementoTexto) {
        elementoTexto.textContent = nomeProduto;
    }

    const modal = document.getElementById("overlay-excluir");
    if (modal) modal.style.display = "flex";
}

function excluirProduto() {
    if (!produtoIdExcluir) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/${produtoIdExcluir}/excluir`;

    document.body.appendChild(form);
    form.submit();
}

// ==========================================
// MONITOR DE CATEGORIAS (FILTRO DINÂMICO)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const selectCategoria = document.getElementById("produtoCategoria");
    const grupoTamanho = document.getElementById("grupoTamanho");
    const inputTamanho = document.getElementById("produtoTamanho");

    if (selectCategoria && grupoTamanho && inputTamanho) {
        selectCategoria.addEventListener("change", (event) => {
            if (event.target.value === "10") {
                grupoTamanho.style.display = "block";
            } else {
                grupoTamanho.style.display = "none";
                inputTamanho.value = "";
            }
        });
    }
});