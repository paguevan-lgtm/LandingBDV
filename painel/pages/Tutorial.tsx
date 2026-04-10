
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icons, Button } from '../components/Shared';
import Dashboard from './Dashboard';
import Passageiros from './Passageiros';
import Agendamentos from './Agendamentos';
import Viagens from './Viagens';
import Motoristas from './Motoristas';
import Tabela from './Tabela';
import Financeiro from './Financeiro';
import { GlobalModals } from '../components/GlobalModals';
import { getTodayDate, formatTime } from '../utils';

const INITIAL_SANDBOX_DATA = {
    passengers: [],
    drivers: [],
    trips: [],
    appointments: [],
    notes: [],
    lostFound: [],
    cannedMessages: [],
    drivers_table_list: [
        { vaga: '01', name: 'Carlos Oliveira', id: 'dt1' },
        { vaga: '02', name: 'Roberto Santos', id: 'dt2' },
        { vaga: '03', name: 'Marcos Lima', id: 'dt3' },
        { vaga: '04', name: 'Ricardo Dias', id: 'dt4' },
        { vaga: '05', name: 'Fernando Costa', id: 'dt5' }
    ],
    table_status: {
        '01': 'confirmed',
        '02': 'lousa'
    },
    confirmed_times: {
        '01': '08:00'
    },
    lousa_order: [
        { uid: 'l1', vaga: '02' }
    ]
};

export default function Tutorial({ theme, systemContext, notify }: any) {
    const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    
    // Persistence
    const [sandboxData, setSandboxData] = useState(() => {
        const saved = localStorage.getItem('sandbox_data');
        return saved ? JSON.parse(saved) : INITIAL_SANDBOX_DATA;
    });
    
    const [completedTutorials, setCompletedTutorials] = useState<string[]>(() => {
        const saved = localStorage.getItem('tutorial_progress');
        return saved ? JSON.parse(saved) : [];
    });

    const [sandboxView, setSandboxView] = useState('dashboard');
    const [sandboxTableTab, setSandboxTableTab] = useState('geral');
    const [sandboxMipDayType, setSandboxMipDayType] = useState('normal');
    const [sandboxAnalysisDate, setSandboxAnalysisDate] = useState(getTodayDate());
    const [sandboxBillingDate, setSandboxBillingDate] = useState(new Date());
    const [sandboxModal, setSandboxModal] = useState<string | null>(null);
    const [sandboxFormData, setSandboxFormData] = useState<any>({});
    const [sandboxSuggestedTrip, setSandboxSuggestedTrip] = useState<any>(null);
    const [sandboxEditingTripId, setSandboxEditingTripId] = useState<string | null>(null);
    const [sandboxAiModal, setSandboxAiModal] = useState(false);
    const [sandboxAiInput, setSandboxAiInput] = useState('');
    const [sandboxEditName, setSandboxEditName] = useState<string | null>(null);
    const [sandboxTempName, setSandboxTempName] = useState('');
    const [sandboxTempVaga, setSandboxTempVaga] = useState('');
    const [tutorialFinished, setTutorialFinished] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('sandbox_data', JSON.stringify(sandboxData));
    }, [sandboxData]);

    useEffect(() => {
        localStorage.setItem('tutorial_progress', JSON.stringify(completedTutorials));
    }, [completedTutorials]);

    const lastDriver = sandboxData.drivers[sandboxData.drivers.length - 1];
    const lastPassenger = useMemo(() => {
        return sandboxData.passengers[sandboxData.passengers.length - 1];
    }, [sandboxData.passengers]);
    const lastTrip = sandboxData.trips[sandboxData.trips.length - 1];

    const tutorials = useMemo(() => [
        {
            id: 'driver',
            title: '1. Como criar um motorista',
            description: 'O primeiro passo é cadastrar quem vai dirigir as vans.',
            icon: Icons.Van,
            steps: [
                { target: 'tut-menu-btn-drivers', text: 'Bem-vindo! Vamos começar cadastrando um motorista. Clique aqui no ícone do carrinho.', position: 'right' },
                { target: 'tut-btn-global-plus', text: 'Agora clique no botão de "+" para abrir o cadastro.', position: 'bottom' },
                { target: 'input-driver-name', text: 'Digite o nome do motorista. Ex: "Carlos".', position: 'bottom', showNext: true },
                { target: 'input-driver-phone-name-0', text: 'Dê um nome para o contato (ex: "WhatsApp").', position: 'bottom', showNext: true },
                { target: 'input-driver-phone-val-0', text: 'Digite o número do telefone.', position: 'bottom', showNext: true },
                { target: 'btn-driver-add-phone', text: 'Você pode adicionar múltiplos telefones se precisar.', position: 'top', showNext: true },
                { target: 'input-driver-cpf', text: 'O CPF é importante para a segurança e identificação.', position: 'bottom', showNext: true },
                { target: 'input-driver-plate', text: 'Digite a placa do veículo.', position: 'bottom', showNext: true },
                { target: 'input-driver-capacity', text: 'Coloque a capacidade da van (quantos lugares ela tem).', position: 'bottom', showNext: true },
                { target: 'input-driver-cnh', text: 'Número da CNH do motorista.', position: 'bottom', showNext: true },
                { target: 'input-driver-cnh-validity', text: 'E a validade da CNH para o sistema te avisar quando vencer.', position: 'bottom', showNext: true },
                { target: 'input-driver-status', text: 'Mantenha como "Ativo" para ele aparecer nas viagens.', position: 'top', showNext: true },
                { target: 'btn-save-driver', text: 'Clique em Salvar para registrar seu primeiro motorista!', position: 'top' }
            ]
        },
        {
            id: 'passenger',
            title: '2. Como criar um passageiro',
            description: 'Agora vamos cadastrar as pessoas que vão viajar.',
            icon: Icons.Users,
            locked: !completedTutorials.includes('driver'),
            steps: [
                { target: 'tut-menu-btn-passengers', text: `Ótimo! Agora que temos o motorista ${lastDriver?.name || ''}, vamos cadastrar um passageiro. Clique no ícone de Pessoas.`, position: 'right' },
                { target: 'tut-btn-global-plus', text: 'Clique no "+" para adicionar um novo passageiro.', position: 'bottom' },
                { target: 'input-passenger-name', text: 'Escreva o nome do passageiro. Ex: "Maria".', position: 'bottom', showNext: true },
                { target: 'input-passenger-phone', text: 'Coloque o WhatsApp dela.', position: 'bottom', showNext: true },
                { target: 'input-passenger-address', text: 'O endereço completo ajuda na hora de traçar a rota.', position: 'bottom', showNext: true },
                { target: 'input-passenger-neighborhood', text: 'Escolha o bairro onde ela mora.', position: 'top', showNext: true },
                { target: 'input-passenger-reference', text: 'Algum ponto de referência? (Ex: Próximo ao mercado).', position: 'bottom', showNext: true },
                { target: 'input-passenger-time', text: 'O horário padrão que ela costuma viajar.', position: 'bottom', showNext: true },
                { target: 'input-passenger-count', text: 'Quantas pessoas viajam com ela? (Geralmente 1).', position: 'bottom', showNext: true },
                { target: 'input-passenger-luggage', text: 'Ela costuma levar malas?', position: 'bottom', showNext: true },
                { target: 'input-passenger-payment', text: 'Qual a forma de pagamento preferida?', position: 'top', showNext: true },
                { target: 'input-passenger-status', text: 'Mantenha "Ativo" para que ela possa ser agendada.', position: 'top', showNext: true },
                { target: 'btn-save-passenger', text: 'Salve o passageiro para continuarmos!', position: 'top' }
            ]
        },
        {
            id: 'appointment',
            title: '3. Como criar um agendamento',
            description: 'Agende o passageiro para uma data e horário.',
            icon: Icons.Calendar,
            locked: !completedTutorials.includes('passenger'),
            steps: [
                { target: 'tut-menu-btn-appointments', text: `Lembra da ${lastPassenger?.name || 'passageira'} que você criou? Vamos agendar ela agora. Clique no Calendário.`, position: 'right' },
                { target: 'tut-btn-global-plus', text: 'Clique no "+" para criar um agendamento.', position: 'bottom' },
                { target: 'input-appointment-passengers', text: `Digite o nome "${lastPassenger?.name || ''}" aqui. O sistema vai reconhecer automaticamente!`, position: 'bottom', showNext: true },
                { target: 'input-appointment-date', text: 'Escolha o dia da viagem (pode ser hoje).', position: 'bottom', showNext: true },
                { target: 'input-appointment-time', text: 'Escolha um horário, por exemplo "08:00".', position: 'bottom', showNext: true },
                { target: 'btn-save-appointment', text: 'Salve o agendamento!', position: 'top' },
                { target: 'tut-btn-reschedule-pass', text: 'Precisa mudar o horário? Clique no reloginho para reagendar rapidamente.', position: 'bottom', showNext: true },
                { target: 'tut-btn-cancel-app', text: 'Se o passageiro desistir, você pode cancelar o agendamento aqui.', position: 'bottom', showNext: true },
                { target: 'tut-btn-copy-pass', text: 'Clique aqui para copiar os dados formatados do passageiro.', position: 'bottom', showNext: true },
                { target: 'tut-btn-wa-confirm', text: 'Use o botão do WhatsApp para confirmar os dados diretamente com o passageiro.', position: 'bottom', showNext: true },
                { target: 'tut-calendar-card', text: 'Fique de olho no calendário para ver os agendamentos dos próximos dias!', position: 'bottom', showNext: true }
            ]
        },
        {
            id: 'trip',
            title: '4. Como criar uma viagem',
            description: 'Monte a van com os passageiros agendados.',
            icon: Icons.Van,
            locked: !completedTutorials.includes('appointment'),
            steps: [
                { target: 'tut-menu-btn-trips', text: 'Agora vamos montar a van! Clique no ícone da Van.', position: 'right' },
                { target: 'tut-btn-global-plus', text: 'Clique no "+" para criar uma nova viagem.', position: 'bottom' },
                { target: 'btn-trip-madrugada', text: 'Se for uma viagem de madrugada, ative este botão para filtrar a tabela específica.', position: 'bottom', showNext: true },
                { target: 'select-trip-driver', text: `Selecione o motorista ${lastDriver?.name || ''} que você criou no início.`, position: 'bottom', showNext: true },
                { target: 'input-trip-time', text: `Coloque o horário "${lastPassenger?.time || '08:00'}" (o mesmo que você agendou para a ${lastPassenger?.name || ''}).`, position: 'bottom', showNext: true },
                { target: 'btn-generate-route', text: 'Clique em Gerar Rota para o sistema buscar quem agendou.', position: 'top' },
                { target: 'btn-trip-autofill', text: `Olha só! A ${lastPassenger?.name || ''} apareceu aqui porque o horário bateu. Clique no robô para verificar se tem mais passageiros no mesmo horario e preencher a van.`, position: 'bottom' },
                { target: 'btn-confirm-trip', text: 'Confirme a viagem para criá-la!', position: 'top' },
                { target: 'tut-btn-trip-wa', text: 'No final, use este botão para enviar a lista completa de passageiros para o motorista via WhatsApp.', position: 'top', showNext: true },
                { target: 'tut-btn-trip-edit', text: 'Você pode editar os detalhes da viagem a qualquer momento aqui.', position: 'bottom', showNext: true },
                { target: 'tut-btn-trip-del', text: 'Ou excluir a viagem se ela não for mais acontecer.', position: 'bottom', showNext: true },
                { target: 'tut-btn-trip-finish', text: 'Quando a viagem terminar, clique em Finalizar para movê-la para o histórico.', position: 'top', showNext: true }
            ]
        },
        {
            id: 'magic',
            title: '5. Como usar o cadastro mágico',
            description: 'Use IA para cadastrar rapidamente.',
            icon: Icons.Stars,
            locked: !completedTutorials.includes('trip'),
            steps: [
                { target: 'tut-menu-btn-dashboard', text: 'Por fim, vamos conhecer a Mágica. Volte para o Dashboard.', position: 'right' },
                { target: 'btn-magic-create', text: 'Clique no botão de estrelas.', position: 'bottom' },
                { target: 'textarea-magic-input', text: 'Cole um texto tipo: "José no Centro as 10h".', position: 'bottom', showNext: true },
                { target: 'btn-magic-submit', text: 'Clique em Criar Mágica.', position: 'top' },
                { target: 'btn-save-passenger', text: 'Viu como é rápido? Agora salve para terminar o treinamento!', position: 'top' }
            ]
        },
        {
            id: 'table_adv',
            title: '6. Tabela Geral (Avançado)',
            description: 'Aprenda a gerenciar a fila de motoristas e a lousa.',
            icon: Icons.List,
            locked: !completedTutorials.includes('magic'),
            steps: [
                { target: 'tut-menu-btn-table', text: 'Vamos para o módulo avançado! Clique em Tabela para ver a fila de motoristas.', position: 'right' },
                { target: 'tut-btn-add-vaga', text: 'Aqui você adiciona novas vagas na fila manualmente.', position: 'bottom', showNext: true },
                { target: 'tut-btn-clear-table', text: 'Este botão limpa toda a tabela. Use com cuidado!', position: 'bottom', showNext: true },
                { target: 'tut-btn-lock-table', text: 'O cadeado trava a tabela para evitar que você arraste motoristas por acidente.', position: 'bottom', showNext: true },
                { target: 'tut-date-nav', text: 'Navegue entre os dias para organizar a escala de amanhã ou ver o histórico.', position: 'bottom', showNext: true },
                { target: 'tut-btn-screenshot', text: 'Gere uma imagem da tabela para enviar no WhatsApp dos motoristas.', position: 'bottom', showNext: true },
                { target: 'tut-row-edit-01', text: 'Clique no lápis para editar o nome ou número da vaga deste motorista.', position: 'bottom', showNext: true },
                { target: 'tut-row-status-01', text: 'Confirme o motorista ou mova-o para a Lousa quando ele chegar.', position: 'bottom', showNext: true }
            ]
        },
        {
            id: 'lousa_adv',
            title: '7. Lousa e Confirmados (Avançado)',
            description: 'Controle a fila de saída em tempo real.',
            icon: Icons.Clipboard,
            locked: !completedTutorials.includes('table_adv'),
            steps: [
                { target: 'tut-menu-btn-table', text: 'Para gerenciar a Lousa, vamos voltar para a Tabela.', position: 'right' },
                { target: 'tut-tab-confirmados', text: 'Veja quem já confirmou presença para hoje.', position: 'bottom' },
                { target: 'tut-tab-lousa', text: 'Agora a parte mais importante: a Lousa de saída.', position: 'bottom' },
                { target: 'tut-btn-skip-time', text: 'Se uma vaga ficar vazia, use este botão para pular o horário na escala.', position: 'bottom', showNext: true },
                { target: 'tut-lousa-baixar-02', text: 'Quando a van sair, clique na seta para "Baixar" o motorista.', position: 'bottom', showNext: true },
                { target: 'tut-lousa-duplicate-02', text: 'Duplique a vaga se o motorista for fazer "dobra" (duas viagens).', position: 'bottom', showNext: true },
                { target: 'tut-lousa-riscar-02', text: 'Se o motorista desistir ou tiver problema, use o "Riscar".', position: 'bottom', showNext: true }
            ]
        },
        {
            id: 'billing_adv',
            title: '8. Financeiro e Cobrança (Avançado)',
            description: 'Gerencie pagamentos e cobranças de forma profissional.',
            icon: Icons.Dollar,
            locked: !completedTutorials.includes('lousa_adv'),
            steps: [
                { target: 'tut-menu-btn-billing', text: 'Por fim, vamos ao Financeiro. Clique no ícone de Cifrão.', position: 'right' },
                { target: 'tut-card-daily-cash', text: 'Aqui você vê o total recebido hoje por todos os operadores.', position: 'bottom', showNext: true },
                { target: 'tut-card-pending', text: 'Este é o valor total que você ainda tem para receber no mês.', position: 'bottom', showNext: true },
                { target: 'tut-billing-item', text: 'Cada viagem vira uma cobrança automática aqui.', position: 'bottom', showNext: true },
                { target: 'tut-btn-toggle-payment', text: 'Alterne entre PAGO e PENDENTE conforme receber o dinheiro.', position: 'bottom', showNext: true },
                { target: 'tut-btn-wa-billing', text: 'O motorista esqueceu de pagar? Clique aqui para cobrar no WhatsApp dele.', position: 'bottom', showNext: true },
                { target: 'tut-btn-edit-billing', text: 'Ajuste valores ou detalhes da cobrança se necessário.', position: 'bottom', showNext: true },
                { target: 'tut-btn-del-billing', text: 'Exclua a cobrança se houver algum erro no lançamento.', position: 'bottom', showNext: true }
            ]
        },
        {
            id: 'sandbox',
            title: 'Modo Sandbox Livre',
            description: 'Explore o sistema livremente sem o passo a passo.',
            icon: Icons.PlayCircle,
            steps: [] // Sem passos = modo livre
        }
    ], [completedTutorials, lastDriver, lastPassenger, lastTrip]);

    const tutorial = useMemo(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const tut = tutorials.find(t => t.id === activeTutorial);
        if (!tut) return null;

        if (isMobile && !isMobileMenuOpen) {
            const currentStepTarget = tut.steps[currentStep]?.target;
            // Se o alvo do passo atual for um botão do menu e o menu estiver fechado, injeta o passo de abrir o menu
            if (currentStepTarget?.startsWith('tut-menu-btn-')) {
                const menuStep = { 
                    target: 'tut-btn-open-menu', 
                    text: 'Clique nos 3 pontinhos para abrir o menu e navegar.', 
                    position: 'bottom' 
                };
                const steps = [...tut.steps];
                steps.splice(currentStep, 0, menuStep);
                return { ...tut, steps };
            }
        }
        
        // Se o menu estiver aberto e o passo atual for um botão do menu, garante que o balão não suma
        if (isMobile && isMobileMenuOpen) {
            const currentStepTarget = tut.steps[currentStep]?.target;
            if (currentStepTarget?.startsWith('tut-menu-btn-')) {
                // Aqui podemos ajustar algo se necessário, mas a lógica de overlay já deve lidar com o targetRect
            }
        }

        return tut;
    }, [activeTutorial, tutorials, isMobileMenuOpen, currentStep]);

    const progress = useMemo(() => {
        if (!tutorials || tutorials.length === 0) return 0;
        const total = tutorials.filter(t => t.id !== 'sandbox').length;
        return Math.min(100, Math.round((completedTutorials.length / total) * 100));
    }, [completedTutorials, tutorials]);

    // Lockdown logic: Disable elements not related to the current or previous steps
    useEffect(() => {
        if (!activeTutorial || tutorialFinished || activeTutorial === 'sandbox' || activeTutorial === 'free') {
            const allElements = document.querySelectorAll('button, input, select, textarea');
            allElements.forEach(el => {
                (el as any).disabled = false;
                (el as HTMLElement).style.pointerEvents = '';
                (el as HTMLElement).style.opacity = '';
            });
            return;
        }

        const enabledTargets = tutorial?.steps.slice(0, currentStep + 1).map(s => s.target) || [];
        const essentialIds = ['tut-btn-open-menu', 'tut-btn-global-plus', 'tut-exit-btn'];

        const updateElements = () => {
            const allElements = document.querySelectorAll('button, input, select, textarea');
            allElements.forEach(el => {
                const id = el.id;
                const tutAttr = el.getAttribute('data-tutorial');
                const isEssential = essentialIds.includes(id);
                const isTarget = enabledTargets.includes(id) || enabledTargets.includes(tutAttr);
                
                // Don't disable tutorial overlay buttons
                if (el.closest('.tutorial-overlay-content') || el.classList.contains('tut-next-btn')) {
                    return;
                }

                if (isTarget || isEssential) {
                    (el as any).disabled = false;
                    (el as HTMLElement).style.pointerEvents = 'auto';
                    (el as HTMLElement).style.opacity = '1';
                } else {
                    (el as any).disabled = true;
                    (el as HTMLElement).style.pointerEvents = 'none';
                    (el as HTMLElement).style.opacity = '0.3';
                }
            });
        };

        updateElements();
        const interval = setInterval(updateElements, 300);
        return () => clearInterval(interval);
    }, [activeTutorial, tutorial, currentStep, tutorialFinished, sandboxView, sandboxModal, isMobileMenuOpen]);

    // Auto-populate drivers_table_list if empty during table tutorials
    useEffect(() => {
        if ((activeTutorial === 'table_adv' || activeTutorial === 'lousa_adv') && 
            (!sandboxData.drivers_table_list || sandboxData.drivers_table_list.length === 0)) {
            setSandboxData((prev: any) => ({
                ...prev,
                drivers_table_list: INITIAL_SANDBOX_DATA.drivers_table_list,
                table_status: INITIAL_SANDBOX_DATA.table_status,
                lousa_order: INITIAL_SANDBOX_DATA.lousa_order,
                confirmed_times: INITIAL_SANDBOX_DATA.confirmed_times
            }));
        }
    }, [activeTutorial, sandboxData.drivers_table_list]);

    const nextTutorialId = useMemo(() => {
        const index = tutorials.findIndex(t => t.id === activeTutorial);
        if (index !== -1 && index < tutorials.length - 1) {
            return tutorials[index + 1].id;
        }
        return null;
    }, [activeTutorial, tutorials]);

    const startTutorial = (id: string) => {
        const t = tutorials.find(x => x.id === id);
        if (t?.locked) {
            notify("Você precisa completar o módulo anterior primeiro!", "error");
            return;
        }

        // Force populate sandbox data for table-related tutorials to ensure consistent state
        if (id === 'table_adv' || id === 'lousa_adv') {
            setSandboxData((prev: any) => ({
                ...prev,
                drivers_table_list: INITIAL_SANDBOX_DATA.drivers_table_list,
                table_status: INITIAL_SANDBOX_DATA.table_status,
                lousa_order: INITIAL_SANDBOX_DATA.lousa_order,
                confirmed_times: INITIAL_SANDBOX_DATA.confirmed_times
            }));
        }

        setActiveTutorial(id);
        setCurrentStep(0);
        setTutorialFinished(false);
        setSandboxView('dashboard');
        setSandboxModal(null);
        setSandboxFormData({});
        setSandboxSuggestedTrip(null);
        setSandboxAiModal(false);
        setSandboxAiInput('');
    };

    const resetTutorial = () => {
        setCompletedTutorials([]);
        setSandboxData(INITIAL_SANDBOX_DATA);
        setActiveTutorial(null);
        setSandboxView('dashboard');
        localStorage.removeItem('tutorial_progress');
        localStorage.removeItem('sandbox_data');
        setShowResetConfirm(false);
        notify("Treinamento resetado com sucesso!", "success");
    };

    const nextStep = () => {
        if (tutorial && currentStep < tutorial.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setTutorialFinished(true);
            if (activeTutorial && !completedTutorials.includes(activeTutorial)) {
                setCompletedTutorials(prev => [...prev, activeTutorial]);
            }
            notify("Módulo finalizado com sucesso!", "success");
        }
    };

    const sandboxDbOp = (type: string, node: string, payload: any) => {
        console.log('Sandbox DB Op:', type, node, payload);
        setSandboxData((prev: any) => {
            let newData = { ...prev };
            
            if (type === 'create') {
                const nextId = (prev[node] || []).reduce((max: number, item: any) => {
                    const idNum = parseInt(item.id);
                    return !isNaN(idNum) ? Math.max(max, idNum) : max;
                }, 0) + 1;
                newData[node] = [...(prev[node] || []), { ...payload, id: payload.id || nextId.toString() }];
            } else if (type === 'update') {
                if (Array.isArray(payload)) {
                    newData[node] = payload;
                } else if (payload && typeof payload === 'object' && payload.id) {
                    newData[node] = (prev[node] || []).map((item: any) => item.id === payload.id ? { ...item, ...payload } : item);
                } else {
                    newData[node] = payload;
                }
            } else if (type === 'delete') {
                newData[node] = (prev[node] || []).filter((item: any) => item.id !== payload);
            }

            // If table is cleared during tutorial, re-populate it to avoid breaking steps
            if ((activeTutorial === 'table_adv' || activeTutorial === 'lousa_adv') && 
                node === 'drivers_table_list' && (!newData[node] || newData[node].length === 0)) {
                newData.drivers_table_list = INITIAL_SANDBOX_DATA.drivers_table_list;
                newData.table_status = INITIAL_SANDBOX_DATA.table_status;
                newData.lousa_order = INITIAL_SANDBOX_DATA.lousa_order;
                newData.confirmed_times = INITIAL_SANDBOX_DATA.confirmed_times;
                notify("Tabela restaurada para o tutorial", "info");
            }

            return newData;
        });
    };

    const sandboxBillingData = useMemo(() => {
        const trips = sandboxData.trips || [];
        const month = sandboxBillingDate.getMonth();
        const year = sandboxBillingDate.getFullYear();
        
        const filtered = trips.filter((t: any) => {
            if (!t.date) return false;
            const d = new Date(t.date + 'T12:00:00');
            return d.getMonth() === month && d.getFullYear() === year;
        });

        const groups: any = {};
        let pending = 0;
        let paid = 0;

        filtered.forEach((t: any) => {
            let val = Number(t.value) || 0;
            const isPaid = t.paymentStatus === 'Pago';
            if (isPaid) paid += val;
            else pending += val;

            if (!groups[t.date]) groups[t.date] = { date: t.date, totalValue: 0, trips: [] };
            groups[t.date].totalValue += val;
            groups[t.date].trips.push({ ...t, value: val, isPaid });
        });

        return {
            summary: { pending, paid },
            groups: Object.values(groups).sort((a: any, b: any) => b.date.localeCompare(a.date))
        };
    }, [sandboxData.trips, sandboxBillingDate]);

    const sandboxSave = (col: string) => {
        const currentTarget = tutorial?.steps[currentStep]?.target;
        const isSaveAction = currentTarget?.includes('save') || currentTarget?.includes('confirm') || currentTarget?.includes('submit');

        if (col === 'blockPassenger') {
            sandboxDbOp('update', 'passengers', { id: sandboxFormData.id, status: 'Bloqueado', blockReason: sandboxFormData.blockReason });
        } else if (col === 'reschedule') {
            sandboxDbOp('update', 'passengers', { id: sandboxFormData.id, date: sandboxFormData.date, time: sandboxFormData.time });
        } else if (col === 'rescheduleAll') {
            const sourceTime = sandboxFormData.sourceTime;
            const newTime = sandboxFormData.newTime;
            sandboxData.passengers.forEach((p: any) => {
                if (p.time === sourceTime) {
                    sandboxDbOp('update', 'passengers', { id: p.id, time: newTime });
                }
            });
        } else if (col === 'appointments') {
            if (sandboxFormData.passengerInput) {
                const identifiers = sandboxFormData.passengerInput.split(',').map((s: string) => s.trim()).filter(Boolean);
                let foundAny = false;
                identifiers.forEach((idOrName: string) => {
                    const p = sandboxData.passengers.find((p: any) => 
                        String(p.id) === idOrName || 
                        p.name.toLowerCase() === idOrName.toLowerCase()
                    );
                    if (p) {
                        foundAny = true;
                        sandboxDbOp('update', 'passengers', {
                            id: p.id,
                            date: sandboxFormData.date || getTodayDate(),
                            time: sandboxFormData.time,
                            source: p.source === 'Site' ? 'Manual' : p.source
                        });
                    }
                });
                if (!foundAny && !isSaveAction) {
                    notify("Nenhum passageiro encontrado com este nome/ID.", "error");
                    return;
                }
            }
        } else {
            sandboxDbOp(sandboxFormData.id ? 'update' : 'create', col, sandboxFormData);
        }
        
        setSandboxModal(null);
        setSandboxFormData({});

        if (isSaveAction) {
            nextStep();
        }
    };

    const sandboxOpenEditTrip = (t: any) => {
        let dr = sandboxData.drivers.find((d: any) => d.id === t.driverId);
        if (!dr && t.driverName) {
            dr = sandboxData.drivers.find((d: any) => d.name.toLowerCase().trim() === t.driverName.toLowerCase().trim());
        }

        let pax = [];
        let occ = 0;

        if (t.passengersSnapshot && t.passengersSnapshot.length > 0) {
            pax = t.passengersSnapshot;
            occ = pax.reduce((a: any, b: any) => a + parseInt(b.passengerCount || 1), 0);
        } else if (t.passengerIds && t.passengerIds.length > 0) {
            pax = sandboxData.passengers.filter((p: any) => (t.passengerIds || []).includes(p.id));
            occ = pax.reduce((a: any, b: any) => a + parseInt(b.passengerCount || 1), 0);
        }

        setSandboxFormData({
            driverId: dr ? dr.id : t.driverId,
            driverName: t.driverName,
            time: t.time,
            date: t.date,
            isMadrugada: !!t.isMadrugada
        });

        setSandboxEditingTripId(t.id);
        setSandboxSuggestedTrip({
            driver: dr || { name: t.driverName || 'Desconhecido', capacity: 0 },
            time: t.time,
            passengers: pax,
            occupancy: occ,
            date: t.date
        });
        setSandboxModal('trip');
    };

    const sandboxSimulate = () => {
        const dr = sandboxData.drivers.find(d => d.id === sandboxFormData.driverId) || sandboxData.drivers[0];
        const tripDate = sandboxFormData.date || getTodayDate();
        const tripTime = sandboxFormData.time || '08:00';

        const occupiedPass = new Set();
        sandboxData.trips.forEach((t: any) => {
            if (t.date === tripDate && t.status !== 'Cancelada' && t.time === tripTime) {
                (t.passengerIds || []).forEach((pid: any) => occupiedPass.add(String(pid)));
            }
        });

        const passengers = sandboxData.passengers.filter(p => 
            p.status === 'Ativo' && 
            p.date === tripDate && 
            p.time === tripTime &&
            !occupiedPass.has(String(p.id))
        );
        const occupancy = passengers.reduce((acc, p) => acc + (p.passengerCount || 1), 0);
        
        setSandboxSuggestedTrip({
            driver: dr,
            driverId: dr.id,
            driverName: dr.name,
            time: tripTime,
            passengers: passengers,
            passengersSnapshot: passengers,
            passengerIds: passengers.map(p => p.id),
            occupancy: occupancy,
            pCount: occupancy,
            totalValue: occupancy * 25,
            status: 'Ativo',
            date: tripDate
        });
        if (tutorial?.steps[currentStep]?.target === 'btn-generate-route') nextStep();
    };

    const sandboxConfirmTrip = () => {
        const op = sandboxEditingTripId ? 'update' : 'create';
        sandboxDbOp(op, 'trips', { ...sandboxSuggestedTrip, id: sandboxEditingTripId || undefined });
        setSandboxSuggestedTrip(null);
        setSandboxEditingTripId(null);
        setSandboxModal(null);
        if (tutorial?.steps[currentStep]?.target === 'btn-confirm-trip') nextStep();
    };

    const sandboxAutoFill = () => {
        if (tutorial?.steps[currentStep]?.target === 'btn-trip-autofill') nextStep();
    };

    const sandboxHandleSmartCreate = () => {
        const mockResult = {
            name: 'Passageiro Teste',
            neighborhood: 'Boqueirão',
            address: 'Rua de Teste, 123',
            phone: '13999999999',
            passengerCount: 1,
            time: '10:00',
            payment: 'Pix',
            status: 'Ativo',
            date: getTodayDate()
        };
        setSandboxFormData(mockResult);
        setSandboxAiModal(false);
        setSandboxModal('passenger');
        if (tutorial?.steps[currentStep]?.target === 'btn-magic-submit') nextStep();
    };

    if (activeTutorial) {
        const step = tutorial?.steps[currentStep];
        
        return (
            <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
                {/* Tutorial Header */}
                <div className="h-16 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 shrink-0 relative z-30">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button 
                            id="tut-btn-open-menu"
                            onClick={() => {
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                                // Removido nextStep() para evitar pular o passo original após abrir o menu
                            }}
                            className="md:hidden p-2 bg-white/5 rounded-lg text-white/60 shrink-0"
                        >
                            <Icons.MoreVertical size={20} />
                        </button>
                        <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg shrink-0">
                            {tutorial ? <tutorial.icon size={20} /> : <Icons.PlayCircle size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="font-bold text-sm truncate">{tutorial ? tutorial.title : 'Sandbox Livre'}</h2>
                            <p className="text-[10px] opacity-50">
                                {tutorial && tutorial.steps.length > 0 
                                    ? `Passo ${currentStep + 1} de ${tutorial.steps.length}` 
                                    : 'Modo de exploração livre'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Sandbox Global Plus Button (Top Right) */}
                        <button 
                            id="tut-btn-global-plus"
                            onClick={() => {
                                if (sandboxView === 'passengers') {
                                    setSandboxModal('passenger');
                                    setSandboxFormData({ status: 'Ativo', payment: 'Dinheiro', passengerCount: 1, date: getTodayDate() });
                                } else if (sandboxView === 'trips') {
                                    setSandboxModal('trip');
                                } else if (sandboxView === 'appointments') {
                                    setSandboxModal('appointment');
                                    setSandboxFormData({ date: getTodayDate() });
                                } else if (sandboxView === 'drivers') {
                                    setSandboxModal('driver');
                                    setSandboxFormData({ status: 'Ativo', capacity: 15 });
                                }
                                if (step?.target === 'tut-btn-global-plus') nextStep();
                            }}
                            className={`${theme.primary} p-2.5 rounded-xl shadow-lg active:scale-95 transition-transform`}
                        >
                            <Icons.Plus size={20}/>
                        </button>

                        <button 
                            id="tut-exit-btn"
                            onClick={() => setActiveTutorial(null)} 
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors shrink-0"
                        >
                            Sair do Tutorial
                        </button>
                    </div>
                </div>

                {/* Sandbox Area */}
                <div className="flex-1 flex overflow-hidden bg-slate-900 relative">
                    {/* Sandbox Sidebar Backdrop (Mobile) */}
                    {isMobileMenuOpen && (
                        <div 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}

                    {/* Sandbox Sidebar */}
                    <div className={`
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
                        fixed md:relative top-0 bottom-0 left-0 w-64 ${theme.card} border-r border-white/10 
                        flex flex-col shrink-0 z-[10002] md:z-40 transition-transform duration-300 h-full
                    `}>
                        <div className="p-6 border-b border-white/10 overflow-hidden flex items-center justify-between">
                            <div className="font-black text-xl tracking-tighter whitespace-nowrap">
                                BORA DE VAN <span className="text-[10px] opacity-40">SANDBOX</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-white/60">
                                <Icons.X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {[
                                { id: 'dashboard', l: 'Dashboard', i: Icons.Home },
                                { id: 'drivers', l: 'Motoristas', i: Icons.Van },
                                { id: 'passengers', l: 'Passageiros', i: Icons.Users },
                                { id: 'trips', l: 'Viagens', i: Icons.Van },
                                { id: 'appointments', l: 'Agendamentos', i: Icons.Calendar },
                                { id: 'table', l: 'Tabela', i: Icons.List },
                                { id: 'billing', l: 'Financeiro', i: Icons.Dollar },
                            ].map(item => (
                                <button 
                                    key={item.id}
                                    id={`tut-menu-btn-${item.id}`}
                                    onClick={() => {
                                        setSandboxView(item.id);
                                        setIsMobileMenuOpen(false);
                                        if (activeTutorial && !tutorialFinished && step?.target === `tut-menu-btn-${item.id}`) {
                                            nextStep();
                                        }
                                    }}
                                    disabled={activeTutorial && activeTutorial !== 'sandbox' && activeTutorial !== 'free' && !tutorialFinished && step?.target !== `tut-menu-btn-${item.id}`}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${sandboxView === item.id ? theme.primary : 'hover:bg-white/5 opacity-70 hover:opacity-100'} ${activeTutorial && activeTutorial !== 'sandbox' && activeTutorial !== 'free' && !tutorialFinished && step?.target !== `tut-menu-btn-${item.id}` ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    title={item.l}
                                >
                                    <item.i size={20}/>
                                    <span className="font-bold text-sm">{item.l}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <div className="absolute inset-0 overflow-y-auto p-4 md:p-8">
                            <div className="max-w-6xl mx-auto pb-20">
                                {sandboxView === 'dashboard' && (
                                    <Dashboard 
                                        data={sandboxData} 
                                        theme={theme} 
                                        setView={setSandboxView} 
                                        onOpenModal={(t: string) => {
                                            if (t === 'newPass') {
                                                setSandboxModal('passenger');
                                                setSandboxFormData({ status: 'Ativo', payment: 'Dinheiro', passengerCount: 1, date: getTodayDate() });
                                                if (tutorial?.steps[currentStep]?.target === 'btn-new-passenger') nextStep();
                                            } else if (t === 'newTrip') {
                                                setSandboxModal('trip');
                                                if (tutorial?.steps[currentStep]?.target === 'btn-new-trip') nextStep();
                                            }
                                        }} 
                                        dbOp={sandboxDbOp} 
                                        setAiModal={(val: boolean) => {
                                            setSandboxAiModal(val);
                                            if (val && tutorial?.steps[currentStep]?.target === 'btn-magic-create') nextStep();
                                        }} 
                                        user={{ username: 'Aluno' }} 
                                        systemContext={systemContext} 
                                        notify={() => {}} 
                                    />
                                )}
                                {sandboxView === 'drivers' && (
                                    <Motoristas 
                                        data={sandboxData} 
                                        theme={theme} 
                                        searchTerm="" 
                                        setFormData={setSandboxFormData} 
                                        setModal={setSandboxModal} 
                                        del={(node: string, id: string) => sandboxDbOp('delete', node, id)} 
                                        notify={(msg: string, type: string) => notify(msg, type)} 
                                    />
                                )}
                                {sandboxView === 'passengers' && (
                                    <Passageiros 
                                        data={sandboxData} 
                                        theme={theme} 
                                        searchTerm="" 
                                        setSearchTerm={() => {}} 
                                        setFormData={setSandboxFormData} 
                                        setModal={setSandboxModal} 
                                        del={(node: string, id: string) => sandboxDbOp('delete', node, id)} 
                                        notify={(msg: string, type: string) => notify(msg, type)} 
                                        systemContext={systemContext} 
                                        dbOp={sandboxDbOp} 
                                    />
                                )}
                                {sandboxView === 'trips' && (
                                    <Viagens 
                                        data={sandboxData} 
                                        theme={theme} 
                                        setModal={setSandboxModal} 
                                        setFormData={setSandboxFormData} 
                                        openEditTrip={sandboxOpenEditTrip}
                                        dbOp={sandboxDbOp} 
                                        updateTripStatus={(id: string, status: string) => sandboxDbOp('update', 'trips', { id, status })}
                                        del={(node: string, id: string) => sandboxDbOp('delete', node, id)}
                                        notify={(msg: string, type: string) => notify(msg, type)} 
                                        systemContext={systemContext}
                                        isTutorialActive={activeTutorial !== 'sandbox'}
                                    />
                                )}
                                {sandboxView === 'appointments' && (
                                    <Agendamentos 
                                        data={sandboxData} 
                                        theme={theme} 
                                        setFormData={setSandboxFormData} 
                                        setModal={setSandboxModal} 
                                        dbOp={sandboxDbOp} 
                                        setSuggestedTrip={setSandboxSuggestedTrip} 
                                        setEditingTripId={setSandboxEditingTripId} 
                                        notify={(msg: string, type: string) => notify(msg, type)} 
                                        requestConfirm={(title: string, msg: string, onConfirm: any) => {
                                            // No sandbox, confirmação automática para agilizar
                                            onConfirm();
                                        }} 
                                        systemContext={systemContext} 
                                        isTutorialActive={activeTutorial !== 'sandbox'}
                                    />
                                )}
                                {sandboxView === 'table' && (
                                    <Tabela 
                                        data={sandboxData}
                                        theme={theme}
                                        tableTab={sandboxTableTab}
                                        setTableTab={setSandboxTableTab}
                                        mipDayType={sandboxMipDayType}
                                        setMipDayType={setSandboxMipDayType}
                                        currentOpDate={getTodayDate()}
                                        getTodayDate={getTodayDate}
                                        analysisDate={sandboxAnalysisDate}
                                        setAnalysisDate={setSandboxAnalysisDate}
                                        analysisRotatedList={sandboxData.drivers_table_list || []}
                                        currentRotatedList={sandboxData.drivers_table_list || []}
                                        tableStatus={sandboxData.table_status || {}}
                                        confirmedTimes={sandboxData.confirmed_times || {}}
                                        lousaOrder={sandboxData.lousa_order || []}
                                        spList={sandboxData.drivers_table_list || []}
                                        setSpList={(newList: any) => setSandboxData((prev: any) => ({ ...prev, drivers_table_list: newList }))}
                                        editName={sandboxEditName}
                                        setEditName={setSandboxEditName}
                                        tempName={sandboxTempName}
                                        setTempName={setSandboxTempName}
                                        tempVaga={sandboxTempVaga}
                                        setTempVaga={setSandboxTempVaga}
                                        saveDriverName={(vaga: string) => {
                                            const newList = sandboxData.drivers_table_list.map((d: any) => 
                                                d.vaga === vaga ? { ...d, name: sandboxTempName, vaga: sandboxTempVaga } : d
                                            );
                                            setSandboxData((prev: any) => ({ ...prev, drivers_table_list: newList }));
                                            setSandboxEditName(null);
                                        }}
                                        updateTableStatus={(vaga: string, status: string) => {
                                            setSandboxData((prev: any) => {
                                                const newStatus = { ...prev.table_status, [vaga]: status };
                                                const newConfirmedTimes = { ...prev.confirmed_times || {} };
                                                if (status === 'confirmed') {
                                                    const now = new Date();
                                                    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
                                                    newConfirmedTimes[vaga] = formatTime(timeStr);
                                                }
                                                return { ...prev, table_status: newStatus, confirmed_times: newConfirmedTimes };
                                            });
                                        }}
                                        handleLousaAction={(uid: string, action: string, vaga: string) => {
                                            if (action === 'remove') {
                                                setSandboxData((prev: any) => ({
                                                    ...prev,
                                                    lousa_order: prev.lousa_order.filter((i: any) => i.uid !== uid)
                                                }));
                                            } else if (action === 'baixou') {
                                                setSandboxData((prev: any) => ({
                                                    ...prev,
                                                    lousa_order: prev.lousa_order.map((i: any) => i.uid === uid ? { ...i, baixou: true } : i)
                                                }));
                                            } else if (action === 'riscar') {
                                                setSandboxData((prev: any) => ({
                                                    ...prev,
                                                    lousa_order: prev.lousa_order.map((i: any) => i.uid === uid ? { ...i, riscado: true } : i)
                                                }));
                                            } else if (action === 'duplicate') {
                                                setSandboxData((prev: any) => ({
                                                    ...prev,
                                                    lousa_order: [...prev.lousa_order, { ...prev.lousa_order.find((i:any)=>i.uid===uid), uid: `dup-${Date.now()}` }]
                                                }));
                                            }
                                        }}
                                        addNullLousaItem={() => {
                                            setSandboxData((prev: any) => ({
                                                ...prev,
                                                lousa_order: [...prev.lousa_order, { uid: `null-${Date.now()}`, isNull: true }]
                                            }));
                                        }}
                                        startLousaTime={new Date()}
                                        dbOp={sandboxDbOp}
                                        notify={notify}
                                        systemContext={systemContext}
                                        isTutorialActive={activeTutorial !== 'sandbox'}
                                    />
                                )}
                                {sandboxView === 'billing' && (
                                    <Financeiro 
                                        data={sandboxData}
                                        theme={theme}
                                        billingData={sandboxBillingData}
                                        billingDate={sandboxBillingDate}
                                        prevBillingMonth={() => setSandboxBillingDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        nextBillingMonth={() => setSandboxBillingDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        togglePaymentStatus={(id: string) => {
                                            const trip = sandboxData.trips.find((t: any) => t.id === id);
                                            if (trip) {
                                                sandboxDbOp('update', 'trips', { 
                                                    id, 
                                                    paymentStatus: trip.paymentStatus === 'Pago' ? 'Pendente' : 'Pago',
                                                    receivedBy: trip.paymentStatus === 'Pago' ? null : 'Aluno',
                                                    receivedAt: trip.paymentStatus === 'Pago' ? null : getTodayDate()
                                                });
                                            }
                                        }}
                                        sendBillingMessage={() => notify('Simulação: Mensagem enviada!', 'success')}
                                        del={(node: string, id: string) => sandboxDbOp('delete', node, id)}
                                        setFormData={setSandboxFormData}
                                        setModal={setSandboxModal}
                                        openEditTrip={sandboxOpenEditTrip}
                                        user={{ username: 'Aluno' }}
                                        notify={notify}
                                        systemContext={systemContext}
                                        spList={sandboxData.drivers_table_list || []}
                                        pranchetaData={[]}
                                        isTutorialActive={activeTutorial !== 'sandbox'}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sandbox Modals */}
                    <div className={activeTutorial ? 'pointer-events-auto' : 'pointer-events-none'}>
                        <GlobalModals 
                            modal={sandboxModal} setModal={setSandboxModal}
                            aiModal={sandboxAiModal} setAiModal={setSandboxAiModal}
                            aiInput={sandboxAiInput} setAiInput={setSandboxAiInput}
                            theme={theme} themeKey="dark"
                            formData={sandboxFormData} setFormData={setSandboxFormData}
                            suggestedTrip={sandboxSuggestedTrip} setSuggestedTrip={setSandboxSuggestedTrip}
                            save={sandboxSave} simulate={sandboxSimulate} confirmTrip={sandboxConfirmTrip}
                            autoFill={sandboxAutoFill}
                            handleSmartCreate={sandboxHandleSmartCreate}
                            data={sandboxData} spList={[]} madrugadaList={[]}
                            systemContext={systemContext}
                            aiPassengerQueue={[]} aiPassengerIndex={0}
                        />
                    </div>
                </div>

                {/* Interactive Elements Overlay - Moved to root for better screen coverage */}
                <div className="fixed inset-0 z-[50000] pointer-events-none">
                    {!tutorialFinished && step && (
                        <TutorialOverlay 
                            step={step} 
                            theme={theme} 
                            currentStep={currentStep}
                            totalSteps={tutorial?.steps.length || 0}
                            onAction={(action: string) => {
                                if (action === 'next') nextStep();
                                else if (action === 'close') setActiveTutorial(null);
                            }}
                        />
                    )}
                    {tutorialFinished && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto z-[20000] p-4">
                            <div className="bg-slate-900 border border-white/10 p-8 rounded-[40px] shadow-2xl max-w-sm text-center animate-bounce-in relative overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-500/10 blur-3xl rounded-full"></div>
                                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/10">
                                    <Icons.Check size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Parabéns!</h3>
                                <p className="text-slate-400 mb-8 font-medium leading-relaxed">Você completou o módulo <span className="text-white font-bold">{tutorial?.title}</span>. O que deseja fazer agora?</p>
                                <div className="flex flex-col gap-3 relative z-10">
                                    {nextTutorialId && (
                                        <button 
                                            onClick={() => startTutorial(nextTutorialId)}
                                            className={`${theme.primary} w-full py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-white`}
                                        >
                                            Ir para o Próximo Módulo
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setTutorialFinished(false);
                                            setActiveTutorial('sandbox');
                                        }}
                                        className="w-full py-4 bg-white/5 text-white rounded-2xl font-black hover:bg-white/10 transition-all border border-white/5"
                                    >
                                        Explorar Sozinho (Sandbox)
                                    </button>
                                    <button 
                                        onClick={() => setActiveTutorial(null)}
                                        className="w-full py-4 bg-transparent text-slate-500 rounded-2xl font-bold hover:text-slate-300 transition-all"
                                    >
                                        Sair do Tutorial
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-black">Central de Treinamento</h2>
                    <p className="text-sm opacity-60">Aprenda a usar o sistema em um ambiente seguro que não afeta seus dados reais.</p>
                </div>
                <div className="flex items-center gap-2">
                    {showResetConfirm ? (
                        <div className="flex items-center gap-2 animate-bounce-in">
                            <button 
                                onClick={resetTutorial}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sim, Resetar Tudo
                            </button>
                            <button 
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                            <Icons.Trash size={14} />
                            Resetar Treinamento
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Seu Progresso</span>
                    <span className="text-[10px] font-bold text-amber-500">{progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-500 transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutorials.map((t) => (
                    <div 
                        key={t.id} 
                        className={`${theme.card} border ${t.locked ? 'border-white/5 opacity-50' : theme.border} p-6 rounded-2xl flex flex-col gap-4 hover:border-amber-500/50 transition-colors group relative overflow-hidden`}
                    >
                        {t.locked && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <div className="bg-slate-800 p-2 rounded-full shadow-xl">
                                    <Icons.Lock size={20} className="text-white/40" />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-start justify-between">
                            <div className={`p-3 ${completedTutorials.includes(t.id) ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'} rounded-xl group-hover:scale-110 transition-transform`}>
                                <t.icon size={24} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">{t.steps.length} Passos</span>
                                {completedTutorials.includes(t.id) && (
                                    <span className="text-[10px] font-bold text-green-500 flex items-center gap-1 mt-1">
                                        <Icons.Check size={10} /> Concluído
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">{t.title}</h3>
                            <p className="text-xs opacity-50 leading-relaxed">{t.description}</p>
                        </div>
                        <Button 
                            theme={theme} 
                            onClick={() => startTutorial(t.id)} 
                            className="mt-2" 
                            variant={completedTutorials.includes(t.id) ? "secondary" : "primary"}
                            disabled={t.locked}
                        >
                            {completedTutorials.includes(t.id) ? "Refazer Tutorial" : "Iniciar Tutorial"}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                    <Icons.HelpCircle size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-blue-300">Ambiente Seguro</h4>
                    <p className="text-xs text-blue-200/60">Tudo o que você fizer dentro dos tutoriais é apenas para teste. Nada será salvo no seu banco de dados real.</p>
                </div>
            </div>
        </div>
    );
}

function TutorialOverlay({ step, theme, onAction, currentStep, totalSteps }: any) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(timer);
    }, [step.target]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const lastTargetRef = useRef<string | null>(null);

    useEffect(() => {
        const checkAndScroll = () => {
            const el = document.getElementById(step.target) || document.querySelector(`[data-tutorial="${step.target}"]`);
            if (el && lastTargetRef.current !== step.target) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                lastTargetRef.current = step.target;
            }
        };

        const interval = setInterval(checkAndScroll, 500);
        return () => clearInterval(interval);
    }, [step.target]);

    useEffect(() => {
        setTargetRect(null); // Reset on step change
        let rafId: number;
        let timeoutId: NodeJS.Timeout;
        
        const updateRect = () => {
            let el = document.getElementById(step.target) as HTMLElement | null;
            if (!el) {
                el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement | null;
            }

            if (el) {
                let targetEl = el;
                const isMobile = window.innerWidth < 640;
                
                // Heurística para incluir o Label se for um campo de formulário
                if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
                    const parent = el.parentElement;
                    const grandParent = parent?.parentElement;
                    
                    // Estrutura do Shared.tsx: div.flex-col > (label + div.relative > input)
                    if (grandParent && grandParent.querySelector('label')) {
                        // No mobile, somos mais criteriosos com a altura para não pegar o container errado
                        if (grandParent.offsetHeight < (isMobile ? 120 : 180)) {
                            targetEl = grandParent;
                        }
                    } else if (parent && parent.querySelector('label')) {
                        if (parent.offsetHeight < (isMobile ? 120 : 180)) {
                            targetEl = parent;
                        }
                    }
                }

                const rect = targetEl.getBoundingClientRect();
                
                setTargetRect(prev => {
                    if (!prev || 
                        Math.abs(prev.top - rect.top) > 0.5 || 
                        Math.abs(prev.left - rect.left) > 0.5 || 
                        Math.abs(prev.width - rect.width) > 0.5 || 
                        Math.abs(prev.height - rect.height) > 0.5) {
                        return rect;
                    }
                    return prev;
                });
            }
            rafId = requestAnimationFrame(updateRect);
        };

        // Pequeno delay para garantir que o DOM esteja pronto
        timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(updateRect);
            window.addEventListener('scroll', updateRect, true);
            window.addEventListener('resize', updateRect);
        }, 300);
        
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timeoutId);
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [step.target]);

    if (!targetRect || (targetRect.top === 0 && targetRect.left === 0 && targetRect.width === 0)) {
        return null;
    }

    // Mobile Balloon Positioning
    const getBalloonStyle = () => {
        if (isMobile) {
            // Se o alvo estiver dentro do menu lateral (que tem z-50), o balão deve ficar em uma posição que não atrapalhe
            const isTargetInSidebar = step.target.startsWith('tut-menu-btn-');
            
            if (isTargetInSidebar) {
                return {
                    top: 'auto',
                    bottom: 20,
                    left: 10,
                    right: 10,
                    width: 'calc(100vw - 20px)',
                    maxHeight: '30vh',
                    zIndex: 50002 
                };
            }

            // On mobile, if target is too high, put balloon at bottom. If too low, put at top.
            const targetCenterY = targetRect.top + targetRect.height / 2;
            const isTargetInUpperHalf = targetCenterY < window.innerHeight / 2;
            
            return {
                top: isTargetInUpperHalf ? 'auto' : 80, // Stay below header
                bottom: isTargetInUpperHalf ? 20 : 'auto',
                left: 10,
                right: 10,
                width: 'calc(100vw - 20px)',
                maxHeight: '40vh',
                overflowY: 'hidden' as const,
                zIndex: 50002
            };
        }

        return {
            top: step.position === 'bottom' ? Math.max(80, targetRect.bottom + 20) : (step.position === 'top' ? 'auto' : Math.max(80, targetRect.top + (targetRect.height / 2) - 60)),
            bottom: step.position === 'top' ? Math.max(10, window.innerHeight - targetRect.top + 20) : 'auto',
            left: step.position === 'right' ? targetRect.right + 20 : (step.position === 'left' ? 'auto' : Math.max(10, Math.min(window.innerWidth - 290, targetRect.left + (targetRect.width / 2) - 140))),
            right: step.position === 'left' ? (window.innerWidth - targetRect.left) + 20 : 'auto',
            width: 'min(280px, calc(100vw - 20px))',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'hidden' as const
        };
    };

    const balloonStyle = getBalloonStyle();

    return (
        <div className="absolute inset-0 z-[50000] pointer-events-none overflow-hidden">
            {/* Spotlight & Dashed Border around target */}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                    scale: 1, 
                    opacity: 1,
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                className="absolute border-[3px] border-dashed border-amber-400 rounded-xl pointer-events-none z-[50001] shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                style={{
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
                    willChange: 'top, left, width, height'
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-amber-500/30 rounded-full animate-ping"></div>
                </div>
            </motion.div>

            {/* Balloon */}
            <AnimatePresence mode="wait">
                {showContent && (
                    <motion.div 
                        key={step.target}
                        layout
                        initial={{ y: 10, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: 0.95 }}
                        className="absolute z-[50002] pointer-events-auto tutorial-overlay-content"
                        style={balloonStyle}
                    >
                        <div className="bg-slate-900/90 backdrop-blur-xl text-white p-6 rounded-[32px] shadow-2xl relative border border-white/10 overflow-hidden w-full max-w-[320px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                            
                            {/* Balloon Header */}
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center shadow-inner">
                                        <Icons.HelpCircle size={16} className="text-amber-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-0.5">
                                            Assistente
                                        </span>
                                        <span className="text-[11px] font-bold text-white/90 leading-none">
                                            Bora de Van
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2.5 py-1 bg-white/5 rounded-full text-[10px] font-black text-amber-500 border border-white/5">
                                        {currentStep + 1} <span className="opacity-30 mx-0.5">/</span> {totalSteps}
                                    </div>
                                    <button onClick={() => onAction('close')} className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                                        <Icons.X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Arrow (Desktop only) */}
                            {!isMobile && (
                                <>
                                    {step.position === 'bottom' && <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-slate-900/90 rotate-45 border-t border-l border-white/10"></div>}
                                    {step.position === 'top' && <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-slate-900/90 rotate-45 border-b border-r border-white/10"></div>}
                                    {step.position === 'right' && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900/90 rotate-45 border-b border-l border-white/10"></div>}
                                    {step.position === 'left' && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900/90 rotate-45 border-t border-r border-white/10"></div>}
                                </>
                            )}
                            
                            <div className="relative z-10">
                                <p className="text-sm font-medium leading-relaxed mb-5 text-slate-200">
                                    {step.text}
                                </p>
                                
                                {/* Progress Bar */}
                                <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                        className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                    />
                                </div>

                                {step.showNext && (
                                    <button 
                                        onClick={() => onAction('next')}
                                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-400 group"
                                    >
                                        Próximo Passo
                                        <Icons.ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
