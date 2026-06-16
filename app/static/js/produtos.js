async function salvarProduto() {
    const nome = document.getElementById("produtoNome").value.trim();
    const categoria = document.getElementById("produtoCategoria").value;
    const precoInput = document.getElementById("produtoPreco").value;
    const estoqueInput = document.getElementById("produtoEstoque").value;
    const imagem = document.getElementById("produtoImagem").files[0];

    // Validações básicas no Front-End para evitar requisições inúteis
    if (!nome) {
        alert("O nome do produto é obrigatório.");
        return;
    }
    if (!categoria) {
        alert("Por favor, selecione uma categoria. Ela é obrigatória.");
        return;
    }

    // Conversão de tipos para garantir consistência numérica
    const preco = parseFloat(precoInput) || 0.0;
    const estoqueAtual = parseInt(estoqueInput) || 0;
    const categoriaId = parseInt(categoria);

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("categoria_id", categoriaId);
    formData.append("preco", preco);
    
    // CORREÇÃO AQUI: Mudamos de "estoque" para "estoque_atual" para bater com o banco
    formData.append("estoque_atual", estoqueAtual); 
    
    // Enviando uma string vazia para a descrição (caso sua rota exija o campo no Schema)
    formData.append("descricao", ""); 

    if (imagem) {
        formData.append("imagem", imagem);
    }

    try {
        const resposta = await fetch("/produtos/novo", {
            method: "POST",
            body: formData
            // Deixe sem headers, o navegador resolve o Boundary do FormData sozinho
        });

        if (resposta.ok) {
            window.location.reload();
        } else {
            // Caso ainda dê erro, isso vai printar no console exatamente qual campo falhou
            const erroDetalhado = await resposta.json();
            console.error("Detalhes do erro 422 enviados pelo FastAPI:", erroDetalhado);
            
            // Tenta mostrar uma mensagem mais amigável vinda do servidor
            if (erroDetalhado.detail && Array.isArray(erroDetalhado.detail)) {
                const erroMsg = erroDetalhado.detail.map(e => `${e.loc.join(' -> ')}: ${e.msg}`).join('\n');
                alert(`Erro de validação no servidor:\n${erroMsg}`);
            } else {
                alert("Erro ao cadastrar produto. Verifique os detalhes no console (F12).");
            }
        }

    } catch (erro) {
        console.error("Erro na conexão:", erro);
        alert("Erro ao conectar com o servidor.");
    }
}

function abrirModal(id) {
    document.getElementById(id).style.display = "flex";
}

function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

function fecharModalFora(event, id) {
    if (event.target.id === id) {
        fecharModal(id);
    }
}

function abrirModalEditar(botao) {

    document.getElementById("editNome").value =
        botao.dataset.nome;

    document.getElementById("editPreco").value =
        botao.dataset.preco;

    document.getElementById("editEstoque").value =
        botao.dataset.estoque;

    document.getElementById("editCategoria").value =
        botao.dataset.categoria;

    document.getElementById("formEditarProduto").action =
        `/produtos/${botao.dataset.id}/editar`;

    document.getElementById("modalEditarProduto").style.display =
        "flex";
}

let produtoIdDesativar = null;

// 1. Função que abre o modal e captura os dados do botão clicado
function abrirModalDesativar(botao) {
    try {
        // Captura o ID e o Nome armazenados nos data-attributes do botão
        produtoIdDesativar = botao.dataset.id;
        const nomeProduto = botao.dataset.nome;

        // Injeta o nome do produto na tag <strong> que está dentro do modal
        const elementoTexto = document.querySelector("#overlay strong");
        if (elementoTexto) {
            elementoTexto.textContent = nomeProduto;
        }

        // Exibe o modal na tela
        const modal = document.getElementById("overlay");
        if (modal) {
            modal.style.display = "flex";
        }
    } catch (erro) {
        console.error("Erro ao abrir o modal de desativação:", erro);
    }
}

// 2. Função que cria o formulário invisível e envia o POST para o banco de dados
function desativarProduto() {
    if (!produtoIdDesativar) return;

    // Cria o formulário dinamicamente
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/${produtoIdDesativar}/desativar`;

    document.body.appendChild(form);

    // Envia o formulário de forma segura
    if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
    } else {
        form.submit();
    }
}

// Aguarda o HTML carregar para monitorar o select de categorias
document.addEventListener("DOMContentLoaded", () => {
    const selectCategoria = document.getElementById("produtoCategoria");
    const grupoTamanho = document.getElementById("grupoTamanho");
    const inputTamanho = document.getElementById("produtoTamanho");

    if (selectCategoria) {
        selectCategoria.addEventListener("change", (event) => {
            // Se o ID selecionado for igual a 10
            if (event.target.value === "10") {
                grupoTamanho.style.display = "block"; // Mostra o campo
            } else {
                grupoTamanho.style.display = "none";  // Esconde o campo
                inputTamanho.value = "";              // Limpa o valor caso mude de ideia
            }
        });
    }
});