import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Truck,
  RefreshCw,
  Megaphone,
  Calculator,
  Plus,
  Trash2,
  Edit3,
  Settings,
  Download,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  BarChart2,
  Layers,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  ShieldCheck,
  HelpCircle,
  Minus,
  Check,
  X,
  Filter,
  PhoneCall,
  Package,
  Building2,
  CreditCard,
  Scale,
  Star,
  XCircle,
  AlertCircle,
  Trophy
} from 'lucide-react';
import {
  Product,
  Order,
  StoreConfig,
  CountryStore,
  AdSpendEntry,
  ExpenseEntry,
  FinancialSettings,
  AdPlatformType,
  ExpenseCategoryType,
  ProductProfitSummary
} from '../types';
import { DEFAULT_FINANCIAL_SETTINGS } from '../data';
import { CustomSelect } from './CustomSelect';

interface ProfitAccountingProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  storeConfig: StoreConfig;
  dashboardLang: 'en' | 'ar' | 'fr';
  displayCurrency: string;
  activeCountrySlug: string;
  countries: CountryStore[];
  onUpdateProductCost?: (productId: string, costPrice: number) => void;
}

export default function ProfitAccounting({
  products,
  setProducts,
  orders,
  storeConfig,
  dashboardLang,
  displayCurrency,
  activeCountrySlug,
  countries,
  onUpdateProductCost
}: ProfitAccountingProps) {
  const isAr = dashboardLang === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'orders' | 'ad_spends' | 'expenses' | 'products' | 'simulator'>('overview');

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | 'this_month' | '30days'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const [financialSettings, setFinancialSettings] = useState<FinancialSettings>(() => {
    try {
      const saved = localStorage.getItem(`mavluy_financial_settings_${activeCountrySlug}`) || localStorage.getItem(`virtuprod_financial_settings_${activeCountrySlug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_FINANCIAL_SETTINGS,
          ...parsed,
          adSpendMethod: parsed.adSpendMethod || 'per_order',
          adSpendOrderScope: 'delivered_only',
          defaultAdSpendPerOrder: parsed.defaultAdSpendPerOrder !== undefined ? Number(parsed.defaultAdSpendPerOrder) : 25
        };
      }
    } catch (e) {
    }
    return DEFAULT_FINANCIAL_SETTINGS;
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [editingOrderAdId, setEditingOrderAdId] = useState<string | null>(null);
  const [inlineOrderAdValue, setInlineOrderAdValue] = useState<string>('');

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<FinancialSettings>(financialSettings);

  const [adSpends, setAdSpends] = useState<AdSpendEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`mavluy_ad_spends_${activeCountrySlug}`) || localStorage.getItem(`virtuprod_ad_spends_${activeCountrySlug}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
    }
    return [];
  });

  const [isAddAdSpendModalOpen, setIsAddAdSpendModalOpen] = useState(false);
  const [editingAdSpend, setEditingAdSpend] = useState<AdSpendEntry | null>(null);
  const [adSpendForm, setAdSpendForm] = useState<{
    platform: AdPlatformType;
    amount: string;
    costModel: 'total' | 'per_order';
    perOrderCost: string;
    ordersCount: string;
    date: string;
    campaignName: string;
    productId: string;
    notes: string;
  }>({
    platform: 'tiktok',
    amount: '',
    costModel: 'per_order',
    perOrderCost: String(financialSettings.defaultAdSpendPerOrder ?? 25),
    ordersCount: '',
    date: new Date().toISOString().split('T')[0],
    campaignName: '',
    productId: '',
    notes: ''
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`mavluy_expenses_${activeCountrySlug}`) || localStorage.getItem(`virtuprod_expenses_${activeCountrySlug}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
    }
    return [];
  });

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    category: ExpenseCategoryType;
    title: string;
    amount: string;
    date: string;
    notes: string;
  }>({
    category: 'packaging',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const isAnyModalOpen = isSettingsModalOpen || isAddAdSpendModalOpen || isAddExpenseModalOpen || Boolean(editingAdSpend) || Boolean(editingExpense);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSettingsModalOpen, isAddAdSpendModalOpen, isAddExpenseModalOpen, editingAdSpend, editingExpense]);

  const [editingCostProductId, setEditingCostProductId] = useState<string | null>(null);
  const [inlineCostValue, setInlineCostValue] = useState<string>('');

  const [simulatorState, setSimulatorState] = useState({
    sellingPrice: 299,
    costPrice: 85,
    adCpa: 60,
    deliveryCost: 35,
    returnCost: 15,
    packagingCost: 3,
    callCenterCost: 5,
    confirmationRate: 85,
    deliveryRate: 75,
    monthlyTargetOrders: 300
  });

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const res = await fetch(`/api/financial-data?storeId=${activeCountrySlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.financialSettings && data.isCustomizedOnServer) {
            const merged = {
              ...DEFAULT_FINANCIAL_SETTINGS,
              ...data.financialSettings,
              adSpendMethod: data.financialSettings.adSpendMethod || 'per_order',
              adSpendOrderScope: 'delivered_only' as const,
              defaultAdSpendPerOrder: data.financialSettings.defaultAdSpendPerOrder !== undefined
                ? Number(data.financialSettings.defaultAdSpendPerOrder)
                : 25
            };
            setFinancialSettings(merged);
            localStorage.setItem(`mavluy_financial_settings_${activeCountrySlug}`, JSON.stringify(merged));
          }
          if (Array.isArray(data.adSpends)) setAdSpends(data.adSpends);
          if (Array.isArray(data.expenses)) setExpenses(data.expenses);
        }
      } catch (err) {
      }
    };
    fetchFinancials();
  }, [activeCountrySlug]);

  const saveFinancialSettings = async (newSettings: FinancialSettings, closeSettingsModal = true) => {
    setFinancialSettings(newSettings);
    localStorage.setItem(`mavluy_financial_settings_${activeCountrySlug}`, JSON.stringify(newSettings));
    localStorage.setItem(`virtuprod_financial_settings_${activeCountrySlug}`, JSON.stringify(newSettings));
    if (closeSettingsModal) {
      setIsSettingsModalOpen(false);
    }
    setIsSavingSettings(true);
    try {
      await fetch('/api/financial-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeCountrySlug, settings: newSettings })
      });
    } catch (e) {
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveAdSpendsState = async (updated: AdSpendEntry[]) => {
    setAdSpends(updated);
    localStorage.setItem(`mavluy_ad_spends_${activeCountrySlug}`, JSON.stringify(updated));
    localStorage.setItem(`virtuprod_ad_spends_${activeCountrySlug}`, JSON.stringify(updated));
    try {
      await fetch('/api/ad-spends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeCountrySlug, adSpends: updated })
      });
    } catch (e) {
    }
  };

  const saveExpensesState = async (updated: ExpenseEntry[]) => {
    setExpenses(updated);
    localStorage.setItem(`mavluy_expenses_${activeCountrySlug}`, JSON.stringify(updated));
    localStorage.setItem(`virtuprod_expenses_${activeCountrySlug}`, JSON.stringify(updated));
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeCountrySlug, expenses: updated })
      });
    } catch (e) {
    }
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const isDateInRange = (itemDateStr?: string | Date) => {
      if (!itemDateStr) return true;
      const d = new Date(itemDateStr);
      const dStr = d.toISOString().split('T')[0];

      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return dStr === todayStr;
      if (dateFilter === 'yesterday') return dStr === yesterdayStr;
      if (dateFilter === '7days') return d >= sevenDaysAgo;
      if (dateFilter === 'this_month') return d >= startOfMonth;
      if (dateFilter === '30days') return d >= thirtyDaysAgo;
      return true;
    };

    const fOrders = orders.filter(o => {
      const matchDate = isDateInRange(o.date);
      const matchCountry = countryFilter === 'all' || o.storeId === countryFilter || (!o.storeId && activeCountrySlug === countryFilter);
      return matchDate && matchCountry;
    });

    const fAdSpends = adSpends.filter(a => {
      const matchDate = isDateInRange(a.date);
      const matchCountry = countryFilter === 'all' || a.storeId === countryFilter || (!a.storeId && activeCountrySlug === countryFilter);
      return matchDate && matchCountry;
    });

    const fExpenses = expenses.filter(e => {
      const matchDate = isDateInRange(e.date);
      const matchCountry = countryFilter === 'all' || e.storeId === countryFilter || (!e.storeId && activeCountrySlug === countryFilter);
      return matchDate && matchCountry;
    });

    return {
      orders: fOrders,
      adSpends: fAdSpends,
      expenses: fExpenses
    };
  }, [orders, adSpends, expenses, dateFilter, countryFilter, activeCountrySlug]);

  const orderProfitList = useMemo(() => {
    // Only calculate profit & ads for orders that reached the client and are paid/completed/delivered
    const deliveredOrders = filteredData.orders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'delivered' || st === 'completed' || st === 'paid';
    });
    const isPerOrderMethod = (financialSettings.adSpendMethod || 'per_order') === 'per_order';
    const defaultPerOrderAd = Number(financialSettings.defaultAdSpendPerOrder ?? 25);
    const customOrderAds = financialSettings.customOrderAdSpends || {};

    return deliveredOrders.map(o => {
      const orderRevenue = Number(o.total ?? o.totalAmount ?? o.totalPrice ?? 0);
      const status = (o.status || 'delivered').toLowerCase();

      let orderCOGS = 0;
      let unitsCount = 0;
      const itemLabels: string[] = [];

      (o.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.name === item.productName);
        const qty = Number(item.quantity || 1);
        const unitCost = (prod && prod.costPrice !== undefined && prod.costPrice > 0)
          ? Number(prod.costPrice)
          : Math.round((Number(item.price || prod?.price || 100)) * 0.35);
        orderCOGS += unitCost * qty;
        unitsCount += qty;
        itemLabels.push(`${item.productName || prod?.name || 'Product'} ×${qty}`);
      });

      const hasCustomAd = customOrderAds[o.id] !== undefined;
      let adCost = 0;
      if (hasCustomAd) {
        adCost = Number(customOrderAds[o.id]) || 0;
      } else if (isPerOrderMethod) {
        adCost = defaultPerOrderAd;
      }

      const deliveryFee = Number(financialSettings.defaultDeliveryFeePerOrder ?? 35);
      const packagingCost = Number(financialSettings.defaultPackagingCostPerOrder ?? 3);
      const callCenterCost = Number(financialSettings.defaultCallCenterCostPerOrder ?? 5);

      const totalOrderSpent = orderCOGS + adCost + deliveryFee + packagingCost + callCenterCost;
      const realizedProfit = orderRevenue - totalOrderSpent;

      return {
        order: o,
        orderId: o.id,
        customerName: o.customerName || '-',
        customerCity: o.customerCity || o.city || '-',
        date: o.date || o.createdAt || '',
        status,
        isDelivered: true,
        isCancelledOrReturned: false,
        isInTransit: false,
        itemSummary: itemLabels.join('، ') || '-',
        unitsCount,
        orderRevenue,
        orderCOGS,
        adCost,
        hasCustomAd,
        deliveryFee,
        returnFee: 0,
        packagingCost,
        callCenterCost,
        opsAndShippingCost: deliveryFee + packagingCost + callCenterCost,
        totalOrderSpent,
        realizedProfit,
        expectedProfitOnDelivery: realizedProfit
      };
    });
  }, [filteredData.orders, products, financialSettings]);

  const metrics = useMemo(() => {
    const fOrders = filteredData.orders;
    const fAdSpends = filteredData.adSpends;
    const fExpenses = filteredData.expenses;

    const totalOrdersCount = fOrders.length;

    const deliveredOrders = fOrders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return st === 'delivered' || st === 'completed' || st === 'paid';
    });
    const cancelledOrReturnedOrders = fOrders.filter(o => o.status === 'cancelled' || o.status === 'returned');
    const inTransitOrders = fOrders.filter(o => o.status === 'shipped' || o.status === 'processing' || o.status === 'confirmed');
    const pendingOrders = fOrders.filter(o => o.status === 'pending');

    const deliveredCount = deliveredOrders.length;
    const cancelledCount = cancelledOrReturnedOrders.length;
    const inTransitCount = inTransitOrders.length;
    const pendingCount = pendingOrders.length;

    const grossDeliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total ?? o.totalAmount ?? o.totalPrice) || 0), 0);
    const totalPotentialRevenue = fOrders.reduce((sum, o) => sum + (Number(o.total ?? o.totalAmount ?? o.totalPrice) || 0), 0);

    let deliveredCOGS = 0;
    let totalItemsDeliveredCount = 0;

    deliveredOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId || p.name === item.productName);
        const unitCost = (prod && prod.costPrice !== undefined && prod.costPrice > 0)
          ? prod.costPrice
          : ((item.price || 100) * 0.35);

        deliveredCOGS += unitCost * (item.quantity || 1);
        totalItemsDeliveredCount += (item.quantity || 1);
      });
    });

    const manualAdSpendTotal = fAdSpends.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    // Ads are calculated strictly on orders that came in and reached the client (deliveredOrders)
    const perOrderAdSpendTotal = orderProfitList.reduce((sum, item) => sum + item.adCost, 0);
    const ordersWithAdsCount = deliveredCount;

    const isPerOrderMethod = (financialSettings.adSpendMethod || 'per_order') === 'per_order';
    const totalAdSpend = isPerOrderMethod
      ? (perOrderAdSpendTotal + manualAdSpendTotal)
      : manualAdSpendTotal;

    const adSpendByPlatform: Record<AdPlatformType, number> = {
      tiktok: 0,
      meta: 0,
      snapchat: 0,
      google: 0,
      influencer: 0,
      other: 0
    };
    fAdSpends.forEach(a => {
      if (adSpendByPlatform[a.platform] !== undefined) {
        adSpendByPlatform[a.platform] += Number(a.amount) || 0;
      } else {
        adSpendByPlatform.other += Number(a.amount) || 0;
      }
    });

    const deliveryFeesTotal = deliveredCount * (financialSettings.defaultDeliveryFeePerOrder ?? 35);

    const returnFeesTotal = cancelledCount * (financialSettings.defaultReturnFeePerOrder ?? 15);

    const packagingCostTotal = (deliveredCount + inTransitCount) * (financialSettings.defaultPackagingCostPerOrder ?? 3);

    const callCenterCostTotal = (deliveredCount + inTransitCount + cancelledCount) * (financialSettings.defaultCallCenterCostPerOrder ?? 5);

    const additionalExpensesTotal = fExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalExpensesAndCosts =
      deliveredCOGS +
      totalAdSpend +
      deliveryFeesTotal +
      returnFeesTotal +
      packagingCostTotal +
      callCenterCostTotal +
      additionalExpensesTotal;

    const netProfit = grossDeliveredRevenue - totalExpensesAndCosts;

    // Expected profit if all non-cancelled orders get delivered
    const expectedTotalNetProfit = orderProfitList.reduce((sum, item) => {
      if (item.isCancelledOrReturned) return sum + item.realizedProfit;
      return sum + item.expectedProfitOnDelivery;
    }, 0) - manualAdSpendTotal - additionalExpensesTotal;

    const avgProfitPerDeliveredOrder = deliveredCount > 0
      ? Math.round(
          orderProfitList
            .filter(item => item.isDelivered)
            .reduce((sum, item) => sum + item.realizedProfit, 0) / deliveredCount
        )
      : 0;

    const lossPerCancelledOrder =
      (Number(financialSettings.defaultAdSpendPerOrder ?? 25)) +
      (Number(financialSettings.defaultReturnFeePerOrder ?? 15)) +
      (Number(financialSettings.defaultCallCenterCostPerOrder ?? 5));

    const netMarginPercent = grossDeliveredRevenue > 0
      ? Math.round((netProfit / grossDeliveredRevenue) * 100)
      : 0;

    const grossProfit = grossDeliveredRevenue - deliveredCOGS;
    const grossMarginPercent = grossDeliveredRevenue > 0
      ? Math.round((grossProfit / grossDeliveredRevenue) * 100)
      : 0;

    const roas = totalAdSpend > 0
      ? Number((grossDeliveredRevenue / totalAdSpend).toFixed(2))
      : (grossDeliveredRevenue > 0 ? 99.9 : 0);

    const roiPercent = totalExpensesAndCosts > 0
      ? Math.round((netProfit / totalExpensesAndCosts) * 100)
      : 0;

    const deliveryRatePercent = (deliveredCount + cancelledCount) > 0
      ? Math.round((deliveredCount / (deliveredCount + cancelledCount)) * 100)
      : (totalOrdersCount > 0 ? Math.round((deliveredCount / totalOrdersCount) * 100) : 0);

    const returnRatePercent = (deliveredCount + cancelledCount) > 0
      ? Math.round((cancelledCount / (deliveredCount + cancelledCount)) * 100)
      : 0;

    const aov = deliveredCount > 0
      ? Math.round(grossDeliveredRevenue / deliveredCount)
      : (totalOrdersCount > 0 ? Math.round(totalPotentialRevenue / totalOrdersCount) : 0);

    const costPerDeliveredOrder = deliveredCount > 0
      ? Math.round(totalExpensesAndCosts / deliveredCount)
      : 0;

    const adCpaPerDeliveredOrder = deliveredCount > 0
      ? Math.round(totalAdSpend / deliveredCount)
      : (Number(financialSettings.defaultAdSpendPerOrder ?? 0));

    const breakEvenRoas = (grossDeliveredRevenue - deliveredCOGS) > 0
      ? Number((grossDeliveredRevenue / (grossDeliveredRevenue - deliveredCOGS - deliveryFeesTotal - returnFeesTotal - packagingCostTotal - callCenterCostTotal)).toFixed(2))
      : 2.5;

    const isWinning = netProfit > 0;
    const isLosing = netProfit < 0;
    const isBreakEven = netProfit === 0;

    return {
      totalOrdersCount,
      deliveredCount,
      cancelledCount,
      inTransitCount,
      pendingCount,
      grossDeliveredRevenue,
      totalPotentialRevenue,
      deliveredCOGS,
      totalItemsDeliveredCount,
      totalAdSpend,
      perOrderAdSpendTotal,
      manualAdSpendTotal,
      ordersWithAdsCount,
      adSpendByPlatform,
      deliveryFeesTotal,
      returnFeesTotal,
      packagingCostTotal,
      callCenterCostTotal,
      additionalExpensesTotal,
      totalExpensesAndCosts,
      netProfit,
      expectedTotalNetProfit,
      avgProfitPerDeliveredOrder,
      lossPerCancelledOrder,
      grossProfit,
      netMarginPercent,
      grossMarginPercent,
      roas,
      roiPercent,
      deliveryRatePercent,
      returnRatePercent,
      aov,
      costPerDeliveredOrder,
      adCpaPerDeliveredOrder,
      breakEvenRoas,
      isWinning,
      isLosing,
      isBreakEven
    };
  }, [filteredData, products, financialSettings, orderProfitList]);

  const productProfitList: ProductProfitSummary[] = useMemo(() => {
    return products.map(prod => {
      let unitsSold = 0;
      let unitsDelivered = 0;
      let totalRevenue = 0;
      let totalDeliveredRevenue = 0;

      filteredData.orders.forEach(o => {
        (o.items || []).forEach(item => {
          if (item.productId === prod.id || item.productName === prod.name) {
            const qty = item.quantity || 1;
            const rev = (item.price || prod.price || 0) * qty;

            unitsSold += qty;
            totalRevenue += rev;

            if (o.status === 'delivered' || o.status === 'completed') {
              unitsDelivered += qty;
              totalDeliveredRevenue += rev;
            }
          }
        });
      });

      const costPrice = prod.costPrice || 0;
      const totalCost = unitsDelivered * costPrice;
      const grossProfit = totalDeliveredRevenue - totalCost;
      
      // Calculate specific ad spend for this product
      const productAdSpend = filteredData.adSpends
        .filter(a => a.productId === prod.id || (a.campaignName && a.campaignName.toLowerCase().includes(prod.name.toLowerCase())))
        .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

      const netProfit = grossProfit - productAdSpend;
      const productRoas = productAdSpend > 0 ? Number((totalDeliveredRevenue / productAdSpend).toFixed(2)) : 0;

      const grossMarginPercent = totalDeliveredRevenue > 0
        ? Math.round((netProfit / totalDeliveredRevenue) * 100)
        : (prod.price > 0 && costPrice > 0 ? Math.round(((prod.price - costPrice) / prod.price) * 100) : 0);

      let status: 'star' | 'profitable' | 'low_margin' | 'loss' | 'no_cost' = 'no_cost';
      if (!costPrice || costPrice === 0) {
        status = 'no_cost';
      } else if (grossMarginPercent >= 50) {
        status = 'star';
      } else if (grossMarginPercent >= 25) {
        status = 'profitable';
      } else if (grossMarginPercent > 0) {
        status = 'low_margin';
      } else {
        status = 'loss';
      }

      return {
        productId: prod.id,
        productName: prod.name,
        productImage: prod.image,
        sku: prod.sku,
        retailPrice: prod.price,
        costPrice,
        unitsSold,
        unitsDelivered,
        totalRevenue,
        totalDeliveredRevenue,
        totalCost,
        grossProfit,
        grossMarginPercent,
        status,
        adSpend: productAdSpend,
        netProfit,
        productRoas
      };
    }).sort((a, b) => (b.netProfit ?? 0) - (a.netProfit ?? 0));
  }, [products, filteredData.orders, filteredData.adSpends]);

  const handleSaveInlineCost = (productId: string) => {
    const val = Number(inlineCostValue);
    if (isNaN(val) || val < 0) return;

    if (onUpdateProductCost) {
      onUpdateProductCost(productId, val);
    } else if (setProducts) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, costPrice: val } : p));
    }

    fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costPrice: val })
    }).catch(() => {});

    setEditingCostProductId(null);
    setInlineCostValue('');
  };

  const handleSaveAdSpend = (e: React.FormEvent) => {
    e.preventDefault();
    const isPerOrderModel = adSpendForm.costModel === 'per_order';
    const perOrderNum = Number(adSpendForm.perOrderCost) || 0;
    const ordersCountNum = Number(adSpendForm.ordersCount) || filteredData.orders.length || 1;
    const amountNum = isPerOrderModel
      ? Math.round(perOrderNum * ordersCountNum)
      : Number(adSpendForm.amount);

    if (!amountNum || amountNum <= 0) return;

    if (editingAdSpend) {
      const updated = adSpends.map(a => a.id === editingAdSpend.id ? {
        ...a,
        platform: adSpendForm.platform,
        amount: amountNum,
        costModel: adSpendForm.costModel,
        perOrderCost: isPerOrderModel ? perOrderNum : undefined,
        ordersCount: isPerOrderModel ? ordersCountNum : undefined,
        date: adSpendForm.date,
        campaignName: adSpendForm.campaignName,
        productId: adSpendForm.productId,
        notes: adSpendForm.notes
      } : a);
      saveAdSpendsState(updated);
    } else {
      const newEntry: AdSpendEntry = {
        id: 'ad-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        storeId: activeCountrySlug,
        platform: adSpendForm.platform,
        amount: amountNum,
        costModel: adSpendForm.costModel,
        perOrderCost: isPerOrderModel ? perOrderNum : undefined,
        ordersCount: isPerOrderModel ? ordersCountNum : undefined,
        date: adSpendForm.date || new Date().toISOString().split('T')[0],
        campaignName: adSpendForm.campaignName || (isPerOrderModel ? `${ordersCountNum} orders × ${perOrderNum} ${displayCurrency}` : ''),
        productId: adSpendForm.productId,
        notes: adSpendForm.notes,
        createdAt: new Date().toISOString()
      };
      saveAdSpendsState([newEntry, ...adSpends]);
    }

    setIsAddAdSpendModalOpen(false);
    setEditingAdSpend(null);
    setAdSpendForm({
      platform: 'tiktok',
      amount: '',
      costModel: 'per_order',
      perOrderCost: String(financialSettings.defaultAdSpendPerOrder ?? 25),
      ordersCount: String(filteredData.orders.length || 1),
      date: new Date().toISOString().split('T')[0],
      campaignName: '',
      productId: '',
      notes: ''
    });
  };

  const handleUpdatePerOrderAdSpend = (newVal: number) => {
    const cleanVal = Math.max(0, Number(newVal) || 0);
    const updated: FinancialSettings = {
      ...financialSettings,
      defaultAdSpendPerOrder: cleanVal,
      adSpendMethod: 'per_order'
    };
    saveFinancialSettings(updated, false);
  };

  const handleSaveCustomOrderAd = (orderId: string) => {
    const val = Number(inlineOrderAdValue);
    if (isNaN(val) || val < 0) return;
    const nextCustom = { ...(financialSettings.customOrderAdSpends || {}), [orderId]: val };
    saveFinancialSettings({
      ...financialSettings,
      customOrderAdSpends: nextCustom
    }, false);
    setEditingOrderAdId(null);
    setInlineOrderAdValue('');
  };

  const handleDeleteAdSpend = (id: string) => {
    const updated = adSpends.filter(a => a.id !== id);
    saveAdSpendsState(updated);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseForm.amount);
    if (!amountNum || amountNum <= 0 || !expenseForm.title.trim()) return;

    if (editingExpense) {
      const updated = expenses.map(ex => ex.id === editingExpense.id ? {
        ...ex,
        category: expenseForm.category,
        title: expenseForm.title.trim(),
        amount: amountNum,
        date: expenseForm.date,
        notes: expenseForm.notes
      } : ex);
      saveExpensesState(updated);
    } else {
      const newEntry: ExpenseEntry = {
        id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        storeId: activeCountrySlug,
        category: expenseForm.category,
        title: expenseForm.title.trim(),
        amount: amountNum,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        notes: expenseForm.notes,
        createdAt: new Date().toISOString()
      };
      saveExpensesState([newEntry, ...expenses]);
    }

    setIsAddExpenseModalOpen(false);
    setEditingExpense(null);
    setExpenseForm({
      category: 'packaging',
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    saveExpensesState(updated);
  };

  const simResults = useMemo(() => {
    const {
      sellingPrice,
      costPrice,
      adCpa,
      deliveryCost,
      returnCost,
      packagingCost,
      callCenterCost,
      confirmationRate,
      deliveryRate,
      monthlyTargetOrders
    } = simulatorState;

    const confFactor = confirmationRate / 100;
    const delivFactor = deliveryRate / 100;

    const leadsNeededPerDelivered = (confFactor * delivFactor) > 0 ? 1 / (confFactor * delivFactor) : 0;
    const realAdCostPerDelivered = leadsNeededPerDelivered * adCpa;

    const returnsPerDelivered = (1 - delivFactor) / delivFactor;
    const realReturnFeePerDelivered = returnsPerDelivered * returnCost;

    const realCallCenterPerDelivered = (1 / delivFactor) * callCenterCost;

    const totalCostPerDelivered =
      costPrice +
      realAdCostPerDelivered +
      deliveryCost +
      realReturnFeePerDelivered +
      packagingCost +
      realCallCenterPerDelivered;

    const netProfitPerDelivered = sellingPrice - totalCostPerDelivered;
    const netMarginPercent = sellingPrice > 0 ? Math.round((netProfitPerDelivered / sellingPrice) * 100) : 0;

    const monthlyDeliveredOrders = Math.round(monthlyTargetOrders * confFactor * delivFactor);
    const monthlyNetProfit = Math.round(monthlyDeliveredOrders * netProfitPerDelivered);
    const monthlyAdSpend = Math.round(monthlyTargetOrders * adCpa);
    const monthlyRevenue = monthlyDeliveredOrders * sellingPrice;

    const availableMarginBeforeAds = sellingPrice - (costPrice + deliveryCost + realReturnFeePerDelivered + packagingCost + realCallCenterPerDelivered);
    const maxAllowedCpa = availableMarginBeforeAds * (confFactor * delivFactor);

    const requiredRoas = monthlyAdSpend > 0 ? Number((monthlyRevenue / monthlyAdSpend).toFixed(2)) : 0;

    const isSimWinning = netProfitPerDelivered > 20 && netMarginPercent >= 15;
    const isSimLoss = netProfitPerDelivered <= 0;

    return {
      leadsNeededPerDelivered: Number(leadsNeededPerDelivered.toFixed(1)),
      realAdCostPerDelivered: Math.round(realAdCostPerDelivered),
      realReturnFeePerDelivered: Math.round(realReturnFeePerDelivered),
      totalCostPerDelivered: Math.round(totalCostPerDelivered),
      netProfitPerDelivered: Math.round(netProfitPerDelivered),
      netMarginPercent,
      monthlyDeliveredOrders,
      monthlyNetProfit,
      monthlyAdSpend,
      monthlyRevenue,
      maxAllowedCpa: Math.max(0, Math.round(maxAllowedCpa)),
      requiredRoas,
      isSimWinning,
      isSimLoss
    };
  }, [simulatorState]);

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value', 'Currency'],
      ['Delivered Gross Revenue', metrics.grossDeliveredRevenue, displayCurrency],
      ['Product COGS (Cost of Goods)', metrics.deliveredCOGS, displayCurrency],
      ['Total Ad Spend', metrics.totalAdSpend, displayCurrency],
      ['Delivery Shipping Costs', metrics.deliveryFeesTotal, displayCurrency],
      ['Return / Refusal Fees', metrics.returnFeesTotal, displayCurrency],
      ['Packaging & Call Center', metrics.packagingCostTotal + metrics.callCenterCostTotal, displayCurrency],
      ['Additional Expenses', metrics.additionalExpensesTotal, displayCurrency],
      ['Total Outflow & Costs', metrics.totalExpensesAndCosts, displayCurrency],
      ['NET PROFIT', metrics.netProfit, displayCurrency],
      ['Net Profit Margin', `${metrics.netMarginPercent}%`, ''],
      ['ROAS', metrics.roas, 'x'],
      ['Total Orders', metrics.totalOrdersCount, 'orders'],
      ['Delivered Orders', metrics.deliveredCount, 'orders'],
      ['Delivery Success Rate', `${metrics.deliveryRatePercent}%`, ''],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mavluy_profit_report_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dateFilterOptions = [
    { value: 'all', label: isAr ? 'كل الأوقات' : 'All Time', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> },
    { value: 'today', label: isAr ? 'اليوم' : 'Today', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> },
    { value: 'yesterday', label: isAr ? 'أمس' : 'Yesterday', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> },
    { value: '7days', label: isAr ? 'آخر 7 أيام' : 'Last 7 Days', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> },
    { value: 'this_month', label: isAr ? 'هذا الشهر' : 'This Month', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> },
    { value: '30days', label: isAr ? 'آخر 30 يوماً' : 'Last 30 Days', icon: <Calendar className="w-3.5 h-3.5 text-stone-400" /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-100 flex items-center gap-2">
                <span>{isAr ? 'الأرباح، المحاسبة وتتبع تكاليف الإعلانات' : 'Profit & Loss (P&L) & Ads Accounting'}</span>
              </h1>
              <p className="text-xs text-stone-400 font-medium mt-0.5">
                {isAr
                  ? 'حساب دقيق لصافي أرباحك، مصاريف إعلاناتك (TikTok, Meta, Snap)، تكاليف الشحن والروتور لتعرف واش رابح ولا خاسر.'
                  : 'Accurately monitor Net Profit, Ad Spend (TikTok, Meta, Snap), COGS, and Delivery/Return costs.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-40 sm:w-44">
            <CustomSelect
              options={dateFilterOptions}
              value={dateFilter}
              onChange={val => setDateFilter(val as any)}
              theme="dark"
              size="sm"
              buttonClassName="!bg-stone-950/80 !border-stone-800 hover:!border-stone-700"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setTempSettings(financialSettings);
              setIsSettingsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-bold transition-all border border-stone-700 cursor-pointer shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'إعدادات رسوم التوصيل' : 'COD Rules'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingAdSpend(null);
              setAdSpendForm({
                platform: 'tiktok',
                amount: '',
                costModel: 'per_order',
                perOrderCost: String(financialSettings.defaultAdSpendPerOrder ?? 25),
                ordersCount: String(filteredData.orders.length || 1),
                date: new Date().toISOString().split('T')[0],
                campaignName: '',
                productId: '',
                notes: ''
              });
              setIsAddAdSpendModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل مصاريف إعلانات' : 'Log Ad Spend'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setExpenseForm({
                category: 'packaging',
                title: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
              });
              setIsAddExpenseModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all border border-stone-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-stone-400" />
            <span>{isAr ? 'مصروف عام' : 'Log Expense'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title={isAr ? 'تصدير التقرير المالي CSV' : 'Export Financial CSV'}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-all border border-stone-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DELIVERED ORDERS AD COST & PROFIT CALCULATOR + TOTAL SPENT SUMMARY */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-stone-100">
                {isAr
                  ? 'حساب الربح والإعلانات للطلبيات المسلمة والمدفوعة (التي استلمها الزبون)'
                  : 'Delivered & Paid Orders Profit & Ads Calculator'}
              </h2>
              {isSavingSettings && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 font-medium">
              {isAr
                ? 'يتم احتساب الربح وتكلفة الإعلان فقط عندما تكتمل الطلبية ويستلمها الزبون وتُدفع (Delivered / Paid)، مع جمع إجمالي ما صرفت في الإعلانات والمصاريف.'
                : 'Profit and ad spend are calculated once the order reaches the client and is paid/delivered, automatically summing your total ad spend and costs.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                type="button"
                onClick={() => saveFinancialSettings({ ...financialSettings, adSpendMethod: 'per_order', adSpendOrderScope: 'delivered_only' }, false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  (financialSettings.adSpendMethod || 'per_order') === 'per_order'
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isAr ? `حساب الإعلان على كل طلبية وصلات للزبون (${metrics.deliveredCount})` : `Ads on Delivered Orders (${metrics.deliveredCount})`}
              </button>
              <button
                type="button"
                onClick={() => saveFinancialSettings({ ...financialSettings, adSpendMethod: 'total' }, false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  financialSettings.adSpendMethod === 'total'
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isAr ? 'مجموع الحملة في الأخير فقط' : 'Manual Campaign Total Only'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-5 bg-stone-950/80 border border-stone-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-200">
                {isAr ? `تكلفة الإعلان لكل طلبية وصلات للزبون (${displayCurrency})` : `Ad Cost for Each Delivered Order (${displayCurrency})`}
              </label>
              <span className="text-xs font-mono font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-lg border border-rose-500/30">
                {financialSettings.defaultAdSpendPerOrder ?? 25} {displayCurrency} / {isAr ? 'طلبية مسلمة' : 'delivered order'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 bg-stone-900 border border-stone-700 rounded-xl overflow-hidden focus-within:border-blue-500">
                <button
                  type="button"
                  onClick={() => handleUpdatePerOrderAdSpend(Math.max(0, (Number(financialSettings.defaultAdSpendPerOrder ?? 25)) - 5))}
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 text-stone-200 border-r border-stone-800 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={financialSettings.defaultAdSpendPerOrder ?? 25}
                  onChange={e => handleUpdatePerOrderAdSpend(Number(e.target.value) || 0)}
                  className="w-full bg-transparent px-3 py-2 text-sm font-mono font-black text-center text-stone-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleUpdatePerOrderAdSpend((Number(financialSettings.defaultAdSpendPerOrder ?? 25)) + 5)}
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 text-stone-200 border-l border-stone-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 ml-1">{isAr ? 'تحديد سريع:' : 'Quick set:'}</span>
              {[0, 15, 20, 25, 30, 40, 50, 60, 80].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdatePerOrderAdSpend(preset)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    Number(financialSettings.defaultAdSpendPerOrder ?? 25) === preset
                      ? 'bg-[#2563eb] text-white border-blue-500'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {preset} {displayCurrency}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-950/80 border border-rose-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                {isAr ? 'مجموع شحال خسرتي فالإعلانات' : 'Total Spent on Ads'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 block">
                {metrics.totalAdSpend.toLocaleString()} {displayCurrency}
              </span>
              <span className="text-[10px] text-stone-400 font-bold block">
                {(financialSettings.adSpendMethod || 'per_order') === 'per_order'
                  ? (isAr
                      ? `${metrics.deliveredCount} طلبية مسلمة × ${financialSettings.defaultAdSpendPerOrder ?? 25} ${displayCurrency}${metrics.manualAdSpendTotal > 0 ? ` (+${metrics.manualAdSpendTotal} يدوي)` : ''}`
                      : `${metrics.deliveredCount} delivered orders × ${financialSettings.defaultAdSpendPerOrder ?? 25} ${displayCurrency}`)
                  : (isAr ? 'من سجل الحملات اليدوي' : 'From manual campaign log')}
              </span>
            </div>

            <div className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                {isAr ? 'المجموع الكلي شحال خسرتي/صرفتي' : 'Total Spent (All Costs)'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 block">
                {metrics.totalExpensesAndCosts.toLocaleString()} {displayCurrency}
              </span>
              <span className="text-[10px] text-stone-400 font-bold block">
                {isAr ? 'إعلانات + سلعة + شحن + روتور' : 'Ads + COGS + Shipping + Returns'}
              </span>
            </div>

            <div className="bg-stone-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                {isAr ? 'الربح الصافي للطلبية المسلمة' : 'Net Profit / Delivered Order'}
              </span>
              <span className={`text-xl sm:text-2xl font-black font-mono block ${
                metrics.avgProfitPerDeliveredOrder >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {metrics.avgProfitPerDeliveredOrder > 0 ? '+' : ''}{metrics.avgProfitPerDeliveredOrder.toLocaleString()} {displayCurrency}
              </span>
              <span className="text-[10px] text-stone-400 font-bold block">
                {isAr
                  ? `من أصل ${metrics.deliveredCount} طلبية وصلات للزبون وتخلصات`
                  : `Across ${metrics.deliveredCount} completed & paid orders`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all ${
        metrics.isWinning
          ? 'bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-900 border-emerald-500/40 shadow-2xl shadow-emerald-950/40'
          : metrics.isLosing
          ? 'bg-gradient-to-br from-rose-950/40 via-stone-900 to-stone-900 border-rose-500/40 shadow-2xl shadow-rose-950/40'
          : 'bg-stone-900 border-stone-800'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 ${
                metrics.isWinning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : metrics.isLosing
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-stone-800 text-stone-300'
              }`}>
                {metrics.isWinning ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{isAr ? 'متجر رابح (Profitable Winner)' : 'WINNING STORE (Profitable)'}</span>
                  </>
                ) : metrics.isLosing ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{isAr ? 'متجر خاسر (Operating at Loss)' : 'LOSING STORE (Loss Alert)'}</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{isAr ? 'نقطة التعادل (Break-Even)' : 'BREAK-EVEN'}</span>
                  </>
                )}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {dateFilter === 'all' ? (isAr ? 'لكل المبيعات' : 'All-time orders') : `${dateFilter}`}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className={`text-3xl sm:text-5xl font-black font-mono tracking-tight ${
                metrics.isWinning
                  ? 'text-emerald-400'
                  : metrics.isLosing
                  ? 'text-rose-400'
                  : 'text-stone-200'
              }`}>
                {metrics.netProfit > 0 ? '+' : ''}{metrics.netProfit.toLocaleString()} {displayCurrency}
              </span>
              <span className="text-sm font-bold text-stone-400">
                {isAr ? 'صافي الربح الحقيقي (Net Profit)' : 'Net Profit'}
              </span>
            </div>

            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              {metrics.isWinning ? (
                isAr
                  ? `أنت تحقق أرباحاً ممتازة بهامش صافي يبلغ ${metrics.netMarginPercent}% وعائد إعلاني ROAS يبلغ ${metrics.roas}x بعد خصم جميع تكاليف الشحن، تكلفة شراء السلع، الإعلانات، ونسب الروتور.`
                  : `You are generating healthy net profits with a ${metrics.netMarginPercent}% net margin and ${metrics.roas}x ROAS after deducting all COGS, Ad Spends, Courier Delivery, and Return Fees.`
              ) : metrics.isLosing ? (
                isAr
                  ? `المتجر يسجل خسارة بقيمة ${Math.abs(metrics.netProfit).toLocaleString()} ${displayCurrency}. ننصح بمراجعة أسعار الشراء، خفض تكلفة الإعلانات (CPA)، أو تحسين نسبة التوصيل.`
                  : `Your store is operating at a net loss of ${Math.abs(metrics.netProfit).toLocaleString()} ${displayCurrency}. Consider optimizing ad campaigns (lower CPA), negotiating better supplier prices, or improving delivery rate.`
              ) : (
                isAr ? 'المداخيل تغطي المصاريف بدقة دون تحقيق ربح إضافي.' : 'Revenues match total expenses exactly (Break-even).'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isAr ? 'هامش الربح الصافي' : 'Net Margin'}
              </span>
              <span className={`text-lg font-black font-mono mt-0.5 block ${metrics.netMarginPercent >= 20 ? 'text-emerald-400' : metrics.netMarginPercent > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {metrics.netMarginPercent}%
              </span>
              <span className="text-[9px] text-stone-500 font-bold block mt-0.5">
                {isAr ? 'من المداخيل المسلمة' : 'of Delivered Rev'}
              </span>
            </div>

            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isAr ? 'عائد الإعلانات ROAS' : 'ROAS'}
              </span>
              <span className="text-lg font-black font-mono text-blue-400 mt-0.5 block">
                {metrics.roas}x
              </span>
              <span className="text-[9px] text-stone-500 font-bold block mt-0.5">
                {isAr ? `التعادل: ${metrics.breakEvenRoas}x` : `B/E: ${metrics.breakEvenRoas}x`}
              </span>
            </div>

            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isAr ? 'نسبة التوصيل' : 'Delivery Rate'}
              </span>
              <span className={`text-lg font-black font-mono mt-0.5 block ${metrics.deliveryRatePercent >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.deliveryRatePercent}%
              </span>
              <span className="text-[9px] text-stone-500 font-bold block mt-0.5">
                {metrics.deliveredCount}/{metrics.deliveredCount + metrics.cancelledCount} {isAr ? 'طرد' : 'parcels'}
              </span>
            </div>

            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                {isAr ? 'إشهار / طرد مسلم' : 'Ad CPA / Deliv'}
              </span>
              <span className="text-lg font-black font-mono text-stone-200 mt-0.5 block">
                {metrics.adCpaPerDeliveredOrder} {displayCurrency}
              </span>
              <span className="text-[9px] text-stone-500 font-bold block mt-0.5">
                {isAr ? 'تكلفة إشهار صافية' : 'Real CPA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'المداخيل المسلمة' : 'Delivered Sales'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-emerald-400">{metrics.grossDeliveredRevenue.toLocaleString()} {displayCurrency}</div>
          <div className="text-[10px] text-stone-500 font-medium">{metrics.deliveredCount} {isAr ? 'طلبية مستلمة' : 'delivered orders'}</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'تكلفة السلع (COGS)' : 'Product COGS'}</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><ShoppingBag className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-stone-200">{metrics.deliveredCOGS.toLocaleString()} {displayCurrency}</div>
          <div className="text-[10px] text-stone-500 font-medium">{metrics.totalItemsDeliveredCount} {isAr ? 'قطعة مسلمة' : 'units delivered'}</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'مصاريف الإعلانات' : 'Total Ad Spend'}</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><Megaphone className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-rose-400">{metrics.totalAdSpend.toLocaleString()} {displayCurrency}</div>
          <div className="text-[10px] text-stone-500 font-medium">TikTok, Meta, Snap, Google</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'مصاريف التوصيل' : 'Delivery Costs'}</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Truck className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-stone-200">{metrics.deliveryFeesTotal.toLocaleString()} {displayCurrency}</div>
          <div className="text-[10px] text-stone-500 font-medium">@{financialSettings.defaultDeliveryFeePerOrder} {displayCurrency} / {isAr ? 'طرد' : 'order'}</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'مصاريف الروتور' : 'Return Fees'}</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400"><RefreshCw className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-orange-400">{metrics.returnFeesTotal.toLocaleString()} {displayCurrency}</div>
          <div className="text-[10px] text-stone-500 font-medium">{metrics.cancelledCount} {isAr ? 'طرد راجع' : 'returned orders'}</div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{isAr ? 'تغليف وتأكيد ومصاريف' : 'Packaging & Ops'}</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Package className="w-3.5 h-3.5" /></div>
          </div>
          <div className="text-lg font-black font-mono text-stone-200">
            {(metrics.packagingCostTotal + metrics.callCenterCostTotal + metrics.additionalExpensesTotal).toLocaleString()} {displayCurrency}
          </div>
          <div className="text-[10px] text-stone-500 font-medium">{isAr ? 'تغليف + تأكيد + مصاريف' : 'Ops & packaging'}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-stone-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>{isAr ? 'تحليل المداخيل والمصاريف' : 'Breakdown & Analytics'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>{isAr ? 'أرباح الطلبيات المسلمة' : 'Delivered Orders Profit'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono font-bold">
            {orderProfitList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ad_spends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ad_spends'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Megaphone className="w-4 h-4 text-rose-400" />
          <span>{isAr ? 'سجل مصاريف الإعلانات' : 'Ad Spend Tracker'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono font-bold">
            {filteredData.adSpends.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'expenses'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          <span>{isAr ? 'المصاريف التشغيلية' : 'Operational Expenses'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono font-bold">
            {filteredData.expenses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'أرباح المنتجات وتكلفة الشراء (COGS)' : 'Product Profitability'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono font-bold">
            {products.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'simulator'
              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
          }`}
        >
          <Calculator className="w-4 h-4 text-blue-400" />
          <span>{isAr ? 'مُحاكي التسعير وتجربة الأرباح' : 'Profit & Pricing Simulator'}</span>
        </button>
      </div>

      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-100">{isAr ? 'توزيع التكاليف والمصاريف المقتطعة' : 'Cost & Expense Distribution'}</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isAr ? 'أين تذهب أموال المتجر بالتفصيل؟' : 'Where your revenue goes proportionally.'}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-stone-300">
                {isAr ? 'إجمالي التكاليف:' : 'Total Costs:'} <strong className="text-stone-100">{metrics.totalExpensesAndCosts.toLocaleString()} {displayCurrency}</strong>
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {isAr ? 'تكلفة شراء السلع (COGS)' : 'Product COGS'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {metrics.deliveredCOGS.toLocaleString()} {displayCurrency} (
                    {metrics.totalExpensesAndCosts > 0 ? Math.round((metrics.deliveredCOGS / metrics.totalExpensesAndCosts) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.totalExpensesAndCosts > 0 ? (metrics.deliveredCOGS / metrics.totalExpensesAndCosts) * 100 : 0}%` }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    {isAr ? 'مصاريف الإعلانات (TikTok, Meta, Snap)' : 'Advertising Spend'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {metrics.totalAdSpend.toLocaleString()} {displayCurrency} (
                    {metrics.totalExpensesAndCosts > 0 ? Math.round((metrics.totalAdSpend / metrics.totalExpensesAndCosts) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.totalExpensesAndCosts > 0 ? (metrics.totalAdSpend / metrics.totalExpensesAndCosts) * 100 : 0}%` }}
                    className="h-full bg-rose-400 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    {isAr ? 'مصاريف الشحن والتوصيل (Livraison)' : 'Courier Delivery Fees'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {metrics.deliveryFeesTotal.toLocaleString()} {displayCurrency} (
                    {metrics.totalExpensesAndCosts > 0 ? Math.round((metrics.deliveryFeesTotal / metrics.totalExpensesAndCosts) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.totalExpensesAndCosts > 0 ? (metrics.deliveryFeesTotal / metrics.totalExpensesAndCosts) * 100 : 0}%` }}
                    className="h-full bg-blue-400 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-orange-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    {isAr ? 'مصاريف الروتور والإلغاء (Retour fees)' : 'Return Fees'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {metrics.returnFeesTotal.toLocaleString()} {displayCurrency} (
                    {metrics.totalExpensesAndCosts > 0 ? Math.round((metrics.returnFeesTotal / metrics.totalExpensesAndCosts) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.totalExpensesAndCosts > 0 ? (metrics.returnFeesTotal / metrics.totalExpensesAndCosts) * 100 : 0}%` }}
                    className="h-full bg-orange-400 rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-purple-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    {isAr ? 'التغليف، التأكيد، والمصاريف التشغيلية' : 'Packaging & Operational Expenses'}
                  </span>
                  <span className="font-mono text-stone-300">
                    {(metrics.packagingCostTotal + metrics.callCenterCostTotal + metrics.additionalExpensesTotal).toLocaleString()} {displayCurrency} (
                    {metrics.totalExpensesAndCosts > 0 ? Math.round(((metrics.packagingCostTotal + metrics.callCenterCostTotal + metrics.additionalExpensesTotal) / metrics.totalExpensesAndCosts) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${metrics.totalExpensesAndCosts > 0 ? ((metrics.packagingCostTotal + metrics.callCenterCostTotal + metrics.additionalExpensesTotal) / metrics.totalExpensesAndCosts) * 100 : 0}%` }}
                    className="h-full bg-purple-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-stone-200 block">
                    {isAr ? 'الربح الصافي المتبقي بعد كل المصاريف' : 'Remaining Net Profit After All Costs'}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    {metrics.grossDeliveredRevenue.toLocaleString()} {displayCurrency} ({isAr ? 'مداخيل' : 'Rev'}) - {metrics.totalExpensesAndCosts.toLocaleString()} {displayCurrency} ({isAr ? 'تكاليف' : 'Costs'})
                  </span>
                </div>
              </div>
              <span className={`text-xl font-black font-mono ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.netProfit >= 0 ? '+' : ''}{metrics.netProfit.toLocaleString()} {displayCurrency}
              </span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-100">{isAr ? 'الإعلانات حسب المنصة' : 'Ads by Platform'}</h3>
              <button
                type="button"
                onClick={() => {
                  setEditingAdSpend(null);
                  setIsAddAdSpendModalOpen(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة' : 'Add'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                  <span className="text-xs font-bold text-stone-100">TikTok Ads</span>
                </div>
                <span className="font-mono text-xs font-black text-stone-200">
                  {metrics.adSpendByPlatform.tiktok.toLocaleString()} {displayCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="text-xs font-bold text-stone-100">Meta / Facebook / IG</span>
                </div>
                <span className="font-mono text-xs font-black text-stone-200">
                  {metrics.adSpendByPlatform.meta.toLocaleString()} {displayCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
                  <span className="text-xs font-bold text-stone-100">Snapchat Ads</span>
                </div>
                <span className="font-mono text-xs font-black text-stone-200">
                  {metrics.adSpendByPlatform.snapchat.toLocaleString()} {displayCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span className="text-xs font-bold text-stone-100">Google & YouTube</span>
                </div>
                <span className="font-mono text-xs font-black text-stone-200">
                  {metrics.adSpendByPlatform.google.toLocaleString()} {displayCurrency}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                  <span className="text-xs font-bold text-stone-100">Influencers & Other</span>
                </div>
                <span className="font-mono text-xs font-black text-stone-200">
                  {(metrics.adSpendByPlatform.influencer + metrics.adSpendByPlatform.other).toLocaleString()} {displayCurrency}
                </span>
              </div>
            </div>


          </div>
        </div>
      )}

      {(activeSubTab === 'overview' || activeSubTab === 'orders') && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-stone-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{isAr ? 'تفاصيل الربح والإعلانات للطلبيات المسلمة والمدفوعة' : 'Delivered & Paid Orders Profit & Ads Breakdown'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr
                  ? 'هنا كتبان غير الطلبيات اللي وصلات للزبون وشدها وتخلصات (Delivered / Paid)، وكيتحسب ليها إعلانها وتكاليفها وصافي ربحها.'
                  : 'Only completed orders that reached the client and were paid are calculated here with their ad cost, total expenses, and net profit.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-black">
                {isAr ? 'مجموع إعلانات الطلبيات المسلمة:' : 'Delivered Orders Ads:'} {metrics.perOrderAdSpendTotal.toLocaleString()} {displayCurrency}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-black">
                {isAr ? 'مجموع الخسائر/المصاريف:' : 'Total Spent:'} {metrics.totalExpensesAndCosts.toLocaleString()} {displayCurrency}
              </div>
            </div>
          </div>

          {orderProfitList.length === 0 ? (
            <div className="py-10 text-center bg-stone-950/50 rounded-2xl border border-stone-800 space-y-2">
              <ShoppingBag className="w-9 h-9 text-stone-600 mx-auto" />
              <div className="text-sm font-bold text-stone-300">
                {isAr ? 'لا توجد طلبيات مسلمة (مدفوعة) بعد في هذه الفترة' : 'No delivered/paid orders yet in this date range'}
              </div>
              <p className="text-xs text-stone-500">
                {isAr
                  ? 'غير توصل الطلبية للزبون ويشدها (Delivered)، غادي تبان هنا أوتوماتيكياً ويتحسب ليها الإعلان والربح الصافي ديالها.'
                  : 'Once an order is delivered and paid by the client, its ad cost and net profit will be calculated here automatically.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-3">{isAr ? 'الطلبية والزبون' : 'Order & Customer'}</th>
                    <th className="pb-3 px-2">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="pb-3 px-2">{isAr ? 'مبلغ الطلبية المدفوع' : 'Paid Total'}</th>
                    <th className="pb-3 px-2 text-amber-400">{isAr ? 'تكلفة السلعة' : 'COGS'}</th>
                    <th className="pb-3 px-2 text-rose-400">{isAr ? 'إعلان الطلبية' : 'Order Ad Cost'}</th>
                    <th className="pb-3 px-2 text-blue-400">{isAr ? 'الشحن والتغليف والتأكيد' : 'Delivery & Ops'}</th>
                    <th className="pb-3 px-2 text-orange-400">{isAr ? 'مجموع ما صرفت على الطلبية' : 'Total Spent on Order'}</th>
                    <th className="pb-3 pl-2 text-right text-emerald-400">{isAr ? 'صافي ربح الطلبية' : 'Order Net Profit'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {orderProfitList.map(row => (
                    <tr key={row.orderId} className="hover:bg-stone-850/50 transition-colors">
                      <td className="py-3.5 pr-3">
                        <div className="font-bold text-stone-100 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-blue-400">#{String(row.orderId).slice(-6)}</span>
                          <span>{row.customerName}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[210px] mt-0.5">
                          {row.itemSummary} • {row.customerCity}
                        </div>
                      </td>

                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {isAr ? 'وصلات للزبون (مدفوعة)' : 'Delivered & Paid'}
                        </span>
                      </td>

                      <td className="py-3.5 px-2 font-mono font-bold text-stone-100">
                        {row.orderRevenue.toLocaleString()} {displayCurrency}
                      </td>

                      <td className="py-3.5 px-2 font-mono text-amber-300">
                        -{row.orderCOGS.toLocaleString()} {displayCurrency}
                      </td>

                      <td className="py-3.5 px-2">
                        {editingOrderAdId === row.orderId ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={inlineOrderAdValue}
                              onChange={e => setInlineOrderAdValue(e.target.value)}
                              className="w-16 px-2 py-1 bg-stone-950 border border-rose-500 rounded-lg text-xs font-mono font-bold text-rose-400 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCustomOrderAd(row.orderId)}
                              className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOrderAdId(null)}
                              className="p-1 bg-stone-800 text-stone-400 rounded-lg hover:bg-stone-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrderAdId(row.orderId);
                              setInlineOrderAdValue(String(row.adCost));
                            }}
                            title={isAr ? 'اضغط لتعديل تكلفة إعلان هذه الطلبية' : 'Click to customize ad cost for this order'}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 font-mono font-black text-xs transition-colors cursor-pointer"
                          >
                            <span>-{row.adCost.toLocaleString()} {displayCurrency}</span>
                            <Edit3 className="w-2.5 h-2.5 text-stone-400" />
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-2 font-mono text-stone-300">
                        -{row.opsAndShippingCost.toLocaleString()} {displayCurrency}
                      </td>

                      <td className="py-3.5 px-2 font-mono font-black text-orange-400">
                        -{row.totalOrderSpent.toLocaleString()} {displayCurrency}
                      </td>

                      <td className="py-3.5 pl-2 text-right">
                        <span className={`font-mono font-black text-sm ${
                          row.realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {row.realizedProfit >= 0 ? '+' : ''}{row.realizedProfit.toLocaleString()} {displayCurrency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-700 bg-stone-950/80 font-mono text-xs font-black">
                    <td className="py-3.5 pr-3 text-stone-100">
                      {isAr ? `المجموع الكلي (${orderProfitList.length} طلبية مسلمة)` : `Grand Total (${orderProfitList.length} Delivered Orders)`}
                    </td>
                    <td className="py-3.5 px-2 text-emerald-400">
                      {metrics.deliveredCount} {isAr ? 'مسلمة' : 'delivered'}
                    </td>
                    <td className="py-3.5 px-2 text-stone-100">
                      {metrics.grossDeliveredRevenue.toLocaleString()} {displayCurrency}
                    </td>
                    <td className="py-3.5 px-2 text-amber-400">
                      -{metrics.deliveredCOGS.toLocaleString()} {displayCurrency}
                    </td>
                    <td className="py-3.5 px-2 text-rose-400">
                      -{metrics.perOrderAdSpendTotal.toLocaleString()} {displayCurrency}
                    </td>
                    <td className="py-3.5 px-2 text-blue-400">
                      -{(metrics.deliveryFeesTotal + metrics.returnFeesTotal + metrics.packagingCostTotal + metrics.callCenterCostTotal).toLocaleString()} {displayCurrency}
                    </td>
                    <td className="py-3.5 px-2 text-orange-400">
                      -{metrics.totalExpensesAndCosts.toLocaleString()} {displayCurrency}
                    </td>
                    <td className={`py-3.5 pl-2 text-right text-sm ${
                      metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {metrics.netProfit >= 0 ? '+' : ''}{metrics.netProfit.toLocaleString()} {displayCurrency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'ad_spends' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-stone-100">{isAr ? 'سجل مصاريف الحملات الإعلانية' : 'Ad Spend Log'}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'سجل مصاريفك اليومية على TikTok، Facebook، Snap لخصمها تلقائياً من الأرباح.' : 'Log daily ad expenditures across platforms to calculate exact net profit.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-black">
                {isAr ? 'المجموع:' : 'Total:'} {metrics.totalAdSpend.toLocaleString()} {displayCurrency}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAdSpend(null);
                  setAdSpendForm({
                    platform: 'tiktok',
                    amount: '',
                    costModel: 'per_order',
                    perOrderCost: String(financialSettings.defaultAdSpendPerOrder ?? 25),
                    ordersCount: String(filteredData.orders.length || 1),
                    date: new Date().toISOString().split('T')[0],
                    campaignName: '',
                    productId: '',
                    notes: ''
                  });
                  setIsAddAdSpendModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'تسجيل إعلان جديد' : 'Add Ad Spend'}</span>
              </button>
            </div>
          </div>

          {filteredData.adSpends.length === 0 ? (
            <div className="py-12 text-center bg-stone-950/40 rounded-2xl border border-stone-800/80 space-y-3">
              <Megaphone className="w-10 h-10 text-stone-600 mx-auto" />
              <div className="text-sm font-bold text-stone-300">
                {isAr ? 'لم تسجل أي مصاريف إعلانية بعد' : 'No ad spends logged yet'}
              </div>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isAr
                  ? 'انقر على الزر أعلاه لإضافة المبالغ التي صرفتها في فيسبوك أو تيك توك لتتمكن من معرفة صافي ربحك بدقة.'
                  : 'Add your ad spends to see how marketing costs impact your bottom-line profit.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-3">{isAr ? 'المنصة' : 'Platform'}</th>
                    <th className="pb-3 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="pb-3 px-3">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="pb-3 px-3">{isAr ? 'اسم الحملة / الملاحظة' : 'Campaign / Notes'}</th>
                    <th className="pb-3 pl-3 text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredData.adSpends.map(spend => {
                    const platformLabels: Record<AdPlatformType, { name: string; color: string }> = {
                      tiktok: { name: 'TikTok Ads', color: 'text-stone-100 bg-stone-800' },
                      meta: { name: 'Meta / Facebook', color: 'text-blue-400 bg-blue-950/60 border-blue-900/40' },
                      snapchat: { name: 'Snapchat Ads', color: 'text-amber-400 bg-amber-950/60 border-amber-900/40' },
                      google: { name: 'Google Ads', color: 'text-rose-400 bg-rose-950/60 border-rose-900/40' },
                      influencer: { name: 'Influencer', color: 'text-purple-400 bg-purple-950/60 border-purple-900/40' },
                      other: { name: 'Other', color: 'text-stone-300 bg-stone-800' }
                    };
                    const pl = platformLabels[spend.platform] || platformLabels.other;
                    const matchedProd = products.find(p => p.id === spend.productId);

                    return (
                      <tr key={spend.id} className="hover:bg-stone-850/50 transition-colors">
                        <td className="py-3.5 pr-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${pl.color}`}>
                            {pl.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-stone-300">{spend.date}</td>
                        <td className="py-3.5 px-3 font-mono font-black text-rose-400 text-sm">
                          {spend.amount} {displayCurrency}
                        </td>
                        <td className="py-3.5 px-3 text-stone-300 max-w-xs">
                          <div className="font-bold text-stone-200">
                            {spend.campaignName || spend.notes || '-'}
                          </div>
                          {matchedProd && (
                            <div className="text-[10px] text-blue-400 font-semibold mt-0.5">
                              {isAr ? '📦 خاص بالمنتج: ' : '📦 For Product: '} {matchedProd.name}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAdSpend(spend);
                                setAdSpendForm({
                                  platform: spend.platform,
                                  amount: String(spend.amount),
                                  costModel: spend.costModel || 'total',
                                  perOrderCost: String(spend.perOrderCost || financialSettings.defaultAdSpendPerOrder || 25),
                                  ordersCount: String(spend.ordersCount || filteredData.orders.length || 1),
                                  date: spend.date,
                                  campaignName: spend.campaignName || '',
                                  productId: spend.productId || '',
                                  notes: spend.notes || ''
                                });
                                setIsAddAdSpendModalOpen(true);
                              }}
                              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdSpend(spend.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'expenses' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-stone-100">{isAr ? 'المصاريف والتكاليف العامة' : 'Operational Expenses'}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr ? 'سجل مصاريف التغليف، الكول سنتر، أدوات السوفتوير، كراء المحل وغيرها.' : 'Track packaging, rent, software subscriptions, call center, and general overheads.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs font-black">
                {isAr ? 'المجموع:' : 'Total:'} {metrics.additionalExpensesTotal.toLocaleString()} {displayCurrency}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setExpenseForm({
                    category: 'packaging',
                    title: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                  });
                  setIsAddExpenseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة مصروف' : 'Add Expense'}</span>
              </button>
            </div>
          </div>

          {filteredData.expenses.length === 0 ? (
            <div className="py-12 text-center bg-stone-950/40 rounded-2xl border border-stone-800/80 space-y-3">
              <Building2 className="w-10 h-10 text-stone-600 mx-auto" />
              <div className="text-sm font-bold text-stone-300">
                {isAr ? 'لم تسجل أي مصاريف إضافية' : 'No operational expenses recorded'}
              </div>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {isAr
                  ? 'يمكنك إضافة فواتير الشحن المباشرة، اشتراكات الأدوات، أو مصاريف التغليف الإضافية.'
                  : 'Log any extra overhead costs to keep your accounting comprehensive.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="pb-3 pr-3">{isAr ? 'البيان / العنوان' : 'Title'}</th>
                    <th className="pb-3 px-3">{isAr ? 'الفئة' : 'Category'}</th>
                    <th className="pb-3 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="pb-3 px-3">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="pb-3 pl-3 text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredData.expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-stone-850/50 transition-colors">
                      <td className="py-3.5 pr-3 font-bold text-stone-200">{exp.title}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-800 text-stone-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-stone-400">{exp.date}</td>
                      <td className="py-3.5 px-3 font-mono font-black text-purple-400 text-sm">
                        {exp.amount} {displayCurrency}
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(exp);
                              setExpenseForm({
                                category: exp.category,
                                title: exp.title,
                                amount: String(exp.amount),
                                date: exp.date,
                                notes: exp.notes || ''
                              });
                              setIsAddExpenseModalOpen(true);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'products' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-stone-100">{isAr ? 'أرباح كل منتج وتحديد سعر الشراء (COGS)' : 'Product Profitability & Unit Economics'}</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isAr
                  ? 'حدد سعر الشراء (تكلفة السلعة من المورد) لكل منتج لحساب أرباحه الصافية بدقة.'
                  : 'Set the supplier cost (COGS) for each product to evaluate individual profit margins.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 pr-3">{isAr ? 'المنتج' : 'Product'}</th>
                  <th className="pb-3 px-3">{isAr ? 'سعر البيع' : 'Retail Price'}</th>
                  <th className="pb-3 px-3">{isAr ? 'سعر الشراء (COGS)' : 'Cost Price (COGS)'}</th>
                  <th className="pb-3 px-3">{isAr ? 'المسلم' : 'Delivered Units'}</th>
                  <th className="pb-3 px-3">{isAr ? 'المداخيل المسلمة' : 'Delivered Rev'}</th>
                  <th className="pb-3 px-3 text-rose-400">{isAr ? 'الإعلانات' : 'Ad Spend'}</th>
                  <th className="pb-3 px-3 text-cyan-400">{isAr ? 'العائد ROAS' : 'ROAS'}</th>
                  <th className="pb-3 px-3 text-emerald-400">{isAr ? 'صافي الربح' : 'Net Profit'}</th>
                  <th className="pb-3 px-3">{isAr ? 'هامش الربح الصافي' : 'Net Margin'}</th>
                  <th className="pb-3 pl-3 text-right">{isAr ? 'التقييم' : 'Verdict'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {productProfitList.map(item => (
                  <tr key={item.productId} className="hover:bg-stone-850/50 transition-colors">
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={item.productName}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 max-w-[180px]">
                          <span className="font-bold text-stone-100 truncate block">{item.productName}</span>
                          {item.sku && <span className="font-mono text-[10px] text-stone-500 uppercase">{item.sku}</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-stone-200">
                      {item.retailPrice} {displayCurrency}
                    </td>

                    <td className="py-3.5 px-3">
                      {editingCostProductId === item.productId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={inlineCostValue}
                            onChange={e => setInlineCostValue(e.target.value)}
                            placeholder="Cost"
                            className="w-20 px-2 py-1 bg-stone-950 border border-emerald-500 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveInlineCost(item.productId)}
                            className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCostProductId(null)}
                            className="p-1 bg-stone-800 text-stone-400 rounded-lg hover:bg-stone-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCostProductId(item.productId);
                            setInlineCostValue(String(item.costPrice || ''));
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-colors cursor-pointer ${
                            item.costPrice > 0
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/50'
                              : 'bg-amber-950/40 text-amber-400 border border-amber-900/40 hover:bg-amber-900/50'
                          }`}
                        >
                          <span>{item.costPrice > 0 ? `${item.costPrice} ${displayCurrency}` : (isAr ? 'أضف سعر الشراء' : 'Set Cost')}</span>
                          <Edit3 className="w-3 h-3 text-stone-400" />
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-stone-300">
                      {item.unitsDelivered} <span className="text-[10px] text-stone-500">({item.unitsSold} {isAr ? 'مباع' : 'sold'})</span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-stone-200">
                      {item.totalDeliveredRevenue.toLocaleString()} {displayCurrency}
                    </td>

                    {/* New product-specific ad spend */}
                    <td className="py-3.5 px-3 font-mono text-rose-400 font-bold">
                      {item.adSpend ? `${item.adSpend.toLocaleString()} ${displayCurrency}` : '-'}
                    </td>

                    {/* New product-specific ROAS */}
                    <td className="py-3.5 px-3 font-mono text-cyan-400 font-bold">
                      {item.productRoas ? `${item.productRoas}x` : '-'}
                    </td>

                    {/* Product net profit */}
                    <td className={`py-3.5 px-3 font-mono font-black ${
                      (item.netProfit ?? 0) > 0 ? 'text-emerald-400' : (item.netProfit ?? 0) < 0 ? 'text-rose-400' : 'text-stone-400'
                    }`}>
                      {(item.netProfit ?? 0) > 0 ? '+' : ''}{(item.netProfit ?? 0).toLocaleString()} {displayCurrency}
                    </td>

                    {/* Net Margin */}
                    <td className="py-3.5 px-3 font-mono font-bold text-stone-300">
                      {item.grossMarginPercent}%
                    </td>

                    <td className="py-3.5 pl-3 text-right">
                      {item.status === 'star' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Star className="w-3 h-3 fill-emerald-400 text-emerald-400 shrink-0" />
                          <span>{isAr ? 'منتج فائز (Winner)' : 'Star Winner'}</span>
                        </span>
                      ) : item.status === 'profitable' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>{isAr ? 'مربح (Profitable)' : 'Profitable'}</span>
                        </span>
                      ) : item.status === 'low_margin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{isAr ? 'هامش ضيق' : 'Low Margin'}</span>
                        </span>
                      ) : item.status === 'loss' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{isAr ? 'خاسر' : 'Loss'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-stone-800 text-stone-400">
                          {isAr ? 'سعر الشراء غير محدد' : 'Cost unentered'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'simulator' && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-black text-stone-100">{isAr ? 'مُحاكي التسعير وحساب الأرباح قبل إطلاق الإعلانات' : 'E-com COD Profit & Pricing Simulator'}</h3>
            </div>
            <p className="text-xs text-stone-400 mt-1 max-w-3xl">
              {isAr
                ? 'جرب أي منتج جديد قبل ما تصرف عليه فلوس فالإشهار! حط سعر البيع وسعر الشراء وتكاليف التوصيل ونسبة التأكيد وشوف واش رابح ولا خاسر والحد الأقصى لتكلفة الإعلان (Max CPA).'
                : 'Simulate the unit economics of any product before launching marketing campaigns. Calculate break-even CPA and required ROAS.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4 bg-stone-950/60 p-5 rounded-3xl border border-stone-800">
              <h4 className="text-xs font-black text-stone-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-800">
                <Settings className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'معطيات المنتج والحملة' : 'Product & Campaign Inputs'}</span>
              </h4>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'سعر البيع للزبون' : 'Selling Price'}</span>
                  <span className="text-stone-200 font-mono font-black">{simulatorState.sellingPrice} {displayCurrency}</span>
                </label>
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, sellingPrice: Math.max(1, (prev.sellingPrice || 0) - 5) }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-r border-stone-800"
                    title="-5"
                    aria-label="Decrease price"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={simulatorState.sellingPrice}
                    onChange={e => setSimulatorState(prev => ({ ...prev, sellingPrice: Number(e.target.value) || 0 }))}
                    className="w-full bg-transparent px-2 py-2 text-xs font-mono font-black text-center text-stone-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, sellingPrice: (prev.sellingPrice || 0) + 5 }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-l border-stone-800"
                    title="+5"
                    aria-label="Increase price"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[-20, -5, 5, 20].map((stepVal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, sellingPrice: Math.max(1, (prev.sellingPrice || 0) + stepVal) }))}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
                    >
                      {stepVal > 0 ? `+${stepVal}` : stepVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'سعر الشراء من المورد (COGS)' : 'Supplier Cost (COGS)'}</span>
                  <span className="text-amber-400 font-mono font-black">{simulatorState.costPrice} {displayCurrency}</span>
                </label>
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, costPrice: Math.max(0, (prev.costPrice || 0) - 5) }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-r border-stone-800"
                    title="-5"
                    aria-label="Decrease cost"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={simulatorState.costPrice}
                    onChange={e => setSimulatorState(prev => ({ ...prev, costPrice: Number(e.target.value) || 0 }))}
                    className="w-full bg-transparent px-2 py-2 text-xs font-mono font-black text-center text-stone-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, costPrice: (prev.costPrice || 0) + 5 }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-l border-stone-800"
                    title="+5"
                    aria-label="Increase cost"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[-10, -5, 5, 10].map((stepVal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, costPrice: Math.max(0, (prev.costPrice || 0) + stepVal) }))}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
                    >
                      {stepVal > 0 ? `+${stepVal}` : stepVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'تكلفة الطلب في الإعلان (CPA / Cost Per Lead)' : 'Cost Per Lead / CPA'}</span>
                  <span className="text-rose-400 font-mono font-black">{simulatorState.adCpa} {displayCurrency}</span>
                </label>
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, adCpa: Math.max(0, (prev.adCpa || 0) - 5) }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-r border-stone-800"
                    title="-5"
                    aria-label="Decrease CPA"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={simulatorState.adCpa}
                    onChange={e => setSimulatorState(prev => ({ ...prev, adCpa: Number(e.target.value) || 0 }))}
                    className="w-full bg-transparent px-2 py-2 text-xs font-mono font-black text-center text-stone-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, adCpa: (prev.adCpa || 0) + 5 }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-l border-stone-800"
                    title="+5"
                    aria-label="Increase CPA"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[-10, -5, 5, 10].map((stepVal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, adCpa: Math.max(0, (prev.adCpa || 0) + stepVal) }))}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
                    >
                      {stepVal > 0 ? `+${stepVal}` : stepVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'نسبة تأكيد الطلبيات (Confirmation Rate)' : 'Confirmation Rate'}</span>
                  <span className="text-blue-400 font-mono font-black">{simulatorState.confirmationRate}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={simulatorState.confirmationRate}
                  onChange={e => setSimulatorState(prev => ({ ...prev, confirmationRate: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'نسبة التوصيل والاستلام (Delivery Rate)' : 'Delivery Rate'}</span>
                  <span className="text-emerald-400 font-mono font-black">{simulatorState.deliveryRate}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={simulatorState.deliveryRate}
                  onChange={e => setSimulatorState(prev => ({ ...prev, deliveryRate: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-400 flex justify-between">
                    <span>{isAr ? 'سعر التوصيل' : 'Delivery'}</span>
                    <span className="font-mono text-stone-300">{simulatorState.deliveryCost}</span>
                  </label>
                  <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg overflow-hidden focus-within:border-blue-500">
                    <button
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, deliveryCost: Math.max(0, (prev.deliveryCost || 0) - 5) }))}
                      className="px-2 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white border-r border-stone-800 select-none cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={simulatorState.deliveryCost}
                      onChange={e => setSimulatorState(prev => ({ ...prev, deliveryCost: Number(e.target.value) || 0 }))}
                      className="w-full bg-transparent p-1.5 text-xs font-mono font-bold text-center text-stone-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, deliveryCost: (prev.deliveryCost || 0) + 5 }))}
                      className="px-2 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white border-l border-stone-800 select-none cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-400 flex justify-between">
                    <span>{isAr ? 'سعر الروتور' : 'Return Fee'}</span>
                    <span className="font-mono text-stone-300">{simulatorState.returnCost}</span>
                  </label>
                  <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg overflow-hidden focus-within:border-blue-500">
                    <button
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, returnCost: Math.max(0, (prev.returnCost || 0) - 5) }))}
                      className="px-2 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white border-r border-stone-800 select-none cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={simulatorState.returnCost}
                      onChange={e => setSimulatorState(prev => ({ ...prev, returnCost: Number(e.target.value) || 0 }))}
                      className="w-full bg-transparent p-1.5 text-xs font-mono font-bold text-center text-stone-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, returnCost: (prev.returnCost || 0) + 5 }))}
                      className="px-2 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-white border-l border-stone-800 select-none cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-800">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex justify-between">
                  <span>{isAr ? 'حجم الطلبات الشهري المستهدف' : 'Monthly Orders Target'}</span>
                  <span className="text-stone-200 font-mono font-black">{simulatorState.monthlyTargetOrders} {isAr ? 'طلب' : 'leads'}</span>
                </label>
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, monthlyTargetOrders: Math.max(10, (prev.monthlyTargetOrders || 0) - 50) }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-r border-stone-800"
                    title="-50"
                    aria-label="Decrease target"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={simulatorState.monthlyTargetOrders}
                    onChange={e => setSimulatorState(prev => ({ ...prev, monthlyTargetOrders: Number(e.target.value) || 0 }))}
                    className="w-full bg-transparent px-2 py-2 text-xs font-mono font-black text-center text-stone-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSimulatorState(prev => ({ ...prev, monthlyTargetOrders: (prev.monthlyTargetOrders || 0) + 50 }))}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-stone-850 hover:bg-stone-800 active:bg-stone-750 text-stone-300 hover:text-white transition-all cursor-pointer select-none border-l border-stone-800"
                    title="+50"
                    aria-label="Increase target"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  {[-100, -50, 50, 100].map((stepVal, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSimulatorState(prev => ({ ...prev, monthlyTargetOrders: Math.max(10, (prev.monthlyTargetOrders || 0) + stepVal) }))}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
                    >
                      {stepVal > 0 ? `+${stepVal}` : stepVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className={`p-6 rounded-3xl border ${
                simResults.isSimWinning
                  ? 'bg-gradient-to-br from-emerald-950/40 to-stone-950 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
                  : simResults.isSimLoss
                  ? 'bg-gradient-to-br from-rose-950/40 to-stone-950 border-rose-500/40 shadow-xl shadow-rose-950/30'
                  : 'bg-gradient-to-br from-amber-950/40 to-stone-950 border-amber-500/40 shadow-xl shadow-amber-950/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                      {isAr ? 'النتيجة التقديرية للقطعة الواحدة المسلمة' : 'Unit Economic Outcome'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl sm:text-4xl font-black font-mono ${
                        simResults.netProfitPerDelivered > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {simResults.netProfitPerDelivered > 0 ? '+' : ''}{simResults.netProfitPerDelivered} {displayCurrency}
                      </span>
                      <span className="text-xs font-bold text-stone-400">
                        ({simResults.netMarginPercent}% {isAr ? 'هامش ربح صافي' : 'Net Margin'})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${
                      simResults.isSimWinning
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : simResults.isSimLoss
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {simResults.isSimWinning ? (
                        <>
                          <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{isAr ? 'منتج فائز ومربح جداً' : 'Highly Profitable Winner'}</span>
                        </>
                      ) : simResults.isSimLoss ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{isAr ? 'خاسر - لا تطلق الإعلان' : 'Losing Economics - Do Not Launch'}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{isAr ? 'هامش ضيق - راقب الأرقام' : 'Moderate / Tight Margin'}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'سعر الشراء' : 'COGS'}</span>
                  <span className="text-base font-black font-mono text-stone-200 mt-1 block">{simulatorState.costPrice} {displayCurrency}</span>
                </div>

                <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'الإعلان الفعلي/طرد' : 'Real Ad Cost'}</span>
                  <span className="text-base font-black font-mono text-rose-400 mt-1 block">{simResults.realAdCostPerDelivered} {displayCurrency}</span>
                </div>

                <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'الشحن والروتور' : 'Courier + Return'}</span>
                  <span className="text-base font-black font-mono text-blue-400 mt-1 block">
                    {simulatorState.deliveryCost + simResults.realReturnFeePerDelivered} {displayCurrency}
                  </span>
                </div>

                <div className="bg-stone-950/70 border border-stone-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'أقصى تكلفة إعلان Max CPA' : 'Max Allowed CPA'}</span>
                  <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                    {simResults.maxAllowedCpa} {displayCurrency}
                  </span>
                </div>
              </div>

              <div className="bg-stone-950/80 border border-stone-800 p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-stone-200 uppercase tracking-wider">
                  {isAr ? `توقعات الأرباح على هدف ${simulatorState.monthlyTargetOrders} طلبية شهرياً` : `Monthly Projection on ${simulatorState.monthlyTargetOrders} Orders`}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'المبيعات المسلمة المتوقعة' : 'Projected Sales'}</span>
                    <span className="text-lg font-black font-mono text-stone-100 mt-1 block">
                      {simResults.monthlyRevenue.toLocaleString()} {displayCurrency}
                    </span>
                    <span className="text-[10px] text-stone-500 font-bold block">{simResults.monthlyDeliveredOrders} {isAr ? 'طرد مستلم' : 'delivered parcels'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">{isAr ? 'ميزانية الإعلانات الشهرية' : 'Monthly Ad Budget'}</span>
                    <span className="text-lg font-black font-mono text-rose-400 mt-1 block">
                      {simResults.monthlyAdSpend.toLocaleString()} {displayCurrency}
                    </span>
                    <span className="text-[10px] text-stone-500 font-bold block">{isAr ? `عائد ROAS مطلوب: ${simResults.requiredRoas}x` : `Required ROAS: ${simResults.requiredRoas}x`}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">{isAr ? 'صافي الربح الشهري المتوقع' : 'Projected Monthly Net Profit'}</span>
                    <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                      {simResults.monthlyNetProfit > 0 ? '+' : ''}{simResults.monthlyNetProfit.toLocaleString()} {displayCurrency}
                    </span>
                    <span className="text-[10px] text-emerald-300/70 font-bold block">{isAr ? 'في جيبك بعد كل المصاريف' : 'Pure net profit'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto dark-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-stone-100">{isAr ? 'إعدادات رسوم التوصيل والروتور' : 'COD Rules & Fees'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-300 block">
                  {isAr ? `تكلفة الإعلان الافتراضية لكل طلبية مسلمة (${displayCurrency})` : `Default Ad Cost for Each Delivered Order (${displayCurrency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempSettings.defaultAdSpendPerOrder ?? 25}
                  onChange={e => setTempSettings(prev => ({ ...prev, defaultAdSpendPerOrder: Number(e.target.value) || 0, adSpendMethod: 'per_order' }))}
                  className="w-full bg-stone-950 border border-rose-500/40 rounded-xl p-3 text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-stone-500">
                  {isAr ? 'يتم خصم هذا المبلغ أوتوماتيكياً على كل طلبية لحساب صافي ربح كل طلبية ومجموع خسارة الإعلانات' : 'Automatically deducted per order to calculate per-order profit and total ad spend'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? `سعر التوصيل للطلب المسلم (${displayCurrency})` : `Courier Fee per Delivered Order (${displayCurrency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempSettings.defaultDeliveryFeePerOrder}
                  onChange={e => setTempSettings(prev => ({ ...prev, defaultDeliveryFeePerOrder: Number(e.target.value) || 0 }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-stone-500">{isAr ? 'المبلغ الذي تؤديه لشركة التوصيل عند استلام الزبون للطلب (مثال: 35 درهم)' : 'Courier cost for successful delivery (e.g. 35)'}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? `سعر الروتور / الطرد المرفوض (${displayCurrency})` : `Return Fee per Refused Parcel (${displayCurrency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempSettings.defaultReturnFeePerOrder}
                  onChange={e => setTempSettings(prev => ({ ...prev, defaultReturnFeePerOrder: Number(e.target.value) || 0 }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-stone-500">{isAr ? 'المبلغ الذي تخصمه شركة التوصيل عن الطرد الراجع (مثال: 15 درهم)' : 'Return charge per refused delivery (e.g. 15)'}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? `تكلفة التغليف للطلب (${displayCurrency})` : `Packaging Cost per Order (${displayCurrency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempSettings.defaultPackagingCostPerOrder}
                  onChange={e => setTempSettings(prev => ({ ...prev, defaultPackagingCostPerOrder: Number(e.target.value) || 0 }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-stone-500">{isAr ? 'كرتون، سكوتش، ملصق البولصة وغيرها (مثال: 3 دراهم)' : 'Box, tape, label cost (e.g. 3)'}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? `تكلفة التأكيد / الكول سنتر لكل طلب (${displayCurrency})` : `Call Center Confirmation Fee (${displayCurrency})`}
                </label>
                <input
                  type="number"
                  min="0"
                  value={tempSettings.defaultCallCenterCostPerOrder}
                  onChange={e => setTempSettings(prev => ({ ...prev, defaultCallCenterCostPerOrder: Number(e.target.value) || 0 }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
                <span className="text-[10px] text-stone-500">{isAr ? 'تكلفة الاتصال وتأكيد الطلب مع الزبون (مثال: 5 دراهم)' : 'Lead confirmation fee (e.g. 5)'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => saveFinancialSettings(tempSettings)}
                className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {isAr ? 'حفظ القواعد' : 'Save Rules'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddAdSpendModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <form onSubmit={handleSaveAdSpend} className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto dark-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-stone-100">
                  {editingAdSpend ? (isAr ? 'تعديل المصروف الإعلاني' : 'Edit Ad Spend') : (isAr ? 'تسجيل مصاريف إعلانات جديدة' : 'Log New Ad Spend')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAdSpendModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'المنصة الإعلانية' : 'Ad Platform'}</label>
                <CustomSelect
                  value={adSpendForm.platform}
                  onChange={val => setAdSpendForm(prev => ({ ...prev, platform: val as AdPlatformType }))}
                  options={[
                    { value: 'tiktok', label: 'TikTok Ads (تيك توك)' },
                    { value: 'meta', label: 'Meta / Facebook / Instagram (فيسبوك)' },
                    { value: 'snapchat', label: 'Snapchat Ads (سناب شات)' },
                    { value: 'google', label: 'Google & YouTube Ads (جوجل)' },
                    { value: 'influencer', label: 'Influencer Marketing (مؤثرين)' },
                    { value: 'other', label: 'Other Marketing (أخرى)' }
                  ]}
                  theme="dark"
                  size="sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? 'طريقة حساب مصروف الإعلان' : 'Ad Spend Calculation Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAdSpendForm(prev => ({ ...prev, costModel: 'per_order', ordersCount: prev.ordersCount || String(metrics.deliveredCount || 1) }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      adSpendForm.costModel === 'per_order'
                        ? 'bg-[#2563eb] text-white'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {isAr ? 'حساب على كل طلبية مسلمة' : 'By Delivered Orders'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdSpendForm(prev => ({ ...prev, costModel: 'total' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      adSpendForm.costModel === 'total'
                        ? 'bg-[#2563eb] text-white'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {isAr ? 'مبلغ إجمالي للحملة' : 'Total Lump Sum'}
                  </button>
                </div>
              </div>

              {adSpendForm.costModel === 'per_order' ? (
                <div className="grid grid-cols-2 gap-3 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-300 block">
                      {isAr ? `تكلفة الطلبية الواحدة (${displayCurrency})` : `Cost per Order (${displayCurrency})`}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={adSpendForm.perOrderCost}
                      onChange={e => setAdSpendForm(prev => ({ ...prev, perOrderCost: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-300 block">
                      {isAr ? 'عدد الطلبيات' : 'Orders Count'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={adSpendForm.ordersCount || String(filteredData.orders.length || 1)}
                      onChange={e => setAdSpendForm(prev => ({ ...prev, ordersCount: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="col-span-2 pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400 font-bold">{isAr ? 'المجموع المحسوب أوتوماتيكياً:' : 'Calculated Total Spend:'}</span>
                    <span className="font-mono font-black text-rose-400 text-sm">
                      {((Number(adSpendForm.perOrderCost) || 0) * (Number(adSpendForm.ordersCount || filteredData.orders.length || 1))).toLocaleString()} {displayCurrency}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300 block">{isAr ? `المبلغ المصروف (${displayCurrency}) *` : `Spend Amount (${displayCurrency}) *`}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adSpendForm.amount}
                    onChange={e => setAdSpendForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                    autoFocus
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  required
                  value={adSpendForm.date}
                  onChange={e => setAdSpendForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">
                  {isAr ? 'المنتج المستهدف بالإعلان (اختياري)' : 'Target Product for Ad Spend (Optional)'}
                </label>
                <select
                  value={adSpendForm.productId || ''}
                  onChange={e => setAdSpendForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-[#2563eb] font-bold"
                >
                  <option value="">{isAr ? '-- حملة عامة أو إعلانات شاملة --' : '-- General Store Ad Campaign (All Products) --'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'اسم الحملة أو تفاصيل إضافية (اختياري)' : 'Campaign Name / Notes (Optional)'}</label>
                <input
                  type="text"
                  value={adSpendForm.campaignName}
                  onChange={e => setAdSpendForm(prev => ({ ...prev, campaignName: e.target.value }))}
                  placeholder={isAr ? 'مثال: حملة تيك توك للمنتج المميز' : 'e.g. TikTok Scaling Campaign'}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsAddAdSpendModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {editingAdSpend ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'تسجيل الإعلان' : 'Save Spend')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <form onSubmit={handleSaveExpense} className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto dark-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-stone-100">
                  {editingExpense ? (isAr ? 'تعديل المصروف' : 'Edit Expense') : (isAr ? 'تسجيل مصروف تشغيلي' : 'Log Operational Expense')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'فئة المصروف' : 'Category'}</label>
                <CustomSelect
                  value={expenseForm.category}
                  onChange={val => setExpenseForm(prev => ({ ...prev, category: val as ExpenseCategoryType }))}
                  options={[
                    { value: 'packaging', label: isAr ? 'مواد تغليف وكرتون' : 'Packaging & Boxes' },
                    { value: 'delivery_extra', label: isAr ? 'فواتير شحن إضافية' : 'Extra Delivery Invoices' },
                    { value: 'call_center', label: isAr ? 'كول سنتر وتأكيد' : 'Call Center Fees' },
                    { value: 'salaries', label: isAr ? 'رواتب وعمولات الفريق' : 'Salaries & Commissions' },
                    { value: 'software', label: isAr ? 'أدوات وسوفتوير' : 'Software Subscriptions' },
                    { value: 'rent', label: isAr ? 'كراء أو مستودع' : 'Warehouse / Rent' },
                    { value: 'product_sampling', label: isAr ? 'عينات وتصوير منتجات' : 'Samples & Content' },
                    { value: 'other', label: isAr ? 'مصاريف أخرى' : 'Other Overhead' }
                  ]}
                  theme="dark"
                  size="sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'بيان / عنوان المصروف *' : 'Expense Title *'}</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isAr ? 'مثال: شراء 500 كرتونة تغليف' : 'e.g. 500 Shipping Boxes'}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 focus:outline-none focus:border-[#2563eb]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? `المبلغ (${displayCurrency}) *` : `Amount (${displayCurrency}) *`}</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 1200"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono font-bold text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 block">{isAr ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-100 focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {editingExpense ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'تسجيل المصروف' : 'Save Expense')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
