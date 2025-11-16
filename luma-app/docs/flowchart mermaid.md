<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# agora crie o flowchart mermaid

```mermaid
flowchart TB
    Start([Usuário Abre App]) --> CheckAuth{Autenticado?}
    
    CheckAuth -->|Não| Login[Tela de Login/Registro]
    Login --> AuthMethod{Método de Auth}
    AuthMethod -->|Email/Senha| EmailAuth[Autenticação Email]
    AuthMethod -->|Social| SocialAuth[Google/Apple Login]
    
    EmailAuth --> CreateAccount{Nova Conta?}
    SocialAuth --> CreateAccount
    
    CreateAccount -->|Sim| CreateHouse[Criar Primeira Casa]
    CreateAccount -->|Não| CheckHouse
    
    CreateHouse --> HouseForm[Preencher Nome e Foto da Casa]
    HouseForm --> GenerateCode[Gerar Código de Convite]
    GenerateCode --> Tutorial[Tutorial Interativo com Luma]
    Tutorial --> Dashboard
    
    CheckAuth -->|Sim| CheckHouse{Tem Casa?}
    CheckHouse -->|Não| CreateHouse
    CheckHouse -->|Sim| Dashboard[Dashboard Principal]
    
    Dashboard --> MainNav{Navegação}
    
    MainNav -->|Chat| LumaChat[Conversa com Luma]
    MainNav -->|Finanças| FinanceFlow[Gestão Financeira]
    MainNav -->|Tarefas| TaskFlow[Gestão de Tarefas]
    MainNav -->|Casa| HouseFlow[Configurações da Casa]
    
    %% FLUXO LUMA
    LumaChat --> UserMessage[Usuário Envia Mensagem]
    UserMessage --> SendWebhook[POST /webhook/luma/chat]
    SendWebhook --> N8N[n8n Workflow]
    
    N8N --> ExtractContext[Extrair Contexto da Casa]
    ExtractContext --> QueryDB{Tipo de Consulta?}
    
    QueryDB -->|Finanças| GetFinances[Buscar Despesas/Orçamento]
    QueryDB -->|Tarefas| GetTasks[Buscar Tarefas]
    QueryDB -->|Dispositivos| GetDevices[Buscar Dispositivos IoT]
    QueryDB -->|Geral| GetGeneral[Contexto Geral]
    
    GetFinances --> BuildPrompt[Construir Prompt Enriquecido]
    GetTasks --> BuildPrompt
    GetDevices --> BuildPrompt
    GetGeneral --> BuildPrompt
    
    BuildPrompt --> LLM[Enviar para LLM]
    LLM --> ProcessResponse[Processar Resposta]
    ProcessResponse --> CheckAction{Requer Ação?}
    
    CheckAction -->|Criar Tarefa| CreateTaskAction[Criar Tarefa no DB]
    CheckAction -->|Registrar Despesa| CreateExpenseAction[Criar Despesa no DB]
    CheckAction -->|Controlar Dispositivo| DeviceAction[Enviar Comando IoT]
    CheckAction -->|Apenas Resposta| ReturnResponse
    
    CreateTaskAction --> ReturnResponse[Retornar Resposta ao App]
    CreateExpenseAction --> ReturnResponse
    DeviceAction --> ReturnResponse
    
    ReturnResponse --> DisplayLuma[Exibir Resposta da Luma]
    DisplayLuma --> SaveConversation[Salvar Conversa no DB]
    SaveConversation --> LumaChat
    
    %% FLUXO FINANCEIRO
    FinanceFlow --> FinanceOptions{Opção}
    FinanceOptions -->|Ver Despesas| ListExpenses[Lista de Despesas]
    FinanceOptions -->|Adicionar| AddExpense[Formulário Nova Despesa]
    FinanceOptions -->|Relatórios| Reports[Dashboard Analytics]
    
    AddExpense --> ExpenseForm[Preencher Dados]
    ExpenseForm --> UploadReceipt{Upload Comprovante?}
    UploadReceipt -->|Sim| UploadFile[Upload para Supabase Storage]
    UploadReceipt -->|Não| SelectCategory
    UploadFile --> SelectCategory[Selecionar Categoria]
    
    SelectCategory --> SplitExpense{Dividir Despesa?}
    SplitExpense -->|Sim| SelectMembers[Selecionar Membros]
    SplitExpense -->|Não| SaveExpense
    SelectMembers --> SaveExpense[Salvar Despesa no DB]
    
    SaveExpense --> NotifyMembers[Notificar Membros]
    NotifyMembers --> ListExpenses
    
    ListExpenses --> ExpenseDetail{Ver Detalhes?}
    ExpenseDetail -->|Sim| ShowExpense[Exibir Detalhes Completos]
    ExpenseDetail -->|Não| FinanceFlow
    ShowExpense --> MarkPaid{Marcar Pago?}
    MarkPaid -->|Sim| UpdatePaid[Atualizar Status]
    UpdatePaid --> ListExpenses
    
    Reports --> GenerateReport[Gerar Relatório]
    GenerateReport --> ShowCharts[Exibir Gráficos]
    ShowCharts --> FinanceFlow
    
    %% FLUXO TAREFAS
    TaskFlow --> TaskOptions{Opção}
    TaskOptions -->|Ver Tarefas| ListTasks[Board Kanban]
    TaskOptions -->|Criar| CreateTask[Formulário Nova Tarefa]
    TaskOptions -->|Filtrar| FilterTasks[Filtros e Ordenação]
    
    CreateTask --> TaskForm[Preencher Dados]
    TaskForm --> AssignMember{Atribuir Membro?}
    AssignMember -->|Sim| SelectAssignee[Selecionar Responsável]
    AssignMember -->|Não| SetPriority
    SelectAssignee --> SetPriority[Definir Prioridade]
    
    SetPriority --> SetDueDate{Definir Prazo?}
    SetDueDate -->|Sim| SelectDate[Escolher Data]
    SetDueDate -->|Não| SaveTask
    SelectDate --> SaveTask[Salvar Tarefa no DB]
    
    SaveTask --> NotifyAssignee[Notificar Responsável]
    NotifyAssignee --> ListTasks
    
    ListTasks --> TaskDetail{Selecionar Tarefa?}
    TaskDetail -->|Sim| ShowTask[Exibir Detalhes]
    TaskDetail -->|Não| TaskFlow
    
    ShowTask --> TaskActions{Ação}
    TaskActions -->|Comentar| AddComment[Adicionar Comentário]
    TaskActions -->|Mudar Status| UpdateStatus[Atualizar Status]
    TaskActions -->|Concluir| CompleteTask[Marcar como Concluída]
    TaskActions -->|Editar| EditTask[Editar Detalhes]
    
    CompleteTask --> AwardPoints[Atribuir Pontos]
    AwardPoints --> SendNotification[Notificar Membros]
    SendNotification --> ListTasks
    
    UpdateStatus --> ListTasks
    AddComment --> ShowTask
    EditTask --> ShowTask
    
    %% FLUXO CASA
    HouseFlow --> HouseOptions{Opção}
    HouseOptions -->|Membros| ManageMembers[Gerenciar Membros]
    HouseOptions -->|Dispositivos| ManageDevices[Gerenciar Dispositivos]
    HouseOptions -->|Configurações| Settings[Configurações Gerais]
    
    ManageMembers --> MemberActions{Ação}
    MemberActions -->|Adicionar| InviteMember[Gerar Link/Código]
    MemberActions -->|Remover| RemoveMember[Remover Membro]
    MemberActions -->|Alterar Papel| ChangeRole[Alterar Permissões]
    
    InviteMember --> ShareInvite[Compartilhar Convite]
    ShareInvite --> ManageMembers
    RemoveMember --> ConfirmRemove{Confirmar?}
    ConfirmRemove -->|Sim| DeleteMember[Excluir do DB]
    DeleteMember --> ManageMembers
    ChangeRole --> ManageMembers
    
    %% FLUXO DISPOSITIVOS IOT (FUTURO)
    ManageDevices --> DeviceList[Lista de Dispositivos]
    DeviceList --> DeviceOptions{Opção}
    DeviceOptions -->|Adicionar| AddDevice[Conectar Novo Dispositivo]
    DeviceOptions -->|Configurar| ConfigDevice[Configurações do Dispositivo]
    DeviceOptions -->|Testar| TestDevice[Testar Conexão]
    
    AddDevice --> ScanDevices[Escanear Rede Local]
    ScanDevices --> SelectDevice[Selecionar Dispositivo]
    SelectDevice --> AuthDevice[Autenticar Dispositivo]
    AuthDevice --> SaveDevice[Salvar no DB]
    SaveDevice --> DeviceList
    
    ConfigDevice --> DeviceSettings[Editar Configurações]
    DeviceSettings --> UpdateDevice[Atualizar DB]
    UpdateDevice --> DeviceList
    
    TestDevice --> SendTestCommand[Enviar Comando Teste]
    SendTestCommand --> CheckResult{Sucesso?}
    CheckResult -->|Sim| ShowSuccess[Exibir Sucesso ✓]
    CheckResult -->|Não| ShowError[Exibir Erro ✗]
    ShowSuccess --> DeviceList
    ShowError --> DeviceList
    
    Settings --> HouseFlow
    
    %% FLUXO COMANDO IOT VIA LUMA
    DeviceAction --> FindDevice[Buscar Dispositivo Compatível]
    FindDevice --> HasDevice{Dispositivo Existe?}
    
    HasDevice -->|Não| NoDeviceMsg[Responder: Sem Dispositivo]
    HasDevice -->|Sim| CheckOnline{Dispositivo Online?}
    
    NoDeviceMsg --> ReturnResponse
    
    CheckOnline -->|Não| OfflineMsg[Responder: Dispositivo Offline]
    CheckOnline -->|Sim| SendCommand[Enviar Comando API]
    
    OfflineMsg --> ReturnResponse
    
    SendCommand --> LogAction[Registrar DeviceAction no DB]
    LogAction --> WaitResponse[Aguardar Resposta]
    WaitResponse --> CommandResult{Sucesso?}
    
    CommandResult -->|Sim| SuccessMsg[Responder: Comando Executado]
    CommandResult -->|Não| FailMsg[Responder: Falha na Execução]
    
    SuccessMsg --> ReturnResponse
    FailMsg --> ReturnResponse
    
    style Start fill:#e1f5e1
    style Dashboard fill:#e3f2fd
    style LumaChat fill:#fff3e0
    style N8N fill:#fce4ec
    style LLM fill:#f3e5f5
    style SaveExpense fill:#e8f5e9
    style SaveTask fill:#e8f5e9
    style CompleteTask fill:#c8e6c9
    style SendCommand fill:#ffccbc
    style DeviceAction fill:#ffccbc
```


***

## Flowchart Simplificado (Visão Geral)

```mermaid
flowchart LR
    A[App Mobile/Web] --> B[Supabase Backend]
    A --> C[n8n Workflow]
    
    C --> D[LLM API]
    C --> B
    
    B --> E[(PostgreSQL + PostGIS)]
    B --> F[Storage Arquivos]
    B --> G[Realtime Subscriptions]
    
    D --> C
    
    A --> H[Dispositivos IoT]
    C --> H
    
    H --> I[Aspirador Robô]
    H --> J[Alexa/Google Home]
    H --> K[Câmeras/Sensores]
    
    style A fill:#4CAF50,color:#fff
    style B fill:#2196F3,color:#fff
    style C fill:#FF9800,color:#fff
    style D fill:#9C27B0,color:#fff
    style E fill:#607D8B,color:#fff
    style H fill:#F44336,color:#fff
```


***

## Flowchart de Autenticação e Onboarding

```mermaid
flowchart TD
    Start([Abrir App]) --> Check{Primeira Vez?}
    
    Check -->|Sim| Welcome[Tela de Boas-Vindas]
    Check -->|Não| Login[Tela de Login]
    
    Welcome --> Choose{Escolher Método}
    Choose -->|Email| EmailSignup[Registro Email]
    Choose -->|Google| GoogleAuth[Login Google]
    Choose -->|Apple| AppleAuth[Login Apple]
    
    EmailSignup --> Verify[Verificar Email]
    GoogleAuth --> CreateProfile
    AppleAuth --> CreateProfile
    Verify --> CreateProfile[Criar Perfil]
    
    CreateProfile --> CreateHouse[Criar Primeira Casa]
    CreateHouse --> HouseInfo[Nome + Endereço + Foto]
    HouseInfo --> InviteCode[Gerar Código Convite]
    InviteCode --> Tutorial[Tutorial Interativo]
    
    Tutorial --> Step1[Passo 1: Conhecer Luma]
    Step1 --> Step2[Passo 2: Adicionar Despesa]
    Step2 --> Step3[Passo 3: Criar Tarefa]
    Step3 --> Complete[Onboarding Completo ✓]
    
    Complete --> Dashboard[Ir para Dashboard]
    
    Login --> Auth[Autenticar Credenciais]
    Auth --> Success{Sucesso?}
    Success -->|Sim| HasHouse{Tem Casa?}
    Success -->|Não| Error[Exibir Erro]
    Error --> Login
    
    HasHouse -->|Sim| Dashboard
    HasHouse -->|Não| JoinCreate{Ação}
    JoinCreate -->|Criar Nova| CreateHouse
    JoinCreate -->|Entrar Existente| EnterCode[Inserir Código]
    EnterCode --> ValidateCode{Código Válido?}
    ValidateCode -->|Sim| JoinHouse[Entrar na Casa]
    ValidateCode -->|Não| CodeError[Código Inválido]
    CodeError --> EnterCode
    JoinHouse --> Dashboard
    
    style Start fill:#4CAF50,color:#fff
    style Complete fill:#2196F3,color:#fff
    style Dashboard fill:#FF9800,color:#fff
```


***

## Flowchart de Interação com Luma (Detalhado)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as App
    participant W as Webhook n8n
    participant N as n8n Workflow
    participant DB as Supabase DB
    participant LLM as OpenAI/Anthropic
    participant IOT as Dispositivo IoT
    
    U->>A: Digite mensagem: "Limpe o quarto"
    A->>A: Adicionar contexto (user_id, house_id)
    A->>W: POST /webhook/luma/chat
    
    W->>N: Trigger workflow
    N->>DB: Buscar últimas conversas
    DB-->>N: Histórico de contexto
    
    N->>DB: Buscar dispositivos da casa
    DB-->>N: Lista de dispositivos
    
    N->>N: Analisar intenção da mensagem
    alt Comando de Dispositivo
        N->>DB: Buscar aspirador robô
        DB-->>N: Roomba encontrado (online)
        N->>LLM: Gerar resposta confirmação
        LLM-->>N: Texto da resposta
        N->>IOT: POST /api/roomba/start_clean
        IOT-->>N: Comando aceito
        N->>DB: Log DeviceAction
    else Consulta Financeira
        N->>DB: Buscar despesas do mês
        DB-->>N: Dados financeiros
        N->>LLM: Gerar análise + resposta
        LLM-->>N: Relatório formatado
    else Consulta Tarefas
        N->>DB: Buscar tarefas da semana
        DB-->>N: Lista de tarefas
        N->>LLM: Gerar resumo
        LLM-->>N: Resposta estruturada
    end
    
    N->>DB: Salvar conversa
    N->>W: Retornar resposta
    W-->>A: JSON response
    A->>A: Renderizar mensagem Luma
    A->>U: Exibir resposta na interface
    
    opt Se comando IoT foi executado
        IOT->>W: Webhook status update
        W->>N: Atualizar status ação
        N->>DB: Atualizar DeviceAction
        N->>A: Push notification
        A->>U: "Limpeza concluída! 🎉"
    end
```

Esses flowcharts cobrem os principais fluxos do aplicativo Luma, desde autenticação até interações complexas com a assistente AI e dispositivos IoT.[^1][^2][^3]

<div align="center">⁂</div>

[^1]: http://arxiv.org/pdf/2502.16796.pdf

[^2]: https://www.aifire.co/p/ai-integration-11-ways-to-connect-your-n8n-ai-agent

[^3]: https://binarymarvels.com/build-smart-ai-chatbots-agents-using-n8n/

