
import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv


load_dotenv()


SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def enviar_email_redefinicao(
    destinatario: str,
    link_redefinicao: str
):

    mensagem = MIMEMultipart("alternative")

    mensagem["Subject"] = "Redefinição de senha - AAPM"
    mensagem["From"] = SMTP_USER
    mensagem["To"] = destinatario

    corpo_html = f"""
    <html>
        <body>

            <h2>Redefinição de senha - AAPM</h2>

            <p>
                Você solicitou a redefinição da sua senha
                no sistema AAPM.
            </p>

            <p>
                Clique no botão abaixo para criar uma nova senha:
            </p>

            <p>
                <a href="{link_redefinicao}"
                   style="
                       display:inline-block;
                       padding:12px 20px;
                       background-color:#0066cc;
                       color:white;
                       text-decoration:none;
                       border-radius:5px;
                   ">
                    Redefinir minha senha
                </a>
            </p>

            <p>
                Este link é válido por 15 minutos.
            </p>

            <p>
                Se você não solicitou essa alteração,
                ignore este e-mail.
            </p>

        </body>
    </html>
    """

    mensagem.attach(
        MIMEText(corpo_html, "html")
    )

    try:

        print("Conectando ao servidor SMTP...")

        with smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT,
            timeout=30
        ) as servidor:

            print("Conexão SMTP estabelecida.")

            servidor.ehlo()

            servidor.starttls()

            print("TLS iniciado.")

            servidor.ehlo()

            servidor.login(
                SMTP_USER,
                SMTP_PASSWORD
            )

            print("Login SMTP realizado.")

            servidor.send_message(
                mensagem,
                from_addr=SMTP_USER,
                to_addrs=[destinatario]
            )

            print(
                f"E-mail enviado com sucesso para {destinatario}"
            )

        return True

    except Exception as erro:

        print(
            f"Erro ao enviar email: {erro}"
        )

        return False

