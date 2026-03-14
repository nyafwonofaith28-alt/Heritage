'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function POSPage() {
  const { profile, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (data) setProducts(data as Product[]);
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} in stock`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock_quantity <= 0) {
        toast.error('Out of stock');
        return prev;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > item.stock_quantity) {
          toast.error(`Only ${item.stock_quantity} in stock`);
          return item;
        }
        if (newQuantity <= 0) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (!user) return toast.error('Not authenticated');

    setLoading(true);
    try {
      // Create sale record
      const saleData = {
        user_id: user.id,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: 'completed',
        created_at: new Date().toISOString()
      };

      const { data: saleResult, error: saleError } = await supabase.from('sales').insert([saleData]).select().single();
      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = cart.map(item => ({
        sale_id: saleResult.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));
      
      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // Update inventory
      for (const item of cart) {
        await supabase.from('products')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);
      }

      toast.success('Sale completed successfully!');
      setCart([]);
      
      // Refresh products to get updated stock
      const { data } = await supabase.from('products').select('*');
      if (data) setProducts(data as Product[]);

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-full">
      {/* Products Section */}
      <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden h-[60vh] lg:h-auto">
        <div className="p-4 border-b border-white/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity <= 0}
                className="flex flex-col text-left p-4 rounded-xl border border-white/40 hover:border-red-500 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white/50 backdrop-blur-sm"
              >
                <span className="font-medium text-slate-900 line-clamp-2 mb-1">{product.name}</span>
                <span className="text-red-600 font-semibold mt-auto">UGX {product.price.toLocaleString()}</span>
                <span className="text-xs text-slate-500 mt-1">Stock: {product.stock_quantity}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 flex flex-col bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden h-[60vh] lg:h-auto">
        <div className="p-4 border-b border-white/40 bg-white/30 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-slate-700" />
          <h2 className="font-semibold text-slate-900">Current Sale</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium text-slate-900 truncate">{item.name}</p>
                    <p className="text-sm text-red-600 font-medium">UGX {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-500 hover:bg-white/60 rounded-md">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-500 hover:bg-white/60 rounded-md">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50/50 rounded-md ml-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/40 bg-white/30">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500">Total</span>
            <span className="text-2xl font-bold text-slate-900">UGX {totalAmount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${paymentMethod === 'cash' ? 'bg-red-50/80 border-red-500 text-red-700' : 'bg-white/50 border-white/40 text-slate-600 hover:bg-white/80'}`}
            >
              <Banknote className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('mobile_money')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${paymentMethod === 'mobile_money' ? 'bg-red-50/80 border-red-500 text-red-700' : 'bg-white/50 border-white/40 text-slate-600 hover:bg-white/80'}`}
            >
              <Smartphone className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">MoMo</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${paymentMethod === 'card' ? 'bg-red-50/80 border-red-500 text-red-700' : 'bg-white/50 border-white/40 text-slate-600 hover:bg-white/80'}`}
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Card</span>
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Complete Sale</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
