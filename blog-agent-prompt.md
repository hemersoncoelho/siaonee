# Prompt do Agente de Blog — Sia One

Arquivo de referência para configurar os nodes de IA no n8n.
Há dois prompts: **Sistema** (fixo, vai no campo `system`) e **Usuário** (dinâmico, vai no campo `user`).

---

## PROMPT DE SISTEMA (System Prompt)

Cole este texto no campo **System** do node HTTP Request ou AI Agent:

```
Você é um especialista sênior em marketing de conteúdo B2B, SEO e automação de vendas no mercado brasileiro.

Seu objetivo é produzir artigos de blog prontos para publicação no site da Sia One — uma plataforma de IA comercial generativa que qualifica leads, responde contatos e move negócios no funil de vendas automaticamente, 24 horas por dia.

## Sobre a Sia One

- Produto: plataforma SaaS de IA comercial generativa
- Público-alvo: gestores de vendas, diretores comerciais e donos de PMEs no Brasil
- Diferencial: combina IA generativa com CRM em tempo real, sem depender do time de vendas
- Tom da marca: direto, técnico mas acessível, confiante, sem jargão excessivo
- CTA padrão: "Ativar minha IA agora" / "Agendar uma demo"

## Regras de SEO obrigatórias

1. A palavra-chave principal deve aparecer:
   - No título (H1) — preferencialmente no início
   - No primeiro parágrafo (primeiros 100 palavras)
   - Em pelo menos um H2
   - Na meta description

2. Estrutura obrigatória do artigo:
   - Título (H1): máximo 60 caracteres, com a palavra-chave principal
   - Meta description: entre 120 e 155 caracteres, com a palavra-chave e uma promessa clara
   - Introdução: 3–4 frases que confirmam o problema e antecipam a solução
   - H2s: entre 4 e 6 seções com subtítulos descritivos
   - Conclusão: resume os pontos e termina com CTA para a Sia One
   - Tamanho total: entre 1.200 e 1.800 palavras

3. Qualidade do conteúdo:
   - Escreva para pessoas, não para bots — o texto deve ser genuinamente útil
   - Use dados, exemplos práticos e cenários reais do mercado brasileiro
   - Evite repetição da palavra-chave (máximo 2–3% de densidade)
   - Use listas com marcadores quando listar 3 ou mais itens

4. CTA final obrigatório:
   - O último parágrafo deve mencionar a Sia One como solução direta para o problema abordado
   - Incluir o texto: "Conheça o Sia One e ative sua IA comercial hoje."

## Formato de saída

Retorne SEMPRE um JSON válido com esta estrutura exata, sem nenhum texto fora do JSON:

{
  "slug": "url-do-artigo-em-kebab-case",
  "title": "Título do Artigo com Palavra-chave",
  "meta_description": "Descrição entre 120 e 155 caracteres com a palavra-chave e proposta de valor.",
  "reading_time": "X min de leitura",
  "published_at": "YYYY-MM-DD",
  "content_markdown": "# Título\n\nConteúdo completo em markdown..."
}

O campo content_markdown deve conter o artigo inteiro em markdown válido, com H1 (#), H2 (##), parágrafos, listas e negrito onde apropriado.
```

---

## PROMPT DO USUÁRIO (User / Human Message)

Este prompt é gerado dinamicamente pelo n8n. As variáveis entre `{{ }}` são substituídas automaticamente.

Cole este texto no campo **User** / **Human Message** do node:

```
Escreva um artigo de blog completo para o site da Sia One sobre o seguinte tópico:

Tópico: {{topico}}
Palavra-chave principal: {{palavra_chave}}
Data de hoje: {{data_hoje}}

Siga todas as regras do sistema e retorne apenas o JSON, sem nenhum texto adicional.
```

---

## Variáveis de entrada esperadas pelo n8n

O node anterior ao de IA deve passar estas variáveis:

| Variável | Tipo | Exemplo |
|---|---|---|
| `topico` | string | `"como qualificar leads com inteligência artificial"` |
| `palavra_chave` | string | `"qualificar leads com IA"` |
| `data_hoje` | string (YYYY-MM-DD) | `"2026-06-25"` |

---

## Node Code — conversão JSON → HTML

Após o node de IA, adicione um node **Code** com o código abaixo.
Ele converte o JSON retornado em um arquivo HTML completo com todas as meta tags SEO.

```javascript
const iaOutput = $input.first().json;

// Parse do JSON — compatível com Claude e OpenAI
let article;
try {
  const raw = iaOutput.content?.[0]?.text
    || iaOutput.choices?.[0]?.message?.content
    || iaOutput.text
    || JSON.stringify(iaOutput);
  article = JSON.parse(raw);
} catch (e) {
  throw new Error('IA não retornou JSON válido: ' + e.message);
}

// Converte markdown básico em HTML
function mdToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

const bodyHtml = mdToHtml(article.content_markdown);
const pubDate = new Date(article.published_at)
  .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const year = new Date().getFullYear();

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${article.title} | Sia One Blog</title>
<meta name="description" content="${article.meta_description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://siaone.com.br/blog/${article.slug}/">
<link rel="icon" type="image/png" href="/assets/icon.png">

<meta property="og:type" content="article">
<meta property="og:url" content="https://siaone.com.br/blog/${article.slug}/">
<meta property="og:title" content="${article.title} | Sia One Blog">
<meta property="og:description" content="${article.meta_description}">
<meta property="og:image" content="https://siaone.com.br/assets/og-image.png">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Sia One">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${article.title} | Sia One Blog">
<meta name="twitter:description" content="${article.meta_description}">
<meta name="twitter:image" content="https://siaone.com.br/assets/og-image.png">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${article.title}",
  "description": "${article.meta_description}",
  "datePublished": "${article.published_at}",
  "dateModified": "${article.published_at}",
  "inLanguage": "pt-BR",
  "url": "https://siaone.com.br/blog/${article.slug}/",
  "publisher": { "@type": "Organization", "name": "Sia One", "url": "https://siaone.com.br/" },
  "author": { "@type": "Organization", "name": "Sia One" }
}
<\/script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" onload="this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>

<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #060608; --surface: #0f0f12; --border: rgba(255,255,255,0.07);
    --text: #FAFAFA; --muted: #71717A; --muted2: #a1a1aa; --cyan: #22D3EE;
    --ease: cubic-bezier(0.16,1,0.3,1);
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.7; }
  a { color: var(--cyan); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .nav { position: sticky; top: 0; z-index: 100; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(6,6,8,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); }
  .nav-brand { font-size: 15px; font-weight: 700; color: var(--text); }
  .nav-brand span { color: var(--cyan); }
  .nav-cta { padding: 8px 18px; border-radius: 10px; background: linear-gradient(130deg,#19CADF,#1BB47C); color: #fff; font-size: 13px; font-weight: 600; transition: box-shadow 200ms; }
  .nav-cta:hover { box-shadow: 0 6px 28px rgba(25,202,223,0.35); text-decoration: none; }
  .article-wrap { max-width: 740px; margin: 0 auto; padding: 64px 32px 96px; }
  .article-meta { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--muted); margin-bottom: 32px; }
  .article-tag { padding: 3px 10px; border-radius: 999px; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.2); color: var(--cyan); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; }
  h1 { font-size: clamp(1.9rem,3.5vw,2.8rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 24px; }
  h2 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; margin: 48px 0 16px; color: var(--text); }
  h3 { font-size: 1.15rem; font-weight: 700; margin: 32px 0 12px; color: var(--muted2); }
  p  { font-size: 17px; line-height: 1.75; color: var(--muted2); margin-bottom: 20px; }
  ul { padding-left: 24px; margin-bottom: 20px; }
  li { font-size: 17px; line-height: 1.7; color: var(--muted2); margin-bottom: 6px; }
  strong { color: var(--text); font-weight: 600; }
  .cta-box { margin: 56px 0 0; padding: 36px 40px; border-radius: 18px; background: rgba(25,202,223,0.06); border: 1px solid rgba(25,202,223,0.18); text-align: center; }
  .cta-box p { color: var(--text); font-size: 18px; font-weight: 600; margin-bottom: 20px; }
  .cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px; border-radius: 13px; background: linear-gradient(130deg,#19CADF,#1BB47C); color: #fff; font-size: 15px; font-weight: 700; box-shadow: 0 4px 28px rgba(25,202,223,0.3); transition: box-shadow 200ms, transform 150ms; }
  .cta-btn:hover { box-shadow: 0 8px 44px rgba(25,202,223,0.45); transform: translateY(-2px); text-decoration: none; }
  .footer { border-top: 1px solid var(--border); padding: 32px 48px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--muted); }
  @media (max-width: 640px) {
    .nav { padding: 0 20px; } .article-wrap { padding: 40px 20px 64px; }
    .cta-box { padding: 28px 24px; } .footer { flex-direction: column; gap: 12px; padding: 24px 20px; }
  }
</style>
</head>
<body>
<nav class="nav">
  <a href="/" class="nav-brand">Sia <span>One</span></a>
  <a href="https://siaone.com.br/#demo" class="nav-cta">Ativar minha IA agora →</a>
</nav>
<article class="article-wrap">
  <div class="article-meta">
    <span class="article-tag">Blog</span>
    <span>${pubDate}</span>
    <span>·</span>
    <span>${article.reading_time}</span>
  </div>
  ${bodyHtml}
  <div class="cta-box">
    <p>Pronto para automatizar suas vendas com IA?</p>
    <a href="https://siaone.com.br/#demo" class="cta-btn">Ativar minha IA agora →</a>
  </div>
</article>
<footer class="footer">
  <span>© ${year} Sia One. Todos os direitos reservados.</span>
  <a href="/blog/">← Blog</a>
</footer>
</body>
</html>`;

return [{ json: { slug: article.slug, title: article.title, published_at: article.published_at, html, file_path: `blog/${article.slug}/index.html` } }];
```

---

## Node GitHub — publicação automática

No node **GitHub** do n8n, configure assim:

| Campo | Valor |
|---|---|
| Operation | `Create or Update File` |
| Repository | `seu-usuario/seu-repo` |
| File Path | `{{ $json.file_path }}` |
| File Content | `{{ Buffer.from($json.html).toString('base64') }}` |
| Commit Message | `blog: {{ $json.title }}` |
| Branch | `main` |

---

## Chamada HTTP direta para a API do Claude

Se preferir o node **HTTP Request** em vez do AI Agent:

```
URL:    https://api.anthropic.com/v1/messages
Method: POST
Headers:
  x-api-key:          SUA_CHAVE_ANTHROPIC
  anthropic-version:  2023-06-01
  content-type:       application/json

Body (JSON):
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "system": "<COLE AQUI O SYSTEM PROMPT COMPLETO>",
  "messages": [
    {
      "role": "user",
      "content": "Tópico: {{topico}}\nPalavra-chave: {{palavra_chave}}\nData: {{data_hoje}}"
    }
  ]
}
```

---

## Lista de tópicos para alimentar o workflow

Crie um node **Set** ou Google Sheets com estes itens:

```json
[
  { "topico": "como qualificar leads com inteligência artificial", "palavra_chave": "qualificar leads com IA" },
  { "topico": "automação de follow-up de vendas", "palavra_chave": "automação de follow-up" },
  { "topico": "CRM com IA para pequenas empresas", "palavra_chave": "CRM com IA" },
  { "topico": "como responder leads mais rápido e vender mais", "palavra_chave": "responder leads rápido" },
  { "topico": "funil de vendas automatizado passo a passo", "palavra_chave": "funil de vendas automatizado" },
  { "topico": "o que é IA comercial generativa", "palavra_chave": "IA comercial generativa" },
  { "topico": "chatbot para vendas B2B vale a pena", "palavra_chave": "chatbot para vendas B2B" }
]
```
