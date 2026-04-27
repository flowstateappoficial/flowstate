# Flowstate — Email templates do Supabase Auth (PT)

Templates traduzidos e estilizados para coincidir com a identidade visual da app
(verde `#00D764`, fundo `#0a0d1f`/`#161a2e`, fonte system, tratamento por "tu").

---

## Como aplicar

1. Vai a [Supabase Dashboard → Authentication → Email Templates](https://supabase.com/dashboard/project/myjgthxaldqiwxgnxjvd/auth/templates).
2. Para cada um dos 6 templates abaixo:
   - Cola o **Subject** no campo "Subject heading"
   - Cola o conteúdo do `.html` correspondente no campo "Message body" (modo HTML)
   - Carrega em **Save**

> Os templates usam variáveis do Supabase (`{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.).
> Estas são processadas server-side antes do envio. **Não modificar o nome das variáveis.**

---

## Subjects (Assuntos)

| Template          | Subject (PT)                                                   |
| ----------------- | -------------------------------------------------------------- |
| Confirm signup    | `Confirma o teu email para começar no Flowstate`               |
| Magic Link        | `O teu link de acesso ao Flowstate`                            |
| Change Email      | `Confirma o teu novo email`                                    |
| Reset Password    | `Redefinir a tua password do Flowstate`                        |
| Reauthentication  | `Código de verificação Flowstate`                              |
| Invite User       | `Foste convidado para o Flowstate`                             |

---

## Ficheiros

| Template          | Ficheiro                          |
| ----------------- | --------------------------------- |
| Confirm signup    | `confirm-signup.html`             |
| Magic Link        | `magic-link.html`                 |
| Change Email      | `change-email.html`               |
| Reset Password    | `reset-password.html`             |
| Reauthentication  | `reauthentication.html`           |
| Invite User       | `invite.html`                     |

---

## Notas técnicas

- **Sender:** `Flowstate <no-reply@flowstateapp.pt>` (configurado em Auth → SMTP Settings via Resend).
- **Design responsivo:** funciona em ecrãs móveis e desktop. Tabela máxima 560px.
- **Fallback de texto:** em vez de só "Click here", todos os templates incluem o
  link textual completo e o código OTP (quando aplicável) para clientes que
  bloqueiem CSS.
- **Acessibilidade:** contraste mínimo WCAG AA preservado (texto claro sobre fundo escuro).
- **Suporte:** todos os templates direcionam para `suporte@flowstateapp.pt`.

---

## Testar

Depois de aplicar os 6 no dashboard:

1. **Confirm signup** — registar uma conta nova com email teu (não `flowstate.app.oficial@gmail.com`)
2. **Reset password** — pedir "esqueci-me" da password
3. **Change email** — em "A minha conta", alterar email
4. Verifica em cada caso que o email chega com o estilo correcto e os links funcionam.

Se algum template não chegar a ser usado pela app (raro: Reauthentication, Invite),
ainda assim configura-o para evitar que algum flow inesperado dispare a versão default
em inglês.
