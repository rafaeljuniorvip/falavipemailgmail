# Guia de Deploy - Gmail Viewer

## Visão Geral

Este projeto usa GitHub Actions para automaticamente buildar e publicar imagens Docker no GitHub Container Registry (ghcr.io). O deploy é feito usando Docker Swarm através do Portainer.

## 1. Configuração Inicial

### 1.1 GitHub Container Registry

A imagem Docker é automaticamente buildada e publicada no GitHub Container Registry quando você faz push para a branch `main`.

A imagem estará disponível em:
```
ghcr.io/rafaeljuniorvip/falavipemailgmail:latest
```

### 1.2 Tornar a Imagem Pública (Opcional)

1. Acesse: https://github.com/rafaeljuniorvip/falavipemailgmail/pkgs/container/falavipemailgmail
2. Clique em "Package settings"
3. Role até "Danger Zone"
4. Clique em "Change visibility" e selecione "Public"

Se preferir manter privada, você precisará criar um Personal Access Token para pull da imagem.

## 2. Deploy no Docker Swarm via Portainer

### 2.1 Preparar Variáveis de Ambiente

No seu servidor, crie um arquivo `.env`:

```bash
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app-do-gmail
```

**Importante**: A senha deve ser uma "Senha de App" do Gmail, não sua senha normal.
Para criar: https://myaccount.google.com/apppasswords

### 2.2 Deploy via Portainer

#### Opção A: Usando Stacks no Portainer

1. Acesse seu Portainer
2. Vá em "Stacks" > "Add stack"
3. Dê um nome (ex: `gmail-viewer`)
4. Cole o conteúdo do `docker-compose.yml`
5. Em "Environment variables", adicione:
   - `EMAIL_USER=seu-email@gmail.com`
   - `EMAIL_PASS=sua-senha-de-app`
6. Clique em "Deploy the stack"

#### Opção B: Via Linha de Comando

No servidor com Docker Swarm:

```bash
# Criar arquivo .env com suas credenciais
cat > .env <<EOF
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EOF

# Deploy da stack
docker stack deploy -c docker-compose.yml gmail-viewer
```

### 2.3 Verificar Deploy

```bash
# Ver serviços rodando
docker service ls

# Ver logs
docker service logs -f gmail-viewer_gmail-viewer

# Ver réplicas
docker service ps gmail-viewer_gmail-viewer
```

## 3. Atualização da Aplicação

Quando você fizer push de novas alterações para a branch `main`:

1. GitHub Actions irá automaticamente buildar e publicar nova imagem
2. No servidor, atualize o serviço:

```bash
# Via CLI
docker service update --image ghcr.io/rafaeljuniorvip/falavipemailgmail:latest gmail-viewer_gmail-viewer

# Ou via Portainer
# Vá em Stacks > gmail-viewer > Editor > Update the stack
```

O Swarm irá fazer um rolling update sem downtime.

## 4. Configuração com Traefik (Opcional)

Se você usa Traefik como reverse proxy, o `docker-compose.yml` já inclui labels.

Ajuste o domínio:
```yaml
- "traefik.http.routers.gmail-viewer.rule=Host(`gmail.seudominio.com`)"
```

## 5. Monitoramento

### Health Check

A aplicação expõe um endpoint de health check:
```
GET /api/health
```

O Docker Swarm usa este endpoint para verificar a saúde do container.

### Logs

```bash
# Ver logs em tempo real
docker service logs -f gmail-viewer_gmail-viewer

# Últimas 100 linhas
docker service logs --tail 100 gmail-viewer_gmail-viewer
```

## 6. Troubleshooting

### Imagem não encontrada

Se você manteve o registry privado, autentique no servidor:

```bash
# Criar um Personal Access Token no GitHub com permissão read:packages
echo "SEU_TOKEN" | docker login ghcr.io -u rafaeljuniorvip --password-stdin
```

### Verificar se a imagem foi buildada

Acesse: https://github.com/rafaeljuniorvip/falavipemailgmail/actions

### Container não inicia

```bash
# Ver logs detalhados
docker service ps --no-trunc gmail-viewer_gmail-viewer

# Inspecionar serviço
docker service inspect gmail-viewer_gmail-viewer
```

## 7. Rollback

Se algo der errado após uma atualização:

```bash
# Via CLI
docker service rollback gmail-viewer_gmail-viewer

# Ou especificar uma versão anterior
docker service update --image ghcr.io/rafaeljuniorvip/falavipemailgmail:main-abc123 gmail-viewer_gmail-viewer
```

## 8. Escalar a Aplicação

```bash
# Aumentar para 3 réplicas
docker service scale gmail-viewer_gmail-viewer=3

# Ou via Portainer: Services > gmail-viewer > Scale
```

## 9. Portas

A aplicação expõe a porta `3001` por padrão. Você pode alterar no `docker-compose.yml`:

```yaml
ports:
  - "8080:3001"  # Mapeia porta 8080 do host para 3001 do container
```
