// ==========================================
// VARIÁVEIS GLOBAIS DE CONTROLE
// ==========================================
let produtoIdStatus = null;
let acaoStatus = "desativar";
let produtoIdExcluir = null;
let urlEdicaoGlobal = ""; // Guarda a URL correta para o envio do form de edição

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

// ==========================================
// GERENCIADOR DINÂMICO DA GRADE DE TAMANHOS
// ==========================================
function gerenciarExibicaoGrade(selectId, grupoId, estoqueId, containerId) {
    const select = document.getElementById(selectId);
    const grupo = document.getElementById(grupoId);
    const estoque = document.getElementById(estoqueId);
    const container = document.getElementById(containerId);

    if (select.value === "10") {
        grupo.style.display = "block";
        estoque.readOnly = true;
        estoque.style.backgroundColor = "#f3f4f6";
        
        // Se o container estiver vazio (como no caso de criar novo), adiciona a linha inicial
        if (container && container.children.length === 0) {
            adicionarLinha(containerId, estoqueId);
        }
        somarGradeNaTela(containerId, estoqueId);
    } else {
        grupo.style.display = "none";
        estoque.readOnly = false;
        estoque.style.backgroundColor = "#ffffff";
    }
}

function adicionarLinha(containerId, estoqueId, tamanhoVal = "", qtdVal = 0) {
    const container = document.getElementById(containerId);
    const novaLinha = document.createElement("div");
    novaLinha.className = "linha-grade";
    novaLinha.style.display = "flex";
    novaLinha.style.gap = "6px";
    novaLinha.style.alignItems = "center";
    novaLinha.innerHTML = `
        <input type="text" class="grade-tamanho" placeholder="Ex: P, M, G" value="${tamanhoVal}" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <input type="number" class="grade-qtd" placeholder="Qtd" min="0" value="${qtdVal}" oninput="somarGradeNaTela('${containerId}', '${estoqueId}')" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
        <button type="button" onclick="removerLinha(this, '${containerId}', '${estoqueId}')" style="background-color: #fee2e2; color: #dc2626; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">✕</button>
    `;
    container.appendChild(novaLinha);
    somarGradeNaTela(containerId, estoqueId);
}

function removerLinha(botao, containerId, estoqueId) {
    const container = document.getElementById(containerId);
    if (container.children.length > 1) {
        botao.closest(".linha-grade").remove();
        somarGradeNaTela(containerId, estoqueId);
    } else {
        alert("Produtos de vestuário exigem pelo menos uma variação.");
    }
}

function somarGradeNaTela(containerId, estoqueId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const inputsQtd = container.querySelectorAll(".grade-qtd");
    let soma = 0;
    inputsQtd.forEach(input => {
        soma += parseInt(input.value) || 0;
    });
    document.getElementById(estoqueId).value = soma;
}

// Coleta os inputs da grade estruturando em formato de Array
function capturarDadosGrade(containerId) {
    const container = document.getElementById(containerId);
    const lines = container.querySelectorAll(".linha-grade");
    const variacoes = [];
    lines.forEach(linha => {
        const tam = linha.querySelector(".grade-tamanho").value.trim();
        const qtd = parseInt(linha.querySelector(".grade-qtd").value) || 0;
        if (tam) {
            variacoes.push({ tamanho: tam, estoque_atual: qtd });
        }
    });
    return variacoes;
}

// ==========================================
// SALVAR NOVO PRODUTO
// ==========================================
async function salvarProduto() {
    const nome = document.getElementById("produtoNome").value.trim();
    const categoria = document.getElementById("produtoCategoria").value;
    const precoInput = document.getElementById("produtoPreco").value;
    const estoqueInput = document.getElementById("produtoEstoque").value;
    const imagem = document.getElementById("produtoImagem").files[0];

    if (!nome) { alert("O nome do produto é obrigatório."); return; }
    if (!categoria) { alert("Por favor, selecione uma categoria."); return; }

    const preco = parseFloat(precoInput) || 0.0;
    const estoqueAtual = parseInt(estoqueInput) || 0;
    const categoriaId = parseInt(categoria);

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("categoria_id", categoriaId);
    formData.append("preco", preco);
    formData.append("estoque_atual", estoqueAtual); 
    formData.append("descricao", ""); 

    if (imagem) { formData.append("imagem", imagem); }

    // Se categoria for Vestuário (10), serializa as variações no Form
    if (categoria === "10") {
        const variacoes = capturarDadosGrade("container-grades");
        formData.append("variacoes_json", JSON.stringify(variacoes));
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
            console.error(erroDetalhado);
            alert("Erro ao cadastrar produto.");
        }
    } catch (erro) {
        alert("Erro ao conectar com o servidor.");
    }
}

// ==========================================
// EDITAR PRODUTO (ABRIR E SALVAR)
// ==========================================
async function abrirModalEditar(botao) {
    if (window.event) window.event.stopPropagation();

    const pId = botao.dataset.id;
    document.getElementById("editNome").value = botao.dataset.nome;
    document.getElementById("editPreco").value = botao.dataset.preco;
    
    // Define o valor inicial do estoque que veio do botão antes do fetch de segurança
    document.getElementById("editEstoque").value = botao.dataset.estoque;
    
    const catSelect = document.getElementById("editCategoria");
    catSelect.value = botao.dataset.categoria;
    
    urlEdicaoGlobal = `/produtos/${pId}/editar`;
    
    const container = document.getElementById("edit-container-grades");
    container.innerHTML = ""; // Limpa a grade antiga

    // Se for categoria 10, aguarda a resposta da API para construir a grade de forma assíncrona
    if (botao.dataset.categoria === "10") {
        try {
            const res = await fetch(`/produtos/${pId}/variacoes`);
            if (res.ok) {
                const variacoes = await res.json();
                if (variacoes.length > 0) {
                    variacoes.forEach(v => {
                        adicionarLinha("edit-container-grades", "editEstoque", v.tamanho, v.estoque_atual);
                    });
                } else {
                    adicionarLinha("edit-container-grades", "editEstoque");
                }
            } else {
                adicionarLinha("edit-container-grades", "editEstoque");
            }
        } catch (e) {
            adicionarLinha("edit-container-grades", "editEstoque");
        }
    }

    // Gerencia o estado de exibição do grupo e o bloqueio de edição direta do campo estoque
    gerenciarExibicaoGrade("editCategoria", "editGrupoTamanho", "editEstoque", "edit-container-grades");
    
    // Força a soma total correta na tela somente após todas as linhas terem sido inseridas
    if (botao.dataset.categoria === "10") {
        somarGradeNaTela("edit-container-grades", "editEstoque");
    }

    abrirModal("modalEditarProduto");
}

async function salvarEdicaoProduto(event) {
    event.preventDefault(); // Impede o envio tradicional síncrono do HTML

    const formElement = document.getElementById("formEditarProduto");
    const formData = new FormData(formElement);

    // Se for vestuário, capturamos a grade exatamente do jeito que está em exibição
    if (document.getElementById("editCategoria").value === "10") {
        const variacoes = capturarDadosGrade("edit-container-grades");
        
        // Remove do envio qualquer valor antigo ou congelado do input estoque_atual
        formData.delete("estoque_atual"); 
        
        // Anexa o JSON com a lista completa (com as alterações e os intocados)
        formData.append("variacoes_json", JSON.stringify(variacoes));
    }

    try {
        const resposta = await fetch(urlEdicaoGlobal, {
            method: "POST",
            body: formData
        });
        if (resposta.ok) {
            window.location.reload();
        } else {
            alert("Erro ao salvar as alterações do produto.");
        }
    } catch (err) {
        alert("Erro de comunicação com o servidor.");
    }
}

// ==========================================
// EVENT LISTENERS DE INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const selectCategoria = document.getElementById("produtoCategoria");
    if (selectCategoria) {
        selectCategoria.addEventListener("change", () => {
            gerenciarExibicaoGrade("produtoCategoria", "grupoTamanho", "produtoEstoque", "container-grades");
        });
    }

    const selectEditCategoria = document.getElementById("editCategoria");
    if (selectEditCategoria) {
        selectEditCategoria.addEventListener("change", () => {
            gerenciarExibicaoGrade("editCategoria", "editGrupoTamanho", "editEstoque", "edit-container-grades");
        });
    }
});

// ==========================================
// CONTROLE DE STATUS E EXCLUSÃO
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
            textoModal.innerHTML = `Tem certeza que deseja ativar <strong>${nomeProduto}</strong>?`;
            botaoConfirmar.textContent = "Ativar";
            botaoConfirmar.style.background = "#2ecc71";
        } else {
            tituloModal.textContent = "Desativar produto";
            textoModal.innerHTML = `Tem certeza que deseja desativar <strong>${nomeProduto}</strong>?`;
            botaoConfirmar.textContent = "Desativar";
            botaoConfirmar.style.background = "#e67e22";
        }
    }
    abrirModal("overlay");
}

function desativarProduto() {
    if (!produtoIdStatus) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/${produtoIdStatus}/${acaoStatus}`;
    document.body.appendChild(form);
    form.submit();
}

function abrirModalExcluir(botao) {
    if (window.event) window.event.stopPropagation();
    produtoIdExcluir = botao.dataset.id;
    document.getElementById("nome-produto-excluir").textContent = botao.dataset.nome;
    abrirModal("overlay-excluir");
}

function excluirProduto() {
    if (!produtoIdExcluir) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/${produtoIdExcluir}/excluir`;
    document.body.appendChild(form);
    form.submit();
}