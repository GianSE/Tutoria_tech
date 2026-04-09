terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

resource "digitalocean_droplet" "tutoria_tech_server" {
  image  = "ubuntu-22-04-x64"
  name   = "tutoria-tech-prod"
  region = var.region
  size   = "s-2vcpu-4gb" # Recomendado para rodar DB + Backend + MinIO confortavelmente
  ssh_keys = [var.ssh_fingerprint]

  user_data = <<-EOF
              #!/bin/bash
              set -e

              # 1. Instalar Docker e Docker Compose
              apt-get update
              apt-get install -y ca-certificates cursor curl gnupg lsb-release git
              mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
              echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
              apt-get update
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

              # 2. Clonar Projeto
              cd /opt
              git clone https://github.com/GianSE/Tutoria_tech.git
              cd Tutoria_tech

              # 3. Configurar Variáveis de Ambiente
              cat <<EOT > .env
              CADDY_DOMAIN=${var.domain_name}
              CADDY_EMAIL=${var.admin_email}
              MINIO_PUBLIC_URL=https://${var.domain_name}/minio
              EOT

              cat <<EOT > backend/.env
              DATABASE_URL="postgresql://tutoriatech_user:tutoriatech_pass@db:5432/tutoriatech?schema=public"
              PORT=3001
              JWT_SECRET="${var.jwt_secret}"
              MINIO_ENDPOINT=minio
              MINIO_PORT=9000
              MINIO_ACCESS_KEY=minioadmin
              MINIO_SECRET_KEY=minioadmin
              MINIO_USE_SSL=false
              MINIO_BUCKET_NAME=materiais
              # No servidor, o link público usa o domínio com HTTPS via Caddy
              MINIO_PUBLIC_URL=https://${var.domain_name}/minio
              EOT

              # 4. Rodar Aplicação
              COMPOSE_PROFILES=prod docker compose up -d --build
              EOF
}

resource "digitalocean_firewall" "tutoria_tech_fw" {
  name = "tutoria-tech-firewall"

  droplet_ids = [digitalocean_droplet.tutoria_tech_server.id]

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "all"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "all"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
