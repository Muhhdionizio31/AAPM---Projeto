// Data no cabeçalho
const dataEl = document.getElementById('dataAtual');
if (dataEl) {
    const agora = new Date();
    dataEl.textContent = agora.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
}

// ── MODAL ──
function abrirModal() {
    const overlay = document.getElementById('modalOverlay');
    const form = document.getElementById('formUsuario');
    document.getElementById('modalTitulo').textContent = 'Novo Usuário';
    document.getElementById('modalSubtitulo').textContent = 'Preencha os dados para criar o acesso';
    document.getElementById('btnSalvar').textContent = 'Criar Usuário';
    document.getElementById('hintSenha').textContent = 'Obrigatório para novo usuário';
    document.getElementById('inputSenha').required = true;
    form.action = '/usuarios/novo';
    form.reset();
    overlay.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('inputNome').focus(), 280);
}

function abrirModalEdicao(id, nome, email, role) {
    const overlay = document.getElementById('modalOverlay');
    const form = document.getElementById('formUsuario');
    document.getElementById('modalTitulo').textContent = 'Editar Usuário';
    document.getElementById('modalSubtitulo').textContent = 'Atualize os dados do usuário';
    document.getElementById('btnSalvar').textContent = 'Salvar Alterações';
    document.getElementById('hintSenha').textContent = 'Deixe em branco para manter a senha atual';
    document.getElementById('inputSenha').required = false;
    form.action = `/usuarios/${id}/editar`;
    form.reset();
    document.getElementById('inputNome').value = nome;
    document.getElementById('inputEmail').value = email;
    document.getElementById('inputPerfil').value = role.toLowerCase();
    overlay.classList.add('aberto');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('inputNome').focus(), 280);
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('aberto');
    document.body.style.overflow = '';
}

function fecharModalFora(e) {
    if (e.target === document.getElementById('modalOverlay')) fecharModal();
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
});

// ── BUSCA ──
function filtrarTabela() {
    const termo = document.getElementById('campoBusca').value.toLowerCase();
    const linhas = document.querySelectorAll('#corpoTabela tr[data-nome]');
    let visiveis = 0;
    linhas.forEach(tr => {
        const nome = tr.dataset.nome || '';
        const email = tr.dataset.email || '';
        const exibe = nome.includes(termo) || email.includes(termo);
        tr.style.display = exibe ? '' : 'none';
        if (exibe) visiveis++;
    });
    const cont = document.getElementById('contagemUsuarios');
    if (cont) cont.textContent = visiveis + ' usuário' + (visiveis !== 1 ? 's' : '');
}

// Inicializa contagem
window.addEventListener('DOMContentLoaded', () => filtrarTabela());