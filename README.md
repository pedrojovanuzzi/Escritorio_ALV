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

## NFS-e — homologação e produção

A emissão de NFS-e já está montada no padrão **ABRASF 2.01 (provedor Fiorilli)** com
assinatura via **certificado A1**:

- **Ambiente** — o formulário de Nota Fiscal tem um seletor **Homologação / Produção**.
  Cada ambiente usa uma WSDL diferente (configurável no `.env`).
- **Certificado A1** — envie o `.pfx` pela própria tela (botão "Enviar certificado") ou
  via `POST /api/nfse/certificado` (campo `certificado`). Ele é salvo em
  `backend/src/files/certificado.pfx` (não versionado).
- **Fluxo** — o serviço monta o RPS ABRASF, **assina** com o A1 e **transmite** o lote
  SOAP ao webservice do ambiente escolhido. Sem certificado/senha, a nota é gravada como
  **rascunho** com o RPS já montado e um aviso (envio plugável).

Configure no `backend/.env` (veja `.env.template`):

| Variável | Descrição |
| --- | --- |
| `NFSE_CERT_PATH` | Caminho do `.pfx` (vazio = usa `files/certificado.pfx`) |
| `NFSE_CERT_PASSWORD` | Senha do certificado A1 |
| `NFSE_WSDL_HOMOLOGACAO` / `NFSE_WSDL_PRODUCAO` | Endpoints por ambiente |
| `NFSE_WS_USERNAME` / `NFSE_WS_PASSWORD` | Credenciais do webservice (se exigidas) |
| `NFSE_PRESTADOR_CNPJ` / `_IM` / `NFSE_CODIGO_MUNICIPIO` / `NFSE_CNAE` | Dados do emitente |

Endpoints NFS-e:

```
GET  /api/nfse/certificado/status   -> { configurado, caminho }
POST /api/nfse/certificado          -> upload do .pfx (multipart, campo "certificado")
POST /api/documentos/nfse           -> emite (body inclui "ambiente": "homologacao" | "producao")
```

> ⚠️ As WSDLs padrão apontam para o provedor Fiorilli (homologação) e Arealva/SP
> (produção, herdado do Wip). **Ajuste `NFSE_WSDL_PRODUCAO` para o webservice do seu
> município** antes de emitir em produção.

## Próximos passos (integração real)

1. **NFS-e** — apontar `NFSE_WSDL_PRODUCAO` para a prefeitura correta, ajustar
   regime/alíquota e tratar o retorno do webservice (número/código de verificação reais)
   em `NfseService` a partir de `retornoWebservice`.
2. **Boleto** — implementar `BoletoService.registrar` com a API do banco (nosso número,
   dígito verificador, linha digitável e código de barras reais).
3. Endurecer a autenticação (refresh token, rate limit) e versionar novas migrations.
