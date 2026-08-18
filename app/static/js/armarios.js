/* =========================================================
   AAPM SENAI — Armários
   Interações: abrir/fechar modais, selecionar armário,
   registrar devolução e exibir toast de feedback.
   ========================================================= */

/* ---------------------------------------------------------
   Utilitários de modal
--------------------------------------------------------- */
function abrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('aberto');
  document.body.style.overflow = '';
}

// Fecha o modal ao clicar fora da caixa (na sobreposição)
function fecharModalFora(event, id) {
  if (event.target && event.target.id === id) {
    fecharModal(id);
  }
}

/* ---------------------------------------------------------
   Modal: Novo Aluguel
--------------------------------------------------------- */
function abrirModalNovoAluguel(armarioId) {
  const form = document.getElementById('formNovoAluguel');
  if (form) form.reset();

  const inputInicio = document.getElementById('modalDataInicio');
  if (inputInicio) {
    const hoje = new Date().toISOString().split('T')[0];
    inputInicio.value = hoje;
    inputInicio.min = hoje;
  }

  const inputDevolucao = document.getElementById('modalDataDevolucao');
  if (inputDevolucao && inputInicio) {
    inputDevolucao.min = inputInicio.value;
  }

  // Se a função foi chamada a partir de um armário específico (grade),
  // pré-seleciona esse armário no select.
  const selectArmario = document.getElementById('modalArmarioNumero');
  if (selectArmario && armarioId) {
    selectArmario.value = armarioId;
  }

  document.getElementById('modalAluguelTitulo').textContent = 'Novo Aluguel';
  abrirModal('modalAluguel');
}

/* ---------------------------------------------------------
   Modal: Detalhe do Armário / Devolução
--------------------------------------------------------- */
function abrirArmario(id, numero, status, alunoNome, alunoTurma, dataDevolucao) {
  const titulo = document.getElementById('detalheArmarioTitulo');
  const conteudo = document.getElementById('conteudoDetalheArmario');
  const inputId = document.getElementById('devolucaoArmarioId');
  const btnConfirmar = document.getElementById('btnConfirmarDevolucao');
  const formDevolucao = document.getElementById('formDevolucao');

  if (titulo) titulo.textContent = `Armário #${numero}`;
  if (inputId) inputId.value = id;

  const rotuloStatus = {
    livre: 'Disponível',
    ocupado: 'Ocupado',
    atrasado: 'Atrasado'
  }[status] || status;

  if (status === 'livre') {
    // Armário livre: sem aluno, oferece atalho para alugar
    if (conteudo) {
      conteudo.innerHTML = `
        <div class="linha-detalhe"><span>Status</span><span>${rotuloStatus}</span></div>
        <div class="linha-detalhe"><span>Aluno</span><span>—</span></div>
      `;
    }
    if (formDevolucao) formDevolucao.style.display = 'none';
  } else {
    if (conteudo) {
      conteudo.innerHTML = `
        <div class="linha-detalhe"><span>Status</span><span>${rotuloStatus}</span></div>
        <div class="linha-detalhe"><span>Aluno</span><span>${alunoNome || '—'}</span></div>
        <div class="linha-detalhe"><span>Turma</span><span>${alunoTurma || '—'}</span></div>
        <div class="linha-detalhe"><span>Previsão de devolução</span><span>${dataDevolucao || '—'}</span></div>
      `;
    }
    if (formDevolucao) formDevolucao.style.display = '';
    if (btnConfirmar) btnConfirmar.textContent = 'Registrar Devolução';
  }

  abrirModal('modalDetalheArmario');
}

/* ---------------------------------------------------------
   Devolução a partir da tabela de aluguéis ativos
--------------------------------------------------------- */
function registrarDevolucao(id, numero) {
  const titulo = document.getElementById('detalheArmarioTitulo');
  const conteudo = document.getElementById('conteudoDetalheArmario');
  const inputId = document.getElementById('devolucaoArmarioId');
  const formDevolucao = document.getElementById('formDevolucao');

  if (titulo) titulo.textContent = `Armário #${numero}`;
  if (inputId) inputId.value = id;
  if (conteudo) {
    conteudo.innerHTML = `
      <div class="linha-detalhe"><span>Ação</span><span>Confirmar devolução do armário #${numero}</span></div>
    `;
  }
  if (formDevolucao) formDevolucao.style.display = '';

  abrirModal('modalDetalheArmario');
}

/* ---------------------------------------------------------
   Toast de feedback
--------------------------------------------------------- */
let toastTimeout;
function mostrarToast(mensagem, tipo = 'sucesso') {
  const toast = document.getElementById('toast');
  const texto = document.getElementById('toastMensagem');
  if (!toast || !texto) return;

  texto.textContent = mensagem;
  toast.classList.toggle('erro', tipo === 'erro');
  toast.classList.add('visivel');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('visivel');
  }, 3200);
}

/* ---------------------------------------------------------
   Data atual no cabeçalho (mesmo padrão do Painel)
--------------------------------------------------------- */
function exibirDataAtual() {
  const elemento = document.getElementById('dataAtual');
  if (!elemento) return;

  const hoje = new Date();
  const texto = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  elemento.textContent = texto;
}

/* ---------------------------------------------------------
   Validações simples de formulário
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  exibirDataAtual();

  const formNovoAluguel = document.getElementById('formNovoAluguel');
  if (formNovoAluguel) {
    formNovoAluguel.addEventListener('submit', (evento) => {
      const armario = document.getElementById('modalArmarioNumero').value;
      const aluno = document.getElementById('modalAluno').value;
      const inicio = document.getElementById('modalDataInicio').value;
      const devolucao = document.getElementById('modalDataDevolucao').value;

      if (!armario || !aluno || !inicio || !devolucao) {
        evento.preventDefault();
        mostrarToast('Preencha todos os campos obrigatórios.', 'erro');
        return;
      }

      if (devolucao < inicio) {
        evento.preventDefault();
        mostrarToast('A previsão de devolução não pode ser antes do início.', 'erro');
      }
    });
  }

  const inputInicio = document.getElementById('modalDataInicio');
  const inputDevolucao = document.getElementById('modalDataDevolucao');
  if (inputInicio && inputDevolucao) {
    inputInicio.addEventListener('change', () => {
      inputDevolucao.min = inputInicio.value;
    });
  }

  // Fecha modais com a tecla Esc
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharModal('modalAluguel');
      fecharModal('modalDetalheArmario');
    }
  });

  // Exibe toast automaticamente quando a página carrega com
  // parâmetros de sucesso na URL (?alugado=ok / ?devolvido=ok)
  const alertaSucesso = document.querySelector('.alerta-sucesso');
  if (alertaSucesso) {
    mostrarToast(alertaSucesso.textContent.trim(), 'sucesso');
  }
});