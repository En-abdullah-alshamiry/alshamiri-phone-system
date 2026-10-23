import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Smartphone,
  Phone,
  User,
  Printer,
  ChevronLeft,
  X,
  PlusCircle,
  Trash2,
  DollarSign,
  ShieldCheck,
  Check,
  Lock,
  Bell,
  Calendar,
  CalendarClock,
  History,
  AlertCircle,
  ClockAlert,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MaintenanceTicket,
  MaintenanceStatus,
  Currency,
  Product,
  ExchangeRates,
  MaintenanceSparePartUsed,
} from '../../types';
import {
  formatMoney,
  convertCurrency,
  formatDate,
  generateCode,
  CURRENCY_CONFIG,
} from '../../utils/formatters';
import { PatternLockDrawer } from '../common/PatternLockDrawer';

export function getDeliveryTimingInfo(ticket: MaintenanceTicket) {
  const isDelivered = ticket.status === 'delivered' || ticket.status === 'cancelled';
  const hasHistory = Boolean(ticket.deliveryDateHistory && ticket.deliveryDateHistory.length > 0);
  const lastHistory = hasHistory ? ticket.deliveryDateHistory![ticket.deliveryDateHistory!.length - 1] : null;

  if (isDelivered) {
    return {
      urgency: 'none' as const,
      isOverdue: false,
      isApproaching: false,
      isRescheduled: hasHistory,
      lastHistory,
      label: 'تم التسليم والمحاسبة',
      badgeClass: 'bg-slate-100 text-slate-500 border border-slate-200',
      countdownText: 'مكتمل',
    };
  }

  if (!ticket.expectedDeliveryDate) {
    return {
      urgency: 'none' as const,
      isOverdue: false,
      isApproaching: false,
      isRescheduled: hasHistory,
      lastHistory,
      label: 'لم يحدد موعد',
      badgeClass: 'bg-slate-100 text-slate-400 border border-slate-200',
      countdownText: 'غير محدد',
    };
  }

  const now = Date.now();
  const target = new Date(ticket.expectedDeliveryDate).getTime();
  const diffMs = target - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Overdue
  if (diffMs < 0) {
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    const text = absHours >= 24 ? `متأخر منذ ${absDays} يوم!` : `متأخر منذ ${absHours} ساعة!`;
    return {
      urgency: 'overdue' as const,
      isOverdue: true,
      isApproaching: false,
      isRescheduled: hasHistory,
      lastHistory,
      label: 'متأخر عن موعد التسليم!',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300 font-black animate-pulse',
      countdownText: text,
      diffHours,
    };
  }

  // Approaching (<= 24 hours)
  if (diffHours <= 24) {
    const text = diffHours <= 1 ? 'خلال أقل من ساعة اليوم!' : `متبقي ${diffHours} ساعة اليوم`;
    return {
      urgency: 'approaching' as const,
      isOverdue: false,
      isApproaching: true,
      isRescheduled: hasHistory,
      lastHistory,
      label: 'يقترب موعد التسليم اليوم',
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      countdownText: text,
      diffHours,
    };
  }

  // Normal upcoming
  return {
    urgency: 'normal' as const,
    isOverdue: false,
    isApproaching: false,
    isRescheduled: hasHistory,
    lastHistory,
    label: `متبقي ${diffDays} يوم`,
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    countdownText: `متبقي ${diffDays} يوم`,
    diffHours,
  };
}

interface MaintenanceViewProps {
  tickets: MaintenanceTicket[];
  products: Product[];
  exchangeRates: ExchangeRates;
  onSaveTicket: (ticket: MaintenanceTicket, deductSpareParts?: boolean) => void;
  onUpdateTicketStatus: (ticketId: string, status: MaintenanceStatus) => void;
  onPrintTicket: (ticket: MaintenanceTicket, type: 'maintenance_reception' | 'maintenance_delivery') => void;
  selectedTicketId?: string | null;
  onClearSelectedTicket?: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  tickets,
  products,
  exchangeRates,
  onSaveTicket,
  onUpdateTicketStatus,
  onPrintTicket,
  selectedTicketId,
  onClearSelectedTicket,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New ticket modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [activeTicketDetails, setActiveTicketDetails] = useState<MaintenanceTicket | null>(null);

  // Auto-open ticket if selected from external (like Dashboard)
  React.useEffect(() => {
    if (selectedTicketId) {
      const found = tickets.find((t) => t.id === selectedTicketId);
      if (found) {
        setActiveTicketDetails(found);
      }
    }
  }, [selectedTicketId, tickets]);

  // Reception Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceBrand, setDeviceBrand] = useState('Apple');
  const [deviceModel, setDeviceModel] = useState('');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [lockType, setLockType] = useState<'pattern' | 'pin' | 'none'>('pin');
  const [lockCode, setLockCode] = useState('');
  const [receivedAccessories, setReceivedAccessories] = useState<string[]>(['بدون ملحقات']);
  const [deviceConditionNotes, setDeviceConditionNotes] = useState('');
  const [technicianName, setTechnicianName] = useState('المهندس ياسين');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [costCurrency, setCostCurrency] = useState<Currency>('YER');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositCurrency, setDepositCurrency] = useState<Currency>('YER');
  const [notes, setNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    d.setMinutes(0);
    return d.toISOString().slice(0, 16);
  });

  // Reschedule Delivery Date Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleTechnician, setRescheduleTechnician] = useState('المهندس ياسين');
  const [reminderFilter, setReminderFilter] = useState<'all' | 'overdue' | 'approaching' | 'rescheduled'>('all');
  const [showRemindersCard, setShowRemindersCard] = useState(true);

  // Active tickets & reminders grouping
  const activeTickets = useMemo(() => {
    return tickets.filter((t) => t.status !== 'delivered' && t.status !== 'cancelled');
  }, [tickets]);

  const overdueTickets = useMemo(() => {
    return activeTickets.filter((t) => getDeliveryTimingInfo(t).urgency === 'overdue');
  }, [activeTickets]);

  const approachingTickets = useMemo(() => {
    return activeTickets.filter((t) => getDeliveryTimingInfo(t).urgency === 'approaching');
  }, [activeTickets]);

  const rescheduledTickets = useMemo(() => {
    return activeTickets.filter((t) => (t.deliveryDateHistory?.length || 0) > 0);
  }, [activeTickets]);

  const totalReminderAlerts = overdueTickets.length + approachingTickets.length + rescheduledTickets.length;

  // Filtered reminder list for the reminders banner
  const displayedReminderTickets = useMemo(() => {
    if (reminderFilter === 'overdue') return overdueTickets;
    if (reminderFilter === 'approaching') return approachingTickets;
    if (reminderFilter === 'rescheduled') return rescheduledTickets;
    // 'all' includes union of all tickets needing attention
    const set = new Map<string, MaintenanceTicket>();
    overdueTickets.forEach((t) => set.set(t.id, t));
    approachingTickets.forEach((t) => set.set(t.id, t));
    rescheduledTickets.forEach((t) => set.set(t.id, t));
    return Array.from(set.values());
  }, [reminderFilter, overdueTickets, approachingTickets, rescheduledTickets]);

  // Spare parts modal inside ticket details
  const [selectedSparePartId, setSelectedSparePartId] = useState('');
  const [sparePartQty, setSparePartQty] = useState(1);
  const [sparePartPrice, setSparePartPrice] = useState(0);

  // Available spare parts in inventory
  const availableSpareParts = useMemo(() => {
    return products.filter((p) => p.category === 'spare_parts' || p.category === 'batteries');
  }, [products]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        !term ||
        t.ticketNumber.toLowerCase().includes(term) ||
        t.customerName.toLowerCase().includes(term) ||
        t.customerPhone.includes(term) ||
        t.deviceModel.toLowerCase().includes(term) ||
        (t.imei && t.imei.toLowerCase().includes(term));
      return matchStatus && matchSearch;
    });
  }, [tickets, statusFilter, searchTerm]);

  // Pipeline Status Columns configuration
  const pipelineColumns: { id: MaintenanceStatus; title: string; color: string; badge: string }[] = [
    { id: 'received', title: 'قيد الفحص والاستلام', color: 'border-slate-300', badge: 'bg-slate-100 text-slate-700' },
    { id: 'waiting_parts', title: 'بانتظار قطع الغيار', color: 'border-amber-400', badge: 'bg-amber-100 text-amber-800' },
    { id: 'in_repair', title: 'جاري الإصلاح بالورشة', color: 'border-indigo-400', badge: 'bg-indigo-100 text-indigo-800' },
    { id: 'ready', title: 'جاهز للتسليم', color: 'border-emerald-400', badge: 'bg-emerald-100 text-emerald-800' },
    { id: 'delivered', title: 'تم التسليم والمحاسبة', color: 'border-blue-300', badge: 'bg-blue-100 text-blue-800' },
  ];

  // Submit new reception ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deviceModel || !issueDescription) {
      alert('يرجى تعبئة اسم العميل ونوع الجهاز ووصف العطل');
      return;
    }

    const ticketNumber = generateCode('REP');
    const newTicket: MaintenanceTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      customerName,
      customerPhone,
      deviceBrand,
      deviceModel,
      color,
      imei: imei.trim(),
      issueDescription,
      lockType,
      lockCode,
      receivedAccessories,
      deviceConditionNotes,
      status: 'received',
      technicianName,
      estimatedCost,
      costCurrency,
      depositAmount,
      depositCurrency,
      laborFee: estimatedCost,
      spareParts: [],
      finalAmount: estimatedCost,
      finalCurrency: costCurrency,
      paymentStatus: depositAmount >= estimatedCost && estimatedCost > 0 ? 'paid' : depositAmount > 0 ? 'partially_paid' : 'unpaid',
      receivedAt: new Date().toISOString(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
      notes,
    };

    onSaveTicket(newTicket);
    setIsNewTicketOpen(false);

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setDeviceModel('');
    setColor('');
    setImei('');
    setIssueDescription('');
    setLockCode('');
    setEstimatedCost(0);
    setDepositAmount(0);

    // Prompt print reception ticket
    onPrintTicket(newTicket, 'maintenance_reception');
  };

  // Reschedule delivery date handler
  const handleSaveRescheduledDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketDetails || !rescheduleDate) return;

    const previous = activeTicketDetails.expectedDeliveryDate;
    const newEntry = {
      changedAt: new Date().toISOString(),
      previousDate: previous,
      newDate: new Date(rescheduleDate).toISOString(),
      reason: rescheduleReason.trim() || 'تأجيل الموعد بطلب من الورشة / العميل',
      changedBy: rescheduleTechnician || activeTicketDetails.technicianName,
    };

    const updatedHistory = [...(activeTicketDetails.deliveryDateHistory || []), newEntry];
    const updatedTicket: MaintenanceTicket = {
      ...activeTicketDetails,
      expectedDeliveryDate: new Date(rescheduleDate).toISOString(),
      deliveryDateHistory: updatedHistory,
    };

    onSaveTicket(updatedTicket);
    setActiveTicketDetails(updatedTicket);
    setIsRescheduleModalOpen(false);
    setRescheduleReason('');
  };

  // Add spare part to active ticket
  const handleAddSparePart = () => {
    if (!activeTicketDetails || !selectedSparePartId) return;
    const part = products.find((p) => p.id === selectedSparePartId);
    if (!part) return;

    if (part.quantity < sparePartQty) {
      alert('الكمية المتوفرة بالمخزن لا تكفي!');
      return;
    }

    const newPart: MaintenanceSparePartUsed = {
      productId: part.id,
      name: part.name,
      quantity: sparePartQty,
      costPrice: part.costPrice,
      costCurrency: part.costCurrency,
      chargedPrice: sparePartPrice > 0 ? sparePartPrice : part.salePrice,
      chargedCurrency: part.saleCurrency,
    };

    const updatedParts = [...activeTicketDetails.spareParts, newPart];
    const partsTotalInTicketCurr = updatedParts.reduce((sum, sp) => {
      const conv = convertCurrency(
        sp.chargedPrice * sp.quantity,
        sp.chargedCurrency,
        activeTicketDetails.finalCurrency,
        exchangeRates
      );
      return sum + conv;
    }, 0);

    const updatedTicket: MaintenanceTicket = {
      ...activeTicketDetails,
      spareParts: updatedParts,
      finalAmount: activeTicketDetails.laborFee + partsTotalInTicketCurr,
    };

    setActiveTicketDetails(updatedTicket);
    onSaveTicket(updatedTicket, true); // Deducts inventory
    setSelectedSparePartId('');
  };

  // Deliver ticket and settle payment
  const handleDeliverAndPay = (ticket: MaintenanceTicket) => {
    const updated: MaintenanceTicket = {
      ...ticket,
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      completedAt: ticket.completedAt || new Date().toISOString(),
      paymentStatus: 'paid',
    };
    onSaveTicket(updated);
    setActiveTicketDetails(updated);

    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch {}

    onPrintTicket(updated, 'maintenance_delivery');
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                قسم صيانة واستقبال الأجهزة
              </h1>
              <p className="text-xs text-slate-500">
                إدارة كروت الاستقبال، تتبع الفحص والإصلاح، رسم النمط، وإضافة قطع الغيار
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              لوحة المراحل (Kanban)
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              جدول القائمة
            </button>
          </div>

          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>كرت استقبال جهاز جديد</span>
          </button>
        </div>
      </div>

      {/* AUTOMATIC DELIVERY REMINDERS & SCHEDULE CHANGES CARD */}
      {showRemindersCard && totalReminderAlerts > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 border border-slate-700 shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    تنبيهات وتذكيرات مواعيد تسليم الأجهزة للعملاء
                  </h3>
                  <span className="text-[11px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                    {totalReminderAlerts} تنبيه موعد
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  أجهزة متأخرة عن الموعد المتفق عليه، أجهزة موعد تسليمها اليوم، أو تم تعديل موعد استلامها
                </p>
              </div>
            </div>

            {/* Sub-Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl text-xs overflow-x-auto self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setReminderFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  reminderFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل ({totalReminderAlerts})
              </button>
              {overdueTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReminderFilter('overdue')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    reminderFilter === 'overdue' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-white'
                  }`}
                >
                  متأخرة ({overdueTickets.length})
                </button>
              )}
              {approachingTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReminderFilter('approaching')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    reminderFilter === 'approaching' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:text-white'
                  }`}
                >
                  اليوم ({approachingTickets.length})
                </button>
              )}
              {rescheduledTickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setReminderFilter('rescheduled')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    reminderFilter === 'rescheduled' ? 'bg-sky-600 text-white' : 'text-sky-400 hover:text-white'
                  }`}
                >
                  تم تعديل موعدها ({rescheduledTickets.length})
                </button>
              )}
            </div>
          </div>

          {/* Alert Tickets Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-3 max-h-72 overflow-y-auto">
            {displayedReminderTickets.map((ticket) => {
              const timing = getDeliveryTimingInfo(ticket);
              return (
                <div
                  key={ticket.id}
                  onClick={() => setActiveTicketDetails(ticket)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-slate-850 hover:bg-slate-800 hover:border-amber-400 flex flex-col justify-between text-xs space-y-2 group ${
                    timing.isOverdue
                      ? 'border-rose-500/50 shadow-sm shadow-rose-950/50'
                      : timing.isApproaching
                      ? 'border-amber-500/50'
                      : 'border-slate-700'
                  }`}
                  title="اضغط لفتح كرت الصيانة ومتابعة الإصلاح"
                >
                  <div>
                    {/* Header Row: Device & Urgency Badge */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-amber-400 font-bold" dir="ltr">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-white text-xs">
                            {ticket.deviceBrand} {ticket.deviceModel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                          العميل: {ticket.customerName} ({ticket.customerPhone})
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shrink-0 ${timing.badgeClass}`}>
                        {timing.countdownText}
                      </span>
                    </div>

                    {/* Rescheduled notice banner */}
                    {timing.isRescheduled && timing.lastHistory && (
                      <div className="p-2 rounded-xl bg-sky-950/80 border border-sky-800/80 text-[11px] text-sky-200 space-y-0.5 mb-1.5">
                        <div className="flex items-center gap-1 font-bold text-sky-300">
                          <History className="w-3.5 h-3.5 text-sky-400" />
                          <span>تغير موعد استلام الجهاز</span>
                        </div>
                        <p className="line-clamp-2 text-[10px] text-slate-300">
                          السبب: {timing.lastHistory.reason}
                        </p>
                        {timing.lastHistory.previousDate && (
                          <p className="text-[9px] text-slate-400 font-mono" dir="ltr">
                            الموعد السابق كان: {formatDate(timing.lastHistory.previousDate)}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-slate-400 text-[11px] line-clamp-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                      العطل: {ticket.issueDescription}
                    </p>
                  </div>

                  {/* Footer Row */}
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      الموعد: {ticket.expectedDeliveryDate ? formatDate(ticket.expectedDeliveryDate) : 'غير محدد'}
                    </span>
                    <span className="text-indigo-400 font-bold group-hover:text-indigo-300 flex items-center gap-0.5">
                      <span>فتح الكرت</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الكرت، اسم العميل، الهاتف، موديل الجهاز أو الـ IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2 text-xs focus:ring-2 focus:ring-amber-500/30 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 shrink-0 font-medium">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
          >
            <option value="all">جميع الحالات</option>
            <option value="received">قيد الفحص</option>
            <option value="waiting_parts">انتظار قطع</option>
            <option value="in_repair">جاري الإصلاح</option>
            <option value="ready">جاهز للتسليم</option>
            <option value="delivered">تم التسليم</option>
          </select>
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {pipelineColumns.map((col) => {
            const colTickets = filteredTickets.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/90 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <span>{col.title}</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                    {colTickets.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTickets.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-[11px] border-2 border-dashed border-slate-200 rounded-xl">
                      لا توجد أجهزة
                    </div>
                  ) : (
                    colTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        onClick={() => setActiveTicketDetails(ticket)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer text-xs space-y-2 relative group"
                      >
                        {/* Top: Ticket Number & Device */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-slate-400" dir="ltr">
                              {ticket.ticketNumber}
                            </span>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                              {ticket.deviceBrand} {ticket.deviceModel}
                            </h4>
                          </div>

                          {ticket.lockType === 'pattern' && (
                            <span className="text-[10px] bg-slate-900 text-sky-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              نمط
                            </span>
                          )}
                          {ticket.lockType === 'pin' && (
                            <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold" dir="ltr">
                              {ticket.lockCode}
                            </span>
                          )}
                        </div>

                        {/* Customer & Issue */}
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-800">{ticket.customerName}</p>
                          <p className="text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {ticket.issueDescription}
                          </p>
                        </div>

                        {/* Delivery Date Tag & Rescheduled indicator */}
                        {ticket.expectedDeliveryDate && (
                          <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 flex items-center gap-1 font-medium">
                              <CalendarClock className="w-3 h-3 text-slate-400" />
                              موعد التسليم:
                            </span>
                            <div className="flex items-center gap-1">
                              {ticket.deliveryDateHistory && ticket.deliveryDateHistory.length > 0 && (
                                <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded text-[9px] font-bold" title="تم تعديل وتأجيل موعد الاستلام">
                                  🔄 معدل ({ticket.deliveryDateHistory.length})
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${getDeliveryTimingInfo(ticket).badgeClass}`}>
                                {getDeliveryTimingInfo(ticket).countdownText}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Financials & Technician */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-indigo-700" dir="ltr">
                            {formatMoney(ticket.finalAmount, ticket.finalCurrency)}
                          </span>

                          <span className="text-slate-400 text-[10px]">
                            {ticket.technicianName || 'الورشة'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">رقم الكرت</th>
                  <th className="p-3">العميل والهاتف</th>
                  <th className="p-3">الجهاز والموديل</th>
                  <th className="p-3">العطل</th>
                  <th className="p-3">موعد التسليم المتفق عليه</th>
                  <th className="p-3">رمز القفل</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-left">التكلفة</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const timing = getDeliveryTimingInfo(ticket);
                  return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setActiveTicketDetails(ticket)}
                  >
                    <td className="p-3 font-mono font-bold text-indigo-700" dir="ltr">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{ticket.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                        {ticket.customerPhone}
                      </p>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {ticket.deviceBrand} {ticket.deviceModel}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {ticket.issueDescription}
                    </td>
                    <td className="p-3">
                      {ticket.expectedDeliveryDate ? (
                        <div className="space-y-1">
                          <div className="font-mono text-[11px] text-slate-700">
                            {formatDate(ticket.expectedDeliveryDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${timing.badgeClass}`}>
                              {timing.countdownText}
                            </span>
                            {ticket.deliveryDateHistory && ticket.deliveryDateHistory.length > 0 && (
                              <span className="text-[9px] bg-sky-100 text-sky-800 px-1 rounded font-bold">
                                🔄 معدل
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">غير محدد</span>
                      )}
                    </td>
                    <td className="p-3">
                      {ticket.lockType === 'pattern' ? (
                        <span className="text-[10px] bg-slate-900 text-sky-300 px-2 py-0.5 rounded font-mono" dir="ltr">
                          نمط: {ticket.lockCode}
                        </span>
                      ) : ticket.lockType === 'pin' ? (
                        <span className="text-[10px] bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono font-bold" dir="ltr">
                          {ticket.lockCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">بدون رمز</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ticket.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : ticket.status === 'ready'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ticket.status === 'in_repair'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ticket.status === 'waiting_parts'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.status === 'delivered'
                          ? 'تم التسليم'
                          : ticket.status === 'ready'
                          ? 'جاهز للتسليم'
                          : ticket.status === 'in_repair'
                          ? 'جاري الإصلاح'
                          : ticket.status === 'waiting_parts'
                          ? 'انتظار قطع'
                          : 'قيد الفحص'}
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold" dir="ltr">
                      {formatMoney(ticket.finalAmount, ticket.finalCurrency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintTicket(ticket, 'maintenance_reception');
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        title="طباعة سند الاستلام"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW TICKET RECEPTION MODAL */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    استقبال جهاز صيانة جديد (كرت ورشة)
                  </h3>
                  <p className="text-xs text-amber-100">
                    توثيق العطل، رسم النمط، تحديد التكلفة والعربون
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="text-amber-100 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Customer Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs">بيانات العميل</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: صالح أحمد الشامي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      placeholder="770000000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs">بيانات الجهاز</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">الشركة</label>
                    <select
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="Apple">Apple آبل</option>
                      <option value="Samsung">Samsung سامسونج</option>
                      <option value="Xiaomi">Xiaomi شاومي</option>
                      <option value="Huawei">Huawei هواوي</option>
                      <option value="Honor">Honor هونر</option>
                      <option value="Infinix">Infinix إنفينيكس</option>
                      <option value="Tecno">Tecno تكنو</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">الموديل *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: iPhone 12 Pro أو A52"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">اللون</label>
                    <input
                      type="text"
                      placeholder="أزرق، أسود، ذهبي..."
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs mb-1">الـ IMEI أو السيريال (اختياري)</label>
                  <input
                    type="text"
                    placeholder="3582019482..."
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs mb-1">العطل المشتكى منه *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="مثال: شاشة مكسورة، لا يشحن، الجهاز طافي، تغيير بطارية..."
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Lock Type & Pattern Drawer */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-slate-600" />
                    رمز قفل الشاشة (Lock Code / Pattern)
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLockType('pattern')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        lockType === 'pattern'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border'
                      }`}
                    >
                      رسم نمط (3x3)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockType('pin')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        lockType === 'pin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border'
                      }`}
                    >
                      رمز أرقام (PIN)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLockType('none');
                        setLockCode('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        lockType === 'none'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border'
                      }`}
                    >
                      بدون قفل
                    </button>
                  </div>
                </div>

                {lockType === 'pattern' && (
                  <div className="pt-2 flex flex-col items-center">
                    <PatternLockDrawer
                      value={lockCode}
                      onChange={(newCode) => setLockCode(newCode)}
                      size="md"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      اضغط على النقاط بالترتيب لرسم نمط فتح الشاشة
                    </p>
                  </div>
                )}

                {lockType === 'pin' && (
                  <div>
                    <input
                      type="text"
                      placeholder="أدخل رمز قفل الشاشة (PIN / باسورد)"
                      value={lockCode}
                      onChange={(e) => setLockCode(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest font-bold"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              {/* Financials & Deposit */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs">التكلفة التقديرية والعربون</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">التكلفة المتفق عليها</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={estimatedCost || ''}
                        onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                        dir="ltr"
                      />
                      <select
                        value={costCurrency}
                        onChange={(e) => {
                          setCostCurrency(e.target.value as Currency);
                          setDepositCurrency(e.target.value as Currency);
                        }}
                        className="bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold"
                      >
                        <option value="YER">ريال يمني</option>
                        <option value="SAR">ريال سعودي</option>
                        <option value="USD">دولار</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs mb-1">
                      العربون المستلم مقدماً (إن وجد)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={depositAmount || ''}
                        onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700"
                        dir="ltr"
                      />
                      <select
                        value={depositCurrency}
                        onChange={(e) => setDepositCurrency(e.target.value as Currency)}
                        className="bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold"
                      >
                        <option value="YER">ريال يمني</option>
                        <option value="SAR">ريال سعودي</option>
                        <option value="USD">دولار</option>
                      </select>
                    </div>
                  </div>
                </div>

                {depositAmount > 0 && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    سيتم إيداع العربون فوراً في خزينة {CURRENCY_CONFIG[depositCurrency].label}
                  </p>
                )}
              </div>

              {/* Technician & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-xs mb-1">المهندس المسؤول</label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="المهندس ياسين">المهندس ياسين (هاردوير وشاشات)</option>
                    <option value="المهندس سمير">المهندس سمير (سوفتوير وشحن)</option>
                    <option value="المهندس أسامة">المهندس أسامة (آي سيات وبورد)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 text-xs mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    placeholder="ملاحظات تسليم، كفر، شاحن..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  حفظ وطباعة سند الاستلام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET DETAILS & WORK MODAL */}
      {activeTicketDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg">
                      {activeTicketDetails.deviceBrand} {activeTicketDetails.deviceModel}
                    </h3>
                    <span className="font-mono text-xs text-amber-300 font-bold" dir="ltr">
                      {activeTicketDetails.ticketNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    العميل: {activeTicketDetails.customerName} | هاتف: {activeTicketDetails.customerPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPrintTicket(activeTicketDetails, 'maintenance_reception')}
                  className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
                  title="طباعة سند الاستلام"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveTicketDetails(null);
                    onClearSelectedTicket?.();
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Status Change Stage Bar */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700">تحديث مرحلة الجهاز:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'received', label: 'قيد الفحص' },
                      { id: 'waiting_parts', label: 'انتظار قطع' },
                      { id: 'in_repair', label: 'جاري الإصلاح' },
                      { id: 'ready', label: 'جاهز للتسليم' },
                      { id: 'delivered', label: 'تم التسليم' },
                    ] as { id: MaintenanceStatus; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        onUpdateTicketStatus(activeTicketDetails.id, st.id);
                        setActiveTicketDetails({
                          ...activeTicketDetails,
                          status: st.id,
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        activeTicketDetails.status === st.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lock & Diagnostics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fault & Notes */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">العطل المسجل:</h4>
                  <p className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 font-medium">
                    {activeTicketDetails.issueDescription}
                  </p>
                  {activeTicketDetails.notes && (
                    <p className="text-slate-500 text-xs pt-1">
                      ملاحظات: {activeTicketDetails.notes}
                    </p>
                  )}
                </div>

                {/* Lock View */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
                  <h4 className="font-bold text-slate-800 text-xs mb-2">رمز قفل الجهاز لفتحه أثناء العمل:</h4>
                  {activeTicketDetails.lockType === 'pattern' ? (
                    <PatternLockDrawer
                      value={activeTicketDetails.lockCode || ''}
                      readOnly={true}
                      size="sm"
                    />
                  ) : activeTicketDetails.lockType === 'pin' ? (
                    <div className="bg-slate-900 text-amber-300 font-mono font-bold text-lg px-6 py-2 rounded-xl" dir="ltr">
                      {activeTicketDetails.lockCode}
                    </div>
                  ) : (
                    <span className="text-slate-400">لا يوجد رمز قفل</span>
                  )}
                </div>
              </div>

              {/* Spare Parts Installed Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    قطع الغيار المستخدمة من المخزون
                  </h4>
                </div>

                {/* Parts Table */}
                {activeTicketDetails.spareParts.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                    <table className="w-full text-right">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-2">القطعة</th>
                          <th className="p-2 text-center">الكمية</th>
                          <th className="p-2 text-left">السعر المحتسب</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeTicketDetails.spareParts.map((sp, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{sp.name}</td>
                            <td className="p-2 text-center">{sp.quantity}</td>
                            <td className="p-2 text-left font-mono font-bold" dir="ltr">
                              {formatMoney(sp.chargedPrice * sp.quantity, sp.chargedCurrency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">لم يتم سحب قطع غيار حتى الآن</p>
                )}

                {/* Add spare part inline picker */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <select
                    value={selectedSparePartId}
                    onChange={(e) => {
                      setSelectedSparePartId(e.target.value);
                      const p = products.find((x) => x.id === e.target.value);
                      if (p) setSparePartPrice(p.salePrice);
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  >
                    <option value="">اختر قطعة غيار من المخزن للإضافة...</option>
                    {availableSpareParts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name} (متوفر {part.quantity} - {part.salePrice} {part.saleCurrency})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedSparePartId}
                    onClick={handleAddSparePart}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-3 py-1.5 rounded-xl"
                  >
                    + خصم من المخزن وإضافة للكرت
                  </button>
                </div>
              </div>

              {/* Financial Totals & Delivery Button */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>أجرة يد الصيانة المعتمدة:</span>
                  <span className="font-mono font-bold" dir="ltr">
                    {formatMoney(activeTicketDetails.laborFee, activeTicketDetails.finalCurrency)}
                  </span>
                </div>
                {activeTicketDetails.depositAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>العربون المدفوع مسبقاً:</span>
                    <span className="font-mono font-bold" dir="ltr">
                      - {formatMoney(activeTicketDetails.depositAmount, activeTicketDetails.depositCurrency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                  <span>المبلغ النهائي المطلوب:</span>
                  <span className="font-mono text-indigo-700 text-base" dir="ltr">
                    {formatMoney(activeTicketDetails.finalAmount, activeTicketDetails.finalCurrency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onPrintTicket(activeTicketDetails, 'maintenance_reception')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  طباعة سند الاستلام
                </button>

                {activeTicketDetails.status !== 'delivered' && (
                  <button
                    type="button"
                    onClick={() => handleDeliverAndPay(activeTicketDetails)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تسليم الجهاز للعميل واستلام الحساب
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
