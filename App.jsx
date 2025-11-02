import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Bar, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Moon, Sun, RefreshCw, Download, Wallet, BarChart3, FileText, Settings, Zap, Clock, CheckCircle, XCircle, Bell, Target, Sparkles, Plus, Trash2 } from 'lucide-react';

export default function RafaelCryptoDashboard() {
  // State Management
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('rafaelDarkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [notification, setNotification] = useState(null);
  const [cryptoData, setCryptoData] = useState([]);
  const [portfolio, setPortfolio] = useState({ totalValue: 0, weeklyChange: 0, weeklyChangePercent: 0 });
  const [aiSignals, setAiSignals] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ bibot: 'online', lechat: 'online', claude: 'online', gemini: 'online' });
  const [orchestratorLogs, setOrchestratorLogs] = useState([]);
  const [ayaoData, setAyaoData] = useState([]);
  const [royalAlerts, setRoyalAlerts] = useState([]);
  const [customAlerts, setCustomAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ coin: '', price: '', type: 'above' });

  const API_BASE = "https://lechat-backend-preview.repl.co";

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('rafaelDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Notification system
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // AYAO Calculator with memoization
  const calculateOptimalYield = useCallback((pools, capital) => {
    return pools.map(pool => ({
      ...pool,
      projectedReturn: capital * pool.apy / 100,
      riskAdjustedReturn: capital * pool.apy / 100 * (1 - pool.riskFactor),
      estimated30d: ((capital * pool.apy / 100 / 12) * 100).toFixed(2) + '%',
      estimated60d: ((capital * pool.apy / 100 / 6) * 100).toFixed(2) + '%',
      estimated90d: ((capital * pool.apy / 100 / 4) * 100).toFixed(2) + '%'
    })).sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
  }, []);

  // Generate Bollinger Bands
  const generateBollingerBands = useCallback((data, multiplier = 2) => {
    const prices = data.map(d => d.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return data.map(d => ({
      ...d,
      middle: avg,
      upper: avg + (stdDev * multiplier),
      lower: avg - (stdDev * multiplier),
      volume: Math.floor(Math.random() * 500) + 1000
    }));
  }, []);

  // Custom Alerts Management
  const addCustomAlert = useCallback(() => {
    if (!newAlert.coin || !newAlert.price) {
      showNotification('⚠️ Mohon isi coin dan harga!', 'warning');
      return;
    }
    const alert = { ...newAlert, id: Date.now(), active: true };
    setCustomAlerts(prev => [...prev, alert]);
    showNotification(`🔔 Alert ditambahkan untuk ${newAlert.coin} @ $${newAlert.price}!`, 'success');
    setNewAlert({ coin: '', price: '', type: 'above' });
  }, [newAlert, showNotification]);

  const removeCustomAlert = useCallback((id) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== id));
    showNotification('🗑️ Alert dihapus!', 'info');
  }, [showNotification]);

  // Check custom alerts
  useEffect(() => {
    cryptoData.forEach(crypto => {
      customAlerts.forEach(alert => {
        if (alert.coin.toUpperCase() === crypto.symbol && alert.active) {
          const triggered = alert.type === 'above' ? crypto.price >= parseFloat(alert.price) : crypto.price <= parseFloat(alert.price);
          if (triggered) {
            showNotification(`🚨 Alert! ${crypto.symbol} ${alert.type === 'above' ? 'di atas' : 'di bawah'} $${alert.price}!`, 'warning');
            setCustomAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: false } : a));
          }
        }
      });
    });
  }, [cryptoData, customAlerts, showNotification]);

  // API Functions with proper error handling
  const syncAll = async () => {
    showNotification('🔄 Memulai sinkronisasi data AI...', 'info');
    try {
      const response = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      showNotification('✅ Sinkronisasi selesai!', 'success');
      fetchAllData();
    } catch (error) {
      console.error('Sync error:', error.message);
      showNotification('⚠️ Error saat sinkronisasi: ' + error.message, 'warning');
    }
  };

  const royalSync = async () => {
    showNotification('👑 Memulai Royal Sync...', 'info');
    try {
      await Promise.all([
        fetchAllData(),
        fetchAYAOData(),
        fetchRoyalAlerts()
      ]);
      showNotification('👑 Semua data Royal disinkronkan!', 'success');
    } catch (error) {
      console.error('Royal Sync error:', error.message);
      showNotification('⚠️ Royal Sync menggunakan data lokal', 'warning');
    }
  };

  const generateReport = async () => {
    showNotification('📄 Membuat laporan PDF Royal...', 'info');
    try {
      const response = await fetch(`${API_BASE}/api/report`);
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Royal_RAFAEL_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('✅ Laporan Royal PDF berhasil diunduh!', 'success');
    } catch (error) {
      console.error('Report error:', error.message);
      showNotification('⚠️ Error saat membuat laporan: ' + error.message, 'warning');
    }
  };

  const fetchAYAOData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/ayao`);
      if (!response.ok) throw new Error('AYAO API failed');
      const data = await response.json();
      setAyaoData(data.pools || []);
    } catch (error) {
      const samplePools = [
        { name: "BTC-USDT", apy: 12.5, riskFactor: 0.1, minDeposit: 0.01, risk: 'Low', tvl: '$2.5B' },
        { name: "ETH-USDT", apy: 15.2, riskFactor: 0.2, minDeposit: 0.05, risk: 'Medium', tvl: '$1.8B' },
        { name: "SOL-USDT", apy: 18.7, riskFactor: 0.3, minDeposit: 1, risk: 'High', tvl: '$850M' },
        { name: "XRP-USDT", apy: 10.8, riskFactor: 0.15, minDeposit: 10, risk: 'Low', tvl: '$1.2B' },
        { name: "MATIC-USDT", apy: 14.3, riskFactor: 0.25, minDeposit: 5, risk: 'Medium', tvl: '$650M' }
      ];
      setAyaoData(calculateOptimalYield(samplePools, 10000));
    }
  };

  const fetchRoyalAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts`);
      if (!response.ok) throw new Error('Alerts API failed');
      const data = await response.json();
      setRoyalAlerts([...data.critical || [], ...data.warnings || []]);
    } catch (error) {
      setRoyalAlerts([
        { coin: 'BTC', price: 70000, type: 'resistance', urgency: 'high', message: 'BTC mendekati resistance $70K!' },
        { coin: 'ETH', price: 3500, type: 'support', urgency: 'medium', message: 'ETH testing support level' },
        { coin: 'SOL', price: 150, type: 'breakout', urgency: 'high', message: 'SOL berpotensi breakout!' }
      ]);
    }
  };

  const loadDemoData = useCallback(() => {
    setCryptoData([
      { 
        symbol: 'BTC', name: 'Bitcoin', price: 67420.50, change: 2.34,
        chartData: generateBollingerBands([
          { day: 'Sen', price: 65800 }, { day: 'Sel', price: 66200 }, { day: 'Rab', price: 65900 },
          { day: 'Kam', price: 66800 }, { day: 'Jum', price: 67100 }, { day: 'Sab', price: 67000 }, { day: 'Min', price: 67420 }
        ])
      },
      { 
        symbol: 'ETH', name: 'Ethereum', price: 3245.80, change: 1.87,
        chartData: generateBollingerBands([
          { day: 'Sen', price: 3180 }, { day: 'Sel', price: 3200 }, { day: 'Rab', price: 3190 },
          { day: 'Kam', price: 3220 }, { day: 'Jum', price: 3235 }, { day: 'Sab', price: 3240 }, { day: 'Min', price: 3246 }
        ])
      },
      { 
        symbol: 'SOL', name: 'Solana', price: 142.35, change: -0.45,
        chartData: generateBollingerBands([
          { day: 'Sen', price: 145 }, { day: 'Sel', price: 144 }, { day: 'Rab', price: 143 },
          { day: 'Kam', price: 144 }, { day: 'Jum', price: 143 }, { day: 'Sab', price: 142 }, { day: 'Min', price: 142 }
        ])
      },
      { 
        symbol: 'XRP', name: 'Ripple', price: 0.5234, change: 3.12,
        chartData: generateBollingerBands([
          { day: 'Sen', price: 0.505 }, { day: 'Sel', price: 0.510 }, { day: 'Rab', price: 0.512 },
          { day: 'Kam', price: 0.518 }, { day: 'Jum', price: 0.520 }, { day: 'Sab', price: 0.521 }, { day: 'Min', price: 0.523 }
        ])
      },
      { 
        symbol: 'MATIC', name: 'Polygon', price: 0.8945, change: 1.23,
        chartData: generateBollingerBands([
          { day: 'Sen', price: 0.880 }, { day: 'Sel', price: 0.885 }, { day: 'Rab', price: 0.882 },
          { day: 'Kam', price: 0.888 }, { day: 'Jum', price: 0.891 }, { day: 'Sab', price: 0.893 }, { day: 'Min', price: 0.895 }
        ])
      }
    ]);

    setAiSignals([
      { coin: 'BTC', signal: 'BUY', confidence: 0.85, reason: 'Momentum positif dan volume meningkat', rsi: 68.4 },
      { coin: 'XRP', signal: 'BUY', confidence: 0.78, reason: 'Breakout resistance level', rsi: 72.1 },
      { coin: 'SOL', signal: 'HOLD', confidence: 0.65, reason: 'Sideways tunggu konfirmasi', rsi: 55.3 }
    ]);

    setLedgerEntries([
      { date: '2025-11-01', action: 'BUY BTC', amount: '0.05', price: '$67,200', note: 'Entry point setelah analisis AI' },
      { date: '2025-10-28', action: 'SELL ETH', amount: '1.2', price: '$3,180', note: 'Take profit 15%' },
      { date: '2025-10-25', action: 'BUY SOL', amount: '10', price: '$145', note: 'DCA strategy' }
    ]);

    // FIXED: Correct portfolio calculation
    const totalValue = 72063.85;
    const weeklyChange = 1538.45;
    const previousTotal = totalValue - weeklyChange;
    const weeklyChangePercent = previousTotal !== 0 ? (weeklyChange / previousTotal) * 100 : 0;

    setPortfolio({
      totalValue: parseFloat(totalValue.toFixed(2)),
      weeklyChange: parseFloat(weeklyChange.toFixed(2)),
      weeklyChangePercent: parseFloat(weeklyChangePercent.toFixed(2))
    });

    setOrchestratorLogs([
      { time: '10:30', action: 'Royal Sync', status: 'success', message: 'Semua data AI berhasil disinkronkan' },
      { time: '09:15', action: 'AYAO Optimization', status: 'success', message: 'Pool BTC-USDT direkomendasikan' },
      { time: '08:00', action: 'Technical Analysis', status: 'success', message: 'Bollinger Bands updated' }
    ]);

    fetchAYAOData();
    fetchRoyalAlerts();
  }, [generateBollingerBands, calculateOptimalYield]);

  const fetchAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [hargaRes, sinyalRes, ledgerRes] = await Promise.all([
        fetch(`${API_BASE}/api/harga`),
        fetch(`${API_BASE}/api/sinyal`),
        fetch(`${API_BASE}/api/ledger`)
      ]);

      if (!hargaRes.ok || !sinyalRes.ok || !ledgerRes.ok) {
        throw new Error('API returned non-OK status');
      }
      
      const [hargaData, sinyalData, ledgerData] = await Promise.all([
        hargaRes.json(),
        sinyalRes.json(),
        ledgerRes.json()
      ]);

      const names = { 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana', 'XRP': 'Ripple', 'MATIC': 'Polygon' };
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

      const formatted = Object.entries(hargaData).map(([symbol, data]) => {
        const history = data.history || [data.current];
        const chartData = history.map((price, i) => ({ 
          day: days[i % 7], 
          price, 
          volume: Math.floor(Math.random() * 500) + 1000 
        }));
        return {
          symbol,
          name: names[symbol] || symbol,
          price: data.current || data.price || 0,
          change: data.change || 0,
          chartData: generateBollingerBands(chartData)
        };
      });

      setCryptoData(formatted);

      const signals = Object.entries(sinyalData).map(([coin, data]) => ({
        coin,
        signal: (data.signal || data.prediksi || 'HOLD').toUpperCase(),
        confidence: data.confidence || 0.5,
        reason: data.reason || 'Analisis AI aktif',
        rsi: data.rsi || (Math.random() * 40 + 40)
      }));
      setAiSignals(signals);

      if (ledgerData.entries) setLedgerEntries(ledgerData.entries);

      // FIXED: Correct portfolio calculation
      const totalValue = formatted.reduce((sum, c) => sum + c.price, 0);
      const weeklyChange = formatted.reduce((sum, c) => {
        const previousPrice = c.price / (1 + c.change / 100);
        return sum + (c.price - previousPrice);
      }, 0);
      const previousTotal = totalValue - weeklyChange;
      const weeklyChangePercent = previousTotal !== 0 ? (weeklyChange / previousTotal) * 100 : 0;

      setPortfolio({
        totalValue: parseFloat(totalValue.toFixed(2)),
        weeklyChange: parseFloat(weeklyChange.toFixed(2)),
        weeklyChangePercent: parseFloat(weeklyChangePercent.toFixed(2))
      });

      setSystemStatus({ bibot: 'online', lechat: 'online', claude: 'online', gemini: 'online' });
      setLastUpdate(new Date());
      showNotification('✅ Data berhasil diperbarui!', 'success');
    } catch (error) {
      console.error('Fetch error:', error.message);
      showNotification('⚠️ Menggunakan data demo. Backend: ' + error.message, 'warning');
      loadDemoData();
      setSystemStatus({ bibot: 'offline', lechat: 'offline', claude: 'online', gemini: 'offline' });
    }
    setRefreshing(false);
  }, [API_BASE, generateBollingerBands, loadDemoData, showNotification]);

  // Auto-refresh with cleanup
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Memoized calculations
  const optimalYieldPool = useMemo(() => ayaoData[0], [ayaoData]);

  // Helper functions
  const formatPrice = (price) => price >= 1000 ? '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '$' + price.toFixed(4);
  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const theme = {
    bg: darkMode ? 'bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-amber-50 to-gray-50',
    card: darkMode ? 'bg-gray-800/80 border-amber-500/30' : 'bg-white border-gray-200',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textSec: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    gold: darkMode ? 'text-amber-400' : 'text-amber-600',
    glow: darkMode ? 'shadow-amber-500/20' : 'shadow-amber-300/30',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
  };

  const RoyalSpinner = () => (
    <div className="flex space-x-2 justify-center items-center">
      <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
      <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
      <div className="h-3 w-3 bg-amber-500 rounded-full animate-bounce"></div>
    </div>
  );

  return (
    <div className={theme.bg + ' min-h-screen ' + theme.text + ' transition-all duration-500'}>
      {notification && (
        <div className={'fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl border-2 text-white backdrop-blur-sm transition-all ' + 
          (notification.type === 'success' ? 'bg-green-500 border-green-400' :
          notification.type === 'error' ? 'bg-red-500 border-red-400' :
          notification.type === 'warning' ? 'bg-yellow-500 border-yellow-400' : 'bg-blue-500 border-blue-400')}>
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <header className={theme.card + ' border-b-2 sticky top-0 z-40 shadow-xl backdrop-blur-md'}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={'w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform ' + theme.glow}>
                <span className="text-gray-900 font-black text-2xl">R</span>
              </div>
              <div>
                <h1 className={'text-2xl font-black ' + theme.gold}>RAFAEL CRYPTO</h1>
                <p className={'text-xs ' + theme.textSec + ' font-medium'}>👑 Royal Intelligence System v2.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={'hidden md:flex items-center gap-2 px-3 py-2 rounded-lg ' + (darkMode ? 'bg-gray-700/50' : 'bg-gray-100')}>
                <Clock className="w-4 h-4" />
                <span className={'text-xs ' + theme.textSec}>Update: {formatTime(lastUpdate)}</span>
              </div>
              <button 
                onClick={royalSync} 
                disabled={refreshing}
                aria-label="Sinkronisasi data Royal"
                className={'p-2 rounded-lg hover:scale-110 transition-all ' + (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                <Sparkles className={'w-5 h-5 ' + (refreshing ? 'animate-spin text-amber-500' : 'text-amber-400')} />
              </button>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                aria-label="Toggle dark mode"
                className={'p-2 rounded-lg hover:scale-110 transition-all ' + (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}>
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-amber-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className={theme.card + ' border-b shadow-lg backdrop-blur-md'}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'ayao', icon: Target, label: 'AYAO' },
              { id: 'alerts', icon: Bell, label: 'Alerts' },
              { id: 'portfolio', icon: Wallet, label: 'Portofolio' },
              { id: 'ledger', icon: FileText, label: 'Ledger' },
              { id: 'orchestrator', icon: Settings, label: 'Orchestrator' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setCurrentTab(tab.id)}
                className={'flex items-center gap-2 px-4 py-3 border-b-2 transition-all hover:scale-105 ' +
                  (currentTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent ' + theme.textSec + ' hover:text-amber-400')}>
                <tab.icon className="w-4 h-4" />
                <span className="font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {royalAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className={'p-3 rounded-lg border-2 backdrop-blur-sm ' + 
            (royalAlerts[0].urgency === 'high' ? 'bg-red-900/30 border-red-500' : 'bg-yellow-900/30 border-yellow-500')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className={'w-5 h-5 animate-pulse ' + (royalAlerts[0].urgency === 'high' ? 'text-red-400' : 'text-yellow-400')} />
                <div>
                  <h3 className={'font-bold ' + (royalAlerts[0].urgency === 'high' ? 'text-red-400' : 'text-yellow-400')}>
                    ⚠️ Royal Alert
                  </h3>
                  <p className="text-sm">{royalAlerts[0].message}</p>
                </div>
              </div>
              <button className={'text-xs px-3 py-1 rounded font-bold transition-all hover:scale-105 ' +
                (royalAlerts[0].urgency === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-gray-900')}>
                Lihat Detail
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl hover:shadow-3xl hover:' + theme.glow + ' transition-all duration-300'}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={'text-xl font-black ' + theme.gold}>👑 Ringkasan Portofolio Royal</h2>
                <button onClick={generateReport}
                  aria-label="Download laporan Royal PDF"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all hover:scale-105 shadow-lg font-bold">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Unduh Laporan Royal</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={'p-4 rounded-xl border-2 border-blue-500 transition-all hover:scale-105 ' + (darkMode ? 'bg-blue-500/20' : 'bg-blue-100')}>
                  <p className={'text-sm ' + theme.textSec + ' mb-2 font-medium'}>💰 Total Aset</p>
                  <p className="text-4xl font-black">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className={'p-4 rounded-xl border-2 transition-all hover:scale-105 ' + 
                  (portfolio.weeklyChange >= 0 ? 
                    'border-green-500 ' + (darkMode ? 'bg-green-500/20' : 'bg-green-100') : 
                    'border-red-500 ' + (darkMode ? 'bg-red-500/20' : 'bg-red-100'))}>
                  <p className={'text-sm ' + theme.textSec + ' mb-2 font-medium'}>📈 Perubahan Mingguan</p>
                  <div className="flex items-center gap-2">
                    <p className={'text-4xl font-black ' + (portfolio.weeklyChange >= 0 ? 'text-green-500' : 'text-red-500')}>
                      ${Math.abs(portfolio.weeklyChange).toFixed(2)}
                    </p>
                    {portfolio.weeklyChange >= 0 ? <TrendingUp className="w-8 h-8 text-green-500" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
                  </div>
                </div>
                <div className={'p-4 rounded-xl border-2 border-purple-500 transition-all hover:scale-105 ' + (darkMode ? 'bg-purple-500/20' : 'bg-purple-100')}>
                  <p className={'text-sm ' + theme.textSec + ' mb-2 font-medium'}>📊 Persentase</p>
                  <p className={'text-4xl font-black ' + (portfolio.weeklyChangePercent >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {portfolio.weeklyChangePercent >= 0 ? '+' : ''}{portfolio.weeklyChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cryptoData.map(crypto => (
                <div key={crypto.symbol} className={theme.card + ' rounded-2xl p-5 border-2 hover:border-amber-500 transition-all cursor-pointer hover:scale-105 hover:shadow-2xl hover:' + theme.glow}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={'font-black text-xl ' + theme.gold}>{crypto.symbol}</span>
                        <span className={'text-xs ' + theme.textSec + ' font-medium'}>{crypto.name}</span>
                      </div>
                      <p className="text-3xl font-black">{formatPrice(crypto.price)}</p>
                    </div>
                    <div className={'flex items-center gap-1 px-3 py-1 rounded-xl border ' +
                      (crypto.change >= 0 ? 'bg-green-500/20 text-green-500 border-green-500' : 'bg-red-500/20 text-red-500 border-red-500')}>
                      {crypto.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-bold">{Math.abs(crypto.change).toFixed(2)}%</span>
                    </div>
                  </div>
                  
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={crypto.chartData}>
                        <defs>
                          <linearGradient id={'g' + crypto.symbol} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={crypto.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={crypto.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#e5e7eb'} strokeOpacity={0.3} />
                        <Area type="monotone" dataKey="upper" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1} />
                        <Area type="monotone" dataKey="lower" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1} />
                        <Area type="monotone" dataKey="price" stroke={crypto.change >= 0 ? '#10b981' : '#ef4444'} 
                          strokeWidth={2} fill={'url(#g' + crypto.symbol + ')'} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl'}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                <h2 className={'text-xl font-black ' + theme.gold}>⚡ Sinyal AI Royal</h2>
              </div>
              <div className="space-y-3">
                {aiSignals.map((signal, idx) => (
                  <div key={idx} className={theme.card + ' p-4 rounded-xl border-2 hover:scale-[1.02] transition-all hover:' + theme.glow + ' ' + 
                    (darkMode ? 'bg-gray-700/50' : 'bg-gray-50')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={'font-black text-xl ' + theme.gold}>{signal.coin}</span>
                        <span className={'px-4 py-1 rounded-full text-xs font-black border-2 ' +
                          (signal.signal === 'BUY' ? 'bg-green-500/20 text-green-500 border-green-500' :
                          signal.signal === 'SELL' ? 'bg-red-500/20 text-red-500 border-red-500' :
                          'bg-yellow-500/20 text-yellow-500 border-yellow-500')}>
                          {signal.signal}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={'text-xs ' + theme.textSec}>Confidence</p>
                        <p className="font-black text-lg">{(signal.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <p className={'text-sm ' + theme.textSec + ' mb-2'}>{signal.reason}</p>
                    <div className="flex items-center justify-between">
                      <div className={'h-2 flex-1 rounded-full overflow-hidden mr-3 ' + (darkMode ? 'bg-gray-600' : 'bg-gray-300')}>
                        <div className={'h-full rounded-full transition-all ' +
                            (signal.confidence >= 0.8 ? 'bg-green-500' : signal.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: (signal.confidence * 100) + '%' }}></div>
                      </div>
                      <span className={'text-xs font-bold ' + theme.textSec}>RSI: {signal.rsi?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'ayao' && (
          <div className="space-y-6">
            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl hover:' + theme.glow}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-amber-400" />
                  <div>
                    <h2 className={'text-2xl font-black ' + theme.gold}>AYAO Dashboard</h2>
                    <p className={theme.textSec + ' text-sm'}>Auto-Yield Algorithm Optimization</p>
                  </div>
                </div>
                <button onClick={() => showNotification('🎯 AYAO Optimization Running...', 'info')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all hover:scale-105 shadow-lg font-bold">
                  Optimize Now
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ayaoData.map((pool, idx) => (
                  <div key={idx} className={'rounded-xl p-5 border-2 transition-all hover:scale-105 hover:shadow-xl cursor-pointer ' +
                    (pool.risk === 'Low' ? 'border-green-500 bg-green-500/10' :
                     pool.risk === 'Medium' ? 'border-yellow-500 bg-yellow-500/10' :
                     'border-red-500 bg-red-500/10')}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={'font-black text-lg ' + theme.gold}>{pool.name}</h3>
                      <span className={'px-3 py-1 rounded-full text-xs font-bold ' +
                        (pool.risk === 'Low' ? 'bg-green-500/20 text-green-500' :
                         pool.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                         'bg-red-500/20 text-red-500')}>
                        {pool.risk} Risk
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className={theme.textSec + ' text-sm'}>APY</span>
                        <span className="font-bold text-green-500">{pool.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textSec + ' text-sm'}>Min Deposit</span>
                        <span className="font-bold">{pool.minDeposit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textSec + ' text-sm'}>TVL</span>
                        <span className="font-bold">{pool.tvl}</span>
                      </div>
                    </div>

                    <div className={'p-3 rounded-lg border ' + (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                      <p className={theme.textSec + ' text-xs mb-2'}>Estimated Returns:</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500">30d</p>
                          <p className="font-bold text-green-500 text-sm">{pool.estimated30d}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">60d</p>
                          <p className="font-bold text-green-500 text-sm">{pool.estimated60d}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">90d</p>
                          <p className="font-bold text-green-500 text-sm">{pool.estimated90d}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {optimalYieldPool && (
                <div className={'mt-6 p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10'}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-amber-400">Royal Recommendation</h3>
                  </div>
                  <p className={theme.textSec}>
                    Berdasarkan analisis AYAO, pool <span className="font-bold text-amber-400">{optimalYieldPool.name}</span> memberikan 
                    risk-adjusted return terbaik dengan APY <span className="font-bold text-green-500">{optimalYieldPool.apy}%</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'alerts' && (
          <div className="space-y-6">
            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl'}>
              <h2 className={'text-xl font-black ' + theme.gold + ' mb-6'}>🔔 Custom Price Alerts</h2>
              
              <div className={'p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10 mb-6'}>
                <h3 className="font-bold mb-3">➕ Tambah Alert Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Coin (BTC, ETH)"
                    value={newAlert.coin}
                    onChange={(e) => setNewAlert({...newAlert, coin: e.target.value.toUpperCase()})}
                    className={'p-3 rounded-lg border-2 ' + theme.input}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newAlert.price}
                    onChange={(e) => setNewAlert({...newAlert, price: e.target.value})}
                    className={'p-3 rounded-lg border-2 ' + theme.input}
                  />
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                    className={'p-3 rounded-lg border-2 ' + theme.input}
                  >
                    <option value="above">Above (Di atas)</option>
                    <option value="below">Below (Di bawah)</option>
                  </select>
                  <button
                    onClick={addCustomAlert}
                    className="flex items-center justify-center gap-2 bg-amber-500 text-gray-900 p-3 rounded-lg hover:bg-amber-600 transition-all font-bold">
                    <Plus className="w-4 h-4" />
                    Tambah Alert
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {customAlerts.length === 0 ? (
                  <p className={theme.textSec + ' text-center py-8'}>Belum ada custom alert. Tambahkan alert pertama Anda!</p>
                ) : (
                  customAlerts.map((alert) => (
                    <div key={alert.id} className={'flex items-center justify-between p-4 rounded-xl border-2 ' + 
                      (alert.active ? 'border-blue-500 bg-blue-500/10' : 'border-gray-500 bg-gray-500/10')}>
                      <div className="flex items-center gap-3">
                        <Bell className={'w-5 h-5 ' + (alert.active ? 'text-blue-400' : 'text-gray-400')} />
                        <div>
                          <p className="font-bold">{alert.coin} {alert.type === 'above' ? '>' : '<'} ${parseFloat(alert.price).toLocaleString()}</p>
                          <p className={'text-sm ' + theme.textSec}>
                            Status: {alert.active ? '🟢 Active' : '⚪ Triggered'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCustomAlert(alert.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl'}>
              <h2 className={'text-xl font-black ' + theme.gold + ' mb-4'}>⚠️ System Alerts</h2>
              <div className="space-y-3">
                {royalAlerts.map((alert, idx) => (
                  <div key={idx} className={'p-4 rounded-xl border-2 ' +
                    (alert.urgency === 'high' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className={'w-5 h-5 ' + (alert.urgency === 'high' ? 'text-red-400' : 'text-yellow-400')} />
                      <span className={'font-bold ' + (alert.urgency === 'high' ? 'text-red-400' : 'text-yellow-400')}>
                        {alert.coin} - {alert.type.toUpperCase()}
                      </span>
                    </div>
                    <p className={theme.textSec}>{alert.message}</p>
                    <p className={'text-sm mt-2 font-bold ' + (alert.urgency === 'high' ? 'text-red-400' : 'text-yellow-400')}>
                      Price: ${alert.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'portfolio' && (
          <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl'}>
            <h2 className={'text-xl font-black ' + theme.gold + ' mb-6'}>💼 Detail Portofolio Royal</h2>
            <div className="space-y-4">
              {cryptoData.map(crypto => (
                <div key={crypto.symbol} className={'p-5 rounded-xl border-2 flex items-center justify-between hover:scale-[1.02] transition-all hover:' + theme.glow + ' ' +
                  (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                      <span className="text-gray-900 font-black text-xl">{crypto.symbol[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{crypto.name}</p>
                      <p className={'text-sm ' + theme.textSec}>{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatPrice(crypto.price)}</p>
                    <p className={'text-sm font-bold ' + (crypto.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'ledger' && (
          <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl'}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={'text-xl font-black ' + theme.gold}>📖 Catatan Transaksi Royal</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold hover:scale-105">
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="space-y-3">
              {ledgerEntries.map((entry, idx) => (
                <div key={idx} className={'p-4 rounded-xl border-2 transition-all hover:' + theme.glow + ' ' + 
                  (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-bold">{entry.action}</p>
                      <p className={'text-sm ' + theme.textSec}>{entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{entry.amount}</p>
                      <p className={'text-sm ' + theme.textSec}>{entry.price}</p>
                    </div>
                  </div>
                  <p className={'text-sm ' + theme.textSec}>{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'orchestrator' && (
          <div className="space-y-6">
            <div className={theme.card + ' rounded-2xl p-6 border-2 shadow-2xl hover:' + theme.glow}>
              <h2 className={'text-xl font-black ' + theme.gold + ' mb-6'}>⚙️ Royal Orchestrator Control Panel</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button onClick={royalSync}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-400 to-amber-600 text-gray-900 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all hover:scale-105 shadow-lg font-bold">
                  <Sparkles className="w-5 h-5" />
                  <span>Royal Sync (All Systems)</span>
                </button>
                <button onClick={generateReport}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:scale-105 shadow-lg font-bold">
                  <Download className="w-5 h-5" />
                  <span>Generate Royal Report</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(systemStatus).map(([name, status]) => (
                  <div key={name} className={'p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ' + 
                    (status === 'online' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10')}>
                    <p className="font-bold capitalize mb-1">{name}</p>
                    <div className="flex items-center justify-center gap-2">
                      {status === 'online' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className={'text-sm font-medium ' + (status === 'online' ? 'text-green-500' : 'text-red-500')}>{status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={'p-4 rounded-xl border-2 ' + (darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200')}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  📋 Activity Logs
                </h3>
                <div className="space-y-2">
                  {orchestratorLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-600/20 transition-all">
                      <div className="flex items-center gap-2">
                        <span className={theme.textSec}>{log.time}</span>
                        <span className="font-medium">{log.action}</span>
                      </div>
                      <span className={log.status === 'success' ? 'text-green-500' : 'text-red-500'}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={theme.card + ' border-t mt-12 backdrop-blur-md'}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className={'text-sm ' + theme.textSec}>
              © 2025 Rafael Crypto • Powered by Royal AI Orchestration v2.0
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className={'text-xs ' + theme.textSec}>Royal System Online</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
