import React, { useState } from 'react';
import { 
  Share2, 
  Check, 
  Copy, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { StoreConfig } from '../types';

interface AffiliateSettingsCardProps {
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  activeCountrySlug: string;
  dashboardLang: 'ar' | 'en' | 'fr';
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const PRESET_PLATFORMS = [
  { id: 'tajercod', name: 'TajerCOD', logo: '🏬' },
  { id: 'cod_network', name: 'COD Network', logo: '📦' },
  { id: 'leadstar', name: 'Leadstar', logo: '⭐' },
  { id: 'youcan', name: 'YouCan Affiliate', logo: '🛍️' },
  { id: 'lightfunnels', name: 'Lightfunnels', logo: '⚡' },
  { id: 'dropify', name: 'Dropify', logo: '🚚' },
  { id: 'shopify', name: 'Shopify / CRM', logo: '🛒' },
  { id: 'custom', name: 'Custom Webhook / Zapier', logo: '🔗' },
];

export default function AffiliateSettingsCard({
  storeConfig,
  setStoreConfig,
  activeCountrySlug,
  dashboardLang,
  showNotification,
}: AffiliateSettingsCardProps) {
  const isAr = dashboardLang === 'ar';

  const [autoSync, setAutoSync] = useState<boolean>(storeConfig.affiliateAutoSync ?? true);
  const [platformName, setPlatformName] = useState<string>(storeConfig.affiliatePlatformName || 'cod_network');
  const [webhookUrl, setWebhookUrl] = useState<string>(storeConfig.affiliateWebhookUrl || '');
  const [apiKey, setApiKey] = useState<string>(storeConfig.affiliateWebhookApiKey || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Inbound Webhook URL to receive status updates back from the affiliate platform
  const inboundWebhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/order-status-update` 
    : '/api/webhooks/order-status-update';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(inboundWebhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
    showNotification(isAr ? 'تم نسخ رابط الويبهوك بنجاح!' : 'Webhook URL copied!', 'success');
  };

  const handleSaveAffiliateConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    const updated: StoreConfig = {
      ...storeConfig,
      affiliateAutoSync: autoSync,
      affiliatePlatformName: platformName,
      affiliateWebhookUrl: webhookUrl.trim(),
      affiliateWebhookApiKey: apiKey.trim(),
    };

    setStoreConfig(updated);

    try {
      const res = await fetch(`/api/store-config?storeId=${activeCountrySlug || 'ma'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        showNotification(isAr ? 'تم حفظ إعدادات ربط الأفلييت بنجاح!' : 'Affiliate integration settings saved!', 'success');
      } else {
        showNotification(isAr ? 'فشل حفظ الإعدادات في الخادم' : 'Failed to save settings', 'error');
      }
    } catch (err) {
      console.error('Error saving affiliate config:', err);
      showNotification(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSync = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/affiliate/test-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          secretKey: apiKey.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data.message || (isAr ? 'تمت تجربة المزامنة وتأكيد الطلبية بنجاح!' : 'Sync test successful!'));
        showNotification(isAr ? 'نجحت تجربة مزامنة الحالة!' : 'Status sync test succeeded!', 'success');
      } else {
        setTestResult(data.error || (isAr ? 'فشلت التجربة' : 'Test failed'));
        showNotification(data.error || (isAr ? 'فشلت التجربة' : 'Test failed'), 'error');
      }
    } catch (err) {
      setTestResult(isAr ? 'تعذر الاتصال بالخادم' : 'Connection error');
      showNotification(isAr ? 'تعذر الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = Boolean(webhookUrl && webhookUrl.startsWith('http') && autoSync);

  return (
    <div className="bg-gradient-to-br from-[#101726] to-[#18181b] border border-blue-500/40 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 shadow-lg">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-100 font-serif">
                {isAr ? 'ربط شبكات الأفلييت والمزامنة التلقائية (Affiliate & Webhook Automation)' : 'Affiliate Platform & Auto Status Sync'}
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isConfigured 
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' 
                  : 'bg-stone-800 text-stone-300 border-stone-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                <span>
                  {isConfigured 
                    ? (isAr ? 'التحويل التلقائي نشط' : 'Auto-Sync Active') 
                    : (isAr ? 'في انتظار الإعداد' : 'Pending Setup')}
                </span>
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1 max-w-3xl leading-relaxed">
              {isAr
                ? 'أي طلبية جديدة تأتي في متجرك تُرسل أوتوماتيكياً إلى منصة الأفلييت التي تعمل معها، وتحديثات الحالة (من Pending إلى Confirmed أو Shipped أو Delivered) تنعكس وتتحدث في متجرك تلقائياً وبشكل حي!'
                : 'Automatically forwards incoming storefront orders to your affiliate platform/CRM and receives live status updates (Pending, Confirmed, Shipped, Delivered) without manual work.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestSync}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={isAr ? 'تجربة تحديث حالة طلبية تجريبية' : 'Test status update'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? (isAr ? 'جاري الفحص...' : 'Testing...') : (isAr ? 'تجربة المزامنة' : 'Test Sync')}</span>
          </button>
        </div>
      </div>

      {/* Quick Visual Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 font-bold text-blue-400">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">1</span>
            <span>{isAr ? 'إرسال الطلب تلقائياً' : 'Order Auto-Dispatch'}</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {isAr ? 'الزبون يطلب من متجرك -> يُرسل الطلب فوراً إلى منصة الأفلييت عبر الـ Webhook.' : 'Customer orders -> dispatched instantly to affiliate network.'}
          </p>
        </div>

        <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">2</span>
            <span>{isAr ? 'تأكيد وشحن بالمنصة' : 'Affiliate Updates'}</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {isAr ? 'فريق المنصة يؤكد الطلب أو شركة التوصيل تسلم الشحنة.' : 'Network call-center confirms order or marks shipped/delivered.'}
          </p>
        </div>

        <div className="bg-stone-900/70 border border-stone-800 p-3.5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
            <span>{isAr ? 'مزامنة حية بمتجرك' : 'Instant Store Sync'}</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {isAr ? 'الحالة (Confirmed / Delivered) تتغير عندك تلقائياً بدون تدخل يدوي!' : 'Your admin dashboard status updates live in real-time!'}
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAffiliateConfig} className="space-y-5">
        {/* Toggle Auto-Dispatch Switch */}
        <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-stone-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'تفعيل تحويل الطلبيات التلقائي لمنصة الأفلييت' : 'Enable Automatic Order Forwarding'}</span>
            </label>
            <p className="text-[11px] text-stone-400">
              {isAr 
                ? 'عند التفعيل، كل طلبية جديدة يتم إرسالها مباشرة إلى المنصة مع بيانات الزبون والمنتج والسعر.' 
                : 'Dispatches every new order instantly to your affiliate webhook with customer & items payload.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={e => setAutoSync(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Platform Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-stone-300 uppercase tracking-widest block">
            {isAr ? 'المنصة أو شبكة الأفلييت المستهدفة' : 'Target Affiliate Network / Platform'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PRESET_PLATFORMS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatformName(p.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  platformName === p.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-[1.02]'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <span className="text-base">{p.logo}</span>
                <span className="text-[11px] truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Webhook URLs & API Key */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Outbound Webhook URL (Send orders to affiliate) */}
          <div className="space-y-1.5 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <label className="text-[11px] font-bold text-stone-200 flex items-center justify-between">
              <span>{isAr ? 'رابط Webhook / API المنصة لاستلام الطلبيات' : 'Affiliate Platform Outbound Webhook URL'}</span>
              <span className="text-[10px] text-blue-400 font-normal">POST</span>
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://api.your-affiliate.com/api/orders or Zapier Webhook URL"
              className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-stone-400">
              {isAr ? 'الرابط الذي توفره لك منصة الأفلييت لاستقبال الطلبيات أو رابط Webhook في Zapier/Make.' : 'Endpoint provided by the affiliate platform or your Zapier/Make integration.'}
            </p>
          </div>

          {/* Webhook Secret Key / API Key */}
          <div className="space-y-1.5 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
            <label className="text-[11px] font-bold text-stone-200 flex items-center justify-between">
              <span>{isAr ? 'مفتاح الحماية السري (Secret Key / Token)' : 'Webhook Secret Key / Authorization Token'}</span>
              <span className="text-[10px] text-stone-400 font-normal">{isAr ? 'اختياري' : 'Optional'}</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[10px] text-stone-400">
              {isAr ? 'مفتاح التحقق لحماية الاتصال (يتم إرساله كـ Bearer Token أو X-Webhook-Secret).' : 'Secret used to authenticate requests between your store and the affiliate platform.'}
            </p>
          </div>
        </div>

        {/* INBOUND WEBHOOK BOX (How the affiliate platform updates status back) */}
        <div className="bg-gradient-to-r from-blue-950/40 via-stone-900/80 to-purple-950/30 border border-blue-500/30 p-4.5 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-100">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'رابط الويبهوك الخاص بمتجرك لاستلام تحديثات الحالة (Inbound Webhook)' : 'Your Store Inbound Webhook for Status Updates'}</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded-full font-mono font-bold w-fit">
              {isAr ? 'جاهز للاستقبال' : 'Ready to receive'}
            </span>
          </div>

          <p className="text-[11px] text-stone-300 leading-relaxed">
            {isAr 
              ? 'انسخ هذا الرابط وضعه في إعدادات Webhook بمنصة الأفلييت (في خانة Order Status Update / Webhooks). كلما قاموا بتغيير حالة طلبية إلى (Confirmed, Shipped, Delivered, Cancelled) ستتحدث تلقائياً عندك في لوحة التحكم!'
              : 'Copy and paste this URL into your affiliate platform webhook settings. When orders change status, they will be updated in your dashboard instantly.'}
          </p>

          <div className="flex items-center gap-2 bg-stone-950 p-2 rounded-xl border border-stone-800 font-mono text-xs text-blue-300">
            <span className="truncate flex-1 select-all px-2 text-[11px] text-stone-200">{inboundWebhookUrl}</span>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy URL')}</span>
            </button>
          </div>

          {/* JSON Payload Example */}
          <div className="bg-black/40 p-3 rounded-xl border border-stone-800 text-[11px] font-mono text-stone-400 space-y-1">
            <div className="text-[10px] font-bold text-stone-300 font-sans">{isAr ? 'مثال على البيانات التي ترسلها منصة الأفلييت للرابط أعلاه:' : 'Expected JSON payload from affiliate network:'}</div>
            <div className="text-emerald-400">{`{ "orderId": "ORD-123456", "status": "confirmed", "secretKey": "${apiKey ? '••••••' : 'optional_secret'}" }`}</div>
            <div className="text-[10px] text-stone-500 font-sans">{isAr ? 'الحالات المدعومة تلقائياً: pending, confirmed, processing, shipped, delivered, cancelled, returned' : 'Supported statuses: pending, confirmed, processing, shipped, delivered, cancelled, returned'}</div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div className="bg-blue-950/60 border border-blue-800 text-blue-200 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ إعدادات الأفلييت والويبهوك' : 'Save Affiliate Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
