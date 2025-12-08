# 🚀 Guia de Deploy na Vercel

Este guia explica como fazer deploy do SensoriAI Agro Insight na Vercel com a chave API configurada de forma segura.

## 📋 Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com
2. Conta no OpenRouter: https://openrouter.ai
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔐 Passo 1: Configurar Variáveis de Ambiente na Vercel

### Opção A: Via Painel da Vercel (Recomendado)

1. **Acesse seu projeto na Vercel**
   - Vá para https://vercel.com/dashboard
   - Selecione seu projeto ou crie um novo

2. **Vá em Settings → Environment Variables**

3. **Adicione as seguintes variáveis:**

   ```
   # OBRIGATÓRIO - Chave da API OpenRouter para o chatbot
   OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
   
   # OPCIONAL - Chave do Resend para envio de emails do formulário de contato
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   
   # OPCIONAL - Email de destino para contatos (padrão: startup.sensoriai@gmail.com)
   CONTACT_EMAIL=startup.sensoriai@gmail.com
   ```

   **Importante:**
   - Substitua `sk-or-v1-sua-chave-aqui` pela sua chave real do OpenRouter
   - A chave deve começar com `sk-or-v1-`
   - Para o formulário de contato funcionar, adicione também `RESEND_API_KEY`
   - Não adicione espaços antes ou depois do `=`

4. **Configure o ambiente:**
   - Selecione os ambientes onde a variável será usada:
     - ✅ Production
     - ✅ Preview
     - ✅ Development (opcional)

5. **Clique em "Save"**

### Opção B: Via CLI da Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Adicionar variável de ambiente
vercel env add OPENROUTER_API_KEY production
# Cole sua chave quando solicitado
```

## 🌐 Passo 2: Configurar CORS (Opcional)

Se você tiver um domínio customizado, adicione também:

```
ALLOWED_ORIGINS=https://seusite.com,https://www.seusite.com
```

**Para desenvolvimento local:**
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📦 Passo 3: Fazer Deploy

### Opção A: Deploy Automático via Git

1. **Conecte seu repositório Git à Vercel:**
   - No dashboard da Vercel, clique em "Add New Project"
   - Conecte seu repositório GitHub/GitLab/Bitbucket
   - A Vercel detectará automaticamente as configurações do `vercel.json`

2. **Configure o projeto:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Clique em "Deploy"**

4. **Aguarde o deploy completar**

### Opção B: Deploy via CLI

```bash
# No diretório do projeto
vercel

# Para produção
vercel --prod
```

## ✅ Passo 4: Verificar o Deploy

1. **Acesse a URL fornecida pela Vercel**
   - Exemplo: `https://seu-projeto.vercel.app`

2. **Teste o chatbot:**
   - Abra o dashboard
   - Tente enviar uma mensagem no chatbot
   - Se funcionar, está tudo configurado! ✅

## 🔍 Passo 5: Configurar Email (Opcional)

Para que o formulário de contato envie emails:

1. **Obtenha chave do Resend:**
   - Acesse: https://resend.com
   - Crie uma conta e obtenha sua chave API

2. **Adicione na Vercel:**
   - Vá em Settings → Environment Variables
   - Adicione: `RESEND_API_KEY=re_xxxxxxxxxxxxx`
   - Adicione (opcional): `CONTACT_EMAIL=startup.sensoriai@gmail.com`

3. **Sem a chave do Resend:**
   - O formulário ainda funcionará, mas apenas logará os dados
   - Emails não serão enviados

## 🔍 Passo 6: Verificar Logs (se houver problemas)

1. **No dashboard da Vercel:**
   - Vá em "Deployments"
   - Clique no deployment mais recente
   - Vá em "Functions" → "View Function Logs"

2. **Verifique se as chaves estão sendo carregadas:**
   - Procure por mensagens de erro ou sucesso
   - Se aparecer erro sobre chaves não configuradas, verifique as variáveis de ambiente

## 🛠️ Solução de Problemas

### Erro: "Chave de API não configurada"

**Solução:**
1. Verifique se a variável `OPENROUTER_API_KEY` está configurada na Vercel
2. Verifique se está no ambiente correto (Production/Preview)
3. Faça um novo deploy após adicionar a variável

### Erro: CORS bloqueado

**Solução:**
1. Adicione a variável `ALLOWED_ORIGINS` na Vercel
2. Inclua o domínio da Vercel: `https://seu-projeto.vercel.app`
3. Se tiver domínio customizado, adicione também

### Erro: Timeout na função

**Solução:**
- As funções já estão configuradas com timeout de 30s (chat) e 60s (stream)
- Se precisar aumentar, edite o `vercel.json`

## 📝 Estrutura de Arquivos

```
projeto/
├── api/
│   └── openrouter/
│       ├── chat.js      # Endpoint não-streaming
│       └── stream.js    # Endpoint streaming
├── vercel.json          # Configuração da Vercel
├── .env                 # NÃO commitar (já no .gitignore)
└── ...
```

## 🔒 Segurança

✅ **A chave API está segura porque:**
- Armazenada apenas nas variáveis de ambiente da Vercel
- Nunca exposta no código fonte
- Nunca enviada para o frontend
- Apenas as serverless functions têm acesso

## 📚 Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Environment Variables na Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Serverless Functions na Vercel](https://vercel.com/docs/concepts/functions/serverless-functions)

## ✨ Pronto!

Seu projeto está configurado e seguro na Vercel! 🎉

A chave API está protegida e nunca será exposta publicamente.

