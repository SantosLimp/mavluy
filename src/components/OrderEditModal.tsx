import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Phone,
  MapPin,
  Package,
  Trash2,
  Plus,
  Truck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Tag,
  Coins,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { Order, OrderItem, Product } from '../types';
import { CustomSelect } from './CustomSelect';
import SleekSpinner from './SleekSpinner';

interface OrderEditModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (updatedOrder: Order) => Promise<void>;
  products: Product[];
  dashboardLang: 'ar' | 'en' | 'fr' | string;
  displayCurrency: string;
  isSaving: boolean;
  error: string;
  success: string;
}

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  onClose,
  onSave,
  products,
  dashboardLang,
  displayCurrency,
  isSaving,
  error,
  success
}) => {
  const [formData, setFormData] = useState<Order | null>(null);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);

  const isAr = dashboardLang === 'ar';

  useEffect(() => {
    if (order) {
      const cloned: Order = JSON.parse(JSON.stringify(order));
      if (Array.isArray(cloned.items)) {
        cloned.items = cloned.items.map(item => {
          const qty = Number(item.quantity || 1);
          if (typeof item.lineTotal === 'number' && qty > 0) {
            return { ...item, price: Math.round((item.lineTotal / qty) * 100) / 100 };
          }
          if (cloned.items.length === 1 && typeof cloned.subtotal === 'number' && cloned.subtotal > 0 && qty > 0) {
            return { ...item, price: Math.round((cloned.subtotal / qty) * 100) / 100 };
          }
          return item;
        });
      }
      setFormData(cloned);
      document.body.style.overflow = 'hidden';
    } else {
      setFormData(null);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [order]);

  if (!order || !formData) return null;

  const recalculateTotal = (items: OrderItem[], shipping: number, discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 1)), 0);
    const total = Math.max(0, subtotal + Number(shipping || 0) - Number(discount || 0));
    return { subtotal, total };
  };

  const handleQtyChange = (index: number, delta: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const updatedItems = [...prev.items];
      const currentQty = updatedItems[index].quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      updatedItems[index] = { ...updatedItems[index], quantity: newQty };
      const { subtotal, total } = recalculateTotal(updatedItems, prev.shippingFee || 0, prev.discountAmount || 0);
      return { ...prev, items: updatedItems, subtotal, total };
    });
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], price: Math.max(0, newPrice) };
      const { subtotal, total } = recalculateTotal(updatedItems, prev.shippingFee || 0, prev.discountAmount || 0);
      return { ...prev, items: updatedItems, subtotal, total };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => {
      if (!prev) return null;
      if (prev.items.length <= 1) {
        const updatedItems = [...prev.items];
        updatedItems.splice(index, 1);
        const { subtotal, total } = recalculateTotal(updatedItems, prev.shippingFee || 0, prev.discountAmount || 0);
        return { ...prev, items: updatedItems, subtotal, total };
      }
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const { subtotal, total } = recalculateTotal(updatedItems, prev.shippingFee || 0, prev.discountAmount || 0);
      return { ...prev, items: updatedItems, subtotal, total };
    });
  };

  const handleAddProduct = () => {
    if (!selectedProductToAdd) return;
    const prod = products.find(p => p.id === selectedProductToAdd);
    if (!prod) return;

    setFormData(prev => {
      if (!prev) return null;
      const existingIdx = prev.items.findIndex(i => i.productId === prod.id);
      let updatedItems = [...prev.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          quantity: (updatedItems[existingIdx].quantity || 1) + 1
        };
      } else {
        updatedItems.push({
          productId: prod.id,
          productName: (isAr && prod.nameAr) ? prod.nameAr : prod.name,
          price: prod.price,
          quantity: 1,
          image: prod.image || ''
        });
      }
      const { subtotal, total } = recalculateTotal(updatedItems, prev.shippingFee || 0, prev.discountAmount || 0);
      return { ...prev, items: updatedItems, subtotal, total };
    });

    setSelectedProductToAdd('');
  };

  const handleShippingChange = (newShipping: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const { subtotal, total } = recalculateTotal(prev.items, newShipping, prev.discountAmount || 0);
      return { ...prev, shippingFee: newShipping, subtotal, total };
    });
  };

  const handleDiscountChange = (newDiscount: number) => {
    setFormData(prev => {
      if (!prev) return null;
      const { subtotal, total } = recalculateTotal(prev.items, prev.shippingFee || 0, newDiscount);
      return { ...prev, discountAmount: newDiscount, subtotal, total };
    });
  };

  const handleManualTotalRecalculate = () => {
    setFormData(prev => {
      if (!prev) return null;
      const { subtotal, total } = recalculateTotal(prev.items, prev.shippingFee || 0, prev.discountAmount || 0);
      return { ...prev, subtotal, total };
    });
  };

  const handleCopyId = () => {
    if (!formData) return;
    navigator.clipboard.writeText(formData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    onSave(formData);
  };

  return (
    <div
      id="order-edit-modal-backdrop"
      className="fixed inset-0 bg-black/85 flex items-center justify-center p-3 sm:p-4 z-[100] overflow-y-auto overscroll-contain animate-fadeIn"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        id="order-edit-modal-container"
        className="bg-[#18181b] rounded-3xl border border-stone-800 max-w-3xl w-full max-h-[92vh] my-auto flex flex-col shadow-2xl animate-scaleUp overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-stone-800/90 flex items-center justify-between bg-stone-900/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-stone-100 text-base sm:text-lg">
                  {isAr ? 'تعديل بيانات الطلب' : 'Modify Order Details'}
                </h3>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 hover:text-white border border-stone-700 text-[11px] font-mono font-bold transition-all cursor-pointer"
                  title={isAr ? 'نسخ رقم الطلب' : 'Copy Order ID'}
                >
                  <span>#{formData.id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-stone-400" />}
                </button>
              </div>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                {isAr ? 'تحديث العنوان، الزبون، المنتجات، حالة الشحن والمبالغ' : 'Update recipient, products, shipping status, and order totals'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="order-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400">
              <User className="w-4 h-4" />
              <span>{isAr ? 'معلومات الزبون والشحن' : 'Customer & Shipping Address'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isAr ? 'اسم المستلم الكامل' : 'Recipient Full Name'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, customerName: e.target.value } : null)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isAr ? 'رقم هاتف المستلم (WhatsApp / Call)' : 'Recipient Phone Number'}</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, customerPhone: e.target.value } : null)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isAr ? 'المدينة' : 'City'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerCity}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, customerCity: e.target.value } : null)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{isAr ? 'العنوان التفصيلي للتوصيل' : 'Full Delivery Address'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerAddress}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, customerAddress: e.target.value } : null)}
                  placeholder={isAr ? 'الحي، الشارع، رقم العمارة، الطابق...' : 'Street name, building, apartment...'}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <Truck className="w-4 h-4" />
              <span>{isAr ? 'حالة الطلب والتتبع اللوجستي' : 'Order Status & Tracking Code'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  {isAr ? 'حالة الشحن / الطلب' : 'Order Status'}
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(val) => setFormData(prev => prev ? { ...prev, status: val as any } : null)}
                  theme="dark"
                  size="sm"
                  options={[
                    { value: 'pending', label: isAr ? 'قيد التأكيد (Pending)' : 'Pending Confirmation' },
                    { value: 'confirmed', label: isAr ? 'مؤكدة (Confirmed)' : 'Confirmed' },
                    { value: 'processing', label: isAr ? 'قيد التجهيز والتغليف (Packaging)' : 'Packaging & Processing' },
                    { value: 'shipped', label: isAr ? 'قيد الشحن والتوصيل (Shipped)' : 'Shipped with Courier' },
                    { value: 'delivered', label: isAr ? 'تم الاستلام والدفع (Delivered & Paid)' : 'Delivered & Paid' },
                    { value: 'cancelled', label: isAr ? 'ملغى (Cancelled)' : 'Cancelled' },
                    { value: 'returned', label: isAr ? 'مرتجعة (Returned)' : 'Returned' }
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  {isAr ? 'رقم التتبع (Tracking Number / Courier Code)' : 'Tracking Code / Waybill'}
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber || ''}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, trackingNumber: e.target.value } : null)}
                  placeholder={isAr ? 'مثال: OZX-99210-MA' : 'e.g. TRK-889123'}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                <Package className="w-4 h-4" />
                <span>{isAr ? 'المنتجات المطلوبة والكميات' : 'Order Items & Quantities'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono font-bold">
                  {formData.items.length} {isAr ? 'منتج' : 'items'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 divide-y divide-stone-800/60">
              {formData.items.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/50 p-3 rounded-xl border border-stone-800/50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-stone-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-200 truncate">{item.productName}</h4>
                      {item.selectedVariant && (
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          {Object.entries(item.selectedVariant).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </div>
                      )}
                      <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                        {item.price} {displayCurrency} × {item.quantity || 1} = <span className="font-bold text-stone-200">{(item.price * (item.quantity || 1))} {displayCurrency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-stone-500 font-bold">{isAr ? 'السعر:' : 'Price:'}</span>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                        className="w-16 bg-transparent text-xs font-mono font-bold text-stone-100 focus:outline-none text-right"
                      />
                      <span className="text-[10px] text-stone-500">{displayCurrency}</span>
                    </div>

                    <div className="flex items-center border border-stone-800 rounded-lg bg-stone-950 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, -1)}
                        className="px-2.5 py-1 text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-stone-100 min-w-6 text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, 1)}
                        className="px-2.5 py-1 text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'حذف هذا المنتج من الطلب' : 'Remove item from order'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1">
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">{isAr ? '-- اختر منتجاً لإضافته إلى الطلب --' : '-- Select product to add to order --'}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {(isAr && p.nameAr) ? p.nameAr : p.name} ({p.price} {displayCurrency})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddProduct}
                disabled={!selectedProductToAdd}
                className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'إضافة للمنتجات' : 'Add Item'}</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
                <Coins className="w-4 h-4" />
                <span>{isAr ? 'تفاصيل الحساب والمجموع' : 'Pricing & Totals Breakdown'}</span>
              </div>
              <button
                type="button"
                onClick={handleManualTotalRecalculate}
                className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-blue-400 transition-colors cursor-pointer"
                title={isAr ? 'إعادة حساب المجموع تلقائياً' : 'Recalculate total'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'إعادة احتساب تلقائي' : 'Recalculate'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  {isAr ? 'رسوم الشحن والتوصيل' : 'Shipping Fee'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.shippingFee !== undefined ? formData.shippingFee : 0}
                    onChange={(e) => handleShippingChange(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                    {displayCurrency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  {isAr ? 'مبلغ الخصم أو الكوبون' : 'Discount / Coupon'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.discountAmount || 0}
                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-100 font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-bold">
                    {displayCurrency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400">
                  {isAr ? 'المبلغ النهائي المطلوب للدفع (Total)' : 'Grand Total (COD)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={formData.total}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, total: Number(e.target.value) } : null)}
                    className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl px-4 py-2.5 text-xs text-emerald-300 font-mono font-black focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">
                    {displayCurrency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span>{isAr ? 'ملاحظة العميل أو تعليمات موظف التوصيل' : 'Customer & Courier Notes'}</span>
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => prev ? { ...prev, notes: e.target.value } : null)}
              placeholder={isAr ? 'مثال: يفضل التوصيل بعد العصر، الاتصال قبل الوصول بـ 30 دقيقة...' : 'e.g. Call before delivery, deliver in afternoon...'}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-blue-500 font-semibold resize-none"
            />
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-900/60 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-900/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </form>

        <div className="p-4 sm:p-5 border-t border-stone-800/90 bg-stone-900/70 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-900/40 cursor-pointer"
          >
            {isSaving ? (
              <>
                <SleekSpinner size="xs" variant="white" />
                <span>{isAr ? 'جاري الحفظ...' : 'Saving Changes...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ تعديلات الطلب' : 'Save Order Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
