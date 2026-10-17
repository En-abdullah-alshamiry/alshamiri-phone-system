import React, { useState, useEffect } from 'react';
import { AppData, CashboxTransaction, Currency, CurrencyExchangeRecord, CustomerAccount, ExpenseVoucher, MaintenanceStatus, MaintenanceTicket, Product, PurchaseInvoice, ReceiptVoucher, SaleInvoice, StoreInfo, ExchangeRates } from './types';
import { getStoredData, saveData } from './services/storage';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { PosView } from './components/pos/PosView';
import { PurchasePhoneModal } from './components/pos/PurchasePhoneModal';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { InventoryView } from './components/inventory/InventoryView';
import { AccountingView } from './components/accounting/AccountingView';
import { SettingsView } from './components/settings/SettingsView';
import { PrintInvoiceModal } from './components/common/PrintInvoiceModal';

export default function App() {
  const [data, setData] = useState<AppData>(() => getStoredData());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [selectedMaintenanceTicketId, setSelectedMaintenanceTicketId] = useState<string | null>(null);

  // Printable modal state
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    type: 'sale' | 'maintenance_reception' | 'maintenance_delivery' | 'purchase';
    data: any;
  }>({
    isOpen: false,
    type: 'sale',
    data: null,
  });

  // Persist data whenever changed
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Update Exchange Rates
  const handleUpdateRates = (newRates: ExchangeRates) => {
    setData((prev) => ({
      ...prev,
      exchangeRates: newRates,
    }));
  };

  // Update Store Info
  const handleUpdateStoreInfo = (newInfo: StoreInfo) => {
    setData((prev) => ({
      ...prev,
      storeInfo: newInfo,
    }));
  };

  // Complete Sale from POS
  const handleCompleteSale = (invoice: SaleInvoice) => {
    // 1. Deduct quantities from products
    const updatedProducts = data.products.map((p) => {
      const soldItem = invoice.items.find((item) => item.product.id === p.id);
      if (soldItem) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - soldItem.quantity),
        };
      }
      return p;
    });

    // 2. Add cashbox transaction if cash or transfer
    let newCashTransactions = [...data.cashTransactions];
    if (invoice.paymentType !== 'credit' && invoice.paidAmount > 0) {
      const netCashReceived = invoice.paidAmount - (invoice.changeCurrency === invoice.paidCurrency ? invoice.changeAmount : 0);
      const saleTx: CashboxTransaction = {
        id: `tx-${Date.now()}`,
        date: invoice.date,
        currency: invoice.paidCurrency,
        amount: netCashReceived,
        type: 'sale_income',
        referenceId: invoice.id,
        title: `مبيعات فاتورة (${invoice.invoiceNumber})`,
        description: `العميل: ${invoice.customerName}`,
      };
      newCashTransactions.push(saleTx);
    }

    // 3. Update customer balance if credit
    let updatedCustomers = [...data.customers];
    if (invoice.paymentType === 'credit') {
      const existingCustomer = updatedCustomers.find((c) => c.name === invoice.customerName);
      if (existingCustomer) {
        updatedCustomers = updatedCustomers.map((c) =>
          c.id === existingCustomer.id
            ? {
                ...c,
                balances: {
                  ...c.balances,
                  [invoice.currency]: (c.balances[invoice.currency] || 0) + invoice.total,
                },
              }
            : c
        );
      } else {
        updatedCustomers.push({
          id: `cust-${Date.now()}`,
          name: invoice.customerName,
          phone: invoice.customerPhone || '',
          balances: {
            YER: invoice.currency === 'YER' ? invoice.total : 0,
            SAR: invoice.currency === 'SAR' ? invoice.total : 0,
            USD: invoice.currency === 'USD' ? invoice.total : 0,
          },
          createdAt: new Date().toISOString(),
        });
      }
    }

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      salesInvoices: [invoice, ...prev.salesInvoices],
      cashTransactions: newCashTransactions,
      customers: updatedCustomers,
    }));
  };

  // Save Purchase of used/new phone
  const handleSavePurchase = (purchase: PurchaseInvoice, createdProduct?: Product) => {
    // 1. Add to inventory if createdProduct
    const updatedProducts = createdProduct ? [createdProduct, ...data.products] : data.products;

    // 2. Record cashbox expense
    const purchaseTx: CashboxTransaction = {
      id: `tx-${Date.now()}`,
      date: purchase.date,
      currency: purchase.cashboxAffected,
      amount: -purchase.total,
      type: 'purchase_expense',
      referenceId: purchase.id,
      title: `شراء جهاز (${purchase.purchaseNumber})`,
      description: `البائع: ${purchase.sellerName} | هاتف: ${purchase.sellerPhone}`,
    };

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      purchaseInvoices: [purchase, ...prev.purchaseInvoices],
      cashTransactions: [...prev.cashTransactions, purchaseTx],
    }));

    setIsPurchaseModalOpen(false);

    // Prompt print purchase agreement
    setPrintModalState({
      isOpen: true,
      type: 'purchase',
      data: purchase,
    });
  };

  // Save Maintenance Ticket (Create or Update)
  const handleSaveMaintenanceTicket = (ticket: MaintenanceTicket, deductSpareParts = false) => {
    const isNew = !data.maintenanceTickets.some((t) => t.id === ticket.id);
    let newTransactions = [...data.cashTransactions];
    let updatedProducts = [...data.products];

    // If new and deposit paid > 0, log deposit transaction in cashbox
    if (isNew && ticket.depositAmount > 0) {
      const depositTx: CashboxTransaction = {
        id: `tx-${Date.now()}`,
        date: ticket.receivedAt,
        currency: ticket.depositCurrency,
        amount: ticket.depositAmount,
        type: 'maintenance_deposit',
        referenceId: ticket.id,
        title: `عربون صيانة كرت (${ticket.ticketNumber})`,
        description: `الجهاز: ${ticket.deviceBrand} ${ticket.deviceModel} | العميل: ${ticket.customerName}`,
      };
      newTransactions.push(depositTx);
    }

    // If status changed to delivered and paid, record remainder payment in safe
    if (!isNew && ticket.status === 'delivered') {
      const remainder = Math.max(0, ticket.finalAmount - ticket.depositAmount);
      if (remainder > 0) {
        const deliveryTx: CashboxTransaction = {
          id: `tx-${Date.now()}`,
          date: ticket.deliveredAt || new Date().toISOString(),
          currency: ticket.finalCurrency,
          amount: remainder,
          type: 'maintenance_income',
          referenceId: ticket.id,
          title: `تسليم صيانة وتصفية كرت (${ticket.ticketNumber})`,
          description: `المتبقي بعد العربون - العميل: ${ticket.customerName}`,
        };
        newTransactions.push(deliveryTx);
      }
    }

    // Deduct spare parts inventory if requested
    if (deductSpareParts && ticket.spareParts.length > 0) {
      const latestPart = ticket.spareParts[ticket.spareParts.length - 1];
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === latestPart.productId) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - latestPart.quantity),
          };
        }
        return p;
      });
    }

    const updatedTickets = isNew
      ? [ticket, ...data.maintenanceTickets]
      : data.maintenanceTickets.map((t) => (t.id === ticket.id ? ticket : t));

    setData((prev) => ({
      ...prev,
      products: updatedProducts,
      maintenanceTickets: updatedTickets,
      cashTransactions: newTransactions,
    }));
  };

  // Quick Ticket Status Update
  const handleUpdateTicketStatus = (ticketId: string, status: MaintenanceStatus) => {
    setData((prev) => ({
      ...prev,
      maintenanceTickets: prev.maintenanceTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status,
              ...(status === 'ready' && !t.completedAt ? { completedAt: new Date().toISOString() } : {}),
            }
          : t
      ),
    }));
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (product: Product) => {
    setData((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      return {
        ...prev,
        products: exists
          ? prev.products.map((p) => (p.id === product.id ? product : p))
          : [product, ...prev.products],
      };
    });
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  // Add Expense Voucher
  const handleAddExpenseVoucher = (voucher: ExpenseVoucher) => {
    const expenseTx: CashboxTransaction = {
      id: `tx-${Date.now()}`,
      date: voucher.date,
      currency: voucher.currency,
      amount: -voucher.amount,
      type: 'operational_expense',
      referenceId: voucher.id,
      title: `سند صرف: ${voucher.category}`,
      description: `صُرف لـ: ${voucher.recipient} - ${voucher.description}`,
    };

    setData((prev) => ({
      ...prev,
      expenseVouchers: [voucher, ...prev.expenseVouchers],
      cashTransactions: [...prev.cashTransactions, expenseTx],
    }));
  };

  // Add Receipt Voucher
  const handleAddReceiptVoucher = (voucher: ReceiptVoucher) => {
    const receiptTx: CashboxTransaction = {
      id: `tx-${Date.now()}`,
      date: voucher.date,
      currency: voucher.currency,
      amount: voucher.amount,
      type: 'debt_payment',
      referenceId: voucher.id,
      title: `سند قبض: ${voucher.category}`,
      description: `استلمنا من: ${voucher.payer} - ${voucher.description}`,
    };

    setData((prev) => ({
      ...prev,
      receiptVouchers: [voucher, ...prev.receiptVouchers],
      cashTransactions: [...prev.cashTransactions, receiptTx],
    }));
  };

  // Execute Currency Exchange
  const handleExecuteExchange = (record: CurrencyExchangeRecord) => {
    // 1. Deduct from Currency A Safe
    const outflowTx: CashboxTransaction = {
      id: `tx-${Date.now()}-out`,
      date: record.date,
      currency: record.fromCurrency,
      amount: -record.fromAmount,
      type: 'currency_exchange_out',
      referenceId: record.id,
      title: `تحويل ومصارفة إلى ${record.toCurrency}`,
      description: record.notes || `صرف ${record.fromAmount} ${record.fromCurrency}`,
    };

    // 2. Deposit into Currency B Safe
    const inflowTx: CashboxTransaction = {
      id: `tx-${Date.now()}-in`,
      date: record.date,
      currency: record.toCurrency,
      amount: record.toAmount,
      type: 'currency_exchange_in',
      referenceId: record.id,
      title: `تحويل ومصارفة من ${record.fromCurrency}`,
      description: record.notes || `استلام ناتج صرف بسعر ${record.exchangeRate}`,
    };

    setData((prev) => ({
      ...prev,
      currencyExchanges: [record, ...prev.currencyExchanges],
      cashTransactions: [...prev.cashTransactions, outflowTx, inflowTx],
    }));
  };

  // Settle Customer Debt
  const handleSettleCustomerDebt = (customerId: string, amount: number, currency: Currency) => {
    const targetCust = data.customers.find((c) => c.id === customerId);
    if (!targetCust) return;

    const receiptTx: CashboxTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      currency,
      amount,
      type: 'debt_payment',
      title: `سداد ذمة عميل (${targetCust.name})`,
      description: `دفعة من الحساب الآجل بالـ ${currency}`,
    };

    const updatedCustomers = data.customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          balances: {
            ...c.balances,
            [currency]: Math.max(0, (c.balances[currency] || 0) - amount),
          },
        };
      }
      return c;
    });

    setData((prev) => ({
      ...prev,
      customers: updatedCustomers,
      cashTransactions: [...prev.cashTransactions, receiptTx],
    }));
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        maintenanceTickets={data.maintenanceTickets}
        products={data.products}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          exchangeRates={data.exchangeRates}
          onUpdateRates={handleUpdateRates}
          cashTransactions={data.cashTransactions}
          onOpenNewSale={() => setCurrentTab('pos')}
          onOpenNewMaintenance={() => setCurrentTab('maintenance')}
          onOpenExchangeModal={() => {
            setCurrentTab('accounting');
            setIsExchangeModalOpen(true);
          }}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenNewSale={() => setCurrentTab('pos')}
              onOpenNewMaintenance={() => setCurrentTab('maintenance')}
              onSelectMaintenanceTicket={(id) => {
                setSelectedMaintenanceTicketId(id);
                setCurrentTab('maintenance');
              }}
            />
          )}

          {currentTab === 'pos' && (
            <PosView
              products={data.products}
              exchangeRates={data.exchangeRates}
              customers={data.customers}
              onCompleteSale={handleCompleteSale}
              onOpenPurchaseModal={() => setIsPurchaseModalOpen(true)}
              onPrintInvoice={(invoice) =>
                setPrintModalState({
                  isOpen: true,
                  type: 'sale',
                  data: invoice,
                })
              }
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView
              tickets={data.maintenanceTickets}
              products={data.products}
              exchangeRates={data.exchangeRates}
              onSaveTicket={handleSaveMaintenanceTicket}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onPrintTicket={(ticket, type) =>
                setPrintModalState({
                  isOpen: true,
                  type,
                  data: ticket,
                })
              }
              selectedTicketId={selectedMaintenanceTicketId}
              onClearSelectedTicket={() => setSelectedMaintenanceTicketId(null)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              products={data.products}
              exchangeRates={data.exchangeRates}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {currentTab === 'accounting' && (
            <AccountingView
              data={data}
              onAddTransaction={(tx) =>
                setData((prev) => ({
                  ...prev,
                  cashTransactions: [...prev.cashTransactions, tx],
                }))
              }
              onAddExpenseVoucher={handleAddExpenseVoucher}
              onAddReceiptVoucher={handleAddReceiptVoucher}
              onExecuteExchange={handleExecuteExchange}
              onSettleCustomerDebt={handleSettleCustomerDebt}
              isExchangeModalOpenInitial={isExchangeModalOpen}
              onCloseExchangeModalInitial={() => setIsExchangeModalOpen(false)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              data={data}
              onUpdateRates={handleUpdateRates}
              onUpdateStoreInfo={handleUpdateStoreInfo}
              onDataLoaded={(fresh) => setData(fresh)}
            />
          )}
        </main>
      </div>

      {/* GLOBAL PURCHASE PHONE MODAL */}
      {isPurchaseModalOpen && (
        <PurchasePhoneModal
          onClose={() => setIsPurchaseModalOpen(false)}
          onSavePurchase={handleSavePurchase}
        />
      )}

      {/* GLOBAL PRINT MODAL */}
      {printModalState.isOpen && (
        <PrintInvoiceModal
          type={printModalState.type}
          data={printModalState.data}
          storeInfo={data.storeInfo}
          exchangeRates={data.exchangeRates}
          onClose={() =>
            setPrintModalState({
              isOpen: false,
              type: 'sale',
              data: null,
            })
          }
        />
      )}
    </div>
  );
}
