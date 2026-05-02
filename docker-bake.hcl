group "default" {
  targets = ["api", "webui"]
}

target "api" {
  context = "./back-end/"
  dockerfile = "Dockerfile"
  tags = ["bayareatrello/novo-trello-api:latest"]
  labels = {
    "maintainer" = "IESB Bay Area <nde.ads@iesb.br>"
    "org.opencontainers.image.title" = "Sprint Tacker API"
    "org.opencontainers.image.description" = "API for Sprint Tacker, a project management task."
    "org.opencontainers.image.source" = "https://github.com/fabrica-bayarea/Sprint-Tracker"
    "org.opencontainers.image.version" = "0.1"
    "org.opencontainers.image.licenses" = "GPL-3.0"
    "org.opencontainers.image.author" = "nde.ads@iesb.br"
  }
}

target "webui" {
  context = "./front-end/"
  dockerfile = "Dockerfile"
  tags = ["bayareatrello/novo-trello-webui:latest"]
  labels = {
    "maintainer" = "IESB Bay Area <nde.ads@iesb.br>"
    "org.opencontainers.image.title" = "Sprint Tacker Web UI"
    "org.opencontainers.image.description" = "Web interface for Sprint Tacker"
    "org.opencontainers.image.source" = "https://github.com/fabrica-bayarea/Sprint-Tracker"
    "org.opencontainers.image.version" = "0.1"
    "org.opencontainers.image.licenses" = "GPL-3.0"
    "org.opencontainers.image.author" = "nde.ads@iesb.br"
  }
}
