async function salvarProduto() {

    const nome = document.getElementById("produtoNome").value;
    const categoria = document.getElementById("produtoCategoria").value;
    const preco = document.getElementById("produtoPreco").value;
    const estoque = document.getElementById("produtoEstoque").value;
    const imagem = document.getElementById("produtoImagem").files[0];

    if (!nome || !categoria || !preco || !estoque) {
        alert("Preencha nome, categoria, preco e estoque.");
        return;
    }

    const formData = new FormData();

    formData.append("nome", nome);
    formData.append("categoria_id", categoria);
    formData.append("preco", preco);
    formData.append("estoque_atual", estoque);

    if (imagem) {
        formData.append("imagem", imagem);
    }

    try {

        const resposta = await fetch("/produtos/novo", {
            method: "POST",
            body: formData
        });

        if (resposta.ok) {
            window.location.href = "/produtos?criado=ok";
        } else {
            alert("Erro ao cadastrar produto.");
        }

    } catch (erro) {
        console.error(erro);
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

function abrirModalDesativar(id, nome) {

    produtoIdDesativar = id;

    document.querySelector("#overlay strong").textContent = nome;

    document.getElementById("overlay").style.display = "flex";
}

function desativarProduto() {

    if (!produtoIdDesativar) return;

    const form = document.createElement("form");

    form.method = "POST";
    form.action = `/produtos/${produtoIdDesativar}/desativar`;

    document.body.appendChild(form);

    form.submit();
}
