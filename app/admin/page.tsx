'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Users,
  DollarSign,
  Activity
} from 'lucide-react';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  totalSales: number;
  lowStockItems: number;
  expiringDrugs: number;
  activeStaff: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    lowStockItems: 0,
    expiringDrugs: 0,
    activeStaff: 0
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Sales (Last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: true });
        
        let totalSalesAmount = 0;
        const salesByDate: Record<string, number> = {};
        
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const dateStr = format(subDays(new Date(), i), 'MMM dd');
          salesByDate[dateStr] = 0;
        }

        if (salesData) {
          salesData.forEach(data => {
            totalSalesAmount += data.total_amount;
            const dateStr = format(parseISO(data.created_at), 'MMM dd');
            if (salesByDate[dateStr] !== undefined) {
              salesByDate[dateStr] += data.total_amount;
            }
          });
        }

        const formattedSalesData = Object.keys(salesByDate).map(date => ({
          date,
          amount: salesByDate[date]
        }));

        // Fetch Low Stock Products
        const { data: productsData } = await supabase.from('products').select('*');
        let lowStockCount = 0;
        let expiringCount = 0;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (productsData) {
          productsData.forEach(data => {
            if (data.stock_quantity <= (data.reorder_level || 10)) {
              lowStockCount++;
            }
            if (data.expiry_date) {
              const expiryDate = parseISO(data.expiry_date);
              if (isAfter(thirtyDaysFromNow, expiryDate)) {
                expiringCount++;
              }
            }
          });
        }

        // Fetch Active Staff
        const { data: staffData } = await supabase.from('users').select('*').in('role', ['staff', 'admin']);
        const activeStaffCount = staffData ? staffData.filter(data => data.shift_status === 'active').length : 0;

        setStats({
          totalSales: totalSalesAmount,
          lowStockItems: lowStockCount,
          expiringDrugs: expiringCount,
          activeStaff: activeStaffCount
        });
        setSalesData(formattedSalesData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Sales (7 Days)',
      value: `UGX ${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems.toString(),
      icon: Package,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      title: 'Expiring Drugs (30 Days)',
      value: stats.expiringDrugs.toString(),
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100'
    },
    {
      title: 'Active Staff on Shift',
      value: stats.activeStaff.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/40 shadow-sm">
          <Activity className="h-4 w-4 text-red-500" />
          <span>Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-sm flex items-start gap-4">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/40 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Sales Trend (Last 7 Days)</h2>
          <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => `UGX ${(value / 1000)}k`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'Sales']}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#dc2626" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#dc2626', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
