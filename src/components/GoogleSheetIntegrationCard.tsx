import React, { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sliders,
  HelpCircle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react';
import { StoreConfig } from '../types';

export interface ColumnDefinition {
  id: string;
  header: string;
  field: string;
}

export const TAJERCOD_COLUMNS: ColumnDefinition[] = [
  { id: 'c1', header: 'date_order', field: 'date_order' },
  { id: 'c2', header: 'full_name', field: 'full_name' },
  { id: 'c3', header: 'phone', field: 'phone' },
  { id: 'c4', header: 'address', field: 'address_with_city' },
  { id: 'c5', header: 'sku', field: 'sku_lowercase' },
  { id: 'c6', header: 'qte', field: 'qte' },
  { id: 'c7', header: 'price', field: 'price' },
  { id: 'c8', header: 'note', field: 'note' },
  { id: 'c9', header: 'delivery_note', field: 'delivery_note' },
];

export const STANDARD_COLUMNS: ColumnDefinition[] = [
  { id: 's1', header: 'رقم الطلب (Order ID)', field: 'order_id' },
  { id: 's2', header: 'رمز المنتج (SKU)', field: 'sku_lowercase' },
  { id: 's3', header: 'التاريخ (Date)', field: 'date' },
  { id: 's4', header: 'اسم الزبون (Customer Name)', field: 'full_name' },
  { id: 's5', header: 'رقم الهاتف (Phone)', field: 'phone' },
  { id: 's6', header: 'المدينة (City)', field: 'city' },
  { id: 's7', header: 'العنوان (Address)', field: 'address' },
  { id: 's8', header: 'اسم المنتج (Product)', field: 'product_name' },
  { id: 's9', header: 'الكمية (Qty)', field: 'qte' },
  { id: 's10', header: 'المجموع (Total MAD)', field: 'price' },
  { id: 's11', header: 'ملاحظات (Notes)', field: 'note' },
  { id: 's12', header: 'حالة الطلب (Status)', field: 'status' },
];

export const AVAILABLE_FIELDS = [
  { key: 'date_order', labelAr: 'تاريخ الطلب (YYYY-MM-DD HH:mm:ss)', labelEn: 'Order Date (YYYY-MM-DD HH:mm:ss)', sample: '2026-10-20 14:30:00' },
  { key: 'date', labelAr: 'تاريخ الطلب بالتنسيق المحلي', labelEn: 'Localized Date', sample: '20/10/2026 14:30:00' },
  { key: 'full_name', labelAr: 'اسم الزبون الكامل (Full Name)', labelEn: 'Customer Full Name', sample: 'محمد أمين' },
  { key: 'phone', labelAr: 'رقم الهاتف (Phone)', labelEn: 'Customer Phone', sample: '0612345678' },
  { key: 'address_with_city', labelAr: 'المدينة + العنوان معاً (مطلوب لـ TajerCOD)', labelEn: 'City + Address Combined (TajerCOD)', sample: 'الدار البيضاء - شارع الزرقطوني رقم 12' },
  { key: 'city', labelAr: 'المدينة فقط (City)', labelEn: 'City Only', sample: 'الدار البيضاء' },
  { key: 'address', labelAr: 'العنوان فقط (Address)', labelEn: 'Address Only', sample: 'شارع الزرقطوني رقم 12' },
  { key: 'sku_lowercase', labelAr: 'رمز SKU بحروف صغيرة lowercase (تجنب أخطاء TajerCOD)', labelEn: 'SKU (strictly lowercase)', sample: 'ventilateur-de-refroidissement' },
  { key: 'sku', labelAr: 'رمز SKU الأصلي كما أدخلته', labelEn: 'Raw SKU', sample: 'ventilateur-de-refroidissement' },
  { key: 'qte', labelAr: 'الكمية المطلوبة (Quantity)', labelEn: 'Total Quantity', sample: '1' },
  { key: 'price', labelAr: 'المجموع الكلي للطلب (Price / Total)', labelEn: 'Order Total (MAD)', sample: '299' },
  { key: 'subtotal', labelAr: 'المجموع قبل الشحن (Subtotal)', labelEn: 'Subtotal', sample: '299' },
  { key: 'shipping', labelAr: 'مصاريف الشحن (Shipping Fee)', labelEn: 'Shipping Fee', sample: '0' },
  { key: 'product_name', labelAr: 'اسم المنتج وتفاصيله (Product Name)', labelEn: 'Product Summary', sample: 'مروحة التبريد الذكية x1' },
  { key: 'note', labelAr: 'ملاحظات الزبون (Notes)', labelEn: 'Customer Notes', sample: 'الاتصال في المساء' },
  { key: 'delivery_note', labelAr: 'ملاحظات التوصيل (Delivery Note)', labelEn: 'Delivery Note', sample: 'يرجى الاتصال قبل التسليم' },
  { key: 'order_id', labelAr: 'رقم الطلب الفريد (Order ID)', labelEn: 'Order ID', sample: 'ORD-8942' },
  { key: 'currency', labelAr: 'العملة (Currency)', labelEn: 'Currency', sample: 'MAD' },
  { key: 'status', labelAr: 'حالة الطلب (Status)', labelEn: 'Status', sample: 'pending' },
];

export function generateAppsScriptCode(columns: ColumnDefinition[], targetTabName?: string): string {
  const headersList = columns.map(c => c.header);
  const headersArrayStr = JSON.stringify(headersList, null, 2);

  const rowMappingExpr = columns.map(c => {
    switch (c.field) {
      case 'date_order':
        return 'dateOrder';
      case 'date':
        return 'date';
      case 'full_name':
        return 'customerName';
      case 'phone':
        return 'customerPhone';
      case 'address_with_city':
        return 'combinedAddress';
      case 'city':
        return 'customerCity';
      case 'address':
        return 'customerAddress';
      case 'sku_lowercase':
        return 'sku';
      case 'sku':
        return 'rawSku';
      case 'qte':
        return 'quantity';
      case 'price':
        return 'total';
      case 'subtotal':
        return 'subtotal';
      case 'shipping':
        return 'shippingFee';
      case 'product_name':
        return 'productName';
      case 'note':
        return 'notes';
      case 'delivery_note':
        return 'deliveryNote';
      case 'order_id':
        return 'orderId';
      case 'currency':
        return 'currency';
      case 'status':
        return 'status';
      default:
        return '""';
    }
  }).join(',\n      ');

  const tabSelector = targetTabName && targetTabName.trim()
    ? `ss.getSheetByName("${targetTabName.trim()}") || ss.getActiveSheet()`
    : 'ss.getActiveSheet()';

  return `/**
 * ==============================================================
 * Mavluy & TajerCOD Google Sheets Order Sync Script
 * تلقائياً يقوم بتسجيل كل طلب جديد من متجرك إلى Google Sheet
 * متوافق تماماً مع منصة TajerCOD وأي منصة شحن أو تأكيد أخرى
 * ==============================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // تجنب التداخل عند وصول عدة طلبات في نفس اللحظة

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ${tabSelector};

    // تحليل بيانات الطلب القادمة من المتجر
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // 1. معالجة وتجهيز البيانات
    var now = new Date();
    var dateOrder = data.date_order || (now.getFullYear() + "-" + 
      ("0" + (now.getMonth() + 1)).slice(-2) + "-" + 
      ("0" + now.getDate()).slice(-2) + " " + 
      ("0" + now.getHours()).slice(-2) + ":" + 
      ("0" + now.getMinutes()).slice(-2) + ":" + 
      ("0" + now.getSeconds()).slice(-2));

    var date = data.date || now.toLocaleString("fr-FR");
    var customerName = (data.full_name || data.customerName || (data.order && data.order.customerName) || "").toString().trim();
    var customerPhone = (data.phone || data.customerPhone || (data.order && data.order.customerPhone) || "").toString().replace(/\\s+/g, "");

    var customerCity = (data.customerCity || (data.order && data.order.customerCity) || "").toString().trim();
    var customerAddress = (data.customerAddress || (data.order && data.order.customerAddress) || "").toString().trim();
    
    // الجمع الذكي بين المدينة والعنوان لـ TajerCOD
    var combinedAddress = (data.address || data.combinedAddress || "").toString().trim();
    if (!combinedAddress) {
      if (customerCity && customerAddress) {
        if (customerAddress.toLowerCase().indexOf(customerCity.toLowerCase()) !== -1) {
          combinedAddress = customerAddress;
        } else {
          combinedAddress = customerCity + " - " + customerAddress;
        }
      } else {
        combinedAddress = customerCity || customerAddress || "";
      }
    }

    // رمز المنتج (SKU) بحروف صغيرة دائماً لتجنب أي تعارض في TajerCOD
    var sku = (data.sku || (data.order && data.order.sku) || "").toString().toLowerCase().trim();
    if (!sku && data.items && data.items.length > 0) {
      sku = data.items.map(function(it) { 
        return (it.sku || it.slug || it.productName || "").toString().toLowerCase().trim(); 
      }).filter(Boolean).join(", ");
    }
    var rawSku = (data.sku || "").toString();

    var quantity = Number(data.qte || data.quantity || 1);
    var total = Number(data.price || data.total || 0);
    var subtotal = Number(data.subtotal || total);
    var shippingFee = Number(data.shippingFee || 0);
    var notes = (data.note || data.notes || (data.order && data.order.notes) || "").toString();
    var deliveryNote = (data.delivery_note || data.notes || "").toString();
    var orderId = (data.orderId || (data.order && data.order.id) || ("ORD-" + now.getTime())).toString();
    var currency = (data.currency || "MAD").toString();
    var status = (data.status || "pending").toString();

    var productName = (data.productName || "").toString();
    if (!productName && data.items && data.items.length > 0) {
      productName = data.items.map(function(it) {
        return (it.productName || "منتج") + (it.variant ? " (" + it.variant + ")" : "") + " x" + (it.quantity || 1);
      }).join(" + ");
    }

    // 2. إذا كانت الورقة فارغة تماماً، نضيف صف العناوين تلقائياً
    if (sheet.getLastRow() === 0) {
      var initialHeaders = ${headersArrayStr};
      sheet.appendRow(initialHeaders);
      sheet.getRange(1, 1, 1, initialHeaders.length)
        .setFontWeight("bold")
        .setBackground("#e8f0fe")
        .setFontColor("#1a73e8");
    }

    // 3. بناء سطر البيانات وترتيبه بناءً على الأعمدة
    var rowData = [
      ${rowMappingExpr}
    ];

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      orderId: orderId,
      message: "تم حفظ الطلب بنجاح في Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
}

interface GoogleSheetIntegrationCardProps {
  storeConfig: StoreConfig;
  setStoreConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  activeCountrySlug: string;
  dashboardLang: 'ar' | 'en' | 'fr';
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}

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
  const [sheetId, setSheetId] = useState<string>(
    storeConfig.googleSheetTargetSheetId || storeConfig.googleSheetId || '1CySBqJk1UEUe_d-Yq3fdgq495NYAHr-yFfyN4JXmsys'
  );
  const [sheetName, setSheetName] = useState<string>(storeConfig.googleSheetTargetSheetName || 'orders');

  const [preset, setPreset] = useState<'tajercod' | 'standard' | 'custom'>(() => {
    return storeConfig.googleSheetPreset || 'tajercod';
  });

  const [columns, setColumns] = useState<ColumnDefinition[]>(() => {
    if (storeConfig.googleSheetColumns && storeConfig.googleSheetColumns.length > 0) {
      return storeConfig.googleSheetColumns.map((c, i) => ({
        id: c.id || `col_${i}_${Date.now()}`,
        header: c.header,
        field: c.field,
      }));
    }
    return TAJERCOD_COLUMNS;
  });

  const [isManualScriptEdit, setIsManualScriptEdit] = useState<boolean>(false);
  const [customScriptCode, setCustomScriptCode] = useState<string>(() => {
    return storeConfig.googleSheetCustomScript || generateAppsScriptCode(TAJERCOD_COLUMNS, 'orders');
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSheetId, setCopiedSheetId] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  // Sync with storeConfig when it changes from outside
  useEffect(() => {
    if (storeConfig.googleSheetWebhookUrl !== undefined) {
      setWebhookUrl(storeConfig.googleSheetWebhookUrl);
    }
    if (storeConfig.googleSheetAutoSync !== undefined) {
      setAutoSync(storeConfig.googleSheetAutoSync);
    }
    if (storeConfig.googleSheetTargetSheetId) {
      setSheetId(storeConfig.googleSheetTargetSheetId);
    }
    if (storeConfig.googleSheetTargetSheetName) {
      setSheetName(storeConfig.googleSheetTargetSheetName);
    }
    if (storeConfig.googleSheetPreset) {
      setPreset(storeConfig.googleSheetPreset);
    }
    if (storeConfig.googleSheetColumns && storeConfig.googleSheetColumns.length > 0) {
      setColumns(storeConfig.googleSheetColumns.map((c, i) => ({
        id: c.id || `col_${i}`,
        header: c.header,
        field: c.field,
      })));
    }
    if (storeConfig.googleSheetCustomScript) {
      setCustomScriptCode(storeConfig.googleSheetCustomScript);
    }
  }, [storeConfig.googleSheetWebhookUrl, storeConfig.googleSheetAutoSync]);

  // Update generated script when columns change (unless user manually edited it)
  useEffect(() => {
    if (!isManualScriptEdit) {
      setCustomScriptCode(generateAppsScriptCode(columns, sheetName));
    }
  }, [columns, sheetName, isManualScriptEdit]);

  const isConfigured = Boolean(webhookUrl && webhookUrl.startsWith('http') && autoSync);

  const handleSelectPreset = (newPreset: 'tajercod' | 'standard' | 'custom') => {
    setPreset(newPreset);
    if (newPreset === 'tajercod') {
      setColumns(TAJERCOD_COLUMNS);
      setIsManualScriptEdit(false);
      setCustomScriptCode(generateAppsScriptCode(TAJERCOD_COLUMNS, sheetName));
    } else if (newPreset === 'standard') {
      setColumns(STANDARD_COLUMNS);
      setIsManualScriptEdit(false);
      setCustomScriptCode(generateAppsScriptCode(STANDARD_COLUMNS, sheetName));
    }
  };

  const handleUpdateColumnHeader = (id: string, newHeader: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, header: newHeader } : c));
    setPreset('custom');
  };

  const handleUpdateColumnField = (id: string, newField: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, field: newField } : c));
    setPreset('custom');
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const next = [...columns];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setColumns(next);
    setPreset('custom');
  };

  const handleDeleteColumn = (id: string) => {
    if (columns.length <= 1) {
      showNotification(isAr ? 'يجب أن يحتوي الجدول على عمود واحد على الأقل' : 'Table must contain at least one column', 'error');
      return;
    }
    setColumns(prev => prev.filter(c => c.id !== id));
    setPreset('custom');
  };

  const handleAddColumn = () => {
    const newColId = `col_${Date.now()}`;
    const nextLetter = String.fromCharCode(65 + Math.min(columns.length, 25));
    setColumns(prev => [
      ...prev,
      {
        id: newColId,
        header: `column_${nextLetter.toLowerCase()}`,
        field: 'note'
      }
    ]);
    setPreset('custom');
  };

  const handleResetToTajerCod = () => {
    setPreset('tajercod');
    setColumns(TAJERCOD_COLUMNS);
    setIsManualScriptEdit(false);
    setCustomScriptCode(generateAppsScriptCode(TAJERCOD_COLUMNS, sheetName));
    showNotification(isAr ? 'تمت استعادة جدول أعمدة TajerCOD الافتراضي!' : 'Restored TajerCOD columns template!', 'success');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showNotification(isAr ? 'تم نسخ كود السكربت بالكامل!' : 'Script code copied!', 'success');
  };

  const handleCopyTajerEmail = () => {
    navigator.clipboard.writeText('googlesheetorders@tajer-441720.iam.gserviceaccount.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
    showNotification(isAr ? 'تم نسخ إيميل TajerCOD بنجاح!' : 'Copied TajerCOD email!', 'success');
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    const updated: StoreConfig = {
      ...storeConfig,
      googleSheetAutoSync: autoSync,
      googleSheetWebhookUrl: webhookUrl.trim(),
      googleSheetTargetSheetId: sheetId.trim(),
      googleSheetTargetSheetName: sheetName.trim(),
      googleSheetPreset: preset,
      googleSheetColumns: columns.map(c => ({ id: c.id, header: c.header, field: c.field })),
      googleSheetCustomScript: customScriptCode,
    };

    setStoreConfig(updated);

    try {
      const res = await fetch(`/api/store-config?storeId=${activeCountrySlug || 'ma'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        showNotification(isAr ? 'تم حفظ إعدادات ربط Google Sheet & TajerCOD بنجاح!' : 'Settings saved successfully!', 'success');
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
          message: data.message || (isAr ? 'تم إرسال طلب تجريبي بنجاح! تفقد ملف Google Sheet الآن للتأكد من ظهور السطر الجديد.' : 'Test order sent successfully! Check your Sheet.'),
          details: data.details
        });
        showNotification(isAr ? 'نجحت تجربة إرسال الطلب لـ Google Sheet!' : 'Google Sheet test succeeded!', 'success');
      } else {
        setTestResult({
          success: false,
          message: data.error || (isAr ? 'فشل إرسال الطلب التجريبي. تأكد من إعدادات النشر (Anyone) في Apps Script.' : 'Failed to send test order.')
        });
        showNotification(data.error || (isAr ? 'فشلت التجربة' : 'Test failed'), 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: isAr ? 'تعذر الاتصال بالخادم أو السكربت' : 'Connection error'
      });
      showNotification(isAr ? 'تعذر الاتصال بالخادم' : 'Connection error', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0c1f17] via-[#121c17] to-[#18181b] border border-emerald-500/40 rounded-[2rem] p-6 sm:p-8 space-y-7 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-900/40 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-100 font-serif">
                {isAr ? 'ربط المتجر التلقائي مع Google Sheets و منصة TajerCOD' : 'Google Sheets & TajerCOD Automated Order Dispatch'}
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
                    : (isAr ? 'في انتظار وضع الرابط' : 'Setup Needed')}
                </span>
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-3xl leading-relaxed">
              {isAr
                ? 'أي طلبية يؤكدها الزبون في متجرك تُرسل فوراً إلى ملف Google Sheet الخاص بك (مع دمج المدينة والعنوان وتصغير رمز SKU)، ومنصة TajerCOD تقرأ الطلب مباشرة لبدء التوصيل وتأكيد الطلبات.'
                : 'Instantly dispatches every customer checkout directly to your Google Sheet with merged address & lowercase SKU, so TajerCOD or any fulfillment platform picks it up immediately.'}
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

      {/* TajerCOD Summary Banner matching user screenshots */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'توافق تام 100% مع مواصفات TajerCOD:' : '100% Tailored for TajerCOD:'}</span>
          </div>
          <ul className="text-[11px] text-stone-300 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-stone-100">{isAr ? 'خانة العنوان (Address):' : 'Address Column:'}</strong>{' '}
              {isAr ? 'يتم دمج المدينة والعنوان تلقائياً (مثال: الدار البيضاء - شارع الزرقطوني) ليظهر العنوان كاملاً في منصة تاجر.' : 'Automatically combines city and address into the single address column.'}
            </li>
            <li>
              <strong className="text-stone-100">{isAr ? 'رمز المنتج (SKU):' : 'Product SKU:'}</strong>{' '}
              {isAr ? 'يُرسل بحروف صغيرة lowercase دائماً (مثال: ventilateur-de-refroidissement) لتفادي أخطاء عدم التعرف في تاجر.' : 'Strictly formatted in lowercase to prevent SKU matching errors in TajerCOD.'}
            </li>
            <li>
              <strong className="text-stone-100">{isAr ? 'إمكانية تعديل الجدول:' : 'Custom Mapping:'}</strong>{' '}
              {isAr ? 'يمكنك في أي وقت تغيير أسماء الأعمدة أو إضافة أعمدة جديدة إذا أردت الانتقال إلى أي منصة أخرى مستقبلاً.' : 'Easily edit or re-map columns anytime if you switch fulfillment services in the future.'}
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showGuide ? (isAr ? 'إخفاء خطوات الربط' : 'Hide Steps') : (isAr ? 'عرض خطوات الربط السريع' : 'View Quick Steps')}</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* TajerCOD Step-by-Step Guide */}
      {showGuide && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="text-xs font-bold text-stone-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'خطوات الربط مع TajerCOD خطوة بخطوة (كما في صور إعداداتك):' : 'TajerCOD Integration Setup Steps:'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px]">1</span>
                <span>{isAr ? 'مشاركة ملف Google Sheet مع تاجر' : 'Share Sheet with Tajer Service Account'}</span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? 'في Google Sheets، اضغط "مشاركة (Share)" وامنح صلاحية المحرر (Editor) لهذا الإيميل:' : 'Share your Google Sheet with Editor permission to this email:'}
              </p>
              <div className="flex items-center justify-between gap-2 bg-stone-900 px-3 py-2 rounded-lg border border-stone-800 font-mono text-[10px] text-emerald-300">
                <span className="truncate">googlesheetorders@tajer-441720.iam.gserviceaccount.com</span>
                <button
                  type="button"
                  onClick={handleCopyTajerEmail}
                  className="p-1 hover:text-white transition-all cursor-pointer shrink-0"
                  title={isAr ? 'نسخ الإيميل' : 'Copy Email'}
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-400">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-[10px]">2</span>
                <span>{isAr ? 'معرف الملف واسم الورقة (Sheet ID & Name)' : 'Sheet ID & Sheet Name'}</span>
              </div>
              <p className="text-[11px] text-stone-400">
                {isAr ? 'البيانات الموجودة في لوحة تحكم TajerCOD الخاصة بك:' : 'Configuration values as displayed in your TajerCOD settings:'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block text-[9px]">Sheet ID:</span>
                  <span className="text-stone-200 truncate block" title={sheetId}>{sheetId}</span>
                </div>
                <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                  <span className="text-stone-500 block text-[9px]">Sheet Name:</span>
                  <span className="text-emerald-300 font-bold block">{sheetName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* Auto Sync Toggle */}
        <div className="bg-stone-900/90 border border-stone-800 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-stone-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'تفعيل الإرسال التلقائي للطلبيات إلى Google Sheet' : 'Enable Automatic Google Sheet Order Forwarding'}</span>
            </label>
            <p className="text-[11px] text-stone-400">
              {isAr
                ? 'عند التفعيل، أي طلبية يؤكدها المشتري تُضاف فوراً كسطر جديد في ملف Google Sheet.'
                : 'Automatically appends every checkout order to your Google Sheet in real time.'}
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

        {/* Webhook URL Input */}
        <div className="space-y-2 bg-stone-900/70 p-4.5 rounded-2xl border border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-200 flex items-center gap-2">
              <span>{isAr ? 'رابط Google Apps Script Web App URL:' : 'Google Apps Script Web App URL:'}</span>
            </label>
            <span className="text-[10px] text-emerald-400 font-mono">POST Endpoint</span>
          </div>
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
              : 'Paste the Web App URL generated when deploying your Apps Script (ends with /exec).'}
          </p>
        </div>

        {/* Sheet ID & Tab Name inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-900/70 p-4.5 rounded-2xl border border-stone-800">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-200">
              {isAr ? 'معرف ملف Google Sheet (Sheet ID):' : 'Google Sheet ID:'}
            </label>
            <input
              type="text"
              value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              placeholder="1CySBqJk1UEUe_d-Yq3fdgq495NYAHr-yFfyN4JXmsys"
              className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-stone-500">
              {isAr ? 'الجزء الموجود في رابط الملف بعد /d/ وقبل /edit' : 'The unique string between /d/ and /edit in the Sheet URL'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-200">
              {isAr ? 'اسم الورقة في الملف (Sheet Tab Name):' : 'Sheet Tab Name:'}
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={e => setSheetName(e.target.value)}
              placeholder="orders"
              className="w-full border border-stone-800 bg-stone-950 text-stone-100 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-stone-500">
              {isAr ? 'اسم التبويب بالأسفل (الافتراضي في تاجر هو: orders)' : 'Sheet tab name (e.g. orders)'}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-3 bg-stone-900/80 p-5 rounded-2xl border border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'نموذج الأعمدة وترتيب الحقول (Table Columns Model):' : 'Table Columns Model:'}</span>
              </h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {isAr
                  ? 'اختر قالب TajerCOD الجاهز، أو قم بتعديل وإضافة الأعمدة بحرية تامة إذا أردت استخدام خدمة أخرى:'
                  : 'Choose TajerCOD preset or customize columns freely for any external service:'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToTajerCod}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/60 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'استعادة أعمدة TajerCOD' : 'Reset to TajerCOD'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('tajercod')}
              className={`p-3.5 rounded-xl border text-right sm:text-center transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                preset === 'tajercod'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/40'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-center gap-2">
                <span className="font-bold text-xs">{isAr ? 'قالب منصة TajerCOD' : 'TajerCOD Template'}</span>
                {preset === 'tajercod' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-[10px] text-stone-400 block">
                {isAr ? '9 أعمدة مطابقة لصور إعداداتك (date_order, full_name, phone, address, sku, qte, price, note, delivery_note)' : 'Exact 9 columns for TajerCOD'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('standard')}
              className={`p-3.5 rounded-xl border text-right sm:text-center transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                preset === 'standard'
                  ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-md shadow-sky-950/40'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-center gap-2">
                <span className="font-bold text-xs">{isAr ? 'القالب العام (Universal)' : 'Universal Template'}</span>
                {preset === 'standard' && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </div>
              <span className="text-[10px] text-stone-400 block">
                {isAr ? '12 عمود شامل لشركات الشحن ومراكز الاتصال Call Centers' : '12 columns for courier and call centers'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`p-3.5 rounded-xl border text-right sm:text-center transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                preset === 'custom'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md shadow-amber-950/40'
                  : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between sm:justify-center gap-2">
                <span className="font-bold text-xs">{isAr ? 'قالب مخصص (Custom)' : 'Custom Columns'}</span>
                {preset === 'custom' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <span className="text-[10px] text-stone-400 block">
                {isAr ? 'تعديل كامل وحر لأسماء وترتيب وربط الحقول' : 'Full manual control over columns & mapping'}
              </span>
            </button>
          </div>

          {/* Interactive Column Mapping Table Editor */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'جدول مطابقة الأعمدة (يمكنك تغيير اسم العمود أو نوع البيانات):' : 'Column Mapping Editor:'}</span>
              </span>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة عمود جديد' : 'Add Column'}</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-stone-800 rounded-2xl bg-stone-950">
              <table className="w-full text-xs text-right sm:text-right">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-stone-300">
                    <th className="py-2.5 px-3 text-center w-12 font-mono">العمود</th>
                    <th className="py-2.5 px-3">{isAr ? 'اسم العمود في Google Sheet' : 'Sheet Column Header'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'البيانات التي تُسجل في هذا العمود' : 'Order Field to Record'}</th>
                    <th className="py-2.5 px-3 text-center w-28">{isAr ? 'ترتيب وحذف' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {columns.map((col, index) => {
                    const colLetter = String.fromCharCode(65 + index);
                    return (
                      <tr key={col.id} className="hover:bg-stone-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="w-6 h-6 rounded-md bg-stone-900 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center mx-auto text-[11px]">
                            {colLetter}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={col.header}
                            onChange={e => handleUpdateColumnHeader(col.id, e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
                            placeholder="اسم العمود"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={col.field}
                            onChange={e => handleUpdateColumnField(col.id, e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {AVAILABLE_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>
                                {isAr ? f.labelAr : f.labelEn}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                              title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveColumn(index, 'down')}
                              disabled={index === columns.length - 1}
                              className="p-1 rounded bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 cursor-pointer"
                              title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(col.id)}
                              className="p-1 rounded bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 cursor-pointer ml-1"
                              title={isAr ? 'حذف العمود' : 'Delete Column'}
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

            {/* Live Sample Row Preview */}
            <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'معاينة حية لشكل السطر داخل Google Sheet عند وصول طلبية جديدة:' : 'Live Google Sheet Row Preview:'}</span>
              </span>
              <div className="overflow-x-auto pb-1">
                <div className="inline-flex gap-1.5 min-w-full">
                  {columns.map(c => {
                    const fieldDef = AVAILABLE_FIELDS.find(f => f.key === c.field);
                    return (
                      <div key={c.id} className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[11px] min-w-[110px] shrink-0">
                        <span className="text-emerald-400 font-mono block text-[10px] font-bold border-b border-stone-800 pb-0.5 truncate" title={c.header}>
                          {c.header}
                        </span>
                        <span className="text-stone-300 font-mono text-[10px] mt-1 block truncate" title={fieldDef?.sample}>
                          {fieldDef?.sample || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Result Message */}
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
            <div className="space-y-1">
              <span className="leading-relaxed font-bold block">{testResult.message}</span>
              {testResult.details && (
                <span className="text-[10px] text-stone-400 font-mono block">
                  {typeof testResult.details === 'string' ? testResult.details : JSON.stringify(testResult.details)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
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
                <span>{isAr ? 'حفظ إعدادات Google Sheet & TajerCOD' : 'Save Google Sheet Settings'}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Script Code Section */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'كود Google Apps Script الجاهز للنسخ:' : 'Ready Google Apps Script Code:'}</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {isAr
                ? 'تم إنشاء هذا الكود خصيصاً ليتطابق مع جدول الأعمدة أعلاه، ويقوم بكتابة الطلبات تلقائياً في ملف الـ Sheet.'
                : 'Generated specifically to match your columns above and append orders seamlessly.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsManualScriptEdit(!isManualScriptEdit)}
              className="text-xs text-stone-300 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{isManualScriptEdit ? (isAr ? 'إيقاف التعديل اليدوي' : 'Lock Script') : (isAr ? 'تعديل الكود يدوياً' : 'Edit Script Manually')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود بالكامل' : 'Copy Code')}</span>
            </button>
          </div>
        </div>

        {isManualScriptEdit ? (
          <div className="space-y-2">
            <textarea
              value={customScriptCode}
              onChange={e => setCustomScriptCode(e.target.value)}
              rows={14}
              className="w-full bg-stone-950 p-4 rounded-xl border border-amber-500/50 font-mono text-[11px] text-amber-200 focus:outline-none focus:border-amber-400 leading-relaxed"
            />
            <span className="text-[10px] text-amber-400/80">
              {isAr ? 'وضع التعديل اليدوي نشط: يمكنك تعديل أي دالة أو سطر برمجي تريده.' : 'Manual edit active: you can customize any line of code.'}
            </span>
          </div>
        ) : (
          <pre className="bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-72 select-all leading-relaxed">
            {customScriptCode}
          </pre>
        )}

        {/* 3-Minute Deployment Instructions */}
        <div className="pt-3 border-t border-stone-800 space-y-2">
          <span className="text-xs font-bold text-stone-200 block">
            {isAr ? 'كيف تنشر هذا الكود في Google Sheets خلال دقيقة:' : 'How to deploy in 1 minute:'}
          </span>
          <ol className="text-xs text-stone-300 space-y-2 list-decimal list-inside leading-relaxed">
            <li>
              {isAr ? 'افتح ملفك' : 'Open your sheet'} (<strong>{sheetId}</strong>) {isAr ? 'واختر من القائمة العلوية:' : 'and click from menu:'}{' '}
              <span className="text-emerald-400 font-bold">Extensions &rarr; Apps Script</span>
            </li>
            <li>
              {isAr ? 'امسح أي كود موجود والصق الكود المنسوخ أعلاه، ثم اضغط حفظ (Save).' : 'Replace editor contents with the code copied above and save.'}
            </li>
            <li>
              {isAr ? (
                <span>
                  اضغط على <span className="text-emerald-400 font-bold">Deploy</span> في الأعلى {`->`} اختر <span className="text-emerald-400 font-bold">New deployment</span> {`->`} اضغط أيقونة الترس واختر <span className="text-emerald-400 font-bold">Web app</span>.
                  <br />
                  <span className="text-amber-300 font-bold inline-flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {isAr ? 'تأكد من اختيار:' : 'Must select:'}
                  </span> في خانة <span className="text-stone-100 font-bold">Who has access</span> اختر: <span className="text-emerald-400 font-bold">Anyone</span>.
                </span>
              ) : (
                <span>Click Deploy &rarr; New deployment &rarr; Web app. Set <strong>Who has access</strong> to <strong>Anyone</strong>.</span>
              )}
            </li>
            <li>
              {isAr ? 'انسخ الـ Web App URL (الذي ينتهي بـ /exec) وضعه في خانة الرابط أعلاه واضغط "إرسال طلب تجريبي للـ Sheet".' : 'Copy the generated Web App URL (/exec) into the Webhook URL input above and test.'}
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
