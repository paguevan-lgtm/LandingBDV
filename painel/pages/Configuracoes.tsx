
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { Icons, Input, Button, IconButton } from '../components/Shared';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { EditExpirationModal } from '../components/EditExpirationModal';
import { THEMES } from '../constants';
import { getAvatarUrl, generateUniqueId, getTodayDate, compressImage, parseUserAgent } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../components/SubscriptionLock';
import { db } from '../firebase';

export default function Configuracoes({ user, theme, restartTour, setAiModal, geminiKey, saveApiKey, ipToBlock, setIpToBlock, blockIp, data, del, ipHistory, ipLabels, saveIpLabel, deviceLabels, saveDeviceLabel, changeTheme, themeKey, dbOp, notify, showAlert, requestConfirm, setView, daysRemaining, isNearExpiration, systemContext, isRecurringActive, pranchetaValue, setPranchetaValue, soundEnabled, setSoundEnabled, popupsEnabled, setPopupsEnabled, siteNotificationsEnabled, setSiteNotificationsEnabled }: any) {
    const { logout } = useAuth();
    const { triggerEarlyRenewal } = useSubscription();
    
    const isAdmin = user.role === 'admin';
    const isSuperAdmin = user.username === 'Breno';

    // States for Newsletter
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [newsImage, setNewsImage] = useState<string|null>(null);
    const [targetSystems, setTargetSystems] = useState<string[]>(['Pg', 'Mip', 'Sv']);
    const [editExpModal, setEditExpModal] = useState<{isOpen: boolean, system: string, currentExpiration: string | null}>({
        isOpen: false,
        system: '',
        currentExpiration: null
    });
    const [securityTab, setSecurityTab] = useState('timeline'); // timeline | blocked
    const [financeiroTab, setFinanceiroTab] = useState('cobranca'); // cobranca | pix
    const [activeTab, setActiveTab] = useState('geral');
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [trustedDevices, setTrustedDevices] = useState<any>({});
    
    // History States
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [historyDate, setHistoryDate] = useState(getTodayDate());
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [expandedSessions, setExpandedSessions] = useState<string[]>([]);

    const importInputRef = useRef<HTMLInputElement>(null);
    const newsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [importStatus, setImportStatus] = useState<any>({
        isOpen: false,
        isMinimized: false,
        currentCollection: '',
        currentItem: '',
        added: 0,
        skipped: 0,
        total: 0,
        logs: []
    });

    const [requireLocationOnLogin, setRequireLocationOnLogin] = useState(false);
    const [viewedMonth, setViewedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyMetrics, setMonthlyMetrics] = useState<any>(null);

    // Generate month options
    const monthOptions = useMemo(() => {
        const options = [];
        const d = new Date();
        for (let i = 0; i < 6; i++) {
            const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
            options.push(m.toISOString().slice(0, 7));
        }
        return options;
    }, []);

    // Fetch Monthly Metrics
    useEffect(() => {
        if (!isSuperAdmin || !db) return;
        const ref = db.ref(`api_metrics_v3/${viewedMonth}`);
        const handleValue = (snap: any) => {
             setMonthlyMetrics(snap.val() || null);
        };
        ref.on('value', handleValue);
        return () => ref.off('value', handleValue);
    }, [isSuperAdmin, viewedMonth]);






    // Fetch requireLocationOnLogin
    useEffect(() => {
        if (!isSuperAdmin || !db) return;
        const ref = db.ref('system_settings/requireLocationOnLogin');
        ref.on('value', (snap:any) => {
            setRequireLocationOnLogin(!!snap.val());
        });
        return () => ref.off();
    }, [isSuperAdmin]);

    // Fetch Trusted Devices
    useEffect(() => {
        if (!isSuperAdmin || !db) return;
        
        const ref = db.ref('trusted_devices');
        ref.on('value', (snap:any) => {
            setTrustedDevices(snap.val() || {});
        });
        return () => ref.off();
    }, [isSuperAdmin]);

    const toggleTrustDevice = (deviceId: string, info: any) => {
        if (!deviceId || !db) return;
        const isCurrentlyTrusted = trustedDevices[deviceId];
        const action = isCurrentlyTrusted ? 'Remover Confiança?' : 'Marcar como Seguro?';
        const msg = isCurrentlyTrusted ? 'Este dispositivo voltará a ser exibido como desconhecido.' : 'Este dispositivo será destacado como seguro na timeline.';
        
        requestConfirm(action, msg, () => {
            if (isCurrentlyTrusted) {
                db.ref(`trusted_devices/${deviceId}`).remove();
            } else {
                db.ref(`trusted_devices/${deviceId}`).set({
                    trustedAt: Date.now(),
                    trustedBy: user.username,
                    info: info || {}
                });
            }
            notify(isCurrentlyTrusted ? "Confiança removida" : "Dispositivo marcado como seguro", "success");
        });
    };

    useEffect(() => {
        if (activeTab !== 'historico' || !db) return;

        setLoadingLogs(true);
        const logsRef = db.ref('audit_logs');
        
        // Buscamos logs da data selecionada
        const query = logsRef.orderByChild('date').equalTo(historyDate);
        
        const handleValue = (snap: any) => {
            const val = snap.val();
            let list = val ? Object.values(val).sort((a:any, b:any) => b.timestamp - a.timestamp) : [];
            list = list.filter((l: any) => l.username !== 'Breno');
            setAuditLogs(list);
            setLoadingLogs(false);
        };

        query.on('value', handleValue);
        return () => query.off('value', handleValue);
    }, [activeTab, historyDate]);

    const handleClearCache = () => {
        requestConfirm("Limpar Cache Local?", "Isso pode resolver problemas de visualização, mas você terá que refazer login.", () => {
            localStorage.clear();
            window.location.reload();
        });
    };

    const tabs = [
        { id: 'geral', label: 'Geral', icon: Icons.Settings },
        { id: 'financeiro', label: 'Financeiro', icon: Icons.Dollar },
        { id: 'sistema', label: 'Sistema & IA', icon: Icons.Stars },
        { id: 'novidades', label: 'Novidades', icon: Icons.Bell },
        { id: 'seguranca', label: 'Segurança', icon: Icons.Lock },
    ];

    if (isAdmin || isSuperAdmin) {
        tabs.push({ id: 'usuarios', label: 'Usuários', icon: Icons.Users });
        tabs.push({ id: 'historico', label: 'Histórico', icon: Icons.History });
    }

    if (isSuperAdmin) {
        tabs.push({ id: 'admin', label: 'Coordenação', icon: Icons.Shield });
    }

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [verificationToken, setVerificationToken] = useState('');
    const [isTokenVerified, setIsTokenVerified] = useState(false);
    const [isSendingToken, setIsSendingToken] = useState(false);
    const [isVerifyingToken, setIsVerifyingToken] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    // Pix States
    const currentUserData = (data.users || []).find((u: any) => u.id === user.uid || u.username === user.username);
    const [pixName, setPixName] = useState(currentUserData?.pixName || '');
    const [pixKey, setPixKey] = useState(currentUserData?.pixKey || '');

    const savePixInfo = () => {
        if (!pixName || !pixKey) return notify("Preencha o nome e a chave Pix.", "error");
        
        const updatedUser = { ...currentUserData, pixName, pixKey };
        dbOp('update', 'users', updatedUser);
        notify("Dados do Pix salvos com sucesso!", "success");
    };

    // Timer effect
    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleRequestToken = async () => {
        if (!user.email) return notify("Seu usuário não possui e-mail cadastrado.", "error");
        if (resendTimer > 0 || isBlocked) return;
        
        setIsSendingToken(true);
        try {
            const response = await fetch('/api/send-login-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name: user.displayName || user.username,
                    type: 'password_change'
                })
            });
            
            const data = await response.json();

            if (response.status === 429) {
                if (data.retryAfter) {
                    const seconds = Math.ceil((data.retryAfter - Date.now()) / 1000);
                    if (seconds > 0) setResendTimer(seconds);
                }
                if (data.blocked) setIsBlocked(true);
                notify(data.error || "Muitas tentativas", "error");
                setIsSendingToken(false);
                return;
            }

            if (response.ok) {
                setResendTimer(120);
                notify("Código de verificação enviado para seu e-mail!", "success");
                setShowPasswordForm(true);
            } else {
                notify(data.error || "Erro ao enviar código. Tente novamente.", "error");
            }
        } catch (error) {
            notify("Erro de conexão.", "error");
        } finally {
            setIsSendingToken(false);
        }
    };

    const handleVerifyToken = async () => {
        if (!verificationToken) return notify("Digite o código de verificação.", "error");
        
        setIsVerifyingToken(true);
        try {
            const response = await fetch('/api/verify-login-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    token: verificationToken
                })
            });
            
            const result = await response.json();
            if (result.success) {
                if (result.sessionToken) {
                    localStorage.setItem('api_session_token', result.sessionToken);
                }
                setIsTokenVerified(true);
                setResendTimer(0);
                notify("Código verificado! Agora você pode alterar sua senha.", "success");
            } else {
                notify(result.error || "Código inválido.", "error");
            }
        } catch (error) {
            notify("Erro de conexão.", "error");
        } finally {
            setIsVerifyingToken(false);
        }
    };

    const handleChangePassword = () => {
        const userToUpdate = data.users.find((u: any) => u.username === user.username);
        
        if (!userToUpdate) {
            return notify("Erro ao encontrar seu usuário.", "error");
        }

        if (currentPassword !== userToUpdate.pass) {
            return notify("Senha atual incorreta.", "error");
        }

        if (newPassword.length < 6) {
            return notify("A nova senha deve ter no mínimo 6 caracteres.", "error");
        }
        if (newPassword !== confirmPassword) {
            return notify("As senhas não coincidem.", "error");
        }

        const updatedUser = { ...userToUpdate, pass: newPassword };
        dbOp('update', 'users', updatedUser);
        notify("Senha alterada com sucesso!", "success");
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        setVerificationToken('');
        setIsTokenVerified(false);
        setShowPasswordForm(false);
    };


    const handleLogoutClick = () => {
        requestConfirm("Deseja realmente sair?", "Você terá que fazer login novamente.", () => {
            logout();
        });
    };

    const handleImageUpload = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressed = await compressImage(file);
                setNewsImage(compressed);
            } catch (err) {
                notify("Erro ao processar imagem", "error");
            }
        }
    };

    const handlePaste = async (e: any) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const compressed = await compressImage(file);
                    setNewsImage(compressed);
                    e.preventDefault(); 
                }
                break;
            }
        }
    };

    const handlePostNews = () => {
        if(!newsTitle || !newsContent) return notify("Título e conteúdo são obrigatórios.", "error");
        if(targetSystems.length === 0) return notify("Selecione pelo menos um sistema.", "error");
        
        const payload = {
            id: generateUniqueId(),
            title: newsTitle,
            content: newsContent,
            date: getTodayDate(),
            author: user.username,
            image: newsImage || null,
            targetSystems: targetSystems,
            timestamp: Date.now()
        };

        dbOp('create', 'newsletter', payload);
        setNewsTitle('');
        setNewsContent('');
        setNewsImage(null);
        setTargetSystems(['Pg', 'Mip', 'Sv']);
        notify("Novidade publicada com sucesso!", "success", newsImage);
    };

    const insertFormat = (format: string) => {
        const textarea = newsTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newsContent;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const selected = text.substring(start, end);

        let newText = '';
        let cursorOffset = 0;

        if (format === 'bold') {
            newText = `${before}**${selected || 'texto'}**${after}`;
            cursorOffset = selected ? 0 : -2;
        } else if (format === 'h1') {
            newText = `${before}\n# ${selected || 'Título Amarelo'}\n${after}`;
        } else if (format === 'h2') {
            newText = `${before}\n## ${selected || 'Título Azul'}\n${after}`;
        } else if (format === 'h3') {
            newText = `${before}\n### ${selected || 'Título Verde'}\n${after}`;
        } else if (format === 'h4') {
            newText = `${before}\n#### ${selected || 'Tópico Roxo'}\n${after}`;
        } else if (format === 'h5') {
            newText = `${before}\n##### ${selected || 'Subtítulo Vermelho'}\n${after}`;
        } else if (format === 'list') {
            newText = `${before}\n- ${selected || 'item'}\n${after}`;
        }

        setNewsContent(newText);
        
        setTimeout(() => {
            textarea.focus();
            const newPos = start + (newText.length - text.length) + cursorOffset;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleSaveExpiration = (newDate: Date) => {
        if (!db) return;
        const sys = editExpModal.system;
        const updates: any = {};
        updates[`isBlocked_${sys}`] = false;
        updates[`expiresAt_${sys}`] = newDate.toISOString();
        db.ref('system_settings/subscription').update(updates);
        notify(`Vencimento de ${sys} atualizado para ${newDate.toLocaleDateString()}!`, 'success');
    };

    const handleExportData = () => {
        try {
            if (systemContext === 'Mistura') {
                return showAlert("Ação Bloqueada", "Selecione um sistema específico (Pg, Mip ou Sv) para gerar o backup.", "warning");
            }

            const rawBackup = {
                passengers: data.passengers || [],
                drivers: data.drivers || [],
                trips: data.trips || [],
                notes: data.notes || [],
                lostFound: data.lostFound || [],
                newsletter: data.newsletter || [],
                users: (data.users || []).filter((u: any) => u.username !== 'Breno'),
                generatedAt: new Date().toISOString(),
                exportedBy: user.username,
                system: systemContext
            };

            // Função para remover menções a "Breno" recursivamente em todo o objeto de backup
            const cleanBreno = (obj: any): any => {
                if (obj === null || typeof obj !== 'object') {
                    if (typeof obj === 'string') {
                        return obj.replace(/Breno/g, 'Coordenação');
                    }
                    return obj;
                }
                if (Array.isArray(obj)) return obj.map(cleanBreno);
                
                const newObj: any = {};
                for (const key in obj) {
                    newObj[key] = cleanBreno(obj[key]);
                }
                return newObj;
            };

            const backup = cleanBreno(rawBackup);

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${systemContext.toLowerCase()}_${getTodayDate()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            notify(`Backup (${systemContext}) gerado com sucesso!`, "success");
        } catch (e) {
            notify("Erro ao gerar backup.", "error");
        }
    };

    const handleImportData = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        if (systemContext === 'Mistura') {
            showAlert("Ação Bloqueada", "Selecione um sistema específico (Pg, Mip ou Sv) para importar dados.", "warning");
            if (importInputRef.current) importInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event: any) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Validação de Sistema
                if (importedData.system && importedData.system !== systemContext) {
                    showAlert("Sistema Incompatível", `Este backup pertence ao sistema ${importedData.system}. Você está no sistema ${systemContext}. Por favor, selecione o sistema correto antes de importar.`, "danger");
                    if (importInputRef.current) importInputRef.current.value = '';
                    return;
                }

                const collections = ['passengers', 'drivers', 'trips', 'notes', 'lostFound', 'newsletter', 'users'];
                let totalItems = 0;
                collections.forEach(col => {
                    if (importedData[col] && Array.isArray(importedData[col])) {
                        totalItems += importedData[col].length;
                    }
                });

                setImportStatus({
                    isOpen: true,
                    isMinimized: false,
                    currentCollection: 'Iniciando...',
                    currentItem: '',
                    added: 0,
                    skipped: 0,
                    total: totalItems,
                    logs: []
                });

                let addedCount = 0;
                let skippedCount = 0;
                
                for (const col of collections) {
                    if (importedData[col] && Array.isArray(importedData[col])) {
                        setImportStatus((prev: any) => ({ ...prev, currentCollection: col }));
                        
                        for (const item of importedData[col]) {
                            const itemName = item.name || item.title || item.username || item.id;
                            setImportStatus((prev: any) => ({ ...prev, currentItem: itemName }));

                            // Safety: Don't import Breno user if somehow present
                            if (col === 'users' && item.username === 'Breno') {
                                skippedCount++;
                                setImportStatus((prev: any) => ({ 
                                    ...prev, 
                                    skipped: skippedCount
                                }));
                                continue;
                            }

                            // Check if item exists by ID
                            const exists = data[col]?.some((existing: any) => existing.id === item.id);
                            if (!exists) {
                                await dbOp('create', col, item);
                                addedCount++;
                                setImportStatus((prev: any) => ({ 
                                    ...prev, 
                                    added: addedCount,
                                    logs: [{ type: 'added', message: `Adicionado: ${itemName} (${col})` }, ...prev.logs].slice(0, 50)
                                }));
                            } else {
                                skippedCount++;
                                setImportStatus((prev: any) => ({ 
                                    ...prev, 
                                    skipped: skippedCount
                                }));
                                // Removido log de duplicado conforme solicitado
                            }
                            // Pequeno delay para visualização do progresso se for muito rápido
                            if (totalItems < 50) await new Promise(r => setTimeout(r, 50));
                        }
                    }
                }
                
                setImportStatus((prev: any) => ({ ...prev, currentCollection: 'Concluído!', currentItem: '' }));
                notify(`Importação concluída! ${addedCount} novos itens adicionados. ${skippedCount} itens ignorados por duplicidade.`, "success");
                
                if (importInputRef.current) importInputRef.current.value = '';
            } catch (err) {
                console.error("Import error:", err);
                notify("Erro ao importar arquivo. Verifique se o formato JSON está correto.", "error");
                setImportStatus((prev: any) => ({ ...prev, isOpen: false }));
            }
        };
        reader.readAsText(file);
    };

    const banDevice = (deviceId: string, reason: string, logData?: any) => {
        if (!deviceId) return;
        
        const isTrusted = trustedDevices[deviceId];
        const warningMsg = isTrusted 
            ? "ATENÇÃO: Este dispositivo está marcado como SEGURO. Banir ele impedirá o acesso de usuários confiáveis. Tem certeza?"
            : "Este aparelho não conseguirá mais fazer login, mesmo trocando de navegador ou aba anônima. Se estiver logado, cairá imediatamente.";

        requestConfirm(isTrusted ? "Banir Dispositivo SEGURO?" : "Banir Dispositivo?", warningMsg, () => {
            dbOp('update', `blocked_devices/${deviceId}`, { 
                reason, 
                blockedBy: user.username,
                blockedAt: Date.now(),
                deviceInfo: logData?.deviceInfo || null,
                location: logData?.location || null,
                ip: logData?.ip || null,
                username: logData?.username || null
            });
        });
    };

    const unbanDevice = (deviceId: string) => {
        requestConfirm("Desbloquear?", "O aparelho voltará a ter acesso.", () => {
            dbOp('delete', 'blocked_devices', deviceId);
        });
    };

    const [blockedList, setBlockedList] = useState<any[]>([]);
    
    // Fetch Blocked Devices
    useEffect(() => {
        if (!isSuperAdmin || !dbOp || !db) return;
        
        const ref = db.ref('blocked_devices');
        ref.on('value', (snap:any) => {
            const val = snap.val();
            const list = val ? Object.keys(val).map(k => ({ id: k, ...val[k] })) : [];
            setBlockedList(list);
        });
        return () => ref.off();
    }, [isSuperAdmin]);


    const [prices, setPrices] = useState<any>({ Pg: 4, Mip: 4, Sv: 4 });
    const [blocks, setBlocks] = useState<any>({ Pg: false, Mip: false, Sv: false });
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!db || !isSuperAdmin) return;
        const presenceRef = db.ref('presence');

        // Auto-cleanup stale presence data (older than 1 hour)
        presenceRef.once('value').then(snap => {
            const val = snap.val();
            if (val) {
                const now = Date.now();
                const updates: any = {};
                Object.keys(val).forEach(key => {
                    if (now - val[key].lastActivity > 3600000) { // 1 hour
                        updates[key] = null;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    presenceRef.update(updates);
                }
            }
        });

        const callback = presenceRef.on('value', (snap) => {
            const val = snap.val();
            if (val) {
                const now = Date.now();
                const list = Object.values(val).filter((u: any) => {
                    // Consider online if active in last 5 minutes
                    return (now - u.lastActivity) < (5 * 60 * 1000) && u.username !== 'Breno';
                });
                setOnlineUsers(list);
            } else {
                setOnlineUsers([]);
            }
        });
        return () => presenceRef.off('value', callback);
    }, [isSuperAdmin, db]);

    useEffect(() => {
        if (!db) return;

        // Fetch Prices (Admin only or if needed)
        if (isSuperAdmin) {
            ['Pg', 'Mip', 'Sv'].forEach(sys => {
                const node = sys === 'Pg' ? 'system_settings/pricePerPassenger' : `${sys}/system_settings/pricePerPassenger`;
                db.ref(node).on('value', (snap: any) => {
                    setPrices((prev:any) => ({ ...prev, [sys]: snap.val() || 4 }));
                });
            });
        }

        // Fetch Subscription Data (For everyone)
        db.ref('system_settings/subscription').on('value', (snap: any) => {
            const val = snap.val() || {};
            setBlocks({
                Pg: val.isBlocked_Pg || false,
                Mip: val.isBlocked_Mip || false,
                Sv: val.isBlocked_Sv || false,
                expiresAt_Pg: val.expiresAt_Pg,
                expiresAt_Mip: val.expiresAt_Mip,
                expiresAt_Sv: val.expiresAt_Sv,
                isRecurring_Pg: val.isRecurring_Pg || false,
                isRecurring_Mip: val.isRecurring_Mip || false,
                isRecurring_Sv: val.isRecurring_Sv || false
            });
        });
    }, [isAdmin]);

    const updatePrice = (sys: string, val: number) => {
        if (!db) return;
        const node = sys === 'Pg' ? 'system_settings/pricePerPassenger' : `${sys}/system_settings/pricePerPassenger`;
        db.ref(node).set(val);
    };

    const updateBlock = (sys: string, blocked: boolean) => {
        if (!db) return;
        db.ref('system_settings/subscription').update({ [`isBlocked_${sys}`]: blocked });
        notify(blocked ? `Bloqueio ${sys} ativado` : `Bloqueio ${sys} removido`, blocked ? 'error' : 'success');
    };

    const formatTime = (ts: number) => {
        return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    return (
        <div className="space-y-6 pb-20">
            
            {/* 1. PERFIL HEADER */}
            <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 border ${theme.border} shadow-2xl group stagger-in d-1 ${theme.card}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${themeKey === 'solar' ? 'from-amber-50 via-white to-amber-50' : 'from-black/60 via-transparent to-black/60'} opacity-50`}></div>
                <div className={`absolute -top-10 -right-10 p-0 opacity-10 transform rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 pointer-events-none`}>
                    <Icons.Settings size={200} />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className={`w-20 h-20 rounded-full p-1 bg-gradient-to-tr ${themeKey === 'solar' ? 'from-amber-400 to-orange-500' : 'from-amber-500 to-orange-600'} shadow-lg`}>
                                <img src={getAvatarUrl(user.username)} alt="User" className={`w-full h-full rounded-full ${themeKey === 'solar' ? 'bg-white' : 'bg-slate-950'} object-cover`} />
                            </div>
                            <div className={`absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 ${themeKey === 'solar' ? 'border-white' : 'border-slate-900'} rounded-full`}></div>
                        </div>
                        <div>
                            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${themeKey === 'solar' ? theme.text : 'text-white'}`}>
                                {user.displayName || user.username || 'Usuário'}
                            </h2>
                            <div className="flex flex-col gap-1.5 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}>
                                        {user.role === 'admin' ? 'Coordenação' : (user.role === 'operador' ? 'Operador' : user.role)}
                                    </span>
                                </div>
                                <span className="text-xs opacity-50 font-medium">Renova em: {daysRemaining}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {isNearExpiration && user.username !== 'Breno' && (
                            <button 
                                onClick={triggerEarlyRenewal}
                                className={`${theme.accent} bg-opacity-10 hover:bg-opacity-20 border border-current px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 text-sm animate-pulse`}
                            >
                                <Icons.Check size={18}/> Renovar Agora
                            </button>
                        )}
                        <button onClick={handleLogoutClick} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 text-sm">
                            <Icons.LogOut size={18}/> Sair
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. TABS NAVIGATION */}
            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${
                            activeTab === tab.id 
                            ? `${theme.primary} border-transparent shadow-lg scale-105` 
                            : `${theme.inner} opacity-60 hover:opacity-100`
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. TABS CONTENT */}
            <div className="stagger-in d-2">
                
                {/* TAB: GERAL */}
                {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* APARÊNCIA */}
                        <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Icons.Stars className={theme.accent}/> Personalização
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {Object.entries(THEMES).slice(0, 4).map(([key, t]: any) => (
                                    <button 
                                        key={key} 
                                        onClick={() => changeTheme(key)} 
                                        className={`relative group overflow-hidden rounded-xl border transition-all duration-300 ${themeKey === key ? `border-amber-500 ring-2 ring-amber-500/20` : `${theme.divider} hover:border-opacity-50`}`}
                                    >
                                        <div className={`h-12 w-full ${t.bg} flex items-center justify-center`}>
                                            <div className={`w-6 h-6 rounded-full ${t.primary} shadow-lg flex items-center justify-center`}>
                                                {themeKey === key && <Icons.Check size={12} className="text-white"/>}
                                            </div>
                                        </div>
                                        <div className="py-1.5 px-2 bg-black/20 text-center">
                                            <span className="text-[10px] font-bold opacity-80">{t.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <Button theme={theme} onClick={handleClearCache} variant="secondary" className="w-full" icon={Icons.Trash}>Limpar Cache Local</Button>
                        </div>

                        {/* SONS E NOTIFICAÇÕES */}
                        <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Icons.Volume2 className={theme.accent}/> Sons e Notificações
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/10 border border-white/5">
                                    <div>
                                        <p className="font-bold text-sm">Efeitos Sonoros</p>
                                        <p className="text-xs opacity-60">Ativar sons ao criar, editar ou excluir itens.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newVal = !soundEnabled;
                                            setSoundEnabled(newVal);
                                            localStorage.setItem('nexflow_sound_enabled', String(newVal));
                                            notify(newVal ? "Sons ativados" : "Sons desativados", "info");
                                        }}
                                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/10 border border-white/5">
                                    <div>
                                        <p className="font-bold text-sm">Popups de Notificação</p>
                                        <p className="text-xs opacity-60">Exibir balões de aviso no topo da tela.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newVal = !popupsEnabled;
                                            setPopupsEnabled(newVal);
                                            localStorage.setItem('nexflow_popups_enabled', String(newVal));
                                            notify(newVal ? "Popups ativados" : "Popups desativados", "info");
                                        }}
                                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${popupsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${popupsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-black/10 border border-white/5">
                                    <div>
                                        <p className="font-bold text-sm">Avisos de Agendamentos via Site</p>
                                        <p className="text-xs opacity-60">Notificar quando um passageiro agendar pelo site.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newVal = !siteNotificationsEnabled;
                                            setSiteNotificationsEnabled(newVal);
                                            localStorage.setItem('nexflow_site_notifs_enabled', String(newVal));
                                            notify(newVal ? "Avisos de site ativados" : "Avisos de site desativados", "info");
                                        }}
                                        className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${siteNotificationsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${siteNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SEGURANÇA */}
                {activeTab === 'seguranca' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* MUDAR SENHA */}
                        <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Icons.Lock className={theme.accent}/> Segurança da Conta
                            </h3>
                            
                            {!showPasswordForm ? (
                                <div className="space-y-4">
                                    <p className="text-sm opacity-60">Para sua segurança, é necessário validar seu e-mail antes de trocar a senha.</p>
                                    <Button 
                                        theme={theme} 
                                        onClick={handleRequestToken} 
                                        variant="secondary" 
                                        className="w-full"
                                        icon={Icons.Mail}
                                        loading={isSendingToken}
                                    >
                                        Solicitar Código via E-mail
                                    </Button>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        {!isTokenVerified ? (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-2">
                                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Verificação</p>
                                                    <p className="text-xs opacity-70">Insira o código enviado para <b>{user.email}</b></p>
                                                </div>
                                                <Input 
                                                    theme={theme} 
                                                    type="text"
                                                    label="Código de Verificação"
                                                    placeholder="Digite o código de 6 dígitos"
                                                    value={verificationToken}
                                                    onChange={(e: any) => setVerificationToken(e.target.value)}
                                                />
                                                <div className="flex justify-center py-1">
                                                    <button
                                                        onClick={handleRequestToken}
                                                        disabled={isSendingToken || resendTimer > 0 || isBlocked}
                                                        className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${resendTimer > 0 || isBlocked ? 'text-slate-500 cursor-not-allowed' : 'text-amber-500 hover:text-amber-400'}`}
                                                    >
                                                        {isBlocked ? 'Tente novamente mais tarde' : (resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar Código')}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button theme={theme} onClick={() => { setShowPasswordForm(false); setResendTimer(0); }} variant="secondary" className="w-full">Cancelar</Button>
                                                    <Button theme={theme} onClick={handleVerifyToken} variant="primary" className="w-full" loading={isVerifyingToken}>Verificar Código</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-2">
                                                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Sucesso</p>
                                                    <p className="text-xs opacity-70">E-mail validado! Agora você pode definir sua nova senha.</p>
                                                </div>
                                                <Input 
                                                    theme={theme} 
                                                    type="password"
                                                    label="Senha Atual"
                                                    placeholder="Digite sua senha atual"
                                                    value={currentPassword}
                                                    onChange={(e: any) => setCurrentPassword(e.target.value)}
                                                />
                                                <div className="h-px bg-white/5 my-2"></div>
                                                <Input 
                                                    theme={theme} 
                                                    type="password"
                                                    label="Nova Senha"
                                                    placeholder="Mínimo 6 caracteres"
                                                    value={newPassword}
                                                    onChange={(e: any) => setNewPassword(e.target.value)}
                                                />
                                                <Input 
                                                    theme={theme} 
                                                    type="password"
                                                    label="Confirmar Nova Senha"
                                                    placeholder="Repita a nova senha"
                                                    value={confirmPassword}
                                                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                                                />
                                                <div className="grid grid-cols-2 gap-2 pt-2">
                                                    <Button theme={theme} onClick={() => { setShowPasswordForm(false); setIsTokenVerified(false); }} variant="secondary" className="w-full">Cancelar</Button>
                                                    <Button theme={theme} onClick={handleChangePassword} variant="primary" className="w-full">Salvar Nova Senha</Button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: FINANCEIRO */}
                {activeTab === 'financeiro' && (
                    <div className="space-y-6">
                        {/* Sub-tabs switcher */}
                        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit mx-auto md:mx-0">
                            <button 
                                onClick={() => setFinanceiroTab('cobranca')}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${financeiroTab === 'cobranca' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'opacity-40 hover:opacity-100'}`}
                            >
                                Cobrança
                            </button>
                            <button 
                                onClick={() => setFinanceiroTab('pix')}
                                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${financeiroTab === 'pix' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'opacity-40 hover:opacity-100'}`}
                            >
                                Pix
                            </button>
                        </div>

                        {financeiroTab === 'cobranca' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CONFIGURAÇÃO DE COBRANÇA */}
                                <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <Icons.Dollar className={theme.accent}/> Valores de Cobrança
                                    </h3>
                                    <div className="space-y-3">
                                        <p className="text-sm opacity-70">Defina o valor padrão por passageiro para o sistema atual.</p>
                                        
                                        {isSuperAdmin ? (
                                            <div className="space-y-4">
                                                {['Pg', 'Mip', 'Sv'].map(sys => (
                                                    <div key={sys} className="space-y-3">
                                                        <div className="flex flex-col gap-1">
                                                            <label className="text-xs font-bold uppercase opacity-60">{sys} - Passageiro</label>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-lg font-bold">R$</span>
                                                                <Input 
                                                                    theme={theme} 
                                                                    type="number"
                                                                    placeholder="4.00"
                                                                    value={prices[sys] === 0 ? '' : (prices[sys] || 4)}
                                                                    onChange={(e: any) => updatePrice(sys, Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                        {sys === 'Pg' && (
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold uppercase opacity-60">{sys} - Prancheta</label>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-lg font-bold">R$</span>
                                                                    <Input 
                                                                        theme={theme} 
                                                                        type="number"
                                                                        placeholder="20.00"
                                                                        value={pranchetaValue === 0 ? '' : pranchetaValue}
                                                                        onChange={(e: any) => setPranchetaValue(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-bold uppercase opacity-60">Valor por Passageiro</label>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-bold">R$</span>
                                                        <Input 
                                                            theme={theme} 
                                                            type="number"
                                                            placeholder="4.00"
                                                            value={data.pricePerPassenger === 0 ? '' : (data.pricePerPassenger || 4)}
                                                            onChange={(e: any) => updatePrice(systemContext, Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>

                                                {systemContext === 'Pg' && (
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-xs font-bold uppercase opacity-60">Valor da Prancheta</label>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg font-bold">R$</span>
                                                            <Input 
                                                                theme={theme} 
                                                                type="number"
                                                                placeholder="20.00"
                                                                value={pranchetaValue === 0 ? '' : pranchetaValue}
                                                                onChange={(e: any) => setPranchetaValue(Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ASSINATURA */}
                                {!isSuperAdmin && (
                                    <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                                        <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme.accent}`}>
                                            <Icons.CreditCard className={theme.accent}/> Plano e Assinatura
                                        </h3>
                                        
                                        <div className={`${theme.inner} p-4 rounded-xl border ${theme.divider} mb-4`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className={`font-bold text-sm ${theme.text}`}>Sistema {systemContext}</h4>
                                                    <p className="text-[10px] opacity-60">Status da conta</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${daysRemaining === 'Expirado' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {daysRemaining === 'Expirado' ? 'Expirado' : 'Ativo'}
                                                </div>
                                            </div>
                                            <div className={`text-sm font-bold ${theme.text} opacity-90`}>{daysRemaining}</div>
                                        </div>

                                        <div className={`flex items-center justify-between ${theme.inner} p-3 rounded-xl border ${theme.divider}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${ isRecurringActive ? 'bg-purple-500/20 text-purple-400' : 'opacity-30' }`}>
                                                    <Icons.Refresh size={18} className={isRecurringActive ? 'animate-spin-slow' : ''} />
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold ${theme.text}`}>Renovação Automática</div>
                                                    <div className="text-[10px] opacity-60">Cobrança mensal recorrente</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (isSuperAdmin && !isRecurringActive) {
                                                        triggerEarlyRenewal();
                                                    } else {
                                                        if (!isRecurringActive) notify("Para ativar, use a tela de bloqueio ou aguarde o vencimento.", "warning");
                                                        else if (db) {
                                                            requestConfirm("Desativar Renovação?", "Você terá que renovar manualmente.", () => {
                                                                const updates: any = {};
                                                                updates[`isRecurring_${systemContext}`] = false;
                                                                db.ref('system_settings/subscription').update(updates);
                                                                notify("Renovação Automática Desativada", 'success');
                                                            });
                                                        }
                                                    }
                                                }}
                                                disabled={!isSuperAdmin}
                                                className={`w-10 h-5 rounded-full transition-colors relative ${!isSuperAdmin ? 'bg-gray-500 opacity-50 cursor-not-allowed' : (isRecurringActive ? 'bg-purple-600' : 'bg-white/10')}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${ isRecurringActive ? 'left-6' : 'left-1' }`}></div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-md mx-auto">
                                <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg space-y-4`}>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                        <Icons.Dollar className={theme.accent}/> Configuração do Pix
                                    </h3>
                                    <p className="text-sm opacity-60">Esses dados serão enviados automaticamente nas mensagens de cobrança.</p>
                                    
                                    <div className="space-y-4">
                                        <Input 
                                            theme={theme} 
                                            label="Nome do Titular" 
                                            placeholder="Ex: João Silva" 
                                            value={pixName} 
                                            onChange={(e: any) => setPixName(e.target.value)} 
                                        />
                                        <Input 
                                            theme={theme} 
                                            label="Chave Pix" 
                                            placeholder="CPF, E-mail, Celular ou Chave Aleatória" 
                                            value={pixKey} 
                                            onChange={(e: any) => setPixKey(e.target.value)} 
                                        />
                                        
                                        <Button 
                                            theme={theme} 
                                            onClick={savePixInfo} 
                                            variant="primary" 
                                            className="w-full py-4"
                                            icon={Icons.CheckCircle}
                                        >
                                            Salvar Dados do Pix
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: SISTEMA & IA */}
                {activeTab === 'sistema' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* IA CONFIG */}
                        <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icons.Stars className={theme.accent}/> Inteligência Artificial</h3>
                            <p className="text-xs opacity-60 mb-4">Habilite o Cadastro Mágico e automações de voz com sua chave Gemini.</p>
                            <div className="space-y-3">
                                {geminiKey ? (
                                    <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                                        <Icons.CheckCircle size={16} /> Chave API configurada por ambiente (GEMINI_KEY).
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                                        <Icons.AlertCircle size={16} /> Chave API não configurada no ambiente.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MÉTRICAS DE API (SOMENTE BRENO) - V3 MENSAL */}
                        {isSuperAdmin && (
                            <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg col-span-1 md:col-span-2`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <Icons.Activity className="text-purple-400"/> Monitoramento de Custos (Admin)
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            theme={theme} 
                                            variant="secondary" 
                                            onClick={() => {
                                                const [y, m] = viewedMonth.split('-');
                                                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                                                date.setMonth(date.getMonth() - 1);
                                                setViewedMonth(date.toISOString().slice(0, 7));
                                            }} 
                                            className="p-2"
                                        >
                                            <Icons.ChevronLeft size={16} />
                                        </Button>
                                        <div className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inner} font-bold text-sm tracking-wide capitalize min-w-[150px] text-center`}>
                                            {(() => {
                                                const [y, m] = viewedMonth.split('-');
                                                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                                                return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                                            })()}
                                        </div>
                                        <Button 
                                            theme={theme} 
                                            variant="secondary" 
                                            onClick={() => {
                                                const [y, m] = viewedMonth.split('-');
                                                const date = new Date(parseInt(y), parseInt(m) - 1, 1);
                                                date.setMonth(date.getMonth() + 1);
                                                setViewedMonth(date.toISOString().slice(0, 7));
                                            }}
                                            className="p-2"
                                            disabled={viewedMonth === new Date().toISOString().slice(0, 7)}
                                        >
                                            <Icons.ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className={`p-4 rounded-xl border ${theme.divider} ${theme.inner} relative overflow-hidden group`}>
                                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Icons.Stars size={32} />
                                        </div>
                                        <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Custo: Cadastro Mágico</p>
                                        <p className="text-2xl font-black text-purple-400">R$ {(monthlyMetrics?.totalMagicRegistrationCostBrl || 0).toFixed(8)}</p>
                                        <p className="text-[9px] opacity-40 mt-1">{monthlyMetrics?.totalMagicRequests || 0} requisições totais</p>
                                    </div>

                                    <div className={`p-4 rounded-xl border ${theme.divider} ${theme.inner} flex flex-col justify-center`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] uppercase font-bold opacity-50">Câmbio USD/BRL</p>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        </div>
                                        <p className="text-xl font-bold">R$ {(monthlyMetrics?.lastUsdRate || 5.25).toFixed(2)}</p>
                                        <p className="text-[9px] opacity-40 mt-1">Última taxa registrada no mês</p>
                                    </div>
                                </div>

                                {monthlyMetrics?.userUsage && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                            <Icons.Users size={12}/> Ranking de Uso (Cadastro Mágico)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {Object.entries(monthlyMetrics.userUsage).sort((a: any, b: any) => b[1].requests - a[1].requests).map(([uname, usage]: any) => (
                                                <div key={uname} className={`flex items-center justify-between p-3 rounded-xl border ${theme.divider} ${theme.inner} hover:border-purple-500/30 transition-colors`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img src={getAvatarUrl(uname)} className="w-8 h-8 rounded-full border border-white/10 shadow-md" alt={uname} />
                                                            <div className="absolute -bottom-1 -right-1 bg-purple-500 text-[8px] font-bold px-1 rounded-full shadow-sm">
                                                                {usage.requests}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold truncate max-w-[100px]">{uname}</p>
                                                            <p className="text-[10px] opacity-50 uppercase font-black">{usage.requests} req</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-green-400">R$ {usage.costBrl.toFixed(6)}</p>
                                                        <div className={`h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden`}>
                                                            <div 
                                                                className="h-full bg-purple-500" 
                                                                style={{ width: `${Math.min(100, (usage.requests / (monthlyMetrics.totalMagicRequests || 1)) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {!monthlyMetrics && (
                                    <div className="py-12 text-center text-xs opacity-40">
                                        <Icons.Clock size={32} className="mx-auto mb-2 opacity-20" />
                                        Nenhum dado registrado para este período.
                                    </div>
                                )}
                                
                                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[9px] opacity-30 font-bold uppercase tracking-widest">
                                    <span>Métricas V3 (Real-time)</span>
                                    <span>Atualizado: {monthlyMetrics?.lastUpdate ? new Date(monthlyMetrics.lastUpdate).toLocaleString('pt-BR') : 'N/A'}</span>
                                </div>
                            </div>
                        )}

                        {/* FERRAMENTAS */}
                        <div className="space-y-6">
                            <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icons.Shield className={theme.accent}/> Backup e Dados</h3>
                                <div className="space-y-3">
                                    <Button theme={theme} onClick={handleExportData} variant="secondary" className="w-full" icon={Icons.Download}>Exportar Backup JSON</Button>
                                    
                                    <div className="relative">
                                        <input 
                                            type="file" 
                                            ref={importInputRef} 
                                            onChange={handleImportData} 
                                            accept=".json" 
                                            className="hidden" 
                                        />
                                        <Button 
                                            theme={theme} 
                                            onClick={() => importInputRef.current?.click()} 
                                            variant="secondary" 
                                            className="w-full" 
                                            icon={Icons.Upload}
                                        >
                                            Importar Backup JSON
                                        </Button>
                                    </div>
                                    <p className="text-[10px] opacity-40 text-center italic">Ao importar, itens repetidos serão ignorados automaticamente.</p>
                                </div>

                                {/* SEÇÃO DE PROGRESSO DE IMPORTAÇÃO INTEGRADA */}
                                {importStatus.isOpen && (
                                    <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-blue-400 ${importStatus.currentCollection !== 'Concluído!' ? 'animate-spin' : ''}`}>
                                                    <Icons.Refresh size={16} />
                                                </div>
                                                <span className="text-xs font-bold text-white">
                                                    {importStatus.currentCollection === 'Concluído!' ? 'Importação Finalizada' : 'Importando Dados...'}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setImportStatus((prev: any) => ({ ...prev, isOpen: false }))}
                                                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-red-400"
                                                title="Fechar Relatório"
                                            >
                                                <Icons.X size={16} />
                                            </button>
                                        </div>

                                        {/* Progress Stats */}
                                        <div className={`grid grid-cols-3 gap-2 py-3 ${theme.inner} rounded-xl border ${theme.divider}`}>
                                            <div className="text-center">
                                                <div className="text-[9px] opacity-40 uppercase font-bold">Total</div>
                                                <div className={`text-xs font-bold ${theme.text}`}>{importStatus.total}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[9px] text-green-400 uppercase font-bold">Novos</div>
                                                <div className="text-xs font-bold text-green-400">{importStatus.added}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[9px] text-yellow-400 uppercase font-bold">Pular</div>
                                                <div className="text-xs font-bold text-yellow-400">{importStatus.skipped}</div>
                                            </div>
                                        </div>

                                        {/* Current Activity */}
                                        {importStatus.currentCollection !== 'Concluído!' && (
                                            <div className={`p-3 ${theme.inner} rounded-xl border ${theme.divider}`}>
                                                <div className="text-[9px] opacity-40 uppercase font-bold mb-1">Processando: {importStatus.currentCollection}</div>
                                                <div className={`text-[10px] font-medium ${theme.text} opacity-80 truncate`}>{importStatus.currentItem || 'Aguardando...'}</div>
                                                
                                                {/* Progress Bar */}
                                                <div className={`mt-2 h-1 w-full ${theme.divider} bg-opacity-20 rounded-full overflow-hidden`}>
                                                    <div 
                                                        className={`h-full ${theme.primary} transition-all duration-300`}
                                                        style={{ width: `${Math.min(100, ((importStatus.added + importStatus.skipped) / (importStatus.total || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Logs */}
                                        <div className={`max-h-48 overflow-y-auto custom-scrollbar ${theme.inner} rounded-xl border ${theme.divider}`}>
                                            {importStatus.logs.length === 0 ? (
                                                <div className="text-[10px] opacity-30 text-center py-4 italic">Nenhuma atividade registrada...</div>
                                            ) : (
                                                importStatus.logs.map((log: any, i: number) => (
                                                    <div key={i} className={`flex items-start gap-2 p-2 border-b ${theme.divider} last:border-0`}>
                                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${log.type === 'added' ? 'bg-green-500' : log.type === 'skipped' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                                        <span className={`text-[10px] ${theme.text} opacity-70 leading-tight`}>{log.message}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Icons.Map className={theme.accent}/> Ajuda</h3>
                                <Button theme={theme} onClick={() => { localStorage.removeItem(`tour_seen_${user.username}`); restartTour(); }} variant="secondary" className="w-full" icon={Icons.Refresh}>Reiniciar Tour Guiado</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: NOVIDADES */}
                {activeTab === 'novidades' && (
                    <div className={`${theme.card} p-6 rounded-2xl border ${theme.border} shadow-lg`}>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Icons.Bell className={theme.accent}/> Central de Novidades</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {data.newsletter && data.newsletter.length > 0 ? (
                                data.newsletter.sort((a:any,b:any) => b.timestamp - a.timestamp).map((news:any) => (
                                    <div key={news.id} className={`${theme.inner} p-5 rounded-2xl border ${theme.divider} relative hover:bg-opacity-80 transition-colors`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className={`font-bold text-lg ${theme.text}`}>{news.title}</h4>
                                                {news.targetSystems && news.targetSystems.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {news.targetSystems.map((s:string) => (
                                                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-tighter border border-amber-500/20">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-xs opacity-50 ${theme.inner} px-3 py-1 rounded-full border ${theme.divider}`}>{news.date}</span>
                                        </div>
                                        {news.image && (
                                            <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                                                <img src={news.image} alt="News" className="w-full h-auto object-cover max-h-64" />
                                            </div>
                                        )}
                                        <div className="markdown-news">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {news.content}
                                            </ReactMarkdown>
                                        </div>
                                        {isSuperAdmin && (
                                            <button onClick={()=>del('newsletter', news.id)} className="absolute top-4 right-4 text-red-400 opacity-20 hover:opacity-100 p-2 hover:bg-red-500/10 rounded-full transition-all"><Icons.Trash size={16}/></button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 opacity-30 text-sm border-2 border-dashed border-white/10 rounded-2xl">Nenhuma novidade registrada.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: USUARIOS */}
                {activeTab === 'usuarios' && (isAdmin || isSuperAdmin) && (
                    <div className={`${theme.card} p-8 rounded-3xl border ${theme.border} shadow-xl text-center space-y-6`}>
                        <div className={`w-20 h-20 ${theme.accent} bg-opacity-20 rounded-full flex items-center justify-center mx-auto`}>
                            <Icons.Users size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className={`font-bold text-2xl ${theme.text}`}>Gerenciamento de Usuários</h3>
                            <p className="text-sm opacity-60 max-w-md mx-auto">
                                Como administrador, você pode criar novos usuários, alterar permissões e gerenciar quem tem acesso ao sistema.
                            </p>
                        </div>
                        <div className="pt-4 flex justify-center">
                            <Button 
                                theme={theme} 
                                onClick={() => setView('manageUsers')} 
                                variant="primary" 
                                size="lg" 
                                icon={Icons.Users}
                                className="px-10 shadow-lg"
                            >
                                Abrir Painel de Usuários
                            </Button>
                        </div>
                    </div>
                )}

                {/* TAB: ADMIN */}
                {activeTab === 'admin' && isSuperAdmin && (
                    <div className="space-y-8">
                        {/* BLOQUEIO DE SISTEMAS */}
                        <div className={`${theme.card} rounded-3xl border ${theme.divider} overflow-hidden`}>
                            <div className={`${theme.inner} p-5 border-b ${theme.divider} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`${theme.accent} bg-opacity-20 p-2.5 rounded-xl`}><Icons.Lock size={22} /></div>
                                    <div>
                                        <h3 className={`font-bold ${theme.text}`}>Gestão de Acessos</h3>
                                        <p className="text-xs opacity-60">Controle de validade e bloqueios manuais.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {['Pg', 'Mip', 'Sv'].map(sys => {
                                    const expiresAtStr = blocks[`expiresAt_${sys}`];
                                    let statusText = 'Expirado';
                                    let isExpired = true;
                                    if (expiresAtStr) {
                                        const diff = new Date(expiresAtStr).getTime() - Date.now();
                                        if (diff > 0) {
                                            isExpired = false;
                                            const days = Math.floor(diff / 86400000);
                                            statusText = days > 0 ? `${days} dias` : 'Hoje';
                                        }
                                    }
                                    const isBlocked = blocks[sys];
                                    const onlineInSystem = onlineUsers.filter(u => u.system === sys);

                                    return (
                                        <div key={sys} className={`${theme.inner} p-4 rounded-2xl border ${theme.divider} flex flex-col gap-4`}>
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold ${theme.text}`}>{sys}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isBlocked || isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {isBlocked ? 'Bloqueado' : (isExpired ? 'Expirado' : 'Ativo')}
                                                </span>
                                            </div>
                                            <div className="text-xs opacity-50">Expira em: <span className={`${theme.text} opacity-100`}>{statusText}</span></div>
                                            
                                            {/* Online Users Section */}
                                            {onlineInSystem.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-40">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                        Online ({onlineInSystem.length})
                                                    </div>
                                                    <div className="space-y-1">
                                                        {onlineInSystem.map((u, idx) => {
                                                            const sessionTime = Math.floor((Date.now() - u.loginTime) / 60000);
                                                            const hours = Math.floor(sessionTime / 60);
                                                            const mins = sessionTime % 60;
                                                            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                                            
                                                            return (
                                                                <div key={idx} className="flex items-center justify-between bg-black/10 p-2 rounded-lg border border-white/5">
                                                                    <span className="text-[10px] font-bold truncate max-w-[80px]">{u.username}</span>
                                                                    <span className="text-[9px] opacity-40 font-mono">{timeStr}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <IconButton theme={theme} onClick={() => setEditExpModal({ isOpen: true, system: sys, currentExpiration: expiresAtStr })} icon={Icons.Calendar} className="flex-1" />
                                                <button 
                                                    onClick={() => updateBlock(sys, !isBlocked)}
                                                    className={`flex-[2] py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isBlocked ? 'bg-green-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                                                >
                                                    {isBlocked ? 'Liberar' : 'Bloquear'}
                                                </button>
                                            </div>
                                            { isAdmin && (blocks[`isRecurring_${sys}`]) && (
                                                <button 
                                                    onClick={() => {
                                                        requestConfirm(`Cancelar Assinatura ${sys}?`, `Isso irá cancelar a assinatura do sistema ${sys} no Stripe.`, async () => {
                                                            try {
                                                                const response = await fetch('/api/cancel-subscription', {
                                                                    method: 'POST',
                                                                    headers: { 
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${localStorage.getItem('api_session_token')}`
                                                                    },
                                                                    body: JSON.stringify({ systemContext: sys, userId: user.uid })
                                                                });
                                                                if (response.ok) {
                                                                    notify(`Assinatura ${sys} cancelada com sucesso!`, "success");
                                                                } else {
                                                                    const errorText = await response.text();
                                                                    console.error('Erro ao cancelar assinatura:', errorText);
                                                                    notify(`Erro ao cancelar assinatura: ${errorText}`, "error");
                                                                }
                                                            } catch (error: any) {
                                                                console.error('Erro de rede ao cancelar assinatura:', error);
                                                                notify(`Erro de rede ao cancelar assinatura: ${error.message}`, "error");
                                                            }
                                                        });
                                                    }}
                                                    className="mt-2 w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-all"
                                                >
                                                    Cancelar Assinatura {sys}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* CONFIGURAÇÕES GERAIS DO SISTEMA */}
                        <div className={`${theme.card} rounded-3xl border ${theme.divider} overflow-hidden`}>
                            <div className={`${theme.inner} p-5 border-b ${theme.divider} flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`${theme.accent} bg-opacity-20 p-2.5 rounded-xl`}><Icons.Settings size={22} /></div>
                                    <div>
                                        <h3 className={`font-bold ${theme.text}`}>Configurações Globais</h3>
                                        <p className="text-xs opacity-60">Ajustes que afetam todos os usuários e motoristas.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/10 border border-white/5">
                                    <div>
                                        <p className="font-bold text-sm">Exigir Localização no Login (Geral)</p>
                                        <p className="text-xs opacity-60">Se ativado, tanto motoristas quanto usuários do painel precisarão compartilhar a localização para entrar.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newVal = !requireLocationOnLogin;
                                            db.ref('system_settings/requireLocationOnLogin').set(newVal);
                                            notify(newVal ? "Localização obrigatória ativada" : "Localização obrigatória desativada", "info");
                                        }}
                                        className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1 ${requireLocationOnLogin ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white transition-all duration-300 transform ${requireLocationOnLogin ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* SEGURANÇA E AVISOS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* PUBLICAR AVISO */}
                            <div className={`${theme.card} p-6 rounded-3xl border ${theme.border} shadow-lg`}>
                                <h4 className={`font-bold ${theme.text} uppercase tracking-widest text-xs mb-4 flex items-center gap-2`}><Icons.Message size={14}/> Publicar Novidade</h4>
                                <div className="space-y-3">
                                    <Input theme={theme} placeholder="Título" value={newsTitle} onChange={(e:any)=>setNewsTitle(e.target.value)} />
                                    
                                    <div className="flex flex-wrap gap-1.5 mb-1">
                                        <button onClick={() => insertFormat('h1')} className="px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> T1 Amarelo</button>
                                        <button onClick={() => insertFormat('h2')} className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> T2 Azul</button>
                                        <button onClick={() => insertFormat('h3')} className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20 hover:bg-green-500/20 transition-all flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> T3 Verde</button>
                                        <button onClick={() => insertFormat('h4')} className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 text-[10px] font-bold border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Tópico Roxo</button>
                                        <button onClick={() => insertFormat('h5')} className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Sub Vermelho</button>
                                        <div className="w-px h-4 bg-white/10 mx-1 self-center"></div>
                                        <button onClick={() => insertFormat('bold')} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1"><Icons.Bold size={10}/> Negrito</button>
                                        <button onClick={() => insertFormat('list')} className="px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center gap-1"><Icons.List size={10}/> Lista</button>
                                    </div>

                                    <textarea 
                                        ref={newsTextareaRef}
                                        className={`w-full h-32 ${theme.inner} border ${theme.divider} ${theme.text} rounded-xl px-4 py-3 outline-none focus:border-opacity-50 resize-none text-sm`}
                                        placeholder="Conteúdo... (Cole imagens aqui)"
                                        value={newsContent}
                                        onChange={(e)=>setNewsContent(e.target.value)}
                                        onPaste={handlePaste}
                                    />
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-2">
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Icons.HelpCircle size={10}/> Dica de Formatação
                                        </p>
                                        <p className="text-[10px] opacity-60 leading-tight">
                                            Use os botões acima para formatar o texto com cores e estilos diferentes.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold opacity-60 ml-1">Sistemas Alvo</label>
                                        <div className="flex gap-2">
                                            {['Pg', 'Mip', 'Sv'].map(sys => (
                                                <button 
                                                    key={sys}
                                                    type="button"
                                                    onClick={() => {
                                                        if (targetSystems.includes(sys)) {
                                                            setTargetSystems(prev => prev.filter(s => s !== sys));
                                                        } else {
                                                            setTargetSystems(prev => [...prev, sys]);
                                                        }
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${targetSystems.includes(sys) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                                                >
                                                    {sys}
                                                </button>
                                            ))}
                                            <button 
                                                type="button"
                                                onClick={() => setTargetSystems(['Pg', 'Mip', 'Sv'])}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white/70"
                                            >
                                                Todos
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <input type="file" id="news-img-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            <label htmlFor="news-img-upload" className={`p-2 ${theme.inner} hover:bg-opacity-80 rounded-lg cursor-pointer ${theme.text} transition-colors`}><Icons.Image size={18}/></label>
                                            {newsImage && <button onClick={() => setNewsImage(null)} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Icons.X size={18}/></button>}
                                        </div>
                                        <Button theme={theme} onClick={handlePostNews} size="sm" variant="success" icon={Icons.Send}>Postar</Button>
                                    </div>
                                </div>
                            </div>

                            {/* TIMELINE DE ACESSOS */}
                            {isSuperAdmin && (
                                <div className={`${theme.card} p-6 rounded-3xl border ${theme.border} shadow-lg`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className={`font-bold ${theme.text} uppercase tracking-widest text-xs flex items-center gap-2`}><Icons.Shield size={14}/> Segurança</h4>
                                        <div className={`flex ${theme.inner} p-1 rounded-lg`}>
                                            <button onClick={()=>setSecurityTab('timeline')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${securityTab==='timeline' ? `${theme.primary} text-white shadow-sm` : 'opacity-40'}`}>Timeline</button>
                                            <button onClick={()=>setSecurityTab('blocked')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${securityTab==='blocked' ? 'bg-red-500/20 text-red-400 shadow-sm' : 'opacity-40'}`}>Bloqueados</button>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                                        {securityTab === 'timeline' ? ipHistory.slice(0, 20).map((log:any) => {
                                            const isBanned = blockedList.some(b => b.id === log.deviceId);
                                            const isTrusted = trustedDevices[log.deviceId];
                                            const deviceName = deviceLabels?.[log.deviceId];
                                            return (
                                                <div 
                                                    key={log.id} 
                                                    onClick={() => setSelectedLog(log)}
                                                    className={`p-3 rounded-xl border flex justify-between items-center group cursor-pointer transition-all hover:scale-[1.01] ${isTrusted ? 'bg-green-500/10 border-green-500/20' : `${theme.inner} border-transparent`}`}
                                                >
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold truncate ${isTrusted ? 'text-green-400' : theme.text}`}>{log.username}</span>
                                                            {isSuperAdmin && deviceName && <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{deviceName}</span>}
                                                            {isTrusted && <Icons.Check size={10} className="text-green-500" />}
                                                            <span className="text-[9px] opacity-30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                        </div>
                                                        <div className="text-[9px] opacity-40 truncate">
                                                            {log.ip} • {log.location?.display_name || 'Localização não identificada'}
                                                        </div>
                                                        {log.location?.coords?.lat != null && log.location?.coords?.lng != null && (
                                                            <div className="text-[8px] opacity-30 truncate">
                                                                Lat: {Number(log.location.coords.lat).toFixed(6)}, Lng: {Number(log.location.coords.lng).toFixed(6)}
                                                            </div>
                                                        )}
                                                        <div className="text-[8px] opacity-20 truncate">{log.deviceInfo?.browser || 'Browser'} • {log.deviceId?.substring(0,8)}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isTrusted && <span className="text-[8px] font-bold text-green-500/60 uppercase tracking-tighter">Seguro</span>}
                                                        {!isBanned && log.deviceId && (
                                                            <button 
                                                                onClick={(e)=>{ e.stopPropagation(); banDevice(log.deviceId, 'Ban Admin', log); }} 
                                                                className="opacity-0 group-hover:opacity-100 text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded transition-all"
                                                            >
                                                                Banir
                                                            </button>
                                                        )}
                                                        {isBanned && <Icons.Slash size={12} className="text-red-500" />}
                                                    </div>
                                                </div>
                                            );
                                        }) : blockedList.map((dev:any) => {
                                            const deviceName = deviceLabels?.[dev.id];
                                            return (
                                                <div 
                                                    key={dev.id} 
                                                    onClick={() => setSelectedLog({ ...dev, deviceId: dev.id })}
                                                    className={`bg-red-900/10 p-3 rounded-xl border border-red-500/20 flex justify-between items-center cursor-pointer hover:bg-red-900/20 transition-colors`}
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="text-[10px] font-mono text-red-200">{dev.id.substring(0,16)}...</div>
                                                        {isSuperAdmin && deviceName && <div className="text-[9px] font-bold text-blue-400 mt-1 uppercase tracking-tighter">{deviceName}</div>}
                                                    </div>
                                                    <IconButton theme={theme} onClick={(e)=>{ e.stopPropagation(); unbanDevice(dev.id); }} icon={Icons.Check} size={14} variant="success" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: HISTORICO */}
                {activeTab === 'historico' && (isAdmin || isSuperAdmin) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* History Controls */}
                        <div className={`${theme.card} p-4 rounded-2xl border ${theme.border} flex flex-wrap items-center justify-between gap-4`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${theme.accent} bg-opacity-10 rounded-xl`}>
                                    <Icons.Calendar size={20}/>
                                </div>
                                <div>
                                    <h3 className={`font-bold ${theme.text}`}>Logs de Atividade</h3>
                                    <p className="text-[10px] opacity-50 uppercase tracking-wider">Histórico dos últimos 30 dias</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <CustomDatePicker 
                                    value={historyDate}
                                    onChange={(date) => setHistoryDate(date)}
                                    theme={theme}
                                    themeKey={themeKey}
                                />
                            </div>
                        </div>

                        {/* Logs List */}
                        <div className="space-y-3">
                            {loadingLogs ? (
                                <div className="text-center py-20 opacity-40">
                                    <div className="animate-spin mb-4 inline-block">
                                        <Icons.Settings size={32}/>
                                    </div>
                                    <p>Carregando registros...</p>
                                </div>
                            ) : auditLogs.length > 0 ? (() => {
                                // Agrupamento por Sessão
                                const groups: any = {};
                                const filteredLogs = auditLogs.filter((log: any) => log.username !== 'Breno');
                                
                                filteredLogs.forEach((log: any) => {
                                    // Agrupamento por sessionId (novo) ou por Usuário+Data+Hora (legado)
                                    const dateObj = new Date(log.timestamp);
                                    const hourKey = `${log.username}-${log.date}-${dateObj.getHours()}`;
                                    
                                    // Se for Login, o ID é o próprio sessionId. Se for ação, usa o sessionId gravado.
                                    const sId = log.action === 'Login' ? log.id : (log.sessionId || `legacy-${hourKey}`);
                                    
                                    if (!groups[sId]) groups[sId] = { login: null, actions: [] };
                                    
                                    if (log.action === 'Login') {
                                        groups[sId].login = log;
                                    } else {
                                        groups[sId].actions.push(log);
                                    }
                                });

                                const sortedGroups = Object.keys(groups).map(id => ({ id, ...groups[id] }))
                                    .sort((a, b) => {
                                        const tA = a.login?.timestamp || a.actions[0]?.timestamp || 0;
                                        const tB = b.login?.timestamp || b.actions[0]?.timestamp || 0;
                                        return tB - tA;
                                    });

                                return sortedGroups.map((group: any) => {
                                    const isExpanded = expandedSessions.includes(group.id);
                                    const hasActions = group.actions.length > 0;
                                    const mainLog = group.login || group.actions[0];

                                    if (!mainLog) return null;

                                    return (
                                        <div key={group.id} className={`${theme.card} rounded-3xl border ${theme.border} overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-blue-500/30 shadow-2xl scale-[1.01]' : 'shadow-lg hover:shadow-xl hover:scale-[1.005]'}`}>
                                            {/* Header / Login Card */}
                                            <div 
                                                onClick={() => hasActions && setExpandedSessions(prev => isExpanded ? prev.filter(id => id !== group.id) : [...prev, group.id])}
                                                className={`p-5 flex items-start sm:items-center gap-5 cursor-pointer hover:bg-white/5 transition-all ${!hasActions ? 'cursor-default' : ''}`}
                                            >
                                                <div className={`w-14 h-14 rounded-2xl ${theme.accent} bg-opacity-10 border border-current border-opacity-20 flex flex-col items-center justify-center shadow-inner shrink-0`}>
                                                    <span className="text-xs font-black tracking-tighter">{formatTime(mainLog.timestamp)}</span>
                                                    <Icons.Clock size={12} className="opacity-40 mt-0.5" />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className={`font-black text-lg tracking-tight ${theme.accent}`}>{mainLog.username}</span>
                                                        {isSuperAdmin && deviceLabels?.[mainLog.deviceId] && (
                                                            <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-blue-500/20">
                                                                {deviceLabels[mainLog.deviceId]}
                                                            </span>
                                                        )}
                                                        <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20`}>
                                                            Sessão Ativa
                                                        </span>
                                                        {hasActions && (
                                                            <span className={`text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/40 px-2 py-0.5 rounded-lg border border-white/5`}>
                                                                {group.actions.length} {group.actions.length === 1 ? 'ação' : 'ações'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                        <p className={`text-sm ${theme.text} opacity-70 font-medium truncate max-w-md`}>
                                                            {group.login ? group.login.details : `Atividade registrada às ${formatTime(mainLog.timestamp)}`}
                                                        </p>
                                                        
                                                        <div className="flex items-center gap-2">
                                                            {mainLog.location?.coords?.lat != null && (
                                                                <span className="flex items-center gap-1 text-[10px] opacity-40 font-mono bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                                                    <Icons.MapPin size={10} />
                                                                    {Number(mainLog.location.coords.lat).toFixed(4)}, {Number(mainLog.location.coords.lng).toFixed(4)}
                                                                </span>
                                                            )}
                                                            {group.login?.ip && (
                                                                <span className="flex items-center gap-1 text-[10px] opacity-40 font-mono bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                                                    <Icons.Map size={10} />
                                                                    {group.login.ip}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {hasActions && (
                                                    <div className={`w-10 h-10 rounded-xl ${theme.inner} flex items-center justify-center shrink-0 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-opacity-100 shadow-md' : 'bg-opacity-40'}`}>
                                                        <Icons.ChevronDown size={20} className={isExpanded ? theme.accent : 'opacity-30'} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expanded Actions */}
                                            <AnimatePresence>
                                                {isExpanded && hasActions && (
                                                    <motion.div 
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className={`border-t ${theme.divider} ${theme.inner} bg-opacity-30 divide-y ${theme.divider} overflow-hidden`}
                                                    >
                                                        {group.actions.sort((a:any, b:any) => b.timestamp - a.timestamp).map((action: any, aIdx: number) => (
                                                            <div key={aIdx} className="p-4 pl-6 sm:pl-20 flex items-start sm:items-center gap-4 sm:gap-6 hover:bg-white/5 transition-colors group/item">
                                                                <div className="flex flex-col items-center gap-1 shrink-0">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500/50 group-hover/item:bg-blue-400 transition-colors"></div>
                                                                    <div className="text-[10px] font-black font-mono opacity-40 tracking-tighter group-hover/item:opacity-80 transition-opacity">
                                                                        {formatTime(action.timestamp)}
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0 bg-black/20 p-3 rounded-xl border border-white/5 group-hover/item:border-white/10 transition-colors">
                                                                    <div className="flex items-center gap-3 mb-1.5">
                                                                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${theme.accent} opacity-80`}>{action.action}</span>
                                                                    </div>
                                                                    <p className={`text-sm ${theme.text} opacity-80 font-medium leading-relaxed`}>{action.details}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                });
                            })() : (
                                <div className="text-center py-20 opacity-20 border-2 border-dashed border-white/10 rounded-2xl">
                                    <Icons.History size={48} className="mx-auto mb-4"/>
                                    <p className="font-bold">Nenhum registro encontrado para esta data.</p>
                                    <p className="text-xs mt-1">Tente selecionar outro dia no calendário.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <EditExpirationModal 
                isOpen={editExpModal.isOpen}
                onClose={() => setEditExpModal(prev => ({...prev, isOpen: false}))}
                system={editExpModal.system}
                currentExpiration={editExpModal.currentExpiration}
                onSave={handleSaveExpiration}
                theme={theme}
            />

            {/* MODAL DETALHES DO DISPOSITIVO */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`${theme.card} w-full max-w-md rounded-3xl border ${theme.border} shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
                        <div className={`p-6 border-b ${theme.divider} flex justify-between items-center`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${trustedDevices[selectedLog.deviceId] ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    <Icons.Smartphone size={20} />
                                </div>
                                <div>
                                    <h3 className={`font-bold ${theme.text}`}>Detalhes do Acesso</h3>
                                    <p className="text-[10px] opacity-50 uppercase tracking-widest">{selectedLog.username}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className={`p-2 hover:${theme.inner} rounded-full transition-colors`}>
                                <Icons.X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider}`}>
                                    <div className="text-[9px] opacity-40 uppercase font-bold mb-1">Navegador</div>
                                    <div className={`text-xs font-bold ${theme.text}`}>{selectedLog.deviceInfo?.browser || 'N/A'}</div>
                                </div>
                                <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider}`}>
                                    <div className="text-[9px] opacity-40 uppercase font-bold mb-1">Sistema</div>
                                    <div className={`text-xs font-bold ${theme.text}`}>{selectedLog.deviceInfo?.os || 'N/A'}</div>
                                </div>
                                <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider}`}>
                                    <div className="text-[9px] opacity-40 uppercase font-bold mb-1">Dispositivo</div>
                                    <div className={`text-xs font-bold ${theme.text}`}>{selectedLog.deviceInfo?.device || 'N/A'}</div>
                                </div>
                                <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider}`}>
                                    <div className="text-[9px] opacity-40 uppercase font-bold mb-1">IP</div>
                                    <div className={`text-xs font-bold ${theme.text} break-all`}>{selectedLog.ip || 'N/A'}</div>
                                </div>
                                {isSuperAdmin && (
                                    <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider} col-span-2`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="text-[9px] opacity-40 uppercase font-bold">Identificação do Aparelho</div>
                                            <button 
                                                onClick={() => {
                                                    const name = prompt("Dê um nome para este dispositivo:", deviceLabels?.[selectedLog.deviceId] || "");
                                                    if (name !== null) saveDeviceLabel(selectedLog.deviceId, name);
                                                }}
                                                className="text-[9px] text-blue-400 hover:underline"
                                            >
                                                Editar Nome
                                            </button>
                                        </div>
                                        <div className={`text-xs font-bold ${theme.text}`}>
                                            {deviceLabels?.[selectedLog.deviceId] || 'Sem nome definido'}
                                        </div>
                                    </div>
                                )}
                                <div className={`${theme.inner} p-3 rounded-xl border ${theme.divider} col-span-2`}>
                                    <div className="text-[9px] opacity-40 uppercase font-bold mb-1">ID do Aparelho</div>
                                    <div className={`text-[10px] font-mono ${theme.text} break-all opacity-60`}>{selectedLog.deviceId || 'N/A'}</div>
                                </div>
                            </div>

                            <div className={`${theme.inner} bg-opacity-50 p-4 rounded-xl border ${theme.divider}`}>
                                <div className="text-[9px] opacity-40 uppercase font-bold mb-2">Localização</div>
                                <div className={`text-[10px] ${theme.text} opacity-80 break-words leading-relaxed`}>
                                    {selectedLog.location?.display_name || selectedLog.location?.exact_address || 'Não identificada'}
                                </div>
                                {selectedLog.location?.coords?.lat && selectedLog.location?.coords?.lng && (
                                    <div className={`text-[9px] mt-2 font-mono ${theme.text} opacity-50`}>
                                        Lat: {selectedLog.location.coords.lat}, Lng: {selectedLog.location.coords.lng}
                                    </div>
                                )}
                            </div>

                            <div className={`${theme.inner} bg-opacity-50 p-4 rounded-xl border ${theme.divider}`}>
                                <div className="text-[9px] opacity-40 uppercase font-bold mb-2">Hardware / GPU</div>
                                <div className={`text-[10px] ${theme.text} opacity-80 break-words leading-relaxed`}>
                                    {selectedLog.deviceInfo?.gpu || 'Não identificado'}
                                </div>
                            </div>

                            {isSuperAdmin && (
                                <div className="pt-2 flex gap-3">
                                    <button 
                                        onClick={() => toggleTrustDevice(selectedLog.deviceId, selectedLog.deviceInfo)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                            trustedDevices[selectedLog.deviceId]
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                            : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                        }`}
                                    >
                                        {trustedDevices[selectedLog.deviceId] ? <Icons.X size={16}/> : <Icons.Check size={16}/>}
                                        {trustedDevices[selectedLog.deviceId] ? 'Remover Seguro' : 'Marcar como Seguro'}
                                    </button>
                                    
                                    {!blockedList.some(b => b.id === selectedLog.deviceId) && (
                                        <button 
                                            onClick={() => banDevice(selectedLog.deviceId, 'Ban Admin', selectedLog)}
                                            className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                        >
                                            Banir
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
