# ares-kzn.ru

Статическая HTML-версия сайта юридической компании «АРЕС» (бывший WordPress).

```
index.html, uslugi/, price/, about/, politika/   страницы
css/  js/  img/  fonts/                          ресурсы
functions/api/contact.js                         Cloudflare Pages Function — форма обратной связи
```

## Форма обратной связи

Форма отправляет `POST /api/contact` (JSON). Функция проверяет поля, отсекает ботов (honeypot)
и отправляет письмо через [Resend](https://resend.com).

Переменные окружения (Cloudflare Pages → Settings → Variables and Secrets):

| Переменная | Описание |
|---|---|
| `RESEND_API_KEY` | API-ключ Resend (secret) |
| `MAIL_TO` | получатель(и) через запятую, например `areskzn@mail.ru` |
| `MAIL_FROM` | отправитель на подтверждённом в Resend домене, например `Сайт АРЕС <noreply@ares-kzn.ru>` |

## Деплой

Cloudflare Pages → Connect to Git → этот репозиторий; build command пустая, output directory `/`.

Локально: `cp .dev.vars.example .dev.vars && npx wrangler pages dev .`
