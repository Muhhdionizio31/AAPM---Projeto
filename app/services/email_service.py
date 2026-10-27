
import os
import smtplib
import ssl

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def enviar_email_redefinicao(
    destinatario: str,
    link_redefinicao: str
):
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        print("Erro: configuração SMTP incompleta no .env")
        return False

    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = "Redefinição de senha - AAPM"
    mensagem["From"] = SMTP_USER
    mensagem["To"] = destinatario

    corpo_html = f"""
    <html>
        <body>
            <h2>Redefinição de senha - AAPM</h2>
            <p>Você solicitou a redefinição da sua senha no sistema AAPM.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <p>
                <a href="{link_redefinicao}"
                   style="display:inline-block;padding:12px 20px;
                   background-color:#0066cc;color:white;
                   text-decoration:none;border-radius:5px;">
                    Redefinir minha senha
                </a>
            </p>
            <p>Este link é válido por 15 minutos.</p>
            <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        </body>
    </html>
    """

    mensagem.attach(MIMEText(corpo_html, "html", "utf-8"))

    etapa = "inicialização"

    try:
        contexto = ssl.create_default_context()

        with smtplib.SMTP_SSL(
            SMTP_HOST,
            SMTP_PORT,
            timeout=30,
            context=contexto
        ) as servidor:

            print("Conexão SSL estabelecida.")

            servidor.login(SMTP_USER, SMTP_PASSWORD)
            print("Login SMTP realizado.")

            servidor.send_message(
                mensagem,
                from_addr=SMTP_USER,
                to_addrs=[destinatario]
            )

            print("E-mail enviado com sucesso.")

        return True

    except smtplib.SMTPAuthenticationError as erro:
        print(f"Falha de autenticação SMTP: código {erro.smtp_code}")
        return False

    except smtplib.SMTPResponseException as erro:
        print(
            f"Erro SMTP na etapa '{etapa}': "
            f"código {erro.smtp_code}, resposta {erro.smtp_error!r}"
        )
        return False

    except (smtplib.SMTPException, OSError) as erro:
        print(
            f"Falha na etapa '{etapa}': "
            f"{type(erro).__name__}: {erro}"
        )
        return False
