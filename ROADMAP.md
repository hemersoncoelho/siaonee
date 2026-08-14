# SEO Roadmap — Sia One

## Visão geral

Três frentes em paralelo:
- **Técnico** — corrigir o que o Google já penaliza hoje
- **Conteúdo** — criar a seção de blog com automação n8n + IA
- **Autoridade** — construir links externos e presença de marca

---

## Fase 1 — Técnico (Semana 1–2)

### 1.1 Corrigir Core Web Vitals

**Ferramenta:** PageSpeed Insights com a URL de produção

| Item | Problema esperado | Fix |
|---|---|---|
| `<img class="brand-symbol">` | CLS — sem `width`/`height` declarados | Adicionar `width="32" height="32"` no HTML |
| Canvas hero animado | LCP lento — frame inicial carrega via JS | Verificar se o preload do `frame_0001.webp` está funcionando |
| Fontes Google | Render-blocking potencial | Já usa `onload` async — validar no PageSpeed |

**Meta:** LCP < 2.5s · CLS < 0.1 · INP < 200ms

---

### 1.2 Adicionar `width`/`height` na logo

No `hero-nova.html`, na tag da logo da nav:

```html
<!-- antes -->
<img class="brand-symbol" src="assets/icon.png" alt="Sia One" fetchpriority="high">

<!-- depois -->
<img class="brand-symbol" src="assets/icon.png" alt="Sia One" width="32" height="32" fetchpriority="high">
```

---

### 1.3 Criar imagem OG (og-image.png)

- Dimensões: **1200 × 630 px**
- Conteúdo sugerido: logo + headline + fundo escuro do site
- Salvar em `assets/og-image.png`
- Já está referenciada nos meta tags do `hero-nova.html`

---

### 1.4 Atualizar URL de produção nos meta tags

No `hero-nova.html`, substituir `https://siaone.com.br/` pelo domínio real em:
- `<link rel="canonical">`
- `og:url`
- `og:image`
- `twitter:image`
- JSON-LD `url` e `publisher.url`

---

### 1.5 Expandir JSON-LD com FAQ (após estabilizar o conteúdo)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "O que é o Sia One?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sia One é uma plataforma de IA comercial generativa que qualifica leads, responde contatos e move negócios no funil de vendas automaticamente, 24 horas por dia."
      }
    }
  ]
}
```

---

## Fase 2 — Blog com Automação n8n + IA (Semana 3–8)

### 2.1 Estrutura de pastas

```
Site_Final/
├── blog/
│   ├── index.html              ← listagem de artigos
│   └── [slug]/
│       └── index.html          ← artigo individual
├── hero-nova.html
└── assets/
```

Cada artigo deve ter:
- URL limpa: `/blog/como-qualificar-leads-com-ia/`
- H1 único com a palavra-chave principal
- Meta description individual
- JSON-LD `Article` com `datePublished` e `author`
- Link interno de volta à home + CTA para a plataforma

---

### 2.2 Fluxo de automação no n8n

```
[Trigger: Cron semanal — ex: toda segunda às 08h]
        ↓
[Pesquisa de palavras-chave]
  → SerpAPI ou Google Trends
  → Retorna 3–5 tópicos com volume de busca no nicho
        ↓
[Geração de artigo com IA]
  → Claude API (claude-sonnet-4-6) ou OpenAI GPT-4o
  → Prompt com: tópico + persona + CTA Sia One
  → Output: título, meta description, H2s, corpo em markdown
        ↓
[Conversão markdown → HTML]
  → Node "Code" (JavaScript) no n8n
  → Injeta template HTML do blog com meta tags dinâmicas
        ↓
[Publicação]
  → Opção A: push via GitHub API → Vercel faz deploy automático
  → Opção B: upload direto via Vercel API
        ↓
[Atualização do blog/index.html]
  → Adiciona novo artigo no topo da listagem
        ↓
[Notificação]
  → Slack / WhatsApp com título e link do artigo publicado
```

---

### 2.3 Nodes necessários no n8n

| Node | Função |
|---|---|
| `Schedule Trigger` | Dispara semanalmente |
| `HTTP Request` → SerpAPI | Busca tópicos em alta no nicho |
| `HTTP Request` → Anthropic/OpenAI | Gera o artigo completo |
| `Code` (JavaScript) | Converte markdown em HTML + injeta template |
| `GitHub` node | Commit do arquivo no repositório |
| `HTTP Request` → Vercel | (Opcional) Dispara deploy via webhook |
| `Telegram` ou `WhatsApp Business` | Notificação de publicação |

---

### 2.4 Prompt base para a IA gerar artigos

```
Você é um especialista em vendas B2B e automação comercial no Brasil.
Escreva um artigo completo e útil sobre: {{topico}}

Regras:
- Público-alvo: gestores de vendas e donos de PMEs brasileiras
- Tom: direto, prático, sem enrolação
- Estrutura: introdução + 4–6 H2 + conclusão com CTA
- CTA final: mencionar o Sia One como solução para o problema abordado
- Tamanho: 1.200 a 1.800 palavras
- Palavra-chave principal no H1, primeiro parágrafo e um H2
- Evitar repetição excessiva de palavras-chave (máx. 2–3% de densidade)

Output em markdown.
```

---

### 2.5 Tópicos prioritários — primeiros artigos

Termos com volume de busca real e baixa concorrência para domínio novo:

1. `como qualificar leads com inteligência artificial`
2. `automação de follow-up de vendas`
3. `CRM com IA para pequenas empresas`
4. `como responder leads mais rápido e vender mais`
5. `funil de vendas automatizado passo a passo`
6. `o que é IA comercial generativa`
7. `chatbot para vendas B2B: vale a pena?`

---

## Fase 3 — Autoridade de Domínio (Mês 2–4)

### 3.1 Presença em plataformas de descoberta

| Plataforma | Ação | Prioridade |
|---|---|---|
| **Product Hunt** | Lançar o produto — gera backlinks de alto DA | Alta |
| **Capterra / G2** | Cadastrar o Sia One com link para o site | Alta |
| **AppSumo** | Avaliação de produto — backlink + audiência | Média |
| **LinkedIn** | Publicar mini-casos com link para artigos do blog | Alta |

---

### 3.2 Guest posts e parcerias

Sites-alvo no nicho de vendas/automação no Brasil:
- Blog RD Station
- Blog Agendor
- Blog Meetime
- Comunidades Slack/Discord de Growth B2B

Formato ideal: artigo técnico com estudo de caso real usando o Sia One.

---

### 3.3 Links internos — regras para cada artigo do blog

- Linkar para a **home** com âncora descritiva (ex: `"plataforma de IA para vendas"`)
- Linkar para **2–3 artigos relacionados** dentro do blog
- Ter pelo menos **um CTA clicável** apontando para o fluxo de demo/cadastro

---

## Métricas para acompanhar

| Métrica | Ferramenta | Frequência |
|---|---|---|
| Posição de palavras-chave | Google Search Console | Semanal |
| Core Web Vitals | PageSpeed Insights | A cada deploy |
| Tráfego orgânico | Google Analytics 4 | Semanal |
| Backlinks novos | Ahrefs Free / Semrush | Mensal |
| Índice de páginas | GSC → Cobertura | Semanal |

---

## Checklist de entrega por fase

### Fase 1
- [ ] `width`/`height` adicionados na logo (`hero-nova.html`)
- [ ] `og-image.png` criada (1200×630)
- [ ] URL de produção atualizada nos meta tags
- [ ] PageSpeed Mobile > 85

### Fase 2
- [ ] Estrutura de pastas `/blog/` criada
- [ ] Template HTML do artigo pronto com meta tags dinâmicas
- [ ] Workflow n8n configurado e testado com um artigo
- [ ] Primeiro artigo publicado e submetido ao Google (via GSC)
- [ ] 5 artigos publicados

### Fase 3
- [ ] Lançamento no Product Hunt
- [ ] Cadastro no Capterra e G2
- [ ] 3 guest posts publicados com link para o site
- [ ] Domain Authority > 10 (medido no Ahrefs)
