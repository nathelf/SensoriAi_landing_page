# 📧 Guia Passo a Passo - Configurar Envio de Emails

## 🎯 Objetivo
Configurar o Resend para que o formulário de contato envie emails para `startup.sensoriai@gmail.com`

---

## 📋 Passo 1: Criar Conta no Resend

1. **Acesse:** https://resend.com
2. **Clique em "Sign Up"** (canto superior direito)
3. **Crie sua conta:**
   - Use seu email (pode ser o `startup.sensoriai@gmail.com`)
   - Defina uma senha
   - Confirme seu email

4. **Faça login** após confirmar o email

---

## 🔑 Passo 2: Obter a Chave da API

1. **No dashboard do Resend**, clique em **"API Keys"** no menu lateral
2. **Clique em "Create API Key"**
3. **Preencha:**
   - **Name:** `SensoriAI Contact Form` (ou qualquer nome)
   - **Permission:** Deixe como "Sending access" (padrão)
4. **Clique em "Add"**
5. **IMPORTANTE:** Copie a chave imediatamente! Ela começa com `re_` e só aparece uma vez
   - Exemplo: `re_1234567890abcdefghijklmnopqrstuvwxyz`

⚠️ **ATENÇÃO:** Se você fechar essa tela sem copiar, precisará criar uma nova chave!

---

## 💾 Passo 3: Adicionar no Arquivo .env

1. **Abra o arquivo `.env`** na raiz do projeto
   - Se não existir, crie um novo arquivo chamado `.env`

2. **Adicione a linha:**
   ```env
   RESEND_API_KEY=re_sua-chave-aqui
   ```
   
   **Substitua `re_sua-chave-aqui` pela chave que você copiou!**
   
   Exemplo:
   ```env
   RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
   ```

3. **Salve o arquivo** (Ctrl+S)

---

## 🔄 Passo 4: Reiniciar o Servidor

1. **Pare o servidor** se estiver rodando:
   - Pressione `Ctrl+C` no terminal onde o servidor está rodando

2. **Inicie o servidor novamente:**
   ```bash
   npm run dev:server
   ```

3. **Verifique os logs:**
   - Você deve ver mensagens normais de inicialização
   - **NÃO** deve aparecer: `⚠ RESEND_API_KEY não configurada`

---

## ✅ Passo 5: Testar

1. **Acesse a página inicial** do seu site
2. **Role até o formulário de contato**
3. **Preencha o formulário:**
   - Nome: Seu nome
   - Email: Seu email de teste
   - Mensagem: Uma mensagem de teste
4. **Clique em "Enviar Mensagem"**

5. **Resultado esperado:**
   - ✅ Mensagem: "Mensagem enviada com sucesso!"
   - ✅ Você recebe um email em `startup.sensoriai@gmail.com`
   - ✅ O usuário recebe um email de confirmação

---

## 🚀 Para Produção (Vercel)

Quando fizer deploy na Vercel:

1. **No dashboard da Vercel:**
   - Vá em **Settings** → **Environment Variables**

2. **Adicione:**
   - **Nome:** `RESEND_API_KEY`
   - **Valor:** A mesma chave que você usou no `.env`
   - **Ambientes:** ✅ Production, ✅ Preview

3. **Salve e faça um novo deploy**

---

## 🔍 Verificar se Está Funcionando

### No Servidor (Logs):
```
✅ Email enviado com sucesso para startup.sensoriai@gmail.com
```

### No Formulário:
- Mensagem de sucesso: "Mensagem enviada com sucesso!"
- **NÃO** deve aparecer: "modo desenvolvimento - email não configurado"

### No Email:
- Verifique a caixa de entrada de `startup.sensoriai@gmail.com`
- Verifique também a pasta de **Spam/Lixo Eletrônico**

---

## ⚠️ Problemas Comuns

### "modo desenvolvimento - email não configurado"
- **Causa:** Chave não configurada ou servidor não reiniciado
- **Solução:** 
  1. Verifique se a chave está no `.env`
  2. Reinicie o servidor

### Erro 403: "You can only send testing emails to your own email address"
- **Causa:** O Resend está em modo teste e só permite enviar para o email da conta
- **Solução Temporária:** O sistema automaticamente enviará o email para o remetente (quem preencheu o formulário)
- **Solução Definitiva:** Verificar um domínio no Resend (veja seção abaixo)

### Email não chega
- Verifique a pasta de spam
- Confirme que a chave está correta
- Verifique os logs do servidor para erros
- Se estiver em modo teste, o email será enviado para o remetente, não para `startup.sensoriai@gmail.com`

### Erro ao enviar
- Verifique se a chave do Resend está ativa
- Confirme que não excedeu o limite gratuito (3.000 emails/mês)

---

## 🌐 Como Verificar um Domínio no Resend (Solução Definitiva)

Para enviar emails para qualquer endereço (como `startup.sensoriai@gmail.com`), você precisa verificar um domínio no Resend:

### Passo 1: Acessar Domínios
1. **No dashboard do Resend**, clique em **"Domains"** no menu lateral
2. **Clique em "Add Domain"**

### Passo 2: Adicionar Domínio
1. **Digite seu domínio:** Ex: `sensoriai.com` ou `sensoriai.agro` (sem `www` ou `http://`)
2. **Clique em "Add"**

### Passo 3: Configurar DNS
O Resend mostrará registros DNS que você precisa adicionar:

1. **Acesse o painel do seu provedor de domínio** (ex: Registro.br, GoDaddy, Cloudflare)
2. **Adicione os registros DNS** que o Resend forneceu:
   - Registros **TXT** para verificação
   - Registros **MX** para recebimento
   - Registros **CNAME** para tracking

3. **Aguarde a propagação DNS** (pode levar de alguns minutos a 24 horas)

### Passo 4: Verificar Status
1. **Volte ao dashboard do Resend**
2. **Aguarde até aparecer "Verified"** ao lado do domínio
3. **Status deve ficar verde** ✅

### Passo 5: Atualizar Configuração
1. **No arquivo `.env`**, adicione:
   ```env
   RESEND_FROM_EMAIL=contato@seu-dominio.com
   ```
   Substitua `seu-dominio.com` pelo domínio verificado (ex: `contato@sensoriai.com`)

2. **Reinicie o servidor**

### Passo 6: Testar
Agora você pode enviar para qualquer email, incluindo `startup.sensoriai@gmail.com`!

---

### ⚡ Solução Rápida (Sem Domínio Próprio)

Se você não tem um domínio próprio ainda, pode:

1. **Usar o email da conta do Resend** como `CONTACT_EMAIL` temporariamente:
   ```env
   CONTACT_EMAIL=seu-email@exemplo.com
   ```
   (Use o mesmo email que você usou para criar a conta no Resend)

2. **Ou deixar o sistema enviar para o remetente** (já está funcionando automaticamente)

---

## 📝 Resumo Rápido

```bash
# 1. Criar conta em https://resend.com
# 2. Obter chave API (começa com re_)
# 3. Adicionar no .env:
RESEND_API_KEY=re_sua-chave-aqui

# 4. Reiniciar servidor:
npm run dev:server

# 5. Testar o formulário!
```

---

## ✨ Pronto!

Após seguir esses passos, o formulário enviará emails reais para `startup.sensoriai@gmail.com`! 🎉

