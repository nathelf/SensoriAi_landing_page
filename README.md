# SensoriAI Agro Insight

Dashboard para análise agronômica com assistente virtual baseado em IA.

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# OpenRouter API Configuration (OBRIGATÓRIO)
# Obtenha sua chave de API em: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Resend API Configuration (opcional - para envio de emails do formulário de contato)
# Obtenha sua chave em: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email de destino para contatos (opcional - padrão: startup.sensoriai@gmail.com)
CONTACT_EMAIL=startup.sensoriai@gmail.com

# Supabase Configuration (opcional - para salvar histórico de conversas)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_TABLE=chat_sessions

# Server Port (opcional - padrão: 3001)
PORT=3001
```

### Como obter a chave do OpenRouter

1. Acesse https://openrouter.ai/
2. Crie uma conta ou faça login
3. Vá em "Keys" (https://openrouter.ai/keys)
4. Crie uma nova chave de API
5. Copie a chave e adicione no arquivo `.env` como `OPENROUTER_API_KEY`

### Como obter a chave do Resend (para formulário de contato)

1. Acesse https://resend.com
2. Crie uma conta ou faça login (gratuito até 3.000 emails/mês)
3. Vá em "API Keys" → "Create API Key"
4. Dê um nome e copie a chave (começa com `re_...`)
5. Adicione no arquivo `.env` como `RESEND_API_KEY`

**Importante:** 
- Sem a chave do OpenRouter configurada, o chatbot não funcionará e retornará erro 401
- A chave deve começar com `sk-or-v1-` e não deve conter espaços em branco
- Sem a chave do Resend, o formulário de contato funcionará mas não enviará emails (modo desenvolvimento)
- Certifique-se de que não há espaços antes ou depois do sinal de `=` no arquivo `.env`
- Após adicionar/modificar o `.env`, **sempre reinicie o servidor**

📖 **Guia completo:** Consulte `GUIA_CONFIGURACAO_RESEND.md` para instruções detalhadas passo a passo

## Instalação

```bash
npm install
```

## Execução

```bash
# Desenvolvimento (frontend + servidor)
npm run dev

# Apenas frontend
npm run dev:vite

# Apenas servidor
npm run dev:server
```

## Estrutura

- `server.js` - Servidor Express que faz proxy para a API do OpenRouter
- `src/components/dashboard/ConsultantChatbot.tsx` - Componente do chatbot
- `src/components/dashboard/RecommendationsPanel.tsx` - Painel de recomendações

## Solução de Problemas

### Erro 401: "User not found" ou "No cookie auth credentials found"
- Verifique se a variável `OPENROUTER_API_KEY` está configurada no arquivo `.env`
- Certifique-se de que a chave está correta e ativa (deve começar com `sk-or-v1-`)
- Verifique se não há espaços em branco antes ou depois do sinal de `=`
- Verifique se a chave não está vazia (após o `=`)
- Reinicie o servidor após adicionar/modificar o `.env`
- Verifique os logs do servidor ao iniciar - deve mostrar `OPENROUTER_KEY present? true`

### Erro ENOTFOUND: "getaddrinfo ENOTFOUND"
- Este erro indica problema de resolução DNS
- Verifique sua conexão com a internet
- Tente acessar https://openrouter.ai no navegador para verificar se o site está acessível
- Verifique configurações de firewall/proxy que possam estar bloqueando
- Se estiver em uma rede corporativa, verifique se há restrições de DNS

### Erro de conexão
- Verifique se o servidor está rodando na porta 3001
- Verifique se não há firewall bloqueando a conexão
- Teste a conectividade executando: `node quick-test.js`