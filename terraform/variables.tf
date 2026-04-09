variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "ssh_fingerprint" {
  description = "Fingerprint da chave SSH já cadastrada na DigitalOcean"
  type        = string
}

variable "region" {
  description = "Região do Droplet (ex: nyc1, sfo3, fra1)"
  type        = string
  default     = "nyc1"
}

variable "jwt_secret" {
  description = "Segredo para o JWT da aplicação"
  type        = string
  default     = "mude_em_producao_123"
}

variable "domain_name" {
  description = "Dominio principal para HTTPS (ex: app.seudominio.com)"
  type        = string
}

variable "admin_email" {
  description = "Email usado pelo Caddy para emitir certificados"
  type        = string
}
