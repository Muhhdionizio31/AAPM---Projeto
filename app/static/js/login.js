// ==========================================================================
// AAPM · SENAI Matarazzo — Tela de Carregamento e Login Administrativo
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('form[action="/auth/login"]');
    if (!formLogin) return;

    const overlay = document.getElementById('login-loading-overlay');
    const spinner = document.getElementById('loading-spinner');
    const successIcon = document.getElementById('loading-success-icon');
    const titleEl = document.getElementById('loading-title');
    const subtitleEl = document.getElementById('loading-subtitle');
    const progressBar = document.getElementById('loading-progress-bar');
    const btnSubmit = formLogin.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const lembrarInput = document.getElementById('lembrar');

    // Elemento para exibir mensagens de erro
    let errorContainer = document.querySelector('.form-error:not(#modal-alert-area .form-error)');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'form-error';
        const cardHeader = document.querySelector('.login-card-header');
        if (cardHeader && cardHeader.nextElementSibling) {
            cardHeader.parentNode.insertBefore(errorContainer, cardHeader.nextElementSibling);
        }
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validação HTML5 básica
        if (!emailInput.value.trim() || !senhaInput.value.trim()) {
            formLogin.reportValidity();
            return;
        }

        // Limpa erro anterior
        if (errorContainer) {
            errorContainer.classList.remove('visible');
            errorContainer.textContent = '';
        }

        // Configuração inicial do Loading
        if (spinner) spinner.style.display = 'flex';
        if (successIcon) successIcon.style.display = 'none';
        if (progressBar) progressBar.classList.remove('finished');
        if (titleEl) titleEl.textContent = 'Autenticando Administrador';
        if (subtitleEl) subtitleEl.textContent = 'Verificando credenciais no sistema...';

        // Ativa o overlay e desativa botão
        if (overlay) {
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
        }
        if (btnSubmit) btnSubmit.disabled = true;

        const startTime = Date.now();
        const minDisplayTime = 800; // Tempo mínimo para animação fluida (800ms)

        try {
            const formData = new URLSearchParams();
            formData.append('email', emailInput.value.trim());
            formData.append('senha', senhaInput.value);
            if (lembrarInput && lembrarInput.checked) {
                formData.append('lembrar', 'true');
            }

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            // Garante tempo mínimo de exibição do loading
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minDisplayTime) {
                await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
            }

            if (response.ok || response.redirected || response.status === 200) {
                // Sucesso!
                if (spinner) spinner.style.display = 'none';
                if (successIcon) successIcon.style.display = 'flex';
                if (progressBar) progressBar.classList.add('finished');
                if (titleEl) titleEl.textContent = 'Acesso Autorizado!';
                if (subtitleEl) subtitleEl.textContent = 'Carregando Painel Administrativo...';

                // Breve pausa para o usuário ver o checkmark verde de sucesso
                setTimeout(() => {
                    window.location.href = '/painel';
                }, 500);

            } else {
                // Erro de autenticação (401, 403, etc.)
                let errorMsg = 'E-mail ou senha incorretos.';
                if (response.status === 403) {
                    errorMsg = 'Usuário inativo. Contate o administrador.';
                }

                // Oculta o overlay
                if (overlay) {
                    overlay.classList.remove('active');
                    overlay.setAttribute('aria-hidden', 'true');
                }
                if (btnSubmit) btnSubmit.disabled = false;

                // Mostra erro na tela
                if (errorContainer) {
                    errorContainer.textContent = errorMsg;
                    errorContainer.classList.add('visible');
                }

                // Limpa e foca no campo de senha
                senhaInput.value = '';
                senhaInput.focus();
            }

        } catch (err) {
            console.error('Erro na requisição de login:', err);

            // Garante tempo mínimo antes de ocultar
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < minDisplayTime) {
                await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
            }

            if (overlay) {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
            }
            if (btnSubmit) btnSubmit.disabled = false;

            if (errorContainer) {
                errorContainer.textContent = 'Erro ao conectar ao servidor. Tente novamente.';
                errorContainer.classList.add('visible');
            }
        }
    });
});
