'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit2, Trash2, Package, Calendar, X, Filter, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock_quantity: number;
  reorder_level: number;
  expiry_date?: string;
  barcode?: string;
  requires_prescription: boolean;
  image_url?: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  type: string;
  reason: string;
  created_at: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    reorder_level: 10,
    expiry_date: '',
    barcode: '',
    requires_prescription: false,
    image_url: ''
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      if (data) {
        setProducts((data as Product[]).filter(p => p.category !== 'Payment Reference'));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock_quantity: product.stock_quantity,
        reorder_level: product.reorder_level || 10,
        expiry_date: product.expiry_date || '',
        barcode: product.barcode || '',
        requires_prescription: product.requires_prescription || false,
        image_url: product.image_url || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        price: 0,
        cost: 0,
        stock_quantity: 0,
        reorder_level: 10,
        expiry_date: '',
        barcode: '',
        requires_prescription: false,
        image_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist, we might get an error. 
        // In a real app, you'd ensure the bucket exists.
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Make sure "products" bucket exists.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        stock_quantity: Number(formData.stock_quantity),
        reorder_level: Number(formData.reorder_level),
        created_at: new Date().toISOString()
      };

      if (editingProduct) {
        const stockDiff = productData.stock_quantity - editingProduct.stock_quantity;
        
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;

        // Record stock movement if quantity changed
        if (stockDiff !== 0) {
          await supabase.from('stock_movements').insert([{
            product_id: editingProduct.id,
            quantity_change: stockDiff,
            type: stockDiff > 0 ? 'restock' : 'adjustment',
            reason: stockDiff > 0 ? 'Manual Restock' : 'Manual Adjustment'
          }]);
        }

        toast.success('Product updated successfully');
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert([productData]).select().single();
        if (error) throw error;

        // Record initial stock movement
        if (productData.stock_quantity > 0) {
          await supabase.from('stock_movements').insert([{
            product_id: newProduct.id,
            quantity_change: productData.stock_quantity,
            type: 'initial',
            reason: 'Initial Stock'
          }]);
        }

        toast.success('Product added successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const fetchStockHistory = async (product: Product) => {
    setHistoryLoading(true);
    setSelectedProductForHistory(product);
    setIsHistoryModalOpen(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStockHistory(data || []);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      toast.error('Failed to load stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['All Categories', ...cats.sort()];
  }, [products]);

  const filteredProducts = products.filter(p => {
    // Category filter
    if (selectedCategory !== 'All Categories' && p.category !== selectedCategory) {
      return false;
    }
    
    // Search query filter (multi-term)
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    // Split by whitespace to get individual terms
    const terms = query.split(/\s+/).filter(t => t.length > 0);
    
    // Every term must match at least one of the fields
    return terms.every(term => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/40 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, category, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:w-48 px-3 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price (UGX)</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading products...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 text-slate-300 mb-2" />
                      <p>No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative">
                        {product.image_url ? (
                          <Image 
                            src={product.image_url} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{product.name}</div>
                      {product.barcode && <div className="text-xs text-slate-500">{product.barcode}</div>}
                    </td>
                    <td className="p-4 text-slate-600">{product.category}</td>
                    <td className="p-4 font-medium text-slate-900">{product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`font-medium ${product.stock_quantity <= (product.reorder_level || 10) ? 'text-rose-600' : 'text-slate-900'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.stock_quantity <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : product.stock_quantity <= (product.reorder_level || 10) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => fetchStockHistory(product)} 
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Stock History"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6 border-b border-slate-200/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                {formData.image_url ? (
                  <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden">
                    <Image 
                      src={formData.image_url} 
                      alt="Product preview" 
                      fill 
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-rose-600 rounded-full shadow-sm hover:bg-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      {uploading ? <Loader2 className="h-6 w-6 text-red-600 animate-spin" /> : <ImageIcon className="h-6 w-6 text-slate-400" />}
                    </div>
                    <p className="text-sm font-medium text-slate-900">Product Image</p>
                    <p className="text-xs text-slate-500 mt-1">Click to upload or drag and drop</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={uploading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Retail Price (UGX) *</label>
                  <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value as any})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (UGX) *</label>
                  <input required type="number" min="0" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value as any})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock *</label>
                  <input required type="number" min="0" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value as any})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" min="0" value={formData.reorder_level} onChange={e => setFormData({...formData, reorder_level: e.target.value as any})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                  <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode</label>
                  <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="prescription" checked={formData.requires_prescription} onChange={e => setFormData({...formData, requires_prescription: e.target.checked})} className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500" />
                <label htmlFor="prescription" className="text-sm font-medium text-slate-700">Requires Prescription</label>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
            <div className="p-6 border-b border-slate-200/50 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Stock History</h2>
                <p className="text-sm text-slate-500">{selectedProductForHistory?.name}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {historyLoading ? (
                <div className="text-center py-8 text-slate-500">Loading history...</div>
              ) : stockHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No stock movements recorded for this product.</div>
              ) : (
                <div className="space-y-4">
                  {stockHistory.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                            movement.type === 'sale' ? 'bg-red-100 text-red-700' :
                            movement.type === 'restock' ? 'bg-green-100 text-green-700' :
                            movement.type === 'initial' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {movement.type}
                          </span>
                          <span className="text-sm font-medium text-slate-900">{movement.reason}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(movement.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200/50 flex justify-end">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
