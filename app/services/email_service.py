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

def enviar_email_redefinicao(destinatario: str, link_redefinicao: str):
    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = "Redefinição de senha - AAPM"
    mensagem["From"] = SMTP_USER
    mensagem["To"] = destinatario

    corpo_html = f"""
    <p>Você solicitou a redefinição da sua senha no sistema AAPM.</p>
    <p>Clique no link abaixo para criar uma nova senha (válido por 15 minutos):</p>
    <p><a href="{link_redefinicao}">{link_redefinicao}</a></p>
    """
    mensagem.attach(MIMEText(corpo_html, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_PASSWORD)
            servidor.sendmail(SMTP_USER, destinatario, mensagem.as_string())
    except Exception as erro:
        print(f"Erro ao enviar email: {erro}")  