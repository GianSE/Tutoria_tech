output "droplet_ip" {
  value = digitalocean_droplet.tutoria_tech_server.ipv4_address
  description = "IP Público do Servidor. Acesse nas portas 5173 (App) e 3001 (API)."
}
