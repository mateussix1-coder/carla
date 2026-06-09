# Ciclo 114

Aplicativo web responsivo e instalável (PWA) para gestão reprodutiva, controle gestacional de matrizes suínas e manejo de leitões do nascimento ao desmame.

## Objetivo

A primeira versão foi preparada para apresentação e uso educacional em celular. Ela concentra dados reprodutivos, partos, pesagens, sanidade e responsáveis em uma interface simples, sem depender de backend ou serviços pagos.

## Stack

- React + Vite
- Tailwind CSS
- React Router DOM
- Lucide React
- Recharts
- `localStorage`
- PWA com manifest e service worker básico
- Configuração de deploy para Vercel

## Como executar

Requisitos: Node.js 18 ou superior e npm.

```bash
npm install
npm run dev
```

O Vite informará o endereço local, normalmente `http://localhost:5173`.

## Verificações

```bash
npm test
npm run build
npm run preview
```

## Publicação na Vercel

O arquivo `vercel.json` já define o framework, o diretório `dist` e o fallback necessário para as rotas do React Router.

```bash
npm install
npm run build
npx vercel login
npx vercel --prod
```

Também é possível importar o repositório no painel da Vercel. Use `npm run build` como comando de build e `dist` como diretório de saída.

## Módulos

- Dashboard com indicadores, próximos partos, alertas, gráfico e ações rápidas
- Matrizes com busca, filtro, cadastro e histórico resumido
- Varrões
- Coberturas com previsão automática em 114 dias
- Acompanhamento da gestação
- Partos com total automático e criação de lote
- Manejo de leitões e pesagens PN, P07, P14, P21 e PD
- Vacinas e medicamentos com alertas
- Alunos e turmas responsáveis
- Relatórios reprodutivos, sanitários e de evolução de peso

## Persistência e decisões da primeira versão

Os dados ficam no `localStorage` do navegador. A aplicação inicia com dados de demonstração relativos à data atual para que alertas e previsões continuem úteis. O botão "Restaurar dados de demonstração" repõe esses dados.

Fotos são representadas por áreas funcionais de interface, mas o upload binário não foi incluído para evitar exceder o limite do `localStorage`. A camada de dados foi centralizada em contexto React para facilitar uma futura substituição por Supabase, Firebase ou uma API própria.

## Próximas melhorias

- Autenticação por professora, turma e aluno
- Banco de dados compartilhado e sincronização entre dispositivos
- Upload e compressão de fotos
- Exportação de relatórios em PDF/CSV
- Registro individual por leitão
- Notificações push para partos e manejos sanitários
- Rotinas de backup e auditoria
