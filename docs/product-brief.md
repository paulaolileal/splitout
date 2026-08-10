# Rolê Sorted — brief de produto original

> **Nota histórica**: este é o prompt/brief de produto original enviado ao Lovable
> para gerar a primeira versão do app, na época chamado "Acerta". O produto foi
> renomeado para **Splitout!**, migrou da stack gerada pelo Lovable para Vite +
> React Router, e a integração com Google Sheets/Auth segue hoje o padrão
> documentado em [`CLAUDE.md`](../CLAUDE.md) (pasta "LealTEK Apps", schema de
> abas próprio) em vez da estrutura de abas sugerida na seção 18 abaixo. Mantido
> como referência de visão de produto — não descreve o estado atual do código.

ACERTA — App para dividir e acertar contas de rolês

Crie uma aplicação web/PWA chamada Acerta.

Tagline

Divida o rolê. Acerte as contas.

O Acerta é um aplicativo para facilitar a divisão de despesas em grupos de amigos, viagens, restaurantes, shoppings, churrascos, Uber, cinema e qualquer situação em que várias pessoas gastam juntas, mas nem sempre cada uma paga exatamente o que consumiu.

O grande diferencial do produto é:

Cada pessoa pode ter consumido uma coisa diferente, pessoas diferentes podem ter pago as despesas, e o Acerta calcula automaticamente quem deve quanto para quem.

O produto deve parecer um aplicativo real e polido, não um CRUD ou dashboard genérico.

1. PRINCÍPIOS DO PRODUTO

Prioridades:

UX extremamente simples.

Mobile-first.

Suporte completo para desktop.

Visual com personalidade.

Poucos passos para criar um rolê.

Cálculo automático e confiável.

Compartilhamento sem necessidade de login.

Google Sheets como armazenamento dos rolês do usuário.

PWA instalável.

Não criar backend tradicional para armazenar os dados dos rolês.

O usuário deve conseguir entender o produto em poucos segundos.

A experiência principal deve ser:

Criar rolê
    ↓
Adicionar pessoas
    ↓
Adicionar despesas
    ↓
Informar quem pagou
    ↓
Informar quanto cada pessoa consumiu
    ↓
Acerta calcula tudo
    ↓
Mostrar quem paga para quem
    ↓
Compartilhar o acerto individual


2. IDENTIDADE DO PRODUTO

Nome:

Acerta

Evitar aparência de aplicativo bancário tradicional.

O Acerta deve transmitir:

rolê

amigos

praticidade

dinheiro sem complicação

diversão

organização

confiança

A interface pode combinar elementos de:

aplicativos financeiros modernos

apps sociais

aplicativos de organização

cartões e chips

microinterações

animações sutis

Mas NÃO copiar visualmente nenhum produto existente.

Evitar:

dashboard corporativo

excesso de tabelas

visual administrativo

aparência de sistema ERP

telas cheias de formulários

excesso de cinza

componentes genéricos de SaaS

3. STACK

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui apenas quando fizer sentido

PWA

Google OAuth

Google Sheets API

Supabase Auth apenas para autenticação, se necessário pela infraestrutura do Lovable

Edge Functions somente quando necessárias para integração segura com Google APIs

IMPORTANTE:

Não criar um banco de dados tradicional para armazenar os rolês.

Os dados do rolê devem existir:

localmente durante a edição

no Google Sheets quando o usuário escolher salvar/sincronizar

em links compartilhados através de um snapshot compacto do relatório

A autenticação existe principalmente para identificar o usuário que está criando/salvando seus próprios rolês.

4. AUTENTICAÇÃO

Apenas o criador do rolê precisa estar autenticado.

Usar:

Entrar com Google

Fluxo:

Usuário entra no Acerta
        ↓
Pode conhecer o produto sem login
        ↓
Clica em "Criar meu primeiro rolê"
        ↓
Login Google
        ↓
Cria o rolê


Não exigir login para:

visualizar uma página pública de compartilhamento

visualizar um relatório individual

acessar um QR Code compartilhado

consultar quanto deve

copiar informações do acerto

IMPORTANTE:

Não criar tela de cadastro tradicional com email/senha.

Priorizar Google.

5. HOME

Criar uma landing/home que também funcione como entrada do aplicativo.

Mobile:

┌──────────────────────────┐
│       ACERTA             │
│                          │
│  Divida o rolê.          │
│  Acerte as contas.       │
│                          │
│   [ + Novo rolê ]        │
│                          │
│  Seus rolês               │
│                          │
│  🍝 Shopping              │
│  🏖️ Viagem               │
│  🍻 Sexta-feira           │
└──────────────────────────┘


No desktop, utilizar uma composição visual mais ampla, mas sem transformar a aplicação em um dashboard corporativo.

Mostrar rolês recentes em cards.

Cada card deve ter:

nome

data

número de participantes

valor total

status

pequeno resumo do acerto

6. CRIAR ROLÊ

Tela extremamente simples.

Título:

Qual é o rolê?

Exemplos:

Shopping

Sexta no bar

Churrasco

Viagem para Ouro Preto

Jantar

Cinema

Campos:

Nome do rolê
Data


Data pode ser preenchida automaticamente com a data atual.

Botão:

Continuar

7. PARTICIPANTES

Interface amigável para adicionar pessoas.

Exemplo:

Quem está no rolê?

👩 Paula
👩 Mel
👩 Jess

[ + Adicionar pessoa ]

             Continuar →


Cada participante deve ter:

nome

avatar/initial gerado automaticamente

cor/identidade visual consistente

Não exigir conta para participantes.

IMPORTANTE:

Somente o criador precisa estar autenticado.

8. DESPESAS

Esta é uma das partes mais importantes do produto.

Criar uma interface extremamente rápida para adicionar uma despesa.

Botão principal:

+ Adicionar despesa

Exemplo:

🍝 Restaurante do shopping

Valor
R$ 90,00

Quem pagou?

[ Paula ]

Como dividir?

[ Por item ] [ Igual ] [ Personalizado ]


9. MODOS DE DIVISÃO

Cada despesa deve permitir três formas.

9.1 Divisão igual

Exemplo:

R$ 90 entre 3 pessoas.

Paula    R$ 30
Mel      R$ 30
Jess     R$ 30


Permitir selecionar quais participantes entram na divisão.

9.2 Por item

Este é um dos principais diferenciais.

Exemplo:

🍝 Restaurante

Macarrão       R$ 40    → Paula
Fricassê       R$ 20    → Mel
Comida         R$ 30    → Jess

Total          R$ 90


Permitir adicionar/remover itens.

Cada item possui:

descrição

valor

participante(s)

Exemplo real:

Macarrão
R$ 40
Paula


O total dos itens deve ser validado contra o valor total da despesa.

Mostrar claramente:

✓ R$ 90 / R$ 90


quando estiver correto.

9.3 Personalizado

Permitir informar manualmente quanto cada pessoa deve assumir.

Exemplo:

Paula     R$ 40
Mel       R$ 20
Jess      R$ 30

Total     R$ 90 ✓


10. DESPESAS COMPARTILHADAS

O sistema também deve suportar despesas como:

Uber

R$ 60

Pago por:

Jess

Dividido entre:

Paula
Mel
Jess

Resultado:

R$ 20 para cada.

Airbnb

Permitir divisão proporcional.

Exemplo:

Paula     2 noites
Mel       2 noites
Jess      1 noite


O valor é distribuído proporcionalmente.

Criar uma estrutura extensível para permitir futuramente outros critérios de divisão.

11. MODELO DE DADOS

Não armazenar diretamente os acertos finais como informação primária.

O modelo deve representar:

Party {
  id
  name
  date
  participants[]
  expenses[]
}


Cada despesa:

Expense {
  id
  description
  totalAmount
  paidBy
  splitType
  items[]
  allocations[]
}


Cada allocation:

Allocation {
  participantId
  amount
}


O saldo deve ser sempre calculado.

Regra:

saldo = totalPago - totalDevido


Onde:

saldo positivo = pessoa recebe

saldo negativo = pessoa paga

12. MOTOR DE ACERTO

Criar uma função pura e testável responsável pelo cálculo.

Exemplo:

Paula  +150
Mel     +30
Jess    -100
João     -80


O algoritmo deve gerar o menor conjunto razoável de transferências.

Resultado:

Jess → Paula     R$ 100
João → Paula     R$ 50
João → Mel       R$ 30


O usuário não precisa entender o algoritmo.

Mostrar apenas o resultado de forma amigável.

13. TELA DE RESULTADO

Essa deve ser uma das telas mais bonitas do aplicativo.

Título:

🎉 Rolê acertado!

Mostrar:

Total do rolê

R$ 350,00

4 pessoas
5 despesas


Depois:

Acertos

Usar cards visuais.

Exemplo:

┌──────────────────────────┐
│ 👩 Mel                   │
│                          │
│ paga R$ 20,00            │
│                          │
│        →                 │
│                          │
│ 👩 Paula                 │
└──────────────────────────┘


Ou:

Mel
↓
R$ 20
↓
Paula


Não apresentar isso inicialmente como uma tabela financeira.

14. VISÃO INDIVIDUAL

Criar uma página específica para cada participante.

Exemplo:

🍝 Shopping

Seu acerto

Você consumiu
R$ 20,00

Você pagou
R$ 0,00

Você precisa pagar

R$ 20,00

────────────────

💸 Você paga para

Paula

R$ 20,00

[ Compartilhar ]


Se a pessoa tiver múltiplos pagamentos:

Você precisa pagar R$ 85

Paula      R$ 50
Jess       R$ 35


Se a pessoa tiver crédito:

Você recebe

R$ 120

de:

Mel       R$ 40
Jess      R$ 80


15. COMPARTILHAMENTO SEM LOGIN

Esta é uma funcionalidade fundamental.

O criador deve poder clicar:

Compartilhar meu acerto

ou:

Compartilhar acerto de Mel

O link deve permitir que a pessoa veja seu relatório sem autenticação.

Não depender de uma página pública que consulte um banco de dados.

Criar um mecanismo de snapshot serializado/compactado do relatório individual dentro do link.

Conceito:

acerta.app/r/<payload>


O payload deve conter somente as informações necessárias para o relatório individual.

NÃO colocar dados desnecessários no link.

Quando o usuário abre o link:

Link
 ↓
Acerta interpreta snapshot
 ↓
Mostra relatório
 ↓
Sem login
 ↓
Sem acesso ao rolê completo


O relatório deve ser somente leitura.

IMPORTANTE:

A pessoa que recebe o link deve ver apenas as informações necessárias para seu acerto.

Não mostrar:

dados privados desnecessários

todos os detalhes financeiros dos outros participantes

acesso ao Google Sheet do criador

16. QR CODE

Na página de compartilhamento individual, permitir:

Gerar QR Code

Exemplo:

┌───────────────────────┐
│                       │
│       QR CODE         │
│                       │
│                       │
└───────────────────────┘

Escaneie para ver seu acerto


Isso deve funcionar perfeitamente em celulares.

17. COMPARTILHAMENTO NATIVO

No celular utilizar a Web Share API quando disponível.

Exemplo:

[ Compartilhar ]


Abrir o menu nativo de compartilhamento do celular.

Texto sugerido:

💸 Seu acerto do rolê "Shopping" ficou em R$ 20,00. Veja os detalhes no Acerta.

Também oferecer:

copiar link

QR Code

18. GOOGLE SHEETS

O Google Sheets será o armazenamento persistente do criador.

Criar integração com Google OAuth + Google Sheets API.

O usuário poderá:

Salvar no Google

Ao salvar um rolê, criar uma planilha específica para ele ou utilizar uma estrutura organizada definida pelo produto.

Preferência inicial:

Criar uma planilha por rolê.

Nome:

Acerta — Shopping — 10/08/2026


Estrutura sugerida:

Aba Resumo

Rolê
Data
Participantes
Total


Aba Despesas

ID
Descrição
Valor
Pago por
Tipo de divisão


Aba Divisão

Despesa
Participante
Valor


Aba Acertos

Quem paga
Quem recebe
Valor


Aba Participantes

ID
Nome


19. SINCRONIZAÇÃO

O Google Sheets não deve deixar a experiência lenta.

O fluxo deve ser:

Usuário edita
     ↓
Estado local atualizado imediatamente
     ↓
UI atualiza imediatamente
     ↓
Sincronização com Google Sheets


Usar debounce para evitar escrever na planilha a cada pequena alteração.

Mostrar um pequeno indicador:

✓ Salvo no Google


ou:

Salvando...


Nunca bloquear a interface esperando o Google Sheets.

20. FUNCIONAMENTO OFFLINE

Como PWA, o aplicativo deve funcionar offline para:

abrir rolês já carregados

editar rolê

adicionar despesas

calcular acertos

Quando voltar a ter conexão:

Sincronizar com Google Sheets


Se não houver conexão com Google, manter o estado local.

21. HOME / HISTÓRICO

Depois de autenticado, mostrar:

Seus rolês

Cards:

🍝 Shopping
10 de agosto

3 pessoas
R$ 90

✓ Acertado


Outro:

🍻 Sexta no bar
8 de agosto

6 pessoas
R$ 420

✓ Acertado


Ações:

abrir

continuar edição

compartilhar

excluir localmente

abrir planilha

22. DESKTOP

Não fazer simplesmente uma versão mobile esticada.

Criar uma experiência desktop real.

Em desktop:

┌──────────────────────────────────────────────────┐
│ ACERTA                              Paula   👤   │
├──────────────────────────────────────────────────┤
│                                                  │
│  🍝 Shopping                                     │
│                                                  │
│  ┌───────────────┐  ┌─────────────────────────┐ │
│  │ Participantes │  │                         │ │
│  │               │  │ Despesas                │ │
│  │ Paula         │  │                         │ │
│  │ Mel           │  │ Restaurante   R$ 90    │ │
│  │ Jess          │  │ Uber          R$ 60    │ │
│  │               │  │                         │ │
│  └───────────────┘  └─────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │                 ACERTO                     │  │
│  │                                            │  │
│  │ Mel → Paula                 R$ 20          │  │
│  │ Jess → Paula                R$ 30          │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘


Usar melhor o espaço horizontal.

Desktop deve parecer uma aplicação de produtividade moderna.

23. MOBILE

Mobile deve ser a prioridade absoluta.

Usar:

bottom sheets

cards

sticky actions

botões grandes

inputs numéricos apropriados

navegação simples

feedback visual

gestos quando fizer sentido

Evitar menus escondidos demais.

O botão principal de adicionar despesa deve estar sempre facilmente acessível.

24. MICROINTERAÇÕES

Investir bastante em animações sutis.

Exemplos:

Quando uma despesa é adicionada:

+ R$ 90


entra suavemente no resumo.

Quando uma conta fecha corretamente:

R$ 90 / R$ 90
✓


mostrar uma pequena animação de sucesso.

Quando o resultado final é calculado:

Calculando...
      ↓
✓ Rolê acertado!


Quando alguém recebe crédito:

+ R$ 50


Quando alguém precisa pagar:

- R$ 20


As animações devem ser rápidas e elegantes, nunca infantis ou exageradas.

Respeitar prefers-reduced-motion.

25. COMPONENTES VISUAIS

Criar componentes próprios para:

ParticipantAvatar

ParticipantChip

ExpenseCard

ExpenseSplit

ExpenseItem

BalanceCard

SettlementCard

PartyHeader

ShareReport

ShareQRCode

GoogleSyncStatus

EmptyState

SuccessState

Não deixar toda a interface dependente dos componentes padrão do shadcn/ui.

Criar identidade visual própria usando esses componentes como base.

26. DESIGN SYSTEM

Criar tokens consistentes para:

tipografia

espaçamento

border radius

sombras

cards

botões

estados financeiros

Usar uma estética moderna, amigável e limpa.

O aplicativo deve ter bastante espaço visual.

Evitar aparência de planilha mesmo quando estiver trabalhando com dados financeiros.

27. ACESSIBILIDADE

Garantir:

contraste adequado

navegação por teclado

labels acessíveis

foco visível

tamanhos de toque adequados

suporte a leitores de tela

prefers-reduced-motion

Valores monetários devem ser claramente identificados.

28. VALIDAÇÕES

Nunca permitir:

despesa sem pagador

divisão cujo total não bate com a despesa

valores negativos

participantes duplicados

rolê sem participantes

divisão inválida

Mostrar erros diretamente no contexto.

Exemplo:

R$ 90,00 de despesa

Dividido:
R$ 85,00

⚠️ Faltam R$ 5,00 para fechar a conta.


29. PRIMEIRA VERSÃO

Implementar primeiro:

Landing/home

Login Google

Criar rolê

Participantes

Despesas

Divisão igual

Divisão por item

Divisão personalizada

Cálculo de saldo

Algoritmo de acerto

Tela de resultado

Relatório individual

Compartilhamento sem login

QR Code

PWA

Google Sheets

Histórico dos rolês

Não implementar ainda:

pagamentos reais

integração bancária

notificações push

chat

sistema social

ranking

gamificação complexa

assinatura paga

anúncios

IA para leitura de nota

A arquitetura deve, entretanto, permitir adicionar essas funcionalidades futuramente.

30. EXEMPLO OBRIGATÓRIO PARA VALIDAR A IMPLEMENTAÇÃO

Criar dados de exemplo para testar este cenário:

Rolê:

Shopping

Participantes:

Paula

Mel

Jess

Despesa:

Restaurante

Valor:

R$ 90

Pagador:

Paula

Divisão por item:

Macarrão → Paula → R$ 40
Fricassê → Mel → R$ 20
Comida → Jess → R$ 30


Resultado esperado:

Paula
Pagou: R$ 90
Deveria pagar: R$ 40
Saldo: +R$ 50

Mel
Pagou: R$ 0
Deveria pagar: R$ 20
Saldo: -R$ 20

Jess
Pagou: R$ 0
Deveria pagar: R$ 30
Saldo: -R$ 30


Acertos:

Mel → Paula     R$ 20
Jess → Paula    R$ 30


Esse cenário deve funcionar perfeitamente tanto no mobile quanto no desktop.

31. PRINCIPAL CRITÉRIO DE QUALIDADE

Antes de considerar a implementação pronta, avaliar a aplicação pela seguinte pergunta:

Uma pessoa que nunca usou o Acerta consegue criar um rolê e descobrir quem deve pagar quem sem precisar de explicação?

Se a resposta for não, simplifique a UX.

O objetivo não é mostrar toda a complexidade do cálculo.

O objetivo é esconder a complexidade e entregar:

"Você deve R$ 20 para Paula."

de forma extremamente clara.

Crie o Acerta com aparência de produto pronto para ser publicado, não de protótipo gerado por IA.
