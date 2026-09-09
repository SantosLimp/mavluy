import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Eye,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  Users,
  TrendingUp,
  Settings,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Check,
  AlertCircle,
  ShieldCheck,
  Play,
  Info,
  ArrowRight,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { PixelStatsSummary, PixelEventRecord, StoreConfig, CountryStore } from '../types';
import { ConfirmModal } from './ConfirmModal';
import SleekSpinner from './SleekSpinner';
import { formatDateTime } from '../utils/dateUtils';

interface PixelDashboardProps {
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  countries?: CountryStore[];
  activeCountrySlug?: string;
  dashboardLang?: 'ar' | 'en';
  onSaveConfig?: (updatedConfig: StoreConfig) => Promise<void> | void;
}

export const PixelDashboard: React.FC<PixelDashboardProps> = ({
  storeConfig,
  setStoreConfig,
  countries = [],
  activeCountrySlug = 'ma',
  dashboardLang = 'ar',
  onSaveConfig
}) => {
  const isAr = dashboardLang === 'ar';

  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('7d');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeCountrySlug || 'all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [stats, setStats] = useState<PixelStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [metaPixelId, setMetaPixelId] = useState<string>(storeConfig.metaPixelId || '');
  const [tiktokPixelId, setTiktokPixelId] = useState<string>(storeConfig.tiktokPixelId || '');
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(storeConfig.pixelTrackingEnabled !== false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState<string | null>(null);

  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  useEffect(() => {
    if (storeConfig) {
      setMetaPixelId(storeConfig.metaPixelId || '');
      setTiktokPixelId(storeConfig.tiktokPixelId || '');
      setTrackingEnabled(storeConfig.pixelTrackingEnabled !== false);
    }
  }, [storeConfig]);

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      params.set('period', selectedPeriod);
      params.set('storeId', selectedStoreId);
      if (selectedPeriod === 'custom') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }

      const res = await fetch(`/api/pixel/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading pixel stats:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod, selectedStoreId, customStartDate, customEndDate]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSuccessNotice(null);

    const updatedConfig: StoreConfig = {
      ...storeConfig,
      metaPixelId: metaPixelId.trim(),
      tiktokPixelId: tiktokPixelId.trim(),
      pixelTrackingEnabled: trackingEnabled
    };

    try {
      const res = await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });

      if (res.ok) {
        setStoreConfig(updatedConfig);
        if (onSaveConfig) {
          await onSaveConfig(updatedConfig);
        }
        setSettingsSuccessNotice(isAr ? 'تم حفظ وتفعيل إعدادات التتبع بنجاح!' : 'Tracking pixel settings saved and activated successfully!');
        setTimeout(() => setSettingsSuccessNotice(null), 4000);
      }
    } catch (e: any) {
      console.error('Error saving pixel config:', e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendTestEvent = async (type: 'PageView' | 'AddToCart' | 'Purchase') => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/pixel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId === 'all' ? 'ma' : selectedStoreId,
          eventType: type
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({
          success: true,
          message: isAr
            ? `تم إرسال حدث تجريبي (${type}) بنجاح وتسجيله في النظام!`
            : `Test event (${type}) sent and recorded successfully!`
        });
        fetchStats(true);
      } else {
        setTestResult({
          success: false,
          message: data.error || (isAr ? 'فشل إرسال الحدث التجريبي' : 'Failed to send test event')
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || (isAr ? 'حدث خطأ في الاتصال' : 'Connection error')
      });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handlePurgeEvents = async () => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/pixel/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId === 'all' ? undefined : selectedStoreId
        })
      });

      if (res.ok) {
        setShowPurgeModal(false);
        fetchStats(true);
      }
    } catch (err) {
      console.error('Error purging events:', err);
    } finally {
      setIsPurging(false);
    }
  };

  const handleExportCsv = () => {
    if (!stats || !stats.events || stats.events.length === 0) return;

    const headers = [
      'Event ID',
      'Event Type',
      'Store ID',
      'Product Name',
      'Product Price',
      'Total Value',
      'Currency',
      'Customer Name',
      'Customer Phone',
      'Order ID',
      'Timestamp',
      'User Agent'
    ];

    const rows = stats.events.map(e => [
      `"${e.id || ''}"`,
      `"${e.eventType || ''}"`,
      `"${e.storeId || ''}"`,
      `"${(e.productName || '').replace(/"/g, '""')}"`,
      e.productPrice || '',
      e.value || '',
      `"${e.currency || 'MAD'}"`,
      `"${(e.customerName || '').replace(/"/g, '""')}"`,
      `"${(e.customerPhone || '').replace(/"/g, '""')}"`,
      `"${e.orderId || ''}"`,
      `"${e.timestamp || ''}"`,
      `"${(e.userAgent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pixel_events_${selectedStoreId}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pageViews = stats?.totals?.pageViews ?? stats?.pageViews ?? stats?.funnel?.pageViews ?? 0;
  const addToCart = stats?.totals?.addToCart ?? stats?.addToCarts ?? stats?.funnel?.addToCarts ?? 0;
  const initiateCheckout = stats?.totals?.initiateCheckout ?? stats?.initiateCheckouts ?? stats?.funnel?.initiateCheckouts ?? 0;
  const purchases = stats?.totals?.purchases ?? stats?.purchases ?? stats?.funnel?.purchases ?? 0;
  const purchaseValue = stats?.totals?.purchaseValue ?? stats?.totalPurchaseValue ?? 0;
  const viewToCartRate = stats?.conversionRates?.viewToCartRate ?? stats?.funnel?.cartRate ?? 0;
  const cartToPurchaseRate = stats?.conversionRates?.cartToPurchaseRate ?? stats?.funnel?.purchaseRate ?? 0;
  const overallConversionRate = stats?.conversionRates?.overallConversionRate ?? stats?.funnel?.overallConversionRate ?? 0;

  const filteredEvents = useMemo(() => {
    const rawEvents = stats?.events || stats?.recentEvents || [];
    return rawEvents.filter(e => {
      if (selectedEventType !== 'all' && e.eventType !== selectedEventType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inProd = e.productName?.toLowerCase().includes(q);
        const inCustomer = e.customerName?.toLowerCase().includes(q);
        const inPhone = e.customerPhone?.includes(q);
        const inOrder = e.orderId?.toLowerCase().includes(q);
        const inType = e.eventType?.toLowerCase().includes(q);
        if (!inProd && !inCustomer && !inPhone && !inOrder && !inType) return false;
      }
      return true;
    });
  }, [stats, selectedEventType, searchQuery]);

  return (
    <div id="pixel-dashboard-root" className="space-y-6 animate-fadeIn" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#18181b] p-5 sm:p-6 rounded-[2rem] border border-stone-800 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-900/40 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100 font-serif">
                {isAr ? 'لوحة تحليلات الـ Pixel والتتبع الإعلاني' : 'Pixel Tracking & Conversion Analytics'}
              </h2>
              <p className="text-xs text-stone-400 font-medium font-sans">
                {isAr
                  ? 'مراقبة تحويلات المتجر، أحداث Meta Pixel و TikTok Pixel، ومعدلات الشراء المباشرة'
                  : 'Track store conversions, Meta Pixel & TikTok Pixel events, and live purchase funnels'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="pixel-refresh-btn"
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-850 text-stone-300 px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-800 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title={isAr ? 'تحديث البيانات المباشرة' : 'Refresh live data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>

          <button
            id="pixel-export-csv-btn"
            onClick={handleExportCsv}
            disabled={!stats || !stats.events || stats.events.length === 0}
            className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 disabled:opacity-40 text-emerald-300 border border-emerald-800/50 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title={isAr ? 'تصدير جدول الأحداث إلى ملف إكسل CSV' : 'Export events log to CSV'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'تصدير تقرير (CSV)' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider">
              {isAr ? 'إعدادات وربط البكسل' : 'Pixel Integration & Tracking Setup'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1.5 ${
              metaPixelId || tiktokPixelId
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${metaPixelId || tiktokPixelId ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{metaPixelId || tiktokPixelId ? (isAr ? 'التتبع مفعّل' : 'Tracking Active') : (isAr ? 'غير مربوط' : 'Not Connected')}</span>
            </span>
          </div>
        </div>

        {settingsSuccessNotice && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{settingsSuccessNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? 'معرّف Meta Pixel' : 'Meta Pixel ID'}</span>
              {metaPixelId && <span className="text-emerald-400 font-mono text-[9px]">ID: {metaPixelId}</span>}
            </label>
            <input
              id="meta-pixel-id-input"
              type="text"
              placeholder={isAr ? "مثال: 123456789012345" : "e.g. 123456789012345"}
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? 'معرّف TikTok Pixel' : 'TikTok Pixel ID'}</span>
              {tiktokPixelId && <span className="text-emerald-400 font-mono text-[9px]">ID: {tiktokPixelId}</span>}
            </label>
            <input
              id="tiktok-pixel-id-input"
              type="text"
              placeholder={isAr ? "مثال: C6ABCD1234EF56789" : "e.g. C6ABCD1234EF56789"}
              value={tiktokPixelId}
              onChange={(e) => setTiktokPixelId(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300 text-xs font-semibold">
              <input
                type="checkbox"
                checked={trackingEnabled}
                onChange={(e) => setTrackingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-stone-900 border-stone-700"
              />
              <span>{isAr ? 'تفعيل التتبع والأحداث في المتجر' : 'Enable live pixel event tracking'}</span>
            </label>

            <button
              id="save-pixel-settings-btn"
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingSettings ? (
                <>
                  <SleekSpinner size="xs" variant="white" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ ونشر إعدادات التتبع' : 'Save & Deploy Pixels'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-400">
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{isAr ? 'إرسال حدث تجريبي للمعاينة:' : 'Send test diagnostic event:'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSendTestEvent('PageView')}
              disabled={isSendingTest}
              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition text-[11px] font-bold cursor-pointer"
            >
              PageView
            </button>
            <button
              onClick={() => handleSendTestEvent('AddToCart')}
              disabled={isSendingTest}
              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition text-[11px] font-bold cursor-pointer"
            >
              AddToCart
            </button>
            <button
              onClick={() => handleSendTestEvent('Purchase')}
              disabled={isSendingTest}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 transition text-[11px] font-bold cursor-pointer"
            >
              Purchase (COD)
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            testResult.success ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50' : 'bg-red-950/70 text-red-300 border border-red-700/50'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-900/90 p-1 rounded-xl border border-stone-800">
          {[
            { id: 'today', label: isAr ? 'اليوم' : 'Today' },
            { id: '7d', label: isAr ? 'آخر 7 أيام' : 'Last 7 Days' },
            { id: '30d', label: isAr ? 'آخر 30 يوم' : 'Last 30 Days' },
            { id: 'all', label: isAr ? 'كافة السجلات' : 'All Time' },
            { id: 'custom', label: isAr ? 'تاريخ مخصص' : 'Custom Range' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedPeriod === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {countries.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-400">{isAr ? 'المتجر / الدولة:' : 'Store / Country:'}</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع المتاجر والدول' : 'All Country Stores'}</option>
              {countries.map(c => (
                <option key={c.slug} value={c.slug}>
                  {isAr ? (c.nameAr || c.name) : c.name} ({c.code || c.slug.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedPeriod === 'custom' && (
        <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-bold">{isAr ? 'من تاريخ:' : 'From date:'}</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-stone-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-bold">{isAr ? 'إلى تاريخ:' : 'To date:'}</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-stone-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-12 text-center">
          <SleekSpinner size="md" variant="white" />
          <p className="text-xs text-stone-400 mt-3 font-semibold">{isAr ? 'جاري تجميع وتحليل بيانات التتبع...' : 'Aggregating tracking & conversion metrics...'}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                  {isAr ? 'إجمالي الزيارات' : 'Total Page Views'}
                </span>
                <div className="p-2 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-900/40">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-stone-100">
                {pageViews.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? 'مشاهدات صفحات المتجر والعروض' : 'Unique page impressions tracked'}
              </p>
            </div>

            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                  {isAr ? 'إضافات السلة' : 'Add To Cart Events'}
                </span>
                <div className="p-2 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-900/40">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-stone-100">
                {addToCart.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? `معدل الإضافة للسلة: ${viewToCartRate.toFixed(1)}%` : `View to Cart Rate: ${viewToCartRate.toFixed(1)}%`}
              </p>
            </div>

            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                  {isAr ? 'بدء الدفع' : 'Initiated Checkouts'}
                </span>
                <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-xl border border-indigo-900/40">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-stone-100">
                {initiateCheckout.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? `نسبة إكمال النموذج: ${cartToPurchaseRate.toFixed(1)}%` : `Cart to Order Rate: ${cartToPurchaseRate.toFixed(1)}%`}
              </p>
            </div>

            <div className="bg-[#18181b] border border-stone-800 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">
                  {isAr ? 'المبيعات والطلبات' : 'Orders & Purchases'}
                </span>
                <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-900/40">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400">
                {purchases.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? `قيمة المبيعات: ${purchaseValue.toLocaleString()} ${stats.currency || 'MAD'}` : `Revenue: ${purchaseValue.toLocaleString()} ${stats.currency || 'MAD'}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider">
                    {isAr ? 'مسار التحويل والمشتريات' : 'Store Conversion Funnel'}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  {overallConversionRate.toFixed(1)}% {isAr ? 'معدل التحويل الكلي' : 'Overall Conversion'}
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: isAr ? 'الزيارات' : 'Views', count: pageViews, fill: '#3b82f6' },
                      { name: isAr ? 'السلة' : 'Cart', count: addToCart, fill: '#f59e0b' },
                      { name: isAr ? 'بدء الطلب' : 'Checkout', count: initiateCheckout, fill: '#6366f1' },
                      { name: isAr ? 'الشراء COD' : 'Purchases', count: purchases, fill: '#10b981' },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.75rem', color: '#f4f4f5' }}
                      formatter={(val: number) => [val.toLocaleString(), isAr ? 'العدد' : 'Events']}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 shadow-md space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-extrabold text-stone-100 uppercase tracking-wider">
                      {isAr ? 'أكثر المنتجات تفاعلاً وطلباً' : 'Top Interacted Products'}
                    </h3>
                  </div>
                  <span className="text-[11px] text-stone-400 font-semibold">{isAr ? 'المشاهدات والطلبات' : 'Views & Purchases'}</span>
                </div>

                <div className="space-y-2.5 mt-3">
                  {stats.topProductsViewed && stats.topProductsViewed.length > 0 ? (
                    stats.topProductsViewed.slice(0, 4).map((p, idx) => (
                      <div key={p.productId || idx} className="bg-stone-900/90 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
                        <div className="min-w-0 flex-1 pl-2">
                          <div className="text-xs font-bold text-stone-200 truncate">{p.productName}</div>
                          <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1 font-mono">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-400" /> {p.views} {isAr ? 'مشاهدة' : 'views'}</span>
                            <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5 text-amber-400" /> {p.adds} {isAr ? 'سلة' : 'carts'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                            {p.purchases} {isAr ? 'طلبات' : 'orders'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-stone-500 font-semibold">
                      {isAr ? 'لا توجد منتجات مسجلة في هذه الفترة' : 'No product interactions recorded in this period'}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isAr ? 'يتم حفظ كافة تفاعلات العملاء ومزامنتها لحظياً مع قاعدة البيانات' : 'All customer events are synchronized in real-time with the database'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] border border-stone-800 rounded-[2rem] p-6 shadow-md space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>{isAr ? 'سجل أحداث الـ Pixel المباشر' : 'Live Pixel Events Stream'}</span>
                  <span className="text-xs text-stone-400 font-mono font-normal">({filteredEvents.length} {isAr ? 'حدث' : 'events'})</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isAr ? 'سجل تفصيلي بجميع أحداث التحويل المرسلة إلى Meta و TikTok' : 'Complete live log of all conversion events sent to Meta & TikTok'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className={`w-3.5 h-3.5 text-stone-400 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    placeholder={isAr ? "بحث بالمنتج، العميل، الهاتف..." : "Search product, customer, phone..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-stone-900 border border-stone-800 text-stone-200 text-xs rounded-xl ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 w-48 sm:w-60 focus:outline-none focus:border-blue-500`}
                  />
                </div>

                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="bg-stone-900 border border-stone-800 text-stone-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                >
                  <option value="all">{isAr ? 'جميع الأحداث' : 'All Events'}</option>
                  <option value="PageView">PageView</option>
                  <option value="ViewContent">ViewContent</option>
                  <option value="AddToCart">AddToCart</option>
                  <option value="InitiateCheckout">InitiateCheckout</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Lead">Lead</option>
                </select>

                <button
                  onClick={() => setShowPurgeModal(true)}
                  className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/40 text-xs px-3 py-2 rounded-xl transition cursor-pointer font-bold"
                  title={isAr ? 'مسح سجل الأحداث' : 'Purge events log'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح السجل' : 'Clear Log'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-800">
              <table className={`w-full text-xs text-stone-300 ${isAr ? 'text-right' : 'text-left'}`}>
                <thead className="bg-stone-900/90 text-stone-400 text-[11px] font-bold uppercase tracking-wider border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">{isAr ? 'نوع الحدث' : 'Event Type'}</th>
                    <th className="py-3 px-4">{isAr ? 'الوقت والتاريخ' : 'Timestamp'}</th>
                    <th className="py-3 px-4">{isAr ? 'المنتج / الصفحة' : 'Product / Page'}</th>
                    <th className="py-3 px-4">{isAr ? 'القيمة' : 'Value'}</th>
                    <th className="py-3 px-4">{isAr ? 'العميل / الهاتف' : 'Customer / Phone'}</th>
                    <th className="py-3 px-4">{isAr ? 'معرف الطلب' : 'Order ID'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 bg-[#18181b]">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((evt) => {
                      let badgeColor = 'bg-stone-800 text-stone-300 border-stone-700';
                      if (evt.eventType === 'PageView') badgeColor = 'bg-blue-950/60 text-blue-300 border-blue-900/50';
                      if (evt.eventType === 'ViewContent') badgeColor = 'bg-purple-950/60 text-purple-300 border-purple-900/50';
                      if (evt.eventType === 'AddToCart') badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-900/50';
                      if (evt.eventType === 'InitiateCheckout') badgeColor = 'bg-orange-950/60 text-orange-300 border-orange-900/50';
                      if (evt.eventType === 'Purchase') badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-900/50 font-bold';
                      if (evt.eventType === 'Lead') badgeColor = 'bg-teal-950/60 text-teal-300 border-teal-900/50';

                      const dateFormatted = formatDateTime(evt.timestamp, isAr ? 'ar' : 'en', {
                        includeTime: true,
                        includeYear: false
                      });

                      return (
                        <tr key={evt.id} className="hover:bg-stone-850/60 transition">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${badgeColor}`}>
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-400" dir="ltr">
                            {dateFormatted}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-stone-200 font-semibold">
                            {evt.productName || evt.pageUrl || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-stone-100 font-mono">
                            {evt.value ? `${evt.value.toLocaleString()} ${evt.currency || 'MAD'}` : '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-stone-300">
                            {evt.customerName ? (
                              <div>
                                <span className="font-semibold text-stone-200">{evt.customerName}</span>
                                {evt.customerPhone && (
                                  <span className="block text-[10px] text-stone-400 font-mono" dir="ltr">{evt.customerPhone}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-400">
                            {evt.orderId || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500 text-sm font-semibold">
                        {isAr ? 'لا توجد أحداث مطابقة لخيارات البحث المحددة' : 'No tracking events match the selected filters'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      <ConfirmModal
        isOpen={showPurgeModal}
        title={isAr ? "تأكيد مسح سجل أحداث الـ Pixel" : "Confirm Purging Pixel Event Logs"}
        message={isAr ? "هل أنت متأكد من رغبتك في مسح سجل أحداث الـ Pixel؟ سيتم حذف جميع الأحداث المسجلة للفترة أو المتجر المختار." : "Are you sure you want to purge all pixel tracking event logs? This action cannot be undone."}
        confirmText={isAr ? "نعم، امسح السجل" : "Yes, Purge Events"}
        cancelText={isAr ? "إلغاء" : "Cancel"}
        confirmVariant="danger"
        onConfirm={handlePurgeEvents}
        onCancel={() => setShowPurgeModal(false)}
        isLoading={isPurging}
      />
    </div>
  );
};

export default PixelDashboard;
