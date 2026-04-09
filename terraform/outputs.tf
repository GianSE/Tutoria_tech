output "droplet_ip" {
  value = digitalocean_droplet.tutoria_tech_server.ipv4_address
  description = "IP Público do Servidor. Use para apontar o DNS e acessar via HTTPS."
}

output "domain" {
  value = var.domain_name
  description = "Dominio configurado para o Caddy."
}
