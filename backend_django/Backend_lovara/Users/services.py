from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

def send_welcome_email(user):

    subject = "Welcome to Lovara"

    html_content = render_to_string(
        "emails/welcome_email.html",
        {"user": user}
    )

    text_content = f"""
    Welcome to Lovara, {user.full_name}

    Your account has been successfully created.
    Visit https://lovara.in
    """

    email = EmailMultiAlternatives(
        subject,
        text_content,
        "Lovara <hello@lovara.in>",
        [user.email],
    )

    email.attach_alternative(html_content, "text/html")
    email.send()