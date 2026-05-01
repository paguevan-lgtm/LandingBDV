import React from "react";
import { Icons, Button } from "../components/Shared";
import { formatDisplayDate, getTodayDate } from "../utils";

export default function Financeiro({
  data,
  theme,
  billingData,
  billingDate,
  prevBillingMonth,
  nextBillingMonth,
  togglePaymentStatus,
  sendBillingMessage,
  del,
  setFormData,
  setModal,
  openEditTrip,
  user,
  notify,
  systemContext,
  spList,
  pranchetaData,
  togglePranchetaPayment,
  weekId,
  pranchetaWeekOffset,
  setPranchetaWeekOffset,
  pranchetaValue,
  setPranchetaValue,
  sendPranchetaBillingMessage,
  pricePerPassenger,
  dbOp,
  logAction,
}: any) {
  const [financeiroTab, setFinanceiroTab] = React.useState("geral");
  const [caixinhaModal, setCaixinhaModal] = React.useState(false);
  const [caixinhaValue, setCaixinhaValue] = React.useState("");

  const [editingTripId, setEditingTripId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState("");

  // Verifica permissão para ver o total recebido
  const canSeeRevenue =
    user && (user.role === "admin" || user.username === "Breno");

  const formatCurrency = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0,00";
    return num.toFixed(2).replace(".", ",");
  };

  // --- Lógica do Caixa Diário ---
  const today = getTodayDate();
  // Viagens PAGAS hoje (independente de quando viajaram)
  let dailyTrips = (data.trips || []).filter(
    (t: any) =>
      t.paymentStatus === "Pago" &&
      t.receivedAt &&
      t.receivedAt.startsWith(today) &&
      t.status !== "Cancelada",
  );

  // Viagens que VIAJARAM hoje (independente de estarem pagas ou não)
  let tripsTraveledToday = (data.trips || []).filter(
    (t: any) => t.date === today && t.status !== "Cancelada",
  );

  // Filter by user role/ownership for operators
  if (user && user.role === "operador") {
    const isSelf = (u: string) => u === user.username;

    dailyTrips = dailyTrips.filter((t: any) => {
      const isStefanyLegacy =
        t.date === "2026-04-29" &&
        user.username === "Stefany" &&
        (!t.createdBy || t.createdBy === "Sistema");
      const owner = t.createdBy || "Sistema";
      // Para viagens de madrugada onde o dono é outra pessoa, eu só vejo se EU recebi o pagamento
      return (
        isSelf(t.receivedBy) ||
        (isSelf(owner) && !t.receivedBy) ||
        isStefanyLegacy
      );
    });

    tripsTraveledToday = tripsTraveledToday.filter((t: any) => {
      const isStefanyLegacy =
        t.date === "2026-04-29" &&
        user.username === "Stefany" &&
        (!t.createdBy || t.createdBy === "Sistema");
      const owner = t.createdBy || "Sistema";
      // Só vê se for o dono (responsável) ou se recebeu
      return isSelf(owner) || isSelf(t.receivedBy) || isStefanyLegacy;
    });
  }

  const calcTripValue = (t: any) => {
    // Se o valor foi explicitamente definido (mesmo que seja 0), use-o.
    if (t.value !== undefined && t.value !== null && t.value !== "") {
      return parseFloat(t.value);
    }

    let value = 0;
    let pCount = 0;

    if (t.isExtra) {
      value = parseFloat(t.value) || 0;
    } else if (t.isMadrugada) {
      pCount =
        t.pCountSnapshot !== undefined
          ? parseInt(t.pCountSnapshot || 0)
          : parseInt(t.pCount || 0);
      const unitPrice =
        Number(t.pricePerPassenger) ||
        Number(t.ticketPrice) ||
        pricePerPassenger ||
        4;
      value = pCount * unitPrice;
    } else {
      if (t.pCountSnapshot !== undefined && t.pCountSnapshot !== null) {
        pCount = parseInt(t.pCountSnapshot || 0);
      } else if (t.passengersSnapshot) {
        pCount = t.passengersSnapshot.reduce(
          (acc: number, p: any) => acc + parseInt(p.passengerCount || 1),
          0,
        );
      } else {
        pCount = data.passengers
          .filter((p: any) => (t.passengerIds || []).includes(p.realId || p.id))
          .reduce(
            (a: number, b: any) => a + parseInt(b.passengerCount || 1),
            0,
          );
      }
      const unitPrice =
        Number(t.pricePerPassenger) ||
        Number(t.ticketPrice) ||
        pricePerPassenger ||
        4;
      value = pCount * unitPrice;
      if (pCount === 0 && t.value) value = parseFloat(t.value);
    }
    return value;
  };

  const operatorTotals: Record<string, number> = {};
  let grandTotal = 0;

  dailyTrips.forEach((t: any) => {
    const val = calcTripValue(t);
    const receiver = t.receivedBy || "Desconhecido";
    if (!operatorTotals[receiver]) operatorTotals[receiver] = 0;
    operatorTotals[receiver] += val;
    grandTotal += val;
  });

  const myTotal = operatorTotals[user.username] || 0;
  // -----------------------------

  const saveTripValue = (tripId: string, newValue: string) => {
    const val = parseFloat(newValue.replace(",", "."));
    if (isNaN(val)) {
      notify("Valor inválido!", "error");
      return;
    }

    dbOp("update", "trips", { id: tripId, value: val });
    logAction("Valor Alterado", `Viagem #${tripId} alterada para R$ ${val}`);
    setEditingTripId(null);
    notify("Valor atualizado com sucesso!", "success");
  };

  const generateDailyReport = () => {
    const caixinha = parseFloat(caixinhaValue) || 0;
    const todayFormatted = new Date().toLocaleDateString("pt-BR");

    // 1. Passageiros que viajaram no dia (Trips que ocorreram hoje)
    const totalPassengers = tripsTraveledToday.reduce((acc: number, t: any) => {
      let pCount = 0;
      if (t.pCountSnapshot !== undefined)
        pCount = parseInt(t.pCountSnapshot || 0);
      else if (t.passengersSnapshot)
        pCount = t.passengersSnapshot.reduce(
          (a: number, p: any) => a + parseInt(p.passengerCount || 1),
          0,
        );
      else pCount = parseInt(t.pCount || 0);
      return acc + pCount;
    }, 0);

    // 2. Valor arrecadado com carro extra/frete (dos que foram PAGOS hoje)
    const extraValue = dailyTrips
      .filter((t: any) => t.isExtra)
      .reduce((acc: number, t: any) => acc + calcTripValue(t), 0);

    // 3. Pranchetas recebidas hoje
    const paidPranchetas = Object.entries(pranchetaData)
      .filter(([_, d]: [string, any]) => {
        const isPaidToday =
          d.paid && d.receivedAt && d.receivedAt.startsWith(today);
        if (!isPaidToday) return false;
        if (user && user.role === "operador") {
          return d.receivedBy === user.username;
        }
        return true;
      })
      .map(([vaga, _]) => vaga);

    const pranchetaTotal =
      paidPranchetas.length * (parseFloat(pranchetaValue) || 20);

    // 4. Débitos não recebidos (Pendentes do dia operacional)
    const pendingTrips = tripsTraveledToday.filter(
      (t: any) => t.paymentStatus !== "Pago",
    );
    const pendingTotal = pendingTrips.reduce(
      (acc: number, t: any) => acc + calcTripValue(t),
      0,
    );
    const pendingVagas = pendingTrips
      .map((t: any) => {
        if (t.isMadrugada) return `Madrugada (${t.vaga})`;
        const sp = spList.find((s: any) => s.name === t.driverName);
        return sp ? sp.vaga : t.driverName;
      })
      .filter(Boolean);

    // 5. Total Geral (O que entrou no caixa: Viagens Pagas + Pranchetas Pagas)
    // O usuário quer que o "Recebido Total" mostre apenas o que foi RECEBIDO.
    // grandTotal já é a soma de dailyTrips (viagens marcadas como pagas HOJE).
    const totalArrecadado = grandTotal + pranchetaTotal;

    // Débitos de dias anteriores recebidos hoje
    const pastDebtsPaidToday = dailyTrips.filter((t: any) => t.date !== today);
    const debtsByDate: Record<string, number> = {};
    pastDebtsPaidToday.forEach((t: any) => {
      const d = formatDisplayDate(t.date);
      debtsByDate[d] = (debtsByDate[d] || 0) + calcTripValue(t);
    });

    // Valor calculado de passageiros (conforme pedido: somatória dos valores das viagens do dia, respeitando edições)
    const totalRevenueCalculated = tripsTraveledToday.reduce(
      (acc: number, t: any) => acc + calcTripValue(t),
      0,
    );

    let report = `👤 *Atendente:* ${user.username}\n`;
    report += `📅 *Caixa do dia:* ${todayFormatted}\n\n`;

    report += `🚐 *Tivemos ${totalPassengers} passageiros* totalizando *R$ ${formatCurrency(totalRevenueCalculated)}* reais\n\n`;

    if (extraValue > 0) {
      report += `🚚 *+ R$ ${formatCurrency(extraValue)}* De carro extra/frete.\n\n`;
    }

    if (paidPranchetas.length > 0) {
      report += `📋 *Recebi ${paidPranchetas.length} prancheta(s)* das vagas: ${paidPranchetas.join(", ")}\n\n`;
    }

    if (Object.keys(debtsByDate).length > 0) {
      Object.entries(debtsByDate).forEach(([date, val]) => {
        report += `✅ *Recebi o débito do dia ${date} no valor de R$ ${formatCurrency(val)}.*\n\n`;
      });
    }

    if (pendingTotal > 0) {
      report += `⚠️ *Os seguintes débitos não foram recebidos:* R$ ${formatCurrency(pendingTotal)}\n📍 *Das seguintes vagas:* ${pendingVagas.join(", ")}\n\n`;
    }

    report += `💰 *Recebido Total:* R$ ${formatCurrency(totalArrecadado)}\n`;
    report += `💸 *Debito:* ${pendingTotal > 0 ? "R$ " + formatCurrency(pendingTotal) : "*sem debito*"}\n\n`;

    report += `🎁 *Caixinha:* R$ ${formatCurrency(caixinha)}`;

    // Copiar para o clipboard
    navigator.clipboard
      .writeText(report)
      .then(() => {
        notify("Relatório copiado para a área de transferência!", "success");
        setCaixinhaModal(false);
        setCaixinhaValue("");
      })
      .catch((err) => {
        console.error("Erro ao copiar relatório:", err);
        notify("Erro ao copiar relatório. Tente novamente.", "error");
      });
  };

  return (
    <div className="space-y-6">
      {/* Modal de Caixinha */}
      {caixinhaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className={`${theme.card} w-full max-w-sm p-6 rounded-2xl border ${theme.border} shadow-2xl anim-bounce-in`}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icons.Dollar className="text-yellow-400" /> Relatório do Dia
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold opacity-70">
                  Recebeu caixinha? Quanto:
                </label>
                <input
                  type="number"
                  className="bg-black/20 border border-white/10 text-white rounded-xl px-4 py-3 h-12 outline-none focus:border-yellow-500/50 transition-colors"
                  placeholder="0,00"
                  value={caixinhaValue}
                  onChange={(e) => setCaixinhaValue(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  theme={theme}
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setCaixinhaModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  theme={theme}
                  className="flex-1"
                  onClick={generateDailyReport}
                >
                  Gerar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho com Navegação de Mês */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 stagger-in d-1">
        <h3 className="text-lg font-bold opacity-80 flex items-center gap-2">
          <Icons.Dollar size={20} /> Financeiro
        </h3>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
          <button
            onClick={prevBillingMonth}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <Icons.ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold capitalize w-32 text-center">
            {billingDate.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={nextBillingMonth}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <Icons.ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Seletor de Abas (Geral / Prancheta) */}
      {systemContext === "Pg" && (
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 stagger-in d-1.5">
          <button
            onClick={() => setFinanceiroTab("geral")}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${financeiroTab === "geral" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"}`}
          >
            <Icons.Dollar size={16} /> Geral
          </button>
          <button
            onClick={() => setFinanceiroTab("prancheta")}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${financeiroTab === "prancheta" ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"}`}
          >
            <Icons.Clipboard size={16} /> Prancheta
          </button>
        </div>
      )}

      {financeiroTab === "geral" ? (
        <>
          {/* CAIXA DIÁRIO (NOVO) */}
          <div className="stagger-in d-2">
            <div
              id="tut-card-daily-cash"
              className={`${theme.card} p-6 rounded-xl border ${theme.border} bg-blue-500/10 border-blue-500/20 relative overflow-hidden`}
            >
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                    Caixa Diário ({canSeeRevenue ? "Geral" : "Meu"})
                  </div>
                  <div className="text-4xl font-bold text-white">
                    R$ {formatCurrency(canSeeRevenue ? grandTotal : myTotal)}
                  </div>
                  <div className="text-sm opacity-50 mt-1">
                    {canSeeRevenue
                      ? dailyTrips.length
                      : dailyTrips.filter(
                          (t: any) => t.receivedBy === user.username,
                        ).length}{" "}
                    pagamentos hoje
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                    <Icons.Dollar size={24} />
                  </div>
                  <button
                    onClick={() => setCaixinhaModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5"
                  >
                    <Icons.Clipboard size={14} /> Relatório
                  </button>
                </div>
              </div>

              {/* Detalhamento para Admin */}
              {canSeeRevenue && Object.keys(operatorTotals).length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                  {Object.entries(operatorTotals).map(([op, val]) => (
                    <div
                      key={op}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="opacity-60">
                        {op === "Breno" ? "Sistema" : op}
                      </span>
                      <span className="font-bold">
                        R$ {formatCurrency(val)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumo Topo (Mensal) */}
          <div
            className={`grid ${canSeeRevenue ? "grid-cols-2" : "grid-cols-1"} gap-4`}
          >
            <div
              id="tut-card-pending"
              className={`${theme.card} p-4 rounded-xl border ${theme.border} bg-red-500/10 border-red-500/20 stagger-in d-2`}
            >
              <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                A Receber (Pendente)
              </div>
              <div className="text-3xl font-bold text-white">
                R$ {formatCurrency(billingData.summary.pending)}
              </div>

              {/* Detalhamento de Débitos Mensais por Operador (Admin Only) */}
              {canSeeRevenue &&
                billingData.summary.perOperatorPending &&
                Object.keys(billingData.summary.perOperatorPending).length >
                  0 && (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    <div className="text-[10px] font-black opacity-40 uppercase tracking-tighter mb-2">
                      Débito por Operador (Mensal)
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {Object.entries(billingData.summary.perOperatorPending)
                        .sort((a: any, b: any) => b[1] - a[1])
                        .map(([op, val]) => (
                          <div
                            key={op}
                            className="flex justify-between items-center text-xs group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500/40 group-hover:bg-red-500 transition-colors"></div>
                              <span className="opacity-60">
                                {op === "Breno" ? "Sistema" : op}
                              </span>
                            </div>
                            <span className="font-bold opacity-80">
                              R$ {formatCurrency(val as number)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {canSeeRevenue && (
              <div
                className={`${theme.card} p-4 rounded-xl border ${theme.border} bg-green-500/10 border-green-500/20 stagger-in d-3`}
              >
                <div className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">
                  Recebido (Pago)
                </div>
                <div className="text-3xl font-bold text-white">
                  R$ {formatCurrency(billingData.summary.paid)}
                </div>
              </div>
            )}
          </div>

          {/* Lista Agrupada por Dia */}
          <div className="space-y-6 stagger-in d-4">
            {billingData.groups.length > 0 ? (
              billingData.groups.map((group: any, idx: number) => {
                const [y, m, d] = group.date.split("-");
                const monthNames = [
                  "Janeiro",
                  "Fevereiro",
                  "Março",
                  "Abril",
                  "Maio",
                  "Junho",
                  "Julho",
                  "Agosto",
                  "Setembro",
                  "Outubro",
                  "Novembro",
                  "Dezembro",
                ];
                const displayDate = `${d} de ${monthNames[parseInt(m) - 1]}`;

                return (
                  <div
                    key={group.date}
                    className="anim-fade"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <h3 className="flex items-center gap-3 text-sm font-bold opacity-60 uppercase tracking-widest mb-3 pl-1">
                      <span>{displayDate}</span>
                      <div className="h-[1px] bg-white/10 flex-1"></div>
                      {/* Só mostra o total do dia se for admin, pois contém valores pagos */}
                      {canSeeRevenue && (
                        <span className="text-white/40">
                          Total: R$ {formatCurrency(group.totalValue)}
                        </span>
                      )}
                    </h3>

                    <div className="space-y-3">
                      {group.trips.map((trip: any) => (
                        <div
                          id="tut-billing-item"
                          key={trip.id}
                          className={`${theme.card} p-4 rounded-xl border ${theme.border} flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden ${trip.status === "Cancelada" ? "opacity-75 grayscale" : ""}`}
                        >
                          {trip.status === "Cancelada" && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
                              <div className="absolute left-4 right-4 h-[2px] bg-red-500/70 top-1/2 transform -translate-y-1/2 pointer-events-none"></div>
                              <div className="bg-red-500 text-white font-black px-4 py-1.5 rounded-lg uppercase tracking-widest text-sm shadow-xl z-30">
                                Viagem Cancelada
                              </div>
                            </div>
                          )}

                          {/* Indicador Lateral de Status */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 ${trip.status === "Cancelada" ? "bg-red-900" : trip.isPaid ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold bg-white/5 border border-white/10 shrink-0 ${!trip.isExtra && !trip.isMadrugada && trip.time && trip.time.length > 3 ? "text-xs" : "text-lg"}`}
                            >
                              {trip.isExtra ? (
                                <Icons.Car size={24} />
                              ) : trip.isMadrugada ? (
                                <Icons.Moon size={24} />
                              ) : trip.time &&
                                trip.time
                                  .toLowerCase()
                                  .includes("madrugada") ? (
                                "Mad."
                              ) : trip.time && trip.time.includes(":") ? (
                                trip.time.split(":")[0] + "h"
                              ) : (
                                trip.time
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {trip.isExtra ? (
                                <>
                                  <div className="font-bold text-lg flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="truncate">
                                      {trip.driverName}
                                    </span>
                                    <div className="flex gap-1 shrink-0">
                                      {trip.extraType === "Carro Extra" ? (
                                        <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase shrink-0">
                                          Carro Extra
                                        </span>
                                      ) : trip.extraType ===
                                          "Cobrança Manual" ||
                                        !trip.extraType ? (
                                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 uppercase shrink-0">
                                          Cobrança Manual
                                        </span>
                                      ) : (
                                        <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 uppercase shrink-0">
                                          {trip.extraType}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm opacity-60 flex items-center gap-2">
                                    <Icons.Calendar
                                      size={12}
                                      className="opacity-50 shrink-0"
                                    />
                                    <span className="truncate">
                                      {formatDisplayDate(trip.date)} às{" "}
                                      {trip.time}
                                    </span>
                                  </div>
                                  {trip.createdBy && (
                                    <div className="text-[10px] opacity-40 font-bold uppercase tracking-wider mt-1">
                                      Criado por: {trip.createdBy}
                                    </div>
                                  )}
                                  <div className="text-sm opacity-60 italic max-w-[200px] truncate mt-1">
                                    {trip.notes || "Sem observação"}
                                  </div>
                                </>
                              ) : trip.isMadrugada ? (
                                <>
                                  <div className="font-bold text-lg flex items-center gap-2 min-w-0">
                                    <span className="truncate">
                                      {trip.driverName}
                                    </span>
                                    <div className="flex gap-1 items-center">
                                      <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase shrink-0">
                                        Madrugada
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm opacity-60 flex items-center gap-2">
                                    <span className="truncate">
                                      {trip.pCount} passageiros
                                    </span>
                                    <span className="shrink-0">
                                      Vaga {trip.vaga}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-lg flex items-center gap-2 min-w-0">
                                    <span className="truncate">
                                      {trip.driverName}
                                    </span>
                                    <div className="flex gap-1 items-center">
                                      {trip.isTemp && (
                                        <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase shrink-0">
                                          Temp
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-sm opacity-60 flex items-center gap-2">
                                    <span className="truncate">
                                      {trip.pCount} passageiros
                                    </span>
                                    <span className="font-mono shrink-0">
                                      #{trip.id}
                                    </span>
                                  </div>
                                </>
                              )}
                              {/* Mostra quem recebeu o pagamento se estiver pago */}
                              {trip.isPaid && trip.receivedBy && (
                                <div className="text-[10px] text-green-500/70 font-medium mt-1 flex items-center gap-1">
                                  <Icons.CheckCircle
                                    size={10}
                                    className="shrink-0"
                                  />{" "}
                                  <span className="truncate">
                                    Recebido por{" "}
                                    {trip.receivedBy === "Breno"
                                      ? "Sistema"
                                      : trip.receivedBy}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3 md:gap-6 bg-black/20 p-3 md:p-0 md:bg-transparent rounded-lg">
                            <div className="flex flex-col items-start md:items-end px-1 md:px-0">
                              <div className="text-xs opacity-50 uppercase font-bold">
                                Valor
                              </div>
                              <div className="text-xl font-bold text-yellow-400 whitespace-nowrap flex items-center gap-2">
                                {editingTripId === trip.id ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm opacity-50">R$</span>
                                    <input
                                      type="text"
                                      className="w-20 bg-black/40 border border-white/20 rounded px-2 py-0.5 text-sm outline-none focus:border-yellow-500/50"
                                      value={editingValue}
                                      onChange={(e) =>
                                        setEditingValue(e.target.value)
                                      }
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          saveTripValue(trip.id, editingValue);
                                        if (e.key === "Escape")
                                          setEditingTripId(null);
                                      }}
                                    />
                                    <button
                                      onClick={() =>
                                        saveTripValue(trip.id, editingValue)
                                      }
                                      className="p-1 hover:text-green-400"
                                    >
                                      <Icons.CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingTripId(null)}
                                      className="p-1 hover:text-red-400"
                                    >
                                      <Icons.X size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    R$ {formatCurrency(trip.value)}
                                    <button
                                      onClick={() => {
                                        setEditingTripId(trip.id);
                                        setEditingValue(
                                          trip.value.toString().replace(".", ","),
                                        );
                                      }}
                                      className="p-1 text-white/20 hover:text-yellow-400 transition-colors"
                                      title="Editar Valor"
                                    >
                                      <Icons.Edit size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 items-center ml-auto md:ml-0">
                              <button
                                id="tut-btn-toggle-payment"
                                onClick={() => togglePaymentStatus(trip)}
                                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border transition-all active:scale-95 ${trip.isPaid ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}`}
                              >
                                {trip.isPaid ? (
                                  <Icons.CheckCircle size={14} />
                                ) : (
                                  <Icons.Clock size={14} />
                                )}
                                {trip.isPaid ? "PAGO" : "PENDENTE"}
                              </button>

                              {/* Botão de Editar */}
                              <button
                                id="tut-btn-edit-billing"
                                onClick={() => openEditTrip(trip)}
                                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex-shrink-0"
                                title="Editar Viagem/Cobrança"
                              >
                                <Icons.Edit size={16} />
                              </button>

                              <button
                                id="tut-btn-wa-billing"
                                onClick={() => sendBillingMessage(trip)}
                                className="px-3 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition-colors shadow-lg active:scale-95 flex-shrink-0"
                                title="Cobrar no WhatsApp"
                              >
                                <Icons.Message size={16} />
                              </button>

                              <button
                                id="tut-btn-del-billing"
                                onClick={() => del("trips", trip.id)}
                                className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex-shrink-0"
                                title="Excluir Cobrança/Viagem"
                              >
                                <Icons.Trash size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 opacity-30 text-sm border-2 border-dashed border-white/10 rounded-xl">
                Nenhuma viagem registrada em{" "}
                {billingDate.toLocaleDateString("pt-BR", { month: "long" })}.
              </div>
            )}
          </div>
        </>
      ) : (
        /* SEÇÃO PRANCHETA (NOVA) */
        <div className="space-y-6 stagger-in d-5">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-lg font-bold opacity-80 flex items-center gap-2">
              <Icons.Clipboard size={20} /> Cobrança Prancheta (Sistema PG)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPranchetaWeekOffset(pranchetaWeekOffset - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Semana Anterior"
              >
                <Icons.ChevronLeft size={16} />
              </button>
              <div className="text-xs font-mono opacity-50 bg-white/5 px-2 py-1 rounded">
                Semana: {weekId}
              </div>
              <button
                onClick={() => setPranchetaWeekOffset(pranchetaWeekOffset + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Próxima Semana"
              >
                <Icons.ChevronRight size={16} />
              </button>
              {pranchetaWeekOffset !== 0 && (
                <button
                  onClick={() => setPranchetaWeekOffset(0)}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 ml-2"
                >
                  Atual
                </button>
              )}
            </div>
          </div>

          {/* Editor de Valor da Prancheta (PG) - MOVIDO PARA MENU DO USUÁRIO */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 23 }, (_, i) =>
              i.toString().padStart(2, "0"),
            ).map((vaga) => {
              const driverInVaga = spList.find((s: any) => s.vaga === vaga);
              const payment = pranchetaData[vaga];

              // Show global status but identify receiver
              const isPaid = payment?.paid;
              const receivedBySelf = payment?.receivedBy === user.username;

              const driverInfo = driverInVaga
                ? data.drivers.find((d: any) => d.name === driverInVaga.name)
                : null;

              return (
                <div
                  key={vaga}
                  className={`${theme.card} p-3 rounded-xl border ${theme.border} flex items-center justify-between gap-3 transition-all hover:bg-white/5`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm border ${isPaid ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-white/40"}`}
                    >
                      {vaga}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`font-bold truncate ${isPaid ? "opacity-50 line-through" : ""}`}
                      >
                        {driverInVaga ? (
                          driverInVaga.name
                        ) : (
                          <span className="opacity-20 italic">Vazia</span>
                        )}
                      </div>
                      {isPaid && (
                        <div
                          className={`text-[10px] font-medium ${receivedBySelf ? "text-green-500" : "text-amber-500/70"}`}
                        >
                          Recebido por{" "}
                          {payment.receivedBy === "Breno"
                            ? "Sistema"
                            : payment.receivedBy}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {driverInVaga && (
                      <button
                        onClick={() => {
                          const phone = driverInfo?.phone || "";
                          sendPranchetaBillingMessage(
                            vaga,
                            driverInVaga.name,
                            phone,
                          );
                        }}
                        className="p-2 rounded-lg bg-green-600/20 text-green-500 hover:bg-green-600/30 transition-colors"
                        title="WhatsApp"
                      >
                        <Icons.Message size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => togglePranchetaPayment(vaga)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] border transition-all active:scale-95 ${isPaid ? "bg-green-500 text-white border-green-500" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"}`}
                    >
                      {isPaid ? "PAGO" : "PENDENTE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
