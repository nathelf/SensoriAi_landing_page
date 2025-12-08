# 🔍 Diagnóstico de Erro - Formulário de Contato

## ❌ Erro: "Erro ao enviar mensagem"

Este guia ajuda a identificar e resolver o problema.

---

## 🔍 Passo 1: Verificar se o Servidor Está Rodando

### Verificar no Terminal

1. **Abra o terminal onde você roda o servidor**
2. **Procure por esta mensagem:**
   ```
   🚀 Server listening on 3001
   ```

3. **Se não aparecer:**
   - O servidor não está rodando
   - **Solução:** Inicie o servidor:
     ```bash
     npm run dev:server
     ```

### Verificar no Navegador

1. **Abra:** http://localhost:3001
2. **Deve aparecer:** `Server OK - [data/hora]`
3. **Se não aparecer:**
   - Servidor não está rodando ou porta diferente
   - Verifique qual porta está configurada

---

## 🔍 Passo 2: Verificar Logs do Servidor

Quando você tenta enviar uma mensagem, o servidor deve mostrar:

```
📧 POST /api/contact from [IP]
```

### Se NÃO aparecer essa mensagem:
- ❌ O frontend não está conseguindo conectar ao servidor
- **Possíveis causas:**
  - Servidor não está rodando
  - Porta errada (verifique se é 3001)
  - Erro de CORS

### Se aparecer mas der erro:
- Verifique a mensagem de erro completa nos logs
- Pode ser problema com Resend API ou validação

---

## 🔍 Passo 3: Verificar Console do Navegador

1. **Abra o DevTools** (F12)
2. **Vá na aba "Console"**
3. **Tente enviar uma mensagem**
4. **Procure por erros em vermelho**

### Erros Comuns:

#### "Failed to fetch" ou "Network Error"
- **Causa:** Servidor não está rodando ou não acessível
- **Solução:** 
  1. Verifique se o servidor está rodando
  2. Verifique se a porta é 3001
  3. Tente acessar http://localhost:3001 no navegador

#### "CORS policy"
- **Causa:** Problema de CORS
- **Solução:** Verifique se o servidor permite a origem do frontend

#### Erro 500
- **Causa:** Erro no servidor
- **Solução:** Verifique os logs do servidor para detalhes

---

## 🔍 Passo 4: Verificar Arquivo .env

1. **Abra o arquivo `.env`** na raiz do projeto
2. **Verifique se existe:**
   ```env
   RESEND_API_KEY=re_...
   ```
3. **Se não existir:**
   - O formulário funcionará mas não enviará emails
   - Você verá: "modo desenvolvimento - email não configurado"
   - Isso é normal se você ainda não configurou o Resend

---

## 🔍 Passo 5: Testar Endpoint Diretamente

Você pode testar o endpoint diretamente:

### Usando curl (no terminal):
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Teste\",\"email\":\"teste@teste.com\",\"message\":\"Mensagem de teste\"}"
```

### Usando Postman ou Insomnia:
- **URL:** `http://localhost:3001/api/contact`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "Teste",
    "email": "teste@teste.com",
    "message": "Mensagem de teste com mais de 10 caracteres"
  }
  ```

---

## ✅ Checklist de Verificação

Marque cada item:

- [ ] Servidor está rodando (porta 3001)
- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] Frontend está rodando (porta 8080, 3000 ou 5173)
- [ ] Não há erros no console do navegador
- [ ] Não há erros nos logs do servidor
- [ ] CORS está configurado corretamente

---

## 🛠️ Soluções Rápidas

### Solução 1: Reiniciar Tudo

```bash
# Pare tudo (Ctrl+C em cada terminal)

# Terminal 1 - Servidor
npm run dev:server

# Terminal 2 - Frontend (se estiver rodando separado)
npm run dev:vite
```

### Solução 2: Verificar Porta

Se o servidor estiver em outra porta, atualize o `ContactForm.tsx`:

```typescript
const apiBaseUrl = "http://localhost:SUA_PORTA_AQUI";
```

### Solução 3: Verificar CORS

Se houver erro de CORS, verifique o `server.js`:
- A porta do frontend deve estar na lista de `allowedOrigins`

---

## 📞 Se Nada Funcionar

1. **Copie os logs do servidor** quando tentar enviar
2. **Copie os erros do console do navegador** (F12 → Console)
3. **Verifique:**
   - Versão do Node.js: `node --version`
   - Se todas as dependências estão instaladas: `npm install`

---

## 🎯 Próximos Passos

Após identificar o problema:
1. Siga as soluções acima
2. Teste novamente o formulário
3. Se funcionar, você verá: "Mensagem enviada com sucesso!"

