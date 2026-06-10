# Ciclo 114

Aplicativo responsivo para gestão reprodutiva suína, acompanhamento de leitões e
participação acadêmica.

## Arquitetura

- React 18 + Vite
- Tailwind CSS
- Vercel Functions
- Neon Postgres para perfis, sessões, dados operacionais, publicações e auditoria
- Vercel Blob privado para fotos
- Autenticação própria com senha protegida por `scrypt`
- Sessões opacas em cookie `HttpOnly`, `Secure` e `SameSite=Lax`

## Desenvolvimento

```bash
npm install
npx vercel env pull .env.local --yes
npm run db:migrate
npm run dev
```

O comando inicia o Vite e as funções de API em conjunto em
`http://127.0.0.1:5173`.

## Verificações

```bash
npm test
npm run build
npm audit --omit=dev
```

## Persistência

O estado operacional é salvo no Postgres com controle otimista de versão. Perfis,
sessões, publicações, comentários, curtidas, acessos e eventos de auditoria possuem
tabelas próprias. Fotos são armazenadas em um Blob privado e servidas somente
depois da validação da sessão.

Excluir um aluno arquiva a conta, encerra suas sessões e preserva a autoria dos
registros anteriores.

## Papéis

- **Professora:** todos os módulos, gestão de alunos, indicadores individuais e
  dados operacionais.
- **Aluno:** painel pessoal, mural acadêmico e perfil.

No primeiro uso, a professora pode entrar diretamente enquanto o perfil ainda não
possui senha. Ao definir uma senha em **Meu perfil**, a entrada direta é desativada.

## Banco

O esquema está em `database/schema.sql`. A migração idempotente e os dados iniciais
ficam em `scripts/migrate.mjs`.
