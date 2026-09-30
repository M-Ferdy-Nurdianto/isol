import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { supabase } from '../lib/supabase'
import { showToast } from '../lib/toast'
import Swal from 'sweetalert2'

import OrdersTab from './admin/tabs/OrdersTab'
import RecapTab from './admin/tabs/RecapTab'
import EventsTab from './admin/tabs/EventsTab'
import MerchTab from './admin/tabs/MerchTab'
import SettingsTab from './admin/tabs/SettingsTab'
import MembersTab from './admin/tabs/MembersTab'
import HeroTab from './admin/tabs/HeroTab'

import OrderDetailModal from './admin/modals/OrderDetailModal'
import OTSOrderModal from './admin/modals/OTSOrderModal'
import BulkDeleteModal from './admin/modals/BulkDeleteModal'
import EventModal from './admin/modals/EventModal'

import { generateExcel, generateMerchExcel, generateMerchPDF, generatePDF } from '../lib/exportUtils'
import { isGuestMode, clearGuestSession } from '../lib/guestMock'
import { getValidAdminToken, logoutAdminSession, touchAdminSession } from '../lib/authSession'

import {
  FaSignOutAlt,
  FaShoppingCart,
  FaCalendar,
  FaChartBar,
  FaBox,
  FaEdit,
  FaUsers,
  FaEllipsisH,
  FaTimes,
  FaEye,
  FaShieldAlt,
  FaSync
} from 'react-icons/fa'

const AdminPage = () => {
  const navigate = useNavigate()
  const isGuest = isGuestMode()

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('admin_active_tab') || 'orders')
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const [orderSubTab, setOrderSubTab] = useState(() => localStorage.getItem('admin_order_subtab') || 'all')
  const [orders, setOrders] = useState([])
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('admin_status_filter') || 'all')
  const [otsFilter, setOtsFilter] = useState(() => localStorage.getItem('admin_ots_filter') || 'all')
  const [eventFilter, setEventFilter] = useState(() => localStorage.getItem('admin_event_filter') || 'all')
  const [recapEventFilter, setRecapEventFilter] = useState(() => localStorage.getItem('admin_recap_event_filter') || 'all')
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('admin_date_filter') || 'all')
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('admin_search_query') || '')
  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem('admin_date_from') || '')
  const [dateTo, setDateTo] = useState(() => localStorage.getItem('admin_date_to') || '')

  const [showOTSModal, setShowOTSModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isOtsCartActive, setIsOtsCartActive] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  const [hargaPerMember, setHargaPerMember] = useState('25000')
  const [hargaGrup, setHargaGrup] = useState('30000')
  const [hargaOtsPerMember, setHargaOtsPerMember] = useState('25000')
  const [hargaOtsGrup, setHargaOtsGrup] = useState('30000')
  const [paymentBank, setPaymentBank] = useState('BCA')
  const [paymentRekening, setPaymentRekening] = useState('0902683273')
  const [paymentAtasNama, setPaymentAtasNama] = useState('Natasya Angelina Putri')
  const [paymentMethod, setPaymentMethod] = useState('Manual TF')
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [maintenanceEstimatedEnd, setMaintenanceEstimatedEnd] = useState('')
  const [configLoading, setConfigLoading] = useState(false)

  const [merch, setMerch] = useState([])
  const [merchOrders, setMerchOrders] = useState([])
  const [showMerchForm, setShowMerchForm] = useState(false)
  const [editingMerch, setEditingMerch] = useState(null)
  const [merchForm, setMerchForm] = useState({ nama: '', deskripsi: '', harga: '', stok: '', available: true, sizes: [], size_chart_urls: [] })
  const [merchImageFile, setMerchImageFile] = useState(null)
  const [merchImagePreview, setMerchImagePreview] = useState('')
  const [merchSizeChartFiles, setMerchSizeChartFiles] = useState([null])
  const [merchSizeChartPreviews, setMerchSizeChartPreviews] = useState([''])
  const [availableSizes, setAvailableSizes] = useState('')
  const [merchSaving, setMerchSaving] = useState(false)
  const merchFileInputRef = useRef(null)
  const sizeChart1InputRef = useRef(null)

  const [merchOrderStatusFilter, setMerchOrderStatusFilter] = useState('all')
  const [merchOrderSearch, setMerchOrderSearch] = useState('')
  const [loadingMerchOrders, setLoadingMerchOrders] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchAll()

    document.documentElement.classList.add('dark')
    document.body.classList.add('dark-theme')

    let subscription = null
    if (supabase) {
      subscription = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          fetchOrders()
          if (payload.eventType === 'INSERT' && payload.new.created_by === 'customer') {
            showToast.info(payload.new.nama_lengkap, 'Order Baru!')
          }
        })
        .subscribe()
    }

    return () => {
      if (supabase && subscription) {
        supabase.removeChannel(subscription)
      }
      const savedTheme = localStorage.getItem('ks-theme')
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        document.body.classList.remove('dark-theme')
        document.body.classList.add('light-theme')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab)
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [statusFilter, otsFilter, eventFilter, dateFilter, dateFrom, dateTo, searchQuery, activeTab, orderSubTab])

  useEffect(() => {
    localStorage.setItem('admin_order_subtab', orderSubTab)
  }, [orderSubTab])

  useEffect(() => {
    localStorage.setItem('admin_status_filter', statusFilter)
    localStorage.setItem('admin_ots_filter', otsFilter)
    localStorage.setItem('admin_event_filter', eventFilter)
    localStorage.setItem('admin_recap_event_filter', recapEventFilter)
    localStorage.setItem('admin_date_filter', dateFilter)
    localStorage.setItem('admin_search_query', searchQuery)
    if (dateFrom) localStorage.setItem('admin_date_from', dateFrom)
    else localStorage.removeItem('admin_date_from')
    if (dateTo) localStorage.setItem('admin_date_to', dateTo)
    else localStorage.removeItem('admin_date_to')
  }, [statusFilter, otsFilter, eventFilter, recapEventFilter, dateFilter, searchQuery, dateFrom, dateTo])

  const checkAuth = () => {
    if (!getValidAdminToken()) {
      navigate('/admin/login')
    }
  }

  const fetchAll = () => {
    fetchOrders()
    fetchMembers()
    fetchEvents()
    fetchConfig()
    fetchMerch()
    fetchMerchOrders()
  }

  const buildOrderParams = () => {
    const params = {}

    if (statusFilter !== 'all') params.status = statusFilter

    if (orderSubTab === 'ots') params.is_ots = 'true'
    else if (orderSubTab === 'po') params.is_ots = 'false'
    else if (otsFilter !== 'all') params.is_ots = otsFilter

    if (eventFilter !== 'all') params.event_id = eventFilter
    if (searchQuery) params.search = searchQuery

    if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      params.dateFrom = weekAgo.toISOString()
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      params.dateFrom = monthAgo.toISOString()
    } else if (dateFilter === 'custom' && dateFrom) {
      params.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo) params.dateTo = new Date(dateTo).toISOString()
    }

    return params
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = buildOrderParams()
      const response = await api.get('/orders', { params })
      setOrders(response.data.data || [])
    } catch (error) {
      console.error(error)
      if (error.response?.status === 401) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members')
      setMembers(res.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      const eventList = res.data.data || []
      setEvents(eventList)

      // Otomatis pilih event aktif (bukan 'all') jika belum ada event spesifik yang dipilih
      if (eventList.length > 0) {
        setEventFilter(prev => {
          if (!prev || prev === 'all') {
            const activeEvent = eventList.find(e => !e.is_past) || eventList[0]
            return activeEvent ? String(activeEvent.id) : prev
          }
          return prev
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await api.get('/config')
      const configData = res.data.data || {}
      if (configData.harga_cheki_per_member) setHargaPerMember(configData.harga_cheki_per_member)
      if (configData.harga_cheki_grup) setHargaGrup(configData.harga_cheki_grup)
      if (configData.harga_ots_per_member) setHargaOtsPerMember(configData.harga_ots_per_member)
      if (configData.harga_ots_grup) setHargaOtsGrup(configData.harga_ots_grup)
      if (configData.payment_bank) setPaymentBank(configData.payment_bank)
      if (configData.payment_rekening) setPaymentRekening(configData.payment_rekening)
      if (configData.payment_atas_nama) setPaymentAtasNama(configData.payment_atas_nama)
      if (configData.payment_method) setPaymentMethod(configData.payment_method)
      setMaintenanceMode(configData.maintenance_mode === 'true' || configData.maintenance_mode === true)
      if (configData.maintenance_message !== undefined) setMaintenanceMessage(configData.maintenance_message || '')
      if (configData.maintenance_estimated_end !== undefined) setMaintenanceEstimatedEnd(configData.maintenance_estimated_end || '')
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMerch = async () => {
    try {
      const res = await api.get('/merchandise')
      setMerch(res.data.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMerchOrders = async () => {
    try {
      setLoadingMerchOrders(true)
      const params = {}
      if (merchOrderStatusFilter !== 'all') params.status = merchOrderStatusFilter
      if (merchOrderSearch) params.search = merchOrderSearch
      const res = await api.get('/merch-orders', { params })
      setMerchOrders(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingMerchOrders(false)
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#079108',
      cancelButtonText: 'Batal'
    }).then(r => {
      if (r.isConfirmed) {
        logoutAdminSession()
        navigate('/admin/login')
      }
    })
  }

  const handleStatusChange = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      showToast.success('Status updated!')
      fetchOrders()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal Update Status', text: error.response?.data?.error || error.message })
    }
  }

  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Hapus Order?',
      text: 'Data tidak bisa dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/orders/${orderId}`)
      Swal.fire('Deleted!', 'Order telah dihapus.', 'success')
      fetchOrders()
    } catch (error) {
      Swal.fire('Error!', error.message, 'error')
    }
  }

  const handleBulkDelete = async (deleteType, params = {}) => {
    try {
      const response = await api.post('/orders/bulk-delete', { deleteType, ...params })
      showToast.success(response.data.message)
      fetchOrders()
      setShowBulkDeleteModal(false)
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handlePurgeOldPayments = async () => {
    const result = await Swal.fire({
      title: 'Bersihkan Bukti Pembayaran Lama?',
      text: 'Semua foto bukti bayar dari order yang usianya sudah lebih dari 30 hari akan dihapus dari Supabase Storage untuk menghemat kuota. Riwayat pesanan tetap tersimpan di database.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Bersihkan Sekarang',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      const response = await api.post('/orders/purge-old-payments')
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: response.data.message,
        confirmButtonColor: '#079108'
      })
      fetchOrders()
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setShowEventModal(true)
  }

  const handleDeleteEvent = async (eventId, eventName) => {
    const result = await Swal.fire({
      title: 'Hapus Event?',
      text: `Apakah Anda yakin ingin menghapus event "${eventName}"? Semua order terkait akan kehilangan referensi event.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(`/events/${eventId}`)
      showToast.success('Event berhasil dihapus')
      fetchEvents()
    } catch (error) {
      Swal.fire('Error!', error.response?.data?.error || error.message, 'error')
    }
  }

  const handleTogglePast = async (eventId, currentStatus) => {
    const isNowPast = !currentStatus;
    const result = await Swal.fire({
      title: isNowPast ? 'Selesaikan Event?' : 'Aktifkan Event?',
      text: isNowPast 
        ? 'Apakah Anda yakin event ini sudah selesai?' 
        : 'Apakah Anda yakin ingin mengaktifkan event ini kembali?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isNowPast ? '#079108' : '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: isNowPast ? 'Ya, Selesaikan' : 'Ya, Aktifkan',
      cancelButtonText: 'Batal',
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg',
        cancelButton: 'rounded-lg'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/events/${eventId}`, { is_past: isNowPast })
      fetchEvents()
      showToast.success(isNowPast ? 'Event ditandai selesai!' : 'Event diaktifkan kembali!')
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.message })
    }
  }

  const updateConfig = async (updates, silent = false) => {
    try {
      setConfigLoading(true)
      await api.patch('/config', updates)
      if (!silent) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Konfigurasi berhasil diupdate', confirmButtonColor: '#079108' })
      } else {
        showToast.success('Pengaturan diperbarui')
      }
      fetchConfig()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.response?.data?.error || 'Gagal update konfigurasi', confirmButtonColor: '#079108' })
    } finally {
      setConfigLoading(false)
    }
  }

  const viewOrderDetail = (order) => {
    setSelectedOrder(order)
    setShowOrderDetailModal(true)
  }

  const handleExportExcel = async ({ scope, value }) => {
    const params = buildOrderParams()
    await generateExcel({ scope, value, params, events, api })
  }

  const handleExportPdf = async ({ scope, value }) => {
    const params = buildOrderParams()
    await generatePDF({ scope, value, params, events, api })
  }

  const handleExportMerchExcel = async () => {
    await generateMerchExcel({ statusFilter: merchOrderStatusFilter, searchQuery: merchOrderSearch })
  }

  const handleExportMerchPdf = async () => {
    await generateMerchPDF({ api, statusFilter: merchOrderStatusFilter, searchQuery: merchOrderSearch })
  }

  const parseHarga = (input) => {
    if (!input) return ''
    let str = String(input).trim().toLowerCase()
    str = str.replace(/^(rp\.?\s*|idr\.?\s*)/i, '')
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      str = str.replace(/\./g, '')
    }
    str = str.replace(',', '.')
    let multiplier = 1
    if (/k$/i.test(str)) { multiplier = 1000; str = str.replace(/k$/i, '') }
    else if (/rb$/i.test(str)) { multiplier = 1000; str = str.replace(/rb$/i, '') }
    else if (/ribu$/i.test(str)) { multiplier = 1000; str = str.replace(/ribu$/i, '') }
    else if (/jt$/i.test(str)) { multiplier = 1000000; str = str.replace(/jt$/i, '') }
    else if (/juta$/i.test(str)) { multiplier = 1000000; str = str.replace(/juta$/i, '') }
    const num = parseFloat(str)
    if (Number.isNaN(num)) return ''
    return Math.round(num * multiplier)
  }

  const [merchHargaRaw, setMerchHargaRaw] = useState('')

  const handleHargaChange = (val) => {
    setMerchHargaRaw(val)
    const parsed = parseHarga(val)
    if (parsed !== '') {
      setMerchForm(f => ({ ...f, harga: parsed }))
    } else if (val === '') {
      setMerchForm(f => ({ ...f, harga: '' }))
    }
  }

  const openMerchForm = (item = null) => {
    if (item) {
      setEditingMerch(item)
      setMerchForm({
        nama: item.nama,
        deskripsi: item.deskripsi || '',
        harga: item.harga,
        stok: item.stok ?? '',
        available: item.available,
        sizes: item.sizes || [],
        size_chart_urls: item.size_chart_urls || []
      })
      setMerchHargaRaw(String(item.harga))
      setMerchImagePreview(item.gambar_url || '')
      setAvailableSizes(Array.isArray(item.sizes) ? item.sizes.join(', ') : '')
      setMerchSizeChartPreviews([
        item.size_chart_urls?.[0] || ''
      ])
    } else {
      setEditingMerch(null)
      setMerchForm({ nama: '', deskripsi: '', harga: '', stok: '', available: true, sizes: [], size_chart_urls: [] })
      setMerchHargaRaw('')
      setMerchImagePreview('')
      setAvailableSizes('')
      setMerchSizeChartPreviews([''])
    }
    setMerchImageFile(null)
    setMerchSizeChartFiles([null])
    setShowMerchForm(true)
  }

  const closeMerchForm = () => {
    setShowMerchForm(false)
    setEditingMerch(null)
    setMerchImageFile(null)
    setMerchImagePreview('')
    setMerchSizeChartFiles([null])
    setMerchSizeChartPreviews([''])
    setAvailableSizes('')
  }

  const handleMerchImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMerchImageFile(file)
    setMerchImagePreview(URL.createObjectURL(file))
  }

  const handleToggleSize = (size) => {
    const currentSizes = availableSizes.split(',').map(s => s.trim()).filter(s => s !== '')
    if (currentSizes.includes(size)) {
      setAvailableSizes(currentSizes.filter(s => s !== size).join(', '))
    } else {
      setAvailableSizes([...currentSizes, size].join(', '))
    }
  }

  const handleSizeChartChange = (e, index) => {
    const file = e.target.files[0]
    if (!file) return
    const newFiles = [...merchSizeChartFiles]
    newFiles[index] = file
    setMerchSizeChartFiles(newFiles)

    const newPreviews = [...merchSizeChartPreviews]
    newPreviews[index] = URL.createObjectURL(file)
    setMerchSizeChartPreviews(newPreviews)
  }

  const compressMerchImage = (file) => new Promise((resolve) => {
    const MAX_PX = 800
    const QUALITY = 0.82
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', QUALITY)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })

  const handleMerchSubmit = async (e) => {
    e.preventDefault()
    if (!merchForm.nama || !merchForm.harga) return showToast.warning('Nama dan harga merchandise wajib diisi')
    setMerchSaving(true)
    try {
      let gambar_url = editingMerch?.gambar_url || ''
      let size_chart_urls = [...(editingMerch?.size_chart_urls || [null])]
      if (size_chart_urls.length < 1) size_chart_urls = [size_chart_urls[0] || null]

      if (merchImageFile) {
        const compressed = await compressMerchImage(merchImageFile)
        const formData = new FormData()
        formData.append('file', compressed, 'merch.jpg')
        const uploadRes = await api.post('/upload/merch-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        gambar_url = uploadRes.data.data.url
      }

      if (merchSizeChartFiles[0]) {
        const compressed = await compressMerchImage(merchSizeChartFiles[0])
        const formData = new FormData()
        formData.append('file', compressed, 'size_chart.jpg')
        const uploadRes = await api.post('/upload/merch-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        size_chart_urls[0] = uploadRes.data.data.url
      }

      if (merchSizeChartPreviews[0] === '' && !merchSizeChartFiles[0]) {
        size_chart_urls[0] = null
      }

      const payload = {
        nama: merchForm.nama,
        deskripsi: merchForm.deskripsi || null,
        harga: parseInt(merchForm.harga, 10),
        stok: merchForm.stok !== '' ? parseInt(merchForm.stok, 10) : 0,
        gambar_url: gambar_url || null,
        available: merchForm.available,
        sizes: availableSizes.split(',').map(s => s.trim()).filter(s => s !== ''),
        size_chart_urls: size_chart_urls.filter(url => url !== null)
      }

      if (editingMerch) {
        await api.put(`/merchandise/${editingMerch.id}`, payload)
        showToast.success('Merchandise berhasil diperbarui!')
      } else {
        await api.post('/merchandise', payload)
        showToast.success('Merchandise berhasil ditambahkan!')
      }

      closeMerchForm()
      fetchMerch()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal menyimpan merchandise')
    } finally {
      setMerchSaving(false)
    }
  }

  const handleDeleteMerch = async (id, nama) => {
    const result = await Swal.fire({
      title: `Hapus "${nama}"?`,
      text: 'Data merchandise ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/merchandise/${id}`)
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Merchandise berhasil dihapus', timer: 1500, showConfirmButton: false })
      fetchMerch()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.response?.data?.error || 'Gagal menghapus' })
    }
  }

  const handleToggleMerchAvailability = async (item, newValue = null) => {
    const isAvailable = newValue !== null ? (newValue === 'aktif') : !item.available
    const previousValue = item.available
    setMerch(prev => prev.map(m => (m.id === item.id ? { ...m, available: isAvailable } : m)))
    try {
      await api.put(`/merchandise/${item.id}`, { available: isAvailable })
      fetchMerch()
    } catch (error) {
      setMerch(prev => prev.map(m => (m.id === item.id ? { ...m, available: previousValue } : m)))
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal update ketersediaan' })
    }
  }

  const handleMerchOrderStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/merch-orders/${orderId}/status`, { status: newStatus })
      fetchMerchOrders()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal update status' })
    }
  }

  const handleDeleteMerchOrder = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Order Merch?',
      text: 'Order ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/merch-orders/${id}`)
      Swal.fire({ icon: 'success', title: 'Berhasil!', timer: 1500, showConfirmButton: false })
      fetchMerchOrders()
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Gagal menghapus' })
    }
  }

  // Bottom nav items (4 primary + More)
  const bottomNavItems = [
    { id: 'orders', label: 'Orders', icon: FaShoppingCart },
    { id: 'events', label: 'Events', icon: FaCalendar },
    { id: 'merch', label: 'Merch', icon: FaBox },
    { id: 'recap', label: 'Recap', icon: FaChartBar },
  ]

  const moreItems = [
    { id: 'members', label: 'Members', icon: FaUsers },
    { id: 'hero', label: 'Pengaturan Hero', icon: FaEye },
    { id: 'settings', label: 'Settings', icon: FaEdit },
  ]

  return (
    <div className="admin-layout min-h-screen md:h-screen md:overflow-hidden bg-[#1A1512] text-white flex flex-col md:flex-row selection:bg-[#E8944A] selection:text-white">
      {/* SIDEBAR â€” desktop only */}
      <aside className="hidden md:flex w-64 md:sticky md:top-0 md:h-screen md:overflow-hidden bg-[#241E19]/95 backdrop-blur-xl border-r border-white/10 p-6 flex-col justify-between shadow-2xl z-20">
        <div>
          <div className="mb-10 px-2 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">KOHI<span className="text-[#E8944A]">SEKAI</span></h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Admin Dashboard</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#E8944A] animate-pulse shadow-[0_0_8px_#E8944A]"></div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'orders', label: 'Orders', icon: FaShoppingCart },
              { id: 'events', label: 'Events', icon: FaCalendar },
              { id: 'members', label: 'Members', icon: FaUsers },
              { id: 'merch', label: 'Merchandise', icon: FaBox },
              { id: 'hero', label: 'Pengaturan Hero', icon: FaEye },
              { id: 'recap', label: 'Recap', icon: FaChartBar },
              { id: 'settings', label: 'Settings', icon: FaEdit },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-[#E8944A] text-white shadow-[0_0_12px_rgba(232,148,74,0.4)] translate-x-1' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`text-lg ${activeTab === item.id ? 'text-white' : 'text-zinc-500'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <button 
          onClick={handleLogout} 
          className="mt-8 w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 md:h-screen md:overflow-y-auto pb-24 md:pb-10 space-y-6">
        {/* GUEST SANDBOX NOTICE BANNER */}
        {isGuest && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <FaShieldAlt className="text-base" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">Mode Tamu / Sandbox Aktif</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">GS123</span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Anda bebas mencoba semua fitur (tambah/hapus member, event, buat OTS, ubah harga). Perubahan bersifat simulasi lokal tanpa menyentuh database asli. Data sensitif disensor.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
              title="Reset semua simulasi ke data awal"
            >
              <FaSync className="text-[10px]" /> Reset Layar (Refresh)
            </button>
          </div>
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={orders}
            events={events}
            loading={loading}
            orderSubTab={orderSubTab}
            setOrderSubTab={setOrderSubTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            eventFilter={eventFilter}
            setEventFilter={setEventFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewOrder={viewOrderDetail}
            onDeleteOrder={handleDeleteOrder}
            onStatusChange={handleStatusChange}
            onShowOTSModal={() => setShowOTSModal(true)}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            merchOrders={merchOrders}
            loadingMerchOrders={loadingMerchOrders}
            merchOrderSearch={merchOrderSearch}
            setMerchOrderSearch={setMerchOrderSearch}
            merchOrderStatusFilter={merchOrderStatusFilter}
            setMerchOrderStatusFilter={setMerchOrderStatusFilter}
            onMerchOrderStatusChange={handleMerchOrderStatusChange}
            onDeleteMerchOrder={handleDeleteMerchOrder}
            onFetchMerchOrders={fetchMerchOrders}
            onExportMerchExcel={handleExportMerchExcel}
            onExportMerchPdf={handleExportMerchPdf}
            members={members}
            hargaOtsPerMember={hargaOtsPerMember}
            hargaOtsGrup={hargaOtsGrup}
            onRefreshOrders={fetchOrders}
            onOtsCartActiveChange={setIsOtsCartActive}
          />
        )}

        {activeTab === 'events' && (
          <EventsTab
            events={events}
            members={members}
            onDeleteEvent={handleDeleteEvent}
            onTogglePast={handleTogglePast}
            onRefresh={fetchEvents}
          />
        )}

        {activeTab === 'merch' && (
          <MerchTab
            merch={merch}
            showMerchForm={showMerchForm}
            editingMerch={editingMerch}
            merchForm={merchForm}
            setMerchForm={setMerchForm}
            merchHargaRaw={merchHargaRaw}
            handleHargaChange={handleHargaChange}
            availableSizes={availableSizes}
            setAvailableSizes={setAvailableSizes}
            merchImagePreview={merchImagePreview}
            merchFileInputRef={merchFileInputRef}
            handleMerchImageChange={handleMerchImageChange}
            setMerchImageFile={setMerchImageFile}
            setMerchImagePreview={setMerchImagePreview}
            merchSizeChartPreviews={merchSizeChartPreviews}
            setMerchSizeChartPreviews={setMerchSizeChartPreviews}
            setMerchSizeChartFiles={setMerchSizeChartFiles}
            sizeChart1InputRef={sizeChart1InputRef}
            merchSaving={merchSaving}
            openMerchForm={openMerchForm}
            closeMerchForm={closeMerchForm}
            handleMerchSubmit={handleMerchSubmit}
            handleSizeChartChange={handleSizeChartChange}
            handleToggleSize={handleToggleSize}
            onToggleMerchAvailability={handleToggleMerchAvailability}
            handleDeleteMerch={handleDeleteMerch}
          />
        )}

        {activeTab === 'recap' && (
          <RecapTab
            orders={orders}
            events={events}
            recapEventFilter={recapEventFilter}
            setRecapEventFilter={setRecapEventFilter}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            onRefresh={fetchMembers}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            hargaPerMember={hargaPerMember}
            setHargaPerMember={setHargaPerMember}
            hargaGrup={hargaGrup}
            setHargaGrup={setHargaGrup}
            hargaOtsPerMember={hargaOtsPerMember}
            setHargaOtsPerMember={setHargaOtsPerMember}
            hargaOtsGrup={hargaOtsGrup}
            setHargaOtsGrup={setHargaOtsGrup}
            paymentBank={paymentBank}
            setPaymentBank={setPaymentBank}
            paymentRekening={paymentRekening}
            setPaymentRekening={setPaymentRekening}
            paymentAtasNama={paymentAtasNama}
            setPaymentAtasNama={setPaymentAtasNama}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            maintenanceMode={maintenanceMode}
            setMaintenanceMode={setMaintenanceMode}
            maintenanceMessage={maintenanceMessage}
            setMaintenanceMessage={setMaintenanceMessage}
            maintenanceEstimatedEnd={maintenanceEstimatedEnd}
            setMaintenanceEstimatedEnd={setMaintenanceEstimatedEnd}
            configLoading={configLoading}
            updateConfig={updateConfig}
            onShowBulkDeleteModal={() => setShowBulkDeleteModal(true)}
            onPurgeOldPayments={handlePurgeOldPayments}
          />
        )}

        {activeTab === 'hero' && (
          <HeroTab />
        )}
      </main>

      {showOrderDetailModal && selectedOrder && (
        <OrderDetailModal
          isOpen={showOrderDetailModal}
          onClose={() => setShowOrderDetailModal(false)}
          order={selectedOrder}
          events={events}
        />
      )}

      {showOTSModal && (
        <OTSOrderModal
          members={members}
          events={events}
          onClose={() => setShowOTSModal(false)}
          onSuccess={() => {
            setShowOTSModal(false)
            fetchOrders()
          }}
          hargaOtsPerMember={hargaOtsPerMember}
          hargaOtsGrup={hargaOtsGrup}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          events={events}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {showEventModal && (
        <EventModal
          members={members}
          editingEvent={editingEvent}
          onClose={() => {
            setShowEventModal(false)
            setEditingEvent(null)
          }}
          onSuccess={() => {
            setShowEventModal(false)
            setEditingEvent(null)
            fetchEvents()
          }}
        />
      )}

      {/* â”€â”€ BOTTOM NAVBAR (mobile only) â”€â”€ */}
      {!isOtsCartActive && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#241E19]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
          <div className="flex items-stretch">
            {bottomNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setShowMoreDrawer(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all ${
                  activeTab === item.id
                    ? 'text-[#E8944A]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <item.icon className={`text-lg transition-all ${activeTab === item.id ? 'text-[#E8944A] drop-shadow-[0_0_6px_#E8944A]' : ''}`} />
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#E8944A] rounded-full" />
                )}
              </button>
            ))}
            {/* More button */}
            <button
              onClick={() => setShowMoreDrawer(prev => !prev)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all ${
                showMoreDrawer || ['members','settings'].includes(activeTab)
                  ? 'text-[#E8944A]'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FaEllipsisH className={`text-lg ${showMoreDrawer || ['members','settings'].includes(activeTab) ? 'text-[#E8944A]' : ''}`} />
              More
            </button>
          </div>
        </nav>
      )}

      {/* â”€â”€ MORE DRAWER (mobile) â”€â”€ */}
      {!isOtsCartActive && showMoreDrawer && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMoreDrawer(false)}
          />
          {/* Drawer */}
          <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-[#0c111d]/98 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.7)] rounded-t-2xl px-4 py-4 animate-fade-in">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              {moreItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setShowMoreDrawer(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-[#079108]/20 text-[#079108] border border-[#079108]/40'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <item.icon className="text-base" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setShowMoreDrawer(false); handleLogout() }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
