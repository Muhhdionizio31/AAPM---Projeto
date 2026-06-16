document.addEventListener("DOMContentLoaded", function () {
    // 1. Atualiza a data no cabeçalho da página
    const dataAtualSpan = document.getElementById("dataAtual");
    if (dataAtualSpan) {
        const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dataAtualSpan.textContent = new Date().toLocaleDateString('pt-BR', opcoes);
    }

    // 2. RECUPERA OS DADOS REAIS DO HTML (Injetados pelo FastAPI/Jinja2)
    const divCategorias = document.getElementById("dados-grafico-categorias");
    const divVendas = document.getElementById("dados-grafico-vendas");

    if (!divCategorias || !divVendas) {
        console.warn("Elementos de dados do painel não foram encontrados nesta página.");
        return;
    }

    const categoriasLabels = JSON.parse(divCategorias.getAttribute("data-labels"));
    const categoriasValores = JSON.parse(divCategorias.getAttribute("data-valores"));
    const vendasMensais = JSON.parse(divVendas.getAttribute("data-vendas"));

  // 3. RENDERIZAÇÃO DO GRÁFICO DE CATEGORIAS (Rosca/Doughnut)
  const canvasCategorias = document.getElementById("graficoCategorias");
    if (canvasCategorias) {
        const ctxCategorias = canvasCategorias.getContext("2d");

        // Paleta de cores do SENAI (Vermelho, Grafite, Cinza) + cores auxiliares modernas
        const paletaCores = [
            '#c8102e', // Vermelho Principal
            '#111111', // Grafite Escuro
            '#7f8c8d', // Cinza Médio
            '#e67e22', // Laranja
            '#2ce6c8', // Azul Turquesa
            '#9b59b6', // Roxo
            '#27ae60', // Verde
            '#f1c40f'  // Amarelo
        ];

        // Mapeia as cores para a quantidade de categorias reais vindas do banco
        const coresDoGrafico = categoriasLabels.map((_, index) => {
            return paletaCores[index % paletaCores.length];
        });

        new Chart(ctxCategorias, {
            type: 'doughnut',
            data: {
                labels: categoriasLabels, // Nomes das categorias reais
                datasets: [{
                    data: categoriasValores, // Quantidade de produtos por categoria
                    backgroundColor: coresDoGrafico, // Lista de cores dinâmicas
                    borderWidth: 2,
                    borderColor: '#ffffff', // Linha fina branca separando os gomos
                    hoverOffset: 8 // Faz o gomo "saltar" levemente ao passar o mouse
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Mantém a legenda padrão oculta (pois você usa a do HTML)
                    },
                    tooltip: {
                        enabled: true, // Garante que a caixinha preta ao passar o mouse está ativa
                        backgroundColor: 'rgba(17, 17, 17, 0.9)', // Fundo grafite elegante
                        titleFont: { family: 'Montserrat', size: 13, weight: 'bold' },
                        bodyFont: { family: 'Lato', size: 13 },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true, // Mostra o quadradinho da cor ao lado do texto no hover
                        callbacks: {
                            // Customiza o texto que aparece dentro do balão do mouse
                            label: function(context) {
                                const quantidade = context.raw;
                                return ` Produtos: ${quantidade} un.`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. RENDERIZAÇÃO DO GRÁFICO DE VENDAS (Barras)
    const canvasVendas = document.getElementById("graficoVendas");
    if (canvasVendas) {
        new Chart(canvasVendas.getContext("2d"), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [
                    {
                        label: 'Vendas (unid.)',
                        data: vendasMensais, // Injeção dos dados dinâmicos do banco
                        backgroundColor: '#c8102e',
                        borderRadius: 4
                    },
                    {
                        label: 'Meta',
                        data: Array(12).fill(150),
                        type: 'line',
                        borderColor: '#111111',
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // 5. RENDERIZAÇÃO DO GRÁFICO DE RECEITA MENSAL (Dados 100% Reais)
    const divReceita = document.getElementById("dados-grafico-receita");
    const canvasReceita = document.getElementById("graficoReceita");
    
    if (divReceita && canvasReceita) {
        const receitaLabels = JSON.parse(divReceita.getAttribute("data-labels"));
        const receitaValores = JSON.parse(divReceita.getAttribute("data-valores"));
        
        new Chart(canvasReceita.getContext("2d"), {
            type: 'line',
            data: {
                labels: receitaLabels, // Meses reais vindos do banco (ex: ['Jan', 'Fev'...])
                datasets: [{
                    label: 'Receita Real (R$)',
                    data: receitaValores, // Faturamento real somado por mês
                    borderColor: '#c8102e',
                    backgroundColor: 'rgba(200, 16, 46, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
});