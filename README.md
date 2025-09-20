# Another Backend

Este é um backend Node.js construído com Fastify, Drizzle ORM e PostgreSQL.

## Fluxo Principal da Aplicação

```mermaid
graph TD
    A[Cliente] -->|HTTP Request| B[Fastify Server :3333]
    B --> C{Rota Disponível?}
    C -->|Não| D[404 Not Found]
    C -->|Sim| E[Handler da Rota]
    E --> F{Precisa de Dados?}
    F -->|Não| G[Resposta Direta]
    F -->|Sim| H[Drizzle ORM]
    H --> I[PostgreSQL Database]
    I -->|Resultados| H
    H -->|Dados Processados| E
    E --> J[Resposta HTTP]
    J --> A
    
    K[Docker Compose] -->|Gerencia| I
    L[Migrations] -->|Atualiza Schema| I
    M[Drizzle Studio] -->|Inspeciona| I
    
    style B fill:#e1f5fe
    style I fill:#f3e5f5
    style H fill:#e8f5e8
```

## Arquitetura

### Stack Tecnológica
- **Fastify**: Framework web para servidor HTTP
- **Drizzle ORM**: Toolkit type-safe para PostgreSQL  
- **TypeScript**: Usando strip-types experimental para execução em runtime
- **PostgreSQL**: Database rodando em container Docker

### Estrutura do Projeto
```
src/
├── server.ts           # Ponto de entrada da aplicação
└── database/
    ├── client.ts       # Configuração do cliente Drizzle
    └── schema.ts       # Definições do schema do database
```

## Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento com hot reload
npm run dev

# Operações de database
npm run db:generate    # Gerar migrations a partir de mudanças no schema
npm run db:migrate     # Executar migrations pendentes
npm run db:studio      # Abrir Drizzle Studio para inspeção do database

# Operações Docker
docker compose up      # Iniciar database PostgreSQL
```

## Configuração do Database

A aplicação espera uma variável de ambiente `DATABASE_URL`. O `docker-compose.yml` incluso fornece uma instância PostgreSQL 17 com credenciais padrão (admin/admin) na porta 5432.

## Detalhes de Implementação

- Usa a flag `--experimental-strip-types` do Node.js para execução direta de TypeScript
- Schema do database usa chaves primárias UUID com valores padrão aleatórios
- Migrations do Drizzle são armazenadas no diretório `./drizzle`
- Servidor roda na porta 3333 por padrão