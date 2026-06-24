# Sistema Fiscal Alvorada

Gerador de documentos fiscais (NFS-e e boletos) do **Escritório Alvorada Contabilidade**,
construído a partir do protótipo de design (Claude Design handoff) seguindo a mesma
arquitetura do projeto **Wip Diversos**:

- **Backend** — Node + TypeScript + Express + TypeORM (MySQL), organizado em
  `controller/`, `routes/`, `entities/`, `services/`, `middleware/`, `database/`.
- **Frontend** — React (CRA) + TypeScript + TailwindCSS + axios + react-router,
  organizado em `pages/<Modulo>/`, com `context/AuthContext`, `components/` e `api/`.

> ⚠️ **Protótipo funcional.** A emissão real de NFS-e (webservice da prefeitura,
> certificado A1, padrão ABRASF) e o registro bancário de boletos estão **stubados**
> em `backend/src/services/nfse` e `backend/src/services/boleto`. Toda a navegação,
> o CRUD de clientes, a geração/preview de documentos e o histórico funcionam de ponta a ponta.

## Estrutura

```
Escritorio_ALV/
├── backend/                     # API Node/TS/Express/TypeORM
│   └── src/
│       ├── controller/          # Auth, Cliente, Documento
│       ├── routes/              # *.routes.ts
│       ├── entities/            # User, Cliente, Documento
│       ├── services/            # nfse/ e boleto/ (stubs da emissão)
│       ├── middleware/          # AuthGuard (JWT)
│       ├── database/            # DataSource (TypeORM)
│       ├── scripts/             # seed.ts
│       ├── app.ts               # rotas + middlewares
│       └── server.ts            # bootstrap
└── frontend/app/                # React CRA + Tailwind
    └── src/
        ├── pages/               # auth, notafiscal, boleto, lote, clientes, historico, preview
        ├── components/          # Layout (sidebar/topbar), ui (Card/Field/Resumo…)
        ├── context/             # AuthContext
        ├── api/                 # instância axios
        └── utils/               # formatação
```

## Como rodar

### 1. Banco de dados

Crie um banco MySQL e ajuste as credenciais em `backend/.env` (copie de `.env.template`):

```sql
CREATE DATABASE escritorio_alv;
```

O schema é criado pelas **migrations** (`synchronize: false`).

### 2. Backend

```bash
cd backend
npm install
npm run migration:run   # cria as tabelas (users, clientes, documentos)
npm run seed            # cria o usuário contador e os clientes de exemplo
npm start               # http://localhost:3000
```

**Login de teste:** `contador@alvoradacontabil.com.br` / senha `123456789`

### 3. Frontend

```bash
cd frontend/app
npm install
npm start        # http://localhost:3001
```

> O frontend roda na porta **3001** (`PORT=3001` em `frontend/app/.env`) e aponta
> para a API do backend (porta 3000) via `REACT_APP_URL`.

## Telas

| Rota            | Tela                                            |
| --------------- | ----------------------------------------------- |
| `/login`        | Acesso interno (split escuro + formulário)      |
| `/nota-fiscal`  | Emissão de NFS-e (tomador, serviço, tributos)   |
| `/boleto`       | Geração de boleto registrado                    |
| `/lote`         | Emissão em lote (NFS-e ou boletos)              |
| `/clientes`     | CRUD de clientes                                |
| `/historico`    | Cards de resumo + histórico de documentos       |
| `/documento/:id`| Visualização/impressão da NFS-e ou boleto       |

## Próximos passos (integração real)

1. **NFS-e** — implementar `NfseService.emitir` com SOAP/REST da prefeitura de Bauru,
   assinatura XML com certificado A1 (`node-forge` + `xml-crypto`), montagem do RPS ABRASF.
2. **Boleto** — implementar `BoletoService.registrar` com a API do banco (nosso número,
   dígito verificador, linha digitável e código de barras reais).
3. Endurecer a autenticação (refresh token, rate limit) e versionar novas migrations.
