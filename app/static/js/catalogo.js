// Estado global dos filtros
let categoriaAtiva = 'todos';

// Garante que o script rode perfeitamente assim que a página carregar
document.addEventListener("DOMContentLoaded", function() {
    aplicarFiltros();
});

/**
 * Função utilitária para remover acentos e espaços extras (Deixa o texto limpo para busca)
 */
function limparTexto(texto) {
    if (!texto) return '';
    return texto
        .toString()
        .toLowerCase()
        .normalize('NFD') // Separa os acentos das letras
        .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
        .trim();
}

/**
 * Função disparada na mudança do Select de Categorias
 */
function filterByCategory(selectElement) {
    if (!selectElement) return;
    
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const valorSelect = selectElement.value;

    if (valorSelect === 'todos') {
        categoriaAtiva = 'todos';
    } else {
        // Coleta preferencialmente do atributo data-nome, senão usa o texto visível
        const nomeAttr = selectedOption.getAttribute('data-nome');
        categoriaAtiva = limparTexto(nomeAttr ? nomeAttr : selectedOption.text);
    }

    aplicarFiltros();
}

/**
 * Função disparada a cada letra digitada no Input de Busca
 */
function searchProducts() {
    aplicarFiltros();
}

/**
 * O Motor Central de Filtragem Combinada
 */
function aplicarFiltros() {
    const inputBusca = document.getElementById('searchInput');
    // Limpa o termo digitado retirando acentos e espaços nas pontas
    const termoBusca = inputBusca ? limparTexto(inputBusca.value) : '';
    
    const cards = document.querySelectorAll('.product-card');
    let visibleCount = 0;

    cards.forEach(card => {
        // 1. Captura e limpa a categoria do card
        const cardCategoria = limparTexto(card.getAttribute('data-cat') || '');
        
        // 2. Captura o título e descrição específicos para evitar ler códigos internos ou links
        const cardTitulo = card.querySelector('h3') ? card.querySelector('h3').innerText : '';
        const cardDescricao = card.querySelector('p') ? card.querySelector('p').innerText : '';
        const textoAgrupadoDoCard = limparTexto(cardTitulo + ' ' + cardDescricao);

        // Regra de Validação 1: Categoria
        const bateCategoria = (
            categoriaAtiva === 'todos' || 
            cardCategoria === categoriaAtiva || 
            cardCategoria.includes(categoriaAtiva)
        );
        
        // Regra de Validação 2: Texto digitado
        const bateBusca = (!termoBusca || textoAgrupadoDoCard.includes(termoBusca));

        // Aplicação visual do filtro no layout
        if (bateCategoria && bateBusca) {
            card.style.setProperty('display', '', 'important');
            visibleCount++;
        } else {
            card.style.setProperty('display', 'none', 'important');
        }
    });

    // Controle do Estado Vazio (Aviso de nenhum produto)
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        if (visibleCount === 0) {
            emptyState.style.setProperty('display', 'block', 'important');
        } else {
            emptyState.style.setProperty('display', 'none', 'important');
        }
    }
}