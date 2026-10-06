import React from 'react'

import CustomSelect from '../components/CustomSelect'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const stripEmoji = (text) => String(text || '').replace(/[^a-zA-Z0-9\s()]/gu, '').trim()

const RecapTab = ({ orders, events, recapEventFilter, setRecapEventFilter }) => {
  const filteredRecapOrders = (recapEventFilter === 'all'
    ? orders
    : orders.filter(o => o.event_id === recapEventFilter))
    .filter(o => o.status === 'checked' || o.status === 'completed')

  const hasData = filteredRecapOrders.length > 0

  const totalRevenue = filteredRecapOrders.reduce((sum, order) => sum + (order.total_harga || 0), 0)

  const totalPolaroidRecap = filteredRecapOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, order) => {
      return sum + (order.order_items?.reduce((pSum, item) => {
        const isCheki = item.item_name.toLowerCase().includes('cheki') || item.item_name.toLowerCase().includes('polaroid')
        return pSum + (isCheki ? (item.quantity || 0) : 0)
      }, 0) || 0)
    }, 0)

  const otsCount = filteredRecapOrders.filter(o => o.is_ots).length
  const poCount = filteredRecapOrders.filter(o => !o.is_ots).length
  const unchecked = filteredRecapOrders.filter(o => o.status === 'pending').length
  const completed = filteredRecapOrders.filter(o => o.status === 'completed').length

  const memberStats = {}

  filteredRecapOrders.forEach(order => {
    order.order_items?.forEach(item => {
      let memberName = stripEmoji(item.item_name.replace('Cheki ', '').replace(' (Pre-Order)', ''))

      if (memberName.toLowerCase().includes('all member') ||
          memberName.toLowerCase().includes('semua member') ||
          memberName.toLowerCase().includes('cheki grup') ||
          memberName.toLowerCase().includes('group')) {
        memberName = 'Cheki Grup (Semua Member)'
      }

      if (!memberStats[memberName]) {
        memberStats[memberName] = { quantity: 0, revenue: 0, poQty: 0, otsQty: 0 }
      }

      memberStats[memberName].quantity += item.quantity || 0
      memberStats[memberName].revenue += (item.price || 0) * (item.quantity || 0)

      if (order.is_ots) {
        memberStats[memberName].otsQty += item.quantity || 0
      } else {
        memberStats[memberName].poQty += item.quantity || 0
      }
    })
  })

  const labels = Object.keys(memberStats)
  const poData = labels.map(name => memberStats[name].poQty)
  const otsData = labels.map(name => memberStats[name].otsQty)
  const revenueData = labels.map(name => memberStats[name].revenue)

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#F5E6D3', font: { weight: 'bold', size: 11 }, boxWidth: 12, padding: 16 }
      },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#B0A599', font: { size: 11 } },
        grid: { color: 'rgba(232, 148, 74, 0.08)' }
      },
      y: {
        ticks: { color: '#B0A599', font: { size: 11 } },
        grid: { color: 'rgba(232, 148, 74, 0.08)' },
        beginAtZero: true
      }
    }
  }

  const quantityChartData = {
    labels,
    datasets: [
      {
        label: 'Pre-Order',
        data: poData,
        backgroundColor: 'rgba(6, 182, 212, 0.7)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'OTS',
        data: otsData,
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  }

  const revenueChartData = {
    labels,
    datasets: [
      {
        label: 'Total Pendapatan (Rp)',
        data: revenueData,
        backgroundColor: 'rgba(232, 148, 74, 0.8)',
        borderColor: '#E8944A',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  }

  // Kartu status order — dikelompokkan jadi satu baris kecil, bukan card besar sejajar
  const statusItems = [
    { label: 'Total Order', value: filteredRecapOrders.length },
    { label: 'Pre-Order', value: poCount },
    { label: 'OTS', value: otsCount },
    { label: 'Belum Dicek', value: unchecked },
    { label: 'Selesai', value: completed },
  ]

  const EmptyChartState = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
      <div className="w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center">
        <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M7 14l4-4 4 4 5-5" />
        </svg>
      </div>
      <p className="text-sm text-[var(--text-secondary)] font-medium">{message}</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">Rekapitulasi <span className="text-[var(--primary)]">Penjualan</span></h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Ringkasan omset & performa penjualan.</p>
        </div>

        <CustomSelect
          value={recapEventFilter}
          onChange={(e) => setRecapEventFilter(e.target.value)}
          options={[
            { value: 'all', label: 'Semua Event' },
            ...events.map(ev => ({ value: ev.id, label: `${ev.nama} - ${ev.bulan} ${ev.tahun}` }))
          ]}
        />
      </div>

      {/* Baris utama: 1 angka hero (Pemasukan) + 1 pendukung (Cheki), sisanya jadi strip kecil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-[var(--primary)]/15 to-[var(--surface)] border border-[var(--primary)]/25 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--primary)]/80 mb-1">Total Pemasukan</div>
            <div className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[var(--primary)]/20 items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Total Cheki Tercetak</div>
            <div className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{totalPolaroidRecap} <span className="text-base font-semibold text-[var(--text-secondary)]">pcs</span></div>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-pink-500/10 items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3.5" strokeWidth={1.8} />
            </svg>
          </div>
        </div>
      </div>

      {/* Strip status order — kecil & rata, bukan card gede sejajar sama hero stat */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-2 py-1 flex flex-wrap divide-x divide-[var(--border)]">
        {statusItems.map((item, i) => (
          <div key={i} className="flex-1 min-w-[110px] px-4 py-3 text-center sm:text-left">
            <div className="text-[11px] text-[var(--text-secondary)] font-medium">{item.label}</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Cheki per Member — Pre-Order vs OTS</h3>
          {hasData
            ? <Bar options={chartOptions} data={quantityChartData} />
            : <EmptyChartState message="Belum ada data cheki untuk event ini." />}
        </div>

        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Total Pemasukan per Member</h3>
          {hasData
            ? <Bar
                options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { display: false } } }}
                data={revenueChartData}
              />
            : <EmptyChartState message="Belum ada data pemasukan untuk event ini." />}
        </div>
      </div>
    </div>
  )
}

export default RecapTab

