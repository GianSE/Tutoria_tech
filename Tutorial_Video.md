
# Tutorial de Instalação via Vídeo

Para que o sistema funcione com os comandos, eles devem ser executados na pasta Tutoria_tech

### 1. Download e Preparação
1. Clique no botão **Code** no repositório.
2. Selecione a opção **"Download ZIP"**.
3. Extraia a pasta no seu computador.
4. Para um passo a passo visual, siga as instruções neste [Vídeo Tutorial](https://drive.google.com/file/d/1iu-f_WCb6BklwU2wRFgTo_Sw_iyqxVmK/view?usp=sharing).

Comandos do docker (inclusos na documentação do projeto, que detalha a instalação).

### 2. Subindo os Serviços com Docker
Os comandos abaixo inicializam toda a infraestrutura da aplicação. Execute-os no seu terminal (lembre-se de estar dentro da pasta `Tutoria_tech`):

```bash
# 1. Sobe a infraestrutura (Banco de dados, MinIO, etc.)
docker compose -f docker-compose.infra.yml up -d --build

# 2. Sobe o backend e frontend da aplicação
docker compose -f docker-compose.app.yml up -d --build

# 3. Sobe o serviço de Inteligência Artificial
docker compose -f docker-compose.ia.yml up -d --build
```

### 3. Acesso à Aplicação

Assim que os contêineres estiverem rodando sem erros, a interface principal estará disponível no seu navegador:

- **Frontend (Interface Principal):** [http://localhost:5173](http://localhost:5173)