// ==========================================================================
// AAPM · SENAI Matarazzo — Modal "Esqueci minha senha"
// ==========================================================================

function abrirModalSenha() {
    const modal = document.getElementById('modal-esqueci-senha');
    document.getElementById('modal-alert-area').innerHTML = '';
    document.getElementById('form-esqueci-senha').reset();
    modal.showModal();
}

function fecharModalSenha() {
    const modal = document.getElementById('modal-esqueci-senha');
    modal.close();
}

// Fecha ao clicar fora do conteúdo (no backdrop)
document.getElementById('modal-esqueci-senha')?.addEventListener('click', (event) => {
    const modal = event.currentTarget;
    if (event.target === modal) {
        modal.close();
    }
});

// Envio do formulário via fetch, sem recarregar a página
document.getElementById('form-esqueci-senha')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value;
    const alertArea = document.getElementById('modal-alert-area');
    const submitBtn = form.querySelector('button[type="submit"]');

    alertArea.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
        // A rota espera form-urlencoded (Form(...) no FastAPI), não JSON
        const response = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email }),
        });

        if (response.ok) {
            // A rota sempre responde com a mesma mensagem genérica,
            // por segurança (não revela se o e-mail existe ou não).
            alertArea.innerHTML = `
                <div class="form-error visible form-error--success">
                    Se este e-mail estiver cadastrado como administrador, você receberá um link de redefinição em instantes.
                </div>
            `;
            form.reset();
        } else {
            alertArea.innerHTML = `
                <div class="form-error visible">
                    Não foi possível processar o pedido. Tente novamente.
                </div>
            `;
        }
    } catch (err) {
        alertArea.innerHTML = `
            <div class="form-error visible">
                Erro de conexão. Verifique sua internet e tente novamente.
            </div>
        `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar link';
    }
});