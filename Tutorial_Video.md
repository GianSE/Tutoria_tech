
# Tutorial de Instalação via Vídeo

Para um passo a passo visual completo, acesse o [Vídeo Tutorial](https://drive.google.com/file/d/13GhYx9QM04GGuFyDMIHUFRBnP0raxSxA/view?usp=sharing).

> Todos os comandos abaixo devem ser executados **dentro da pasta `Tutoria_tech`**.

---

### 1. Pré-requisitos

- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) (com WSL 2 habilitado)
- [Git](https://git-scm.com/downloads/win)

---

### 2. Clonar o Repositório

```bash
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech
```

---

### 3. Subir toda a Stack com um Único Comando

```bash
docker compose -f docker-compose.full.yml up -d --build
```

Aguarde todos os 5 containers ficarem `running`. Na primeira execução o banco é criado, o seed é executado e os dados de exemplo já estão disponíveis.

---

### 4. Acesso à Aplicação

| Endereço | Descrição |
| :--- | :--- |
| http://localhost:5173 | **Interface principal** |
| http://localhost:9001 | Painel MinIO (minioadmin / minioadmin) |

---

### 5. Logins de Teste

Na tela de login, use os **botões de acesso rápido** ou entre manualmente:

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Admin | `admin@projeto.com` | `admin` |
| Mentora | `mentora1@tutoria.com` | `password123` |
| Aluna | `aluna1@tutoria.com` | `password123` |

---

### 6. Derrubar os Containers

```bash
docker compose -f docker-compose.full.yml down
```

Para apagar todos os dados (volumes):

```bash
docker compose -f docker-compose.full.yml down -v
```
