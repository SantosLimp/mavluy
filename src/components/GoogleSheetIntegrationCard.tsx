import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Check,
  Copy,
  ExternalLink,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Table,
  Code2,
  ArrowRight,
  Share2,
  HelpCircle,
  Layers
} from 'lucide-react';
import { StoreConfig } from '../types';

interface GoogleSheetIntegrationCardProps {
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  activeCountrySlug: string;
  dashboardLang: 'ar' | 'en' | 'fr';
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "رقم الطلب",
        "رمز المنتج (SKU)",
        "التاريخ",
        "اسم الزبون",
        "رقم الهاتف",
        "المدينة",
        "العنوان",
        "اسم المنتج",
        "الكمية",
        "المجموع (MAD)",
        "ملاحظات",
        "حالة الطلب"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#e6f4ea");
    }

    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var orderId = data.orderId || (data.order && data.order.id) || ("ORD-" + new Date().getTime());
    var sku = data.sku || (data.order && data.order.sku) || "";
    if (!sku && data.items && data.items.length > 0) {
      sku = data.items.map(function(it) { return it.sku || ""; }).filter(Boolean).join(", ");
    }
    var date = data.date || new Date().toLocaleString('fr-FR');
    var customerName = data.customerName || (data.customer && data.customer.name) || (data.order && data.order.customerName) || "";
    var customerPhone = data.customerPhone || (data.customer && data.customer.phone) || (data.order && data.order.customerPhone) || "";
    var customerCity = data.customerCity || (data.customer && data.customer.city) || (data.order && data.order.customerCity) || "";
    var customerAddress = data.customerAddress || (data.customer && data.customer.address) || (data.order && data.order.customerAddress) || "";

    var productName = data.productName || "";
    if (!productName && data.items && data.items.length > 0) {
      productName = data.items.map(function(it) {
        return (it.productName || "منتج") + (it.variant ? " (" + it.variant + ")" : "") + " x" + (it.quantity || 1);
      }).join(" + ");
    }

    var quantity = data.quantity || 1;
    var total = data.total || (data.order && data.order.total) || 0;
    var notes = data.notes || (data.order && data.order.notes) || "";
    var status = data.status || "pending";

    sheet.appendRow([
      orderId,
      sku,
      date,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      productName,
      quantity,
      total,
      notes,
      status
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      orderId: orderId,
      message: "تم حفظ الطلب في Google Sheet بنجاح"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function GoogleSheetIntegrationCard({
  storeConfig,
  setStoreConfig,
  activeCountrySlug,
  dashboardLang,
  showNotification,
}: GoogleSheetIntegrationCardProps) {
  const isAr = dashboardLang === 'ar';

  const [autoSync, setAutoSync] = useState<boolean>(storeConfig.googleSheetAutoSync ?? true);
  const [webhookUrl, setWebhookUrl] = useState<string>(storeConfig.googleSheetWebhookUrl || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCode, setShowCode] = useState(false);

  React.useEffect(() => {
    if (storeConfig.googleSheetWebhookUrl) {
      setWebhookUrl(storeConfig.googleSheetWebhookUrl);
    }
    if (storeConfig.googleSheetAutoSync !== undefined) {
      setAutoSync(storeConfig.googleSheetAutoSync);
    }
  }, [storeConfig.googleSheetWebhookUrl, storeConfig.googleSheetAutoSync]);

  const isConfigured = Boolean(webhookUrl && webhookUrl.startsWith('http') && autoSync);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showNotification(isAr ? 'تم نسخ كود السكربت بنجاح!' : 'Apps Script code copied!', 'success');
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    const updated: StoreConfig = {
      ...storeConfig,
      googleSheetAutoSync: autoSync,
      googleSheetWebhookUrl: webhookUrl.trim(),
    };

    setStoreConfig(updated);

    try {
      const res = await fetch(`/api/store-config?storeId=${activeCountrySlug || 'ma'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        showNotification(isAr ? 'تم حفظ إعدادات ربط Google Sheet بنجاح!' : 'Google Sheet settings saved!', 'success');
      } else {
        showNotification(isAr ? 'فشل حفظ الإعدادات في الخادم' : 'Failed to save settings', 'error');
      }
    } catch (err) {
      console.error('Error saving google sheet config:', err);
      showNotification(isAr ? 'حدث خطأ أثناء حفظ الإعدادات' : 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSync = async () => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      showNotification(isAr ? 'يرجى إدخال رابط Google Apps Script Webhook أولاً' : 'Please enter your Webhook URL first', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/google-sheet/test-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          storeId: activeCountrySlug || 'ma'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || (isAr ? 'تم إرسال طلب تجريبي بنجاح! تفقد ملف Google Sheet الآن.' : 'Test order sent successfully! Check your Sheet.')
        });
        showNotification(isAr ? 'نجحت تجربة إرسال الطلب للـ Sheet!' : 'Google Sheet test succeeded!', 'success');
      } else {
        setTestResult({
          success: false,
          message: data.error || (isAr ? 'فشل إرسال الطلب التجريبي. تأكد من إعدادات النشر (Anyone).' : 'Failed to send test order.')
        });
        showNotification(data.error || (isAr ? 'فشلت التجربة' : 'Test failed'), 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: isAr ? 'تعذر الاتصال بالخادم' : 'Connection error'
      });
      showNotification(isAr ? 'تعذر الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0f241a] via-[#121c17] to-[#18181b] border border-emerald-500/40 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-100 font-serif">
                {isAr ? 'ربط Google Sheets التلقائي (تصدير الطلبيات لأي منصة أو نظام شحن)' : 'Google Sheets Universal Order Forwarding'}
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                isConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                  : 'bg-stone-800 text-stone-300 border-stone-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'}`} />
                <span>
                  {isConfigured
                    ? (isAr ? 'الربط التلقائي نشط' : 'Live Sync Active')
                    : (isAr ? 'في انتظار وضع الرابط' : 'Pending Setup')}
                </span>
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
              {isAr
                ? 'الحل الشامل لربط متجرك مع Google Sheets وأي منصة أخرى (شركات الشحن، مراكز الاتصال Call Centers، منصات الأفلييت مثل TajerCOD أو YouCan أو غيرها، أو نظامك الخاص): أي زبون يؤكد طلبه في متجرك، يُضاف سطراً فورياً في ملف Google Sheet الخاص بك، ويمكنك ربط هذا الملف مع أي موقع أو خدمة خارجية لقراءة الطلب تلقائياً!'
                : 'Instantly dispatches every new order from your custom-coded store into your Google Sheet, which can be connected to any fulfillment, CRM, courier, or affiliate platform for automated processing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestSync}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            title={isAr ? 'إرسال طلب فحص تجريبي إلى Google Sheet' : 'Send test order to Sheet'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? (isAr ? 'جاري الفحص...' : 'Testing...') : (isAr ? 'إرسال طلب تجريبي للـ Sheet' : 'Send Test Order')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">1</span>
            <span>{isAr ? 'الزبون يطلب من متجرك' : 'Storefront Order'}</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {isAr ? 'بمجرد أن يضغط الزبون على "تأكيد الطلب"، يقوم خادم المتجر بإرسال البيانات فوراً لـ Webhook الخاص بالـ Sheet.' : 'Order details (name, phone, city, items, price) are dispatched automatically.'}
          </p>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sky-400">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-[10px]">2</span>
            <span>{isAr ? 'تسجيل فوري بـ Google Sheet' : 'Instant Sheet Row'}</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {isAr ? 'يتم كتابة سطر جديد ببيانات الطلب في جزء من الثانية (رقم الطلب، التاريخ، الاسم، الهاتف، العنوان، المنتج، المجموع).' : 'A new clean row is appended instantly with full order details.'}
          </p>
        </div>

        <div className="bg-stone-900/80 border border-stone-800 p-4 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px]">3</span>
            <span>{isAr ? 'سحب تلقائي مع أي منصة أو نظام' : 'Auto-Sync to Any Platform'}</span>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {isAr ? 'يمكن لأي منصة، شركة شحن، مركز اتصالات، أو نظام أفلييت قراءة السطر الجديد من الـ Google Sheet مباشرة لبدء التأكيد والشحن فوراً.' : 'Any external platform, warehouse, or CRM can pull the new order directly from your Google Sheet.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-5">
        <div className="bg-stone-900/90 border border-stone-800 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-stone-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تفعيل الإرسال التلقائي للطلبيات إلى Google Sheet' : 'Enable Automatic Google Sheet Order Forwarding'}</span>
            </label>
            <p className="text-[11px] text-stone-400">
              {isAr
                ? 'عند التفعيل، أي طلبية مؤكدة يتم إرسالها لملف Google Sheet في نفس اللحظة.'
                : 'Automatically appends every storefront order to your Google Sheet.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={e => setAutoSync(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="space-y-2 bg-stone-900/70 p-4.5 rounded-2xl border border-stone-800">
          <label className="text-xs font-bold text-stone-200 flex items-center justify-between">
            <span>{isAr ? 'رابط Google Apps Script Web App URL:' : 'Google Apps Script Web App URL:'}</span>
            <span className="text-[10px] text-emerald-400 font-mono">POST Endpoint</span>
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
          />
          <p className="text-[11px] text-stone-400">
            {isAr
              ? 'الصق هنا الرابط الذي حصلت عليه بعد نشر سكربت الـ Apps Script (ينتهي بـ /exec).'
              : 'Paste the web app execution URL provided by Google Apps Script deployment (ends with /exec).'}
          </p>
        </div>

        {testResult && (
          <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
            testResult.success
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="leading-relaxed font-medium">{testResult.message}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ إعدادات Google Sheet' : 'Save Google Sheet Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'طريقة إعداد Google Sheet في 3 دقائق فقط:' : 'Quick 3-Minute Setup Guide:'}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showCode ? (isAr ? 'إخفاء كود السكربت' : 'Hide Script') : (isAr ? 'عرض كود السكربت الجاهز' : 'View Script Code')}</span>
          </button>
        </div>

        <ol className="text-xs text-stone-300 space-y-2.5 list-decimal list-inside leading-relaxed">
          <li>
            <strong className="text-stone-100">{isAr ? 'إنشاء ملف Google Sheet جديد:' : 'Create a new Google Sheet:'}</strong>{' '}
            {isAr ? 'افتح حسابك في Google Drive وأنشئ ملف جدول بيانات جديد (Google Sheet) وسمّه مثلاً: Store Orders.' : 'Open Google Sheets and create a new sheet (e.g. Store Orders).'}
          </li>
          <li>
            <strong className="text-stone-100">{isAr ? 'فتح محرر Apps Script:' : 'Open Apps Script:'}</strong>{' '}
            {isAr ? 'من القائمة العلوية للـ Sheet، اضغط على الإضافات (Extensions) ثم اختر Apps Script.' : 'Click Extensions -> Apps Script in the Google Sheet menu.'}
          </li>
          <li>
            <strong className="text-stone-100">{isAr ? 'لصق الكود الجاهز:' : 'Paste the Script Code:'}</strong>{' '}
            {isAr ? 'امسح أي كود موجود في المحرر، والصق الكود الموجود بالأسفل، ثم اضغط على زر الحفظ (Save).' : 'Replace editor contents with the code below and save.'}
          </li>
          <li>
            <strong className="text-stone-100">{isAr ? 'نشر السكربت (Deploy as Web App):' : 'Deploy as Web App:'}</strong>{' '}
            {isAr ? (
              <span>
                اضغط على الزر الأزرق العريض <span className="text-emerald-400 font-bold">Deploy</span> أعلى اليمين {`->`} اختر <span className="text-emerald-400 font-bold">New deployment</span> {`->`} اضغط على أيقونة الترس واختر <span className="text-emerald-400 font-bold">Web app</span>.
                <br />
                <span className="text-amber-300 font-bold inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {isAr ? 'خطوة مهمة:' : 'Important step:'}</span> في خانة <span className="text-stone-100 font-bold">Who has access</span> اختر: <span className="text-emerald-400 font-bold">Anyone</span> (حتى يتمكن متجرك من إرسال الطلبات للـ Sheet بدون طلب تسجيل دخول).
              </span>
            ) : (
              <span>Click Deploy &rarr; New deployment &rarr; Select Web app. Set <strong>Who has access</strong> to <strong>Anyone</strong>.</span>
            )}
          </li>
          <li>
            <strong className="text-stone-100">{isAr ? 'نسخ الرابط ولصقه هنا:' : 'Copy Web App URL:'}</strong>{' '}
            {isAr ? 'انسخ الـ Web App URL الذي يظهر لك وضعه في خانة الرابط أعلاه، ثم اضغط زر "إرسال طلب تجريبي للـ Sheet".' : 'Copy the generated Web App URL into the input field above and click Send Test Order.'}
          </li>
          <li>
            <strong className="text-stone-100">{isAr ? 'الربط مع أي منصة أو شركة شحن:' : 'Link with Any Platform or Fulfillment:'}</strong>{' '}
            {isAr ? (
              <span>
                يمكنك ربط رابط ملف الـ Google Sheet مع أي منصة، شركة شحن، أو نظام أفلييت يدعم استيراد الطلبيات تلقائياً (مثل TajerCOD, YouCan, COD Network, أو أي نظام إدارة طلبيات مخصص) بكل سهولة عبر تحديد الأعمدة المطابقة.
              </span>
            ) : (
              <span>Link your Google Sheet URL with any fulfillment, courier, CRM, or affiliate platform that supports automated order importing by mapping the corresponding columns.</span>
            )}
          </li>
        </ol>

        <div className="space-y-2 pt-2 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'كود Google Apps Script الجاهز:' : 'Ready Google Apps Script Code:'}</span>
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود بالكامل' : 'Copy Code')}</span>
            </button>
          </div>

          <pre className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-72 select-all leading-relaxed">
            {GOOGLE_APPS_SCRIPT_CODE}
          </pre>
        </div>

        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
          <div className="text-xs font-bold text-stone-200 flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'ترتيب وتسمية الأعمدة في ملف Google Sheet (Mapping مع أي منصة):' : 'Universal Column Mapping in Google Sheet:'}</span>
          </div>
          <p className="text-[11px] text-stone-400">
            {isAr
              ? 'السكربت يكتب تلقائياً الأعمدة التالية، وفي منصتك ستختار فقط الأعمدة المطابقة:'
              : 'The script automatically creates and populates these columns, allowing any platform to map them seamlessly:'}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { col: 'A', name: isAr ? 'رقم الطلب' : 'Order ID' },
              { col: 'B', name: isAr ? 'التاريخ' : 'Date' },
              { col: 'C', name: isAr ? 'اسم الزبون' : 'Customer Name' },
              { col: 'D', name: isAr ? 'رقم الهاتف' : 'Phone' },
              { col: 'E', name: isAr ? 'المدينة' : 'City' },
              { col: 'F', name: isAr ? 'العنوان' : 'Address' },
              { col: 'G', name: isAr ? 'اسم المنتج' : 'Product' },
              { col: 'H', name: isAr ? 'الكمية' : 'Quantity' },
              { col: 'I', name: isAr ? 'المجموع (MAD)' : 'Total' },
              { col: 'J', name: isAr ? 'ملاحظات' : 'Notes' },
              { col: 'K', name: isAr ? 'حالة الطلب' : 'Status' },
            ].map(c => (
              <span key={c.col} className="px-2.5 py-1 bg-stone-900 border border-stone-700/80 rounded-lg text-[10px] font-mono text-stone-200">
                <span className="text-emerald-400 font-bold mr-1">{c.col}:</span>
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
