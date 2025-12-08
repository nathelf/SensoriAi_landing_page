# Política de Segurança - SensoriAI Agro Insight

## Proteção de Chaves de API

### ✅ Implementações de Segurança

1. **Chave API nunca exposta no frontend**
   - A chave `OPENROUTER_API_KEY` é armazenada apenas no servidor (arquivo `.env`)
   - O frontend nunca tem acesso à chave
   - Todas as requisições passam pelo servidor que atua como proxy

2. **Arquivo .env protegido**
   - O arquivo `.env` está no `.gitignore` e nunca será commitado
   - Variáveis de ambiente são carregadas apenas no servidor Node.js

3. **CORS Restritivo**
   - Apenas origens permitidas podem fazer requisições
   - Configurável via variável `ALLOWED_ORIGINS`
   - Padrão: apenas localhost em desenvolvimento

4. **Rate Limiting**
   - Limite de 30 requisições por minuto por IP
   - Previne abuso e ataques de força bruta
   - Retorna erro 429 quando excedido

5. **Validação de Entrada**
   - Mensagens são sanitizadas e validadas
   - Limite de 50 mensagens por requisição
   - Limite de 10.000 caracteres por mensagem
   - Whitelist de modelos permitidos

6. **Logs Seguros**
   - Chave API nunca é logada completa
   - Apenas preview dos primeiros 8 caracteres
   - URLs sensíveis são mascaradas nos logs

7. **Sanitização de Dados**
   - Mensagens são normalizadas antes de enviar
   - Apenas roles válidos são aceitos (user, assistant, system)
   - Conteúdo é limitado e sanitizado

## Configuração Segura

### Variáveis de Ambiente

```env
# OBRIGATÓRIO - Chave da API OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# OPCIONAL - Origens permitidas (separadas por vírgula)
ALLOWED_ORIGINS=http://localhost:3000,https://seusite.com

# OPCIONAL - Ambiente
NODE_ENV=production
```

### Checklist de Segurança

- [ ] Arquivo `.env` está no `.gitignore`
- [ ] Chave API nunca é commitada no código
- [ ] CORS está configurado para origens específicas em produção
- [ ] Rate limiting está ativo
- [ ] Logs não expõem informações sensíveis
- [ ] Validação de entrada está implementada
- [ ] Servidor está rodando em HTTPS em produção

## Boas Práticas

1. **Nunca** commitar o arquivo `.env`
2. **Nunca** expor a chave API no frontend
3. **Sempre** usar HTTPS em produção
4. **Sempre** validar e sanitizar entrada do usuário
5. **Sempre** usar rate limiting em APIs públicas
6. **Sempre** revisar logs antes de compartilhar

## Em Caso de Vazamento

Se a chave API for exposta:

1. **Imediatamente** revogue a chave no painel do OpenRouter
2. Gere uma nova chave
3. Atualize o arquivo `.env` com a nova chave
4. Reinicie o servidor
5. Verifique logs de uso suspeito

## Contato

Para reportar vulnerabilidades de segurança, entre em contato com a equipe de desenvolvimento.

