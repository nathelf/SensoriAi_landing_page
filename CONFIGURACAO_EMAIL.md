# 📧 Configuração de Envio de Email - Formulário de Contato

## ✅ Alterações Realizadas

O formulário de contato foi configurado para enviar mensagens para:
- **Email de destino:** `startup.sensoriai@gmail.com`
- **Sistema:** Usa servidor Express (local) ou Vercel Serverless Functions (produção)

## 🔧 Configuração Necessária

Para que o envio de emails funcione, você precisa configurar a chave da API do Resend:

### Passo 1: Obter chave do Resend

1. Acesse: https://resend.com
2. Crie uma conta ou faça login (gratuito até 3.000 emails/mês)
3. Vá em **API Keys** → **Create API Key**
4. Dê um nome para a chave (ex: "SensoriAI Contact Form")
5. Copie a chave (começa com `re_...`)

### Passo 2: Configurar no arquivo .env (Desenvolvimento Local)

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a linha:
   ```env
   RESEND_API_KEY=re_sua-chave-aqui
   ```
3. Salve o arquivo
4. **Reinicie o servidor** para carregar a nova variável:
   ```bash
   npm run dev:server
   ```

### Passo 3: Configurar na Vercel (Produção)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Nome:** `RESEND_API_KEY`
   - **Valor:** Sua chave do Resend
5. Selecione os ambientes: Production, Preview
6. Clique em **Save**
7. Faça um novo deploy

### Passo 4: Verificar domínio no Resend (Opcional)

Por padrão, o Resend permite enviar de `onboarding@resend.dev`. Para usar um domínio próprio:

1. No Resend, vá em **Domains**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize o campo `from` no código (atualmente: `onboarding@resend.dev`)

## 📋 Como Funciona

1. **Usuário preenche o formulário** na página inicial
2. **Formulário valida os dados** (nome, email, mensagem obrigatórios)
3. **Envia para `/api/contact`** (servidor local ou Vercel)
4. **Servidor envia 2 emails:**
   - **Para você:** `startup.sensoriai@gmail.com` (com todos os dados do contato)
   - **Para o usuário:** Email de confirmação automática

## 🧪 Testar

1. Preencha o formulário de contato na página inicial
2. Envie a mensagem
3. Verifique se recebeu o email em `startup.sensoriai@gmail.com`
4. O usuário também deve receber um email de confirmação

## ⚠️ Solução de Problemas

### Mensagem: "modo desenvolvimento - email não configurado"
- **Causa:** `RESEND_API_KEY` não configurada no `.env`
- **Solução:** 
  1. Adicione `RESEND_API_KEY=re_sua-chave` no arquivo `.env`
  2. Reinicie o servidor: `npm run dev:server`

### Erro: "Failed to send admin email"
- **Causa:** Chave do Resend inválida ou domínio não verificado
- **Solução:** 
  1. Verifique se a chave está correta no `.env`
  2. Verifique o status do domínio no Resend
  3. Confira os logs do servidor para mais detalhes

### Email não chega
- Verifique a pasta de spam
- Confirme que o email `startup.sensoriai@gmail.com` está correto
- Verifique os logs do servidor (console onde roda `npm run dev:server`)
- Verifique se a chave do Resend está ativa no painel

### Em produção (Vercel)
- Certifique-se de que `RESEND_API_KEY` está configurada nas variáveis de ambiente
- Verifique os logs das funções na Vercel Dashboard

## 📝 Arquivos Modificados

- `server.js` - Endpoint `/api/contact` para envio de emails
- `api/contact.js` - Serverless function para Vercel
- `src/components/ContactForm.tsx` - Atualizado para usar novo endpoint
- Email de destino: `startup.sensoriai@gmail.com`

## 🔒 Segurança

- A chave `RESEND_API_KEY` está armazenada como secret no Supabase
- Nunca commite a chave no código
- A função valida todos os dados antes de enviar

