import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Plus,
  Trash2,
  Edit3,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  Share2,
  Layers,
  Search,
  Filter,
  DollarSign,
  Crown,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Utensils,
  ArrowRightLeft,
  RefreshCw,
  Send,
  Sliders,
  Eye,
  Settings2,
  Check,
  Flame,
  Music,
  Trees,
  DoorOpen,
  Coffee,
  HelpCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Grid,
} from 'lucide-react';

import { useAppStore } from '../../stores/useAppStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useTableStore } from '../../stores/useTableStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { soundEngine } from '../../services/soundEngine';
import {
  FloorTable,
  FloorSection,
  TableShape,
  TableStatus,
  LandmarkType,
  TableReservation,
  ReservationOccasion,
  ReservationStatus,
  FloorPlanStats,
} from '../../types/floorplan';

// Initial Mock Zones
const INITIAL_SECTIONS: FloorSection[] = [
  {
    id: 'sec-main',
    nameAr: 'الصالة الملكية الرئيسية',
    nameEn: 'Royal Main Dining Room',
    floor: 1,
    isActive: true,
    color: '#F59E0B',
    sortOrder: 1,
    descriptionAr: 'الصالة الداخلية الفاخرة بطابع ملكي وأجواء دافئة',
    descriptionEn: 'Opulent indoor dining area with royal ambiance',
    canvasWidth: 1000,
    canvasHeight: 650,
  },
  {
    id: 'sec-terrace',
    nameAr: 'التراس والشرفة الخارجية',
    nameEn: 'Open Air Terrace Lounge',
    floor: 1,
    isActive: true,
    color: '#10B981',
    sortOrder: 2,
    descriptionAr: 'جلسات خارجية مطلة مع رذاذ منعش وإطلالة رائعة',
    descriptionEn: 'Outdoor panoramic lounge with misty breeze',
    canvasWidth: 1000,
    canvasHeight: 650,
  },
  {
    id: 'sec-vip',
    nameAr: 'أجنحة كبائن VIP الفاخرة',
    nameEn: 'VIP Private Family Suites',
    floor: 2,
    isActive: true,
    color: '#8B5CF6',
    sortOrder: 3,
    descriptionAr: 'كبائن عائلية معزولة بأعلى درجات الخصوصية والفخامة',
    descriptionEn: 'Private suites with high-tier discretion and royal service',
    canvasWidth: 1000,
    canvasHeight: 650,
  },
  {
    id: 'sec-bar',
    nameAr: 'بار المشروبات واللاونج',
    nameEn: 'Artisan Bar & Mocktail Lounge',
    floor: 1,
    isActive: true,
    color: '#EC4899',
    sortOrder: 4,
    descriptionAr: 'كاونتر القهوة المختصة والموكتيلات المنعشة',
    descriptionEn: 'Specialty coffee & fresh artisan mocktails counter',
    canvasWidth: 1000,
    canvasHeight: 650,
  },
];

// Initial Rich Tables
const INITIAL_FLOOR_TABLES: FloorTable[] = [
  // Main Hall Tables
  {
    id: 'tbl-m1',
    tableNumber: 'T-01',
    sectionId: 'sec-main',
    capacity: 2,
    shape: 'square',
    status: 'occupied',
    currentOrderId: 'ORD-2026-101',
    posX: 80,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m1',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 150,
    lastOccupiedAt: new Date(Date.now() - 42 * 60000).toISOString(),
    guestCount: 2,
  },
  {
    id: 'tbl-m2',
    tableNumber: 'T-02',
    sectionId: 'sec-main',
    capacity: 4,
    shape: 'rectangle',
    status: 'available',
    posX: 220,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m2',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 200,
  },
  {
    id: 'tbl-m3',
    tableNumber: 'T-03',
    sectionId: 'sec-main',
    capacity: 4,
    shape: 'rectangle',
    status: 'billing',
    currentOrderId: 'ORD-2026-102',
    posX: 380,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m3',
    assignedWaiterId: 'st_3',
    assignedWaiterName: 'عمر القحطاني',
    minSpend: 200,
    lastOccupiedAt: new Date(Date.now() - 68 * 60000).toISOString(),
    guestCount: 4,
  },
  {
    id: 'tbl-m4',
    tableNumber: 'T-04',
    sectionId: 'sec-main',
    capacity: 6,
    shape: 'round',
    status: 'available',
    posX: 540,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m4',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 300,
  },
  {
    id: 'tbl-m5',
    tableNumber: 'T-05',
    sectionId: 'sec-main',
    capacity: 8,
    shape: 'rectangle',
    status: 'reserved',
    posX: 80,
    posY: 260,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m5',
    assignedWaiterId: 'st_3',
    assignedWaiterName: 'عمر القحطاني',
    minSpend: 450,
    label: 'حجز أ. فهد الشمري (8:30م)',
  },
  {
    id: 'tbl-m6',
    tableNumber: 'T-06',
    sectionId: 'sec-main',
    capacity: 4,
    shape: 'round',
    status: 'cleaning',
    posX: 260,
    posY: 260,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m6',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 200,
  },
  {
    id: 'tbl-m7',
    tableNumber: 'T-07',
    sectionId: 'sec-main',
    capacity: 6,
    shape: 'round',
    status: 'occupied',
    currentOrderId: 'ORD-2026-103',
    posX: 440,
    posY: 260,
    rotation: 0,
    qrCodeToken: 'qr_tbl_m7',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 350,
    lastOccupiedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    guestCount: 5,
  },
  {
    id: 'tbl-m-landmark-1',
    tableNumber: 'STAGE-1',
    sectionId: 'sec-main',
    capacity: 0,
    shape: 'landmark',
    status: 'available',
    posX: 700,
    posY: 80,
    width: 140,
    height: 120,
    rotation: 0,
    qrCodeToken: 'stage',
    landmarkType: 'stage_music',
    label: 'مسرح العزف الحي والعود',
  },
  {
    id: 'tbl-m-landmark-2',
    tableNumber: 'ENT-1',
    sectionId: 'sec-main',
    capacity: 0,
    shape: 'landmark',
    status: 'available',
    posX: 80,
    posY: 440,
    width: 120,
    height: 60,
    rotation: 0,
    qrCodeToken: 'entrance',
    landmarkType: 'entrance',
    label: 'المدخل الملكي الرئيسي',
  },
  {
    id: 'tbl-m-landmark-3',
    tableNumber: 'FOUNT-1',
    sectionId: 'sec-main',
    capacity: 0,
    shape: 'landmark',
    status: 'available',
    posX: 660,
    posY: 260,
    width: 130,
    height: 130,
    rotation: 0,
    qrCodeToken: 'fountain',
    landmarkType: 'fountain_decor',
    label: 'نافورة المياه الكريستالية',
  },

  // Terrace Tables
  {
    id: 'tbl-t1',
    tableNumber: 'TR-01',
    sectionId: 'sec-terrace',
    capacity: 4,
    shape: 'round',
    status: 'occupied',
    currentOrderId: 'ORD-2026-104',
    posX: 80,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_t1',
    assignedWaiterId: 'st_4',
    assignedWaiterName: 'خالد السبيعي',
    minSpend: 180,
    lastOccupiedAt: new Date(Date.now() - 34 * 60000).toISOString(),
    guestCount: 3,
  },
  {
    id: 'tbl-t2',
    tableNumber: 'TR-02',
    sectionId: 'sec-terrace',
    capacity: 4,
    shape: 'round',
    status: 'available',
    posX: 240,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_t2',
    assignedWaiterId: 'st_4',
    assignedWaiterName: 'خالد السبيعي',
    minSpend: 180,
  },
  {
    id: 'tbl-t3',
    tableNumber: 'TR-03',
    sectionId: 'sec-terrace',
    capacity: 2,
    shape: 'square',
    status: 'cleaning',
    posX: 400,
    posY: 100,
    rotation: 0,
    qrCodeToken: 'qr_tbl_t3',
    assignedWaiterId: 'st_4',
    assignedWaiterName: 'خالد السبيعي',
    minSpend: 100,
  },
  {
    id: 'tbl-t4',
    tableNumber: 'TR-04',
    sectionId: 'sec-terrace',
    capacity: 6,
    shape: 'rectangle',
    status: 'available',
    posX: 120,
    posY: 260,
    rotation: 0,
    qrCodeToken: 'qr_tbl_t4',
    assignedWaiterId: 'st_4',
    assignedWaiterName: 'خالد السبيعي',
    minSpend: 300,
  },
  {
    id: 'tbl-t5',
    tableNumber: 'TR-05',
    sectionId: 'sec-terrace',
    capacity: 8,
    shape: 'rectangle',
    status: 'reserved',
    posX: 340,
    posY: 260,
    rotation: 0,
    qrCodeToken: 'qr_tbl_t5',
    assignedWaiterId: 'st_4',
    assignedWaiterName: 'خالد السبيعي',
    minSpend: 500,
    label: 'حجز د. نورة القاسم (9:00م)',
  },

  // VIP Family Suites
  {
    id: 'tbl-v1',
    tableNumber: 'VIP-01',
    sectionId: 'sec-vip',
    capacity: 8,
    shape: 'vip_booth',
    status: 'occupied',
    currentOrderId: 'ORD-2026-105',
    posX: 80,
    posY: 80,
    width: 170,
    height: 150,
    rotation: 0,
    qrCodeToken: 'qr_tbl_v1',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 800,
    vipTierRequired: true,
    lastOccupiedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    guestCount: 7,
    label: 'جناح الديوان الملكي VIP',
  },
  {
    id: 'tbl-v2',
    tableNumber: 'VIP-02',
    sectionId: 'sec-vip',
    capacity: 10,
    shape: 'vip_booth',
    status: 'available',
    posX: 300,
    posY: 80,
    width: 190,
    height: 150,
    rotation: 0,
    qrCodeToken: 'qr_tbl_v2',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 1000,
    vipTierRequired: true,
    label: 'جناح قصر اليمامة VIP',
  },
  {
    id: 'tbl-v3',
    tableNumber: 'VIP-03',
    sectionId: 'sec-vip',
    capacity: 12,
    shape: 'vip_booth',
    status: 'reserved',
    posX: 80,
    posY: 270,
    width: 210,
    height: 160,
    rotation: 0,
    qrCodeToken: 'qr_tbl_v3',
    assignedWaiterId: 'st_2',
    assignedWaiterName: 'سارة المنصور',
    minSpend: 1500,
    vipTierRequired: true,
    label: 'جناح الدرعية للاحتفالات',
  },

  // Bar Lounge
  {
    id: 'tbl-b-counter',
    tableNumber: 'BAR-CTR',
    sectionId: 'sec-bar',
    capacity: 0,
    shape: 'landmark',
    status: 'available',
    posX: 60,
    posY: 60,
    width: 450,
    height: 70,
    rotation: 0,
    qrCodeToken: 'bar_counter',
    landmarkType: 'bar_counter',
    label: 'كاونتر البار الرئيسي والمشروبات',
  },
  {
    id: 'tbl-b1',
    tableNumber: 'BAR-01',
    sectionId: 'sec-bar',
    capacity: 1,
    shape: 'bar_stool',
    status: 'occupied',
    posX: 80,
    posY: 150,
    rotation: 0,
    qrCodeToken: 'qr_bar_1',
    minSpend: 50,
    assignedWaiterName: 'خالد السبيعي',
  },
  {
    id: 'tbl-b2',
    tableNumber: 'BAR-02',
    sectionId: 'sec-bar',
    capacity: 1,
    shape: 'bar_stool',
    status: 'occupied',
    posX: 160,
    posY: 150,
    rotation: 0,
    qrCodeToken: 'qr_bar_2',
    minSpend: 50,
    assignedWaiterName: 'خالد السبيعي',
  },
  {
    id: 'tbl-b3',
    tableNumber: 'BAR-03',
    sectionId: 'sec-bar',
    capacity: 1,
    shape: 'bar_stool',
    status: 'available',
    posX: 240,
    posY: 150,
    rotation: 0,
    qrCodeToken: 'qr_bar_3',
    minSpend: 50,
  },
  {
    id: 'tbl-b4',
    tableNumber: 'BAR-04',
    sectionId: 'sec-bar',
    capacity: 1,
    shape: 'bar_stool',
    status: 'available',
    posX: 320,
    posY: 150,
    rotation: 0,
    qrCodeToken: 'qr_bar_4',
    minSpend: 50,
  },
  {
    id: 'tbl-b5',
    tableNumber: 'BAR-05',
    sectionId: 'sec-bar',
    capacity: 1,
    shape: 'bar_stool',
    status: 'available',
    posX: 400,
    posY: 150,
    rotation: 0,
    qrCodeToken: 'qr_bar_5',
    minSpend: 50,
  },
];

// Initial Rich Table Reservations
const INITIAL_RESERVATIONS: TableReservation[] = [
  {
    id: 'res-101',
    reservationNumber: 'RES-2026-0814-01',
    guestName: 'أ. فهد الشمري',
    phone: '+966504423189',
    email: 'fahad.alshammari@gmail.com',
    tableId: 'tbl-m5',
    tableNumber: 'T-05',
    sectionId: 'sec-main',
    partySize: 8,
    reservationDate: new Date().toISOString().slice(0, 10),
    reservationTime: '20:30',
    durationMinutes: 120,
    status: 'confirmed',
    occasion: 'birthday',
    depositAmount: 300,
    depositPaid: true,
    specialRequests: 'تجهيز كعكة الشوكولاتة الملكية مع كتابة (سنة حلوة فهد) وتقديمها مع القهوة',
    whatsappSent: true,
    whatsappSentAt: '14:15',
    vipTier: 'Gold',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-102',
    reservationNumber: 'RES-2026-0814-02',
    guestName: 'د. نورة القاسم',
    phone: '+966551982344',
    email: 'noura.qasim@hospital.sa',
    tableId: 'tbl-t5',
    tableNumber: 'TR-05',
    sectionId: 'sec-terrace',
    partySize: 6,
    reservationDate: new Date().toISOString().slice(0, 10),
    reservationTime: '21:00',
    durationMinutes: 90,
    status: 'confirmed',
    occasion: 'anniversary',
    depositAmount: 200,
    depositPaid: true,
    specialRequests: 'طاولة في طرف التراس بإطلالة مفتوحة مع باقة ورد جوري أحمر على الطاولة',
    whatsappSent: true,
    whatsappSentAt: '13:30',
    vipTier: 'Black VIP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-103',
    reservationNumber: 'RES-2026-0814-03',
    guestName: 'المهندس سلطان بن عبد العزيز',
    phone: '+966548771200',
    tableId: 'tbl-v3',
    tableNumber: 'VIP-03',
    sectionId: 'sec-vip',
    partySize: 10,
    reservationDate: new Date().toISOString().slice(0, 10),
    reservationTime: '21:30',
    durationMinutes: 150,
    status: 'confirmed',
    occasion: 'business',
    depositAmount: 500,
    depositPaid: true,
    specialRequests: 'عشاء عمل تنفيذي VIP، تقديم الضيافة الملكية فور الوصول والتأكد من إغلاق الستائر',
    whatsappSent: true,
    whatsappSentAt: '11:00',
    vipTier: 'Black VIP',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-104',
    reservationNumber: 'RES-2026-0814-04',
    guestName: 'عبد الله الدوسري',
    phone: '+966509911223',
    tableId: 'tbl-m4',
    tableNumber: 'T-04',
    sectionId: 'sec-main',
    partySize: 4,
    reservationDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    reservationTime: '19:45',
    durationMinutes: 90,
    status: 'pending',
    occasion: 'family',
    depositAmount: 150,
    depositPaid: false,
    specialRequests: 'كرسي أطفال إضافي',
    whatsappSent: false,
    vipTier: 'Silver',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Order Details for Occupied Tables
const MOCK_TABLE_ORDERS: Record<string, any> = {
  'tbl-m1': {
    orderNumber: 'ORD-2026-101',
    customerName: 'سعود التميمي',
    items: [
      { nameAr: 'ستيك واغيو ريب آي A5', nameEn: 'Wagyu Ribeye Steak A5', qty: 1, price: 320 },
      { nameAr: 'شوربة الفطر وزيت الكمأة', nameEn: 'Wild Truffle Soup', qty: 2, price: 45 },
      { nameAr: 'موهيتو الباشن فروت', nameEn: 'Passion Fruit Mojito', qty: 2, price: 34 },
    ],
    subtotal: 478,
    tax: 71.7,
    total: 549.7,
    notes: 'الستيك استواء Medium Well',
  },
  'tbl-m3': {
    orderNumber: 'ORD-2026-102',
    customerName: 'فيصل الحربي',
    items: [
      { nameAr: 'مشكل مشاوي السلطان المميز', nameEn: 'Sultan Mixed Grill', qty: 2, price: 145 },
      { nameAr: 'داينمايت شرمب مقرمش', nameEn: 'Dynamite Shrimp', qty: 2, price: 58 },
      { nameAr: 'كنافة نابلسية بالجبن', nameEn: 'Royal Cheese Kunafa', qty: 1, price: 48 },
      { nameAr: 'قهوة V60 إثيوبية', nameEn: 'Ethiopian V60', qty: 4, price: 28 },
    ],
    subtotal: 566,
    tax: 84.9,
    total: 650.9,
    notes: 'طلب الحساب - دفع شبكة',
  },
  'tbl-m7': {
    orderNumber: 'ORD-2026-103',
    customerName: 'عائلة الخالدي',
    items: [
      { nameAr: 'مشكل مشاوي السلطان المميز', nameEn: 'Sultan Mixed Grill', qty: 3, price: 145 },
      { nameAr: 'سلطة سيزر الدجاج المشوي', nameEn: 'Grilled Caesar Salad', qty: 2, price: 42 },
      { nameAr: 'عصير برتقال طازج', nameEn: 'Fresh Orange Juice', qty: 5, price: 22 },
    ],
    subtotal: 629,
    tax: 94.35,
    total: 723.35,
    notes: 'بدون بصل في المشاوي',
  },
  'tbl-t1': {
    orderNumber: 'ORD-2026-104',
    customerName: 'محمد الشهري',
    items: [
      { nameAr: 'بيتزا نابوليتانا بجبنة البوراتا', nameEn: 'Neapolitan Burrata Pizza', qty: 2, price: 78 },
      { nameAr: 'تشيز كيك سان سيباستيان', nameEn: 'San Sebastian Cheesecake', qty: 2, price: 52 },
      { nameAr: 'سبانش لاتيه مثلج', nameEn: 'Iced Spanish Latte', qty: 3, price: 26 },
    ],
    subtotal: 338,
    tax: 50.7,
    total: 388.7,
    notes: 'جلسة التراس الخارجي',
  },
  'tbl-v1': {
    orderNumber: 'ORD-2026-105',
    customerName: 'الشيخ منصور الراجحي',
    items: [
      { nameAr: 'ستيك واغيو ريب آي A5', nameEn: 'Wagyu Ribeye Steak A5', qty: 3, price: 320 },
      { nameAr: 'مشكل مشاوي السلطان المميز', nameEn: 'Sultan Mixed Grill', qty: 2, price: 145 },
      { nameAr: 'شوربة الفطر وزيت الكمأة', nameEn: 'Wild Truffle Soup', qty: 4, price: 45 },
      { nameAr: 'كنافة نابلسية بالجبن', nameEn: 'Royal Cheese Kunafa', qty: 2, price: 48 },
      { nameAr: 'دلة قهوة سعودية ملكية بالهيل والزعفران', nameEn: 'Royal Saudi Coffee Dallah', qty: 1, price: 65 },
    ],
    subtotal: 1591,
    tax: 238.65,
    total: 1829.65,
    notes: 'جناح VIP - خدمة ضيافة كبار الشخصيات',
  },
};

export const FloorPlanModule: React.FC = () => {
  const { language, playSound, setActiveModule } = useAppStore();
  const isAr = language === 'ar';

  // Master State
  const [sections, setSections] = useState<FloorSection[]>(() => {
    const saved = localStorage.getItem('restaurant_floor_sections');
    return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
  });

  const [tables, setTables] = useState<FloorTable[]>(() => {
    const saved = localStorage.getItem('restaurant_floor_tables');
    return saved ? JSON.parse(saved) : INITIAL_FLOOR_TABLES;
  });

  const [reservations, setReservations] = useState<TableReservation[]>(() => {
    const saved = localStorage.getItem('restaurant_floor_reservations');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'canvas' | 'reservations' | 'analytics'>('canvas');
  const [mode, setMode] = useState<'service' | 'edit'>('service');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Canvas Viewport Controls
  const [zoom, setZoom] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(20);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTimers, setShowTimers] = useState<boolean>(true);
  const [showCapacities, setShowCapacities] = useState<boolean>(true);

  // Selection & Modals
  const [selectedTable, setSelectedTable] = useState<FloorTable | null>(null);
  const [editingTable, setEditingTable] = useState<FloorTable | null>(null);
  const [showNewTableModal, setShowNewTableModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [activeWhatsAppRes, setActiveWhatsAppRes] = useState<TableReservation | null>(null);
  const [targetTransferTableId, setTargetTransferTableId] = useState<string>('');
  const [receiptToast, setReceiptToast] = useState<string | null>(null);
  const [waToast, setWaToast] = useState<string | null>(null);

  // New Reservation Form State
  const [newResGuestName, setNewResGuestName] = useState<string>('');
  const [newResPhone, setNewResPhone] = useState<string>('+9665');
  const [newResDate, setNewResDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newResTime, setNewResTime] = useState<string>('20:00');
  const [newResPartySize, setNewResPartySize] = useState<number>(4);
  const [newResSectionId, setNewResSectionId] = useState<string>('sec-main');
  const [newResTableId, setNewResTableId] = useState<string>('');
  const [newResOccasion, setNewResOccasion] = useState<ReservationOccasion>('casual');
  const [newResDeposit, setNewResDeposit] = useState<number>(100);
  const [newResDepositPaid, setNewResDepositPaid] = useState<boolean>(true);
  const [newResNotes, setNewResNotes] = useState<string>('');
  const [newResVipTier, setNewResVipTier] = useState<'Standard' | 'Silver' | 'Gold' | 'Black VIP'>('Gold');

  // Dragging State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real-time Timer Counter for occupied tables
  const [tick, setTick] = useState<number>(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('restaurant_floor_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('restaurant_floor_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('restaurant_floor_reservations', JSON.stringify(reservations));
  }, [reservations]);

  // Compute Live KPI Stats
  const stats: FloorPlanStats = useMemo(() => {
    const regularTables = tables.filter((t) => t.shape !== 'landmark');
    const totalTables = regularTables.length;
    const totalCapacity = regularTables.reduce((sum, t) => sum + (t.capacity || 0), 0);
    const availableTables = regularTables.filter((t) => t.status === 'available').length;
    const occupiedTables = regularTables.filter((t) => t.status === 'occupied').length;
    const billingTables = regularTables.filter((t) => t.status === 'billing').length;
    const cleaningTables = regularTables.filter((t) => t.status === 'cleaning').length;
    const reservedTables = regularTables.filter((t) => t.status === 'reserved').length;

    const occupancyRate = totalTables > 0 ? Math.round(((occupiedTables + billingTables) / totalTables) * 100) : 0;
    
    // Sum active revenue from occupied and billing tables
    const liveRevenue = Object.values(MOCK_TABLE_ORDERS).reduce((sum, ord) => sum + (ord.total || 0), 0);
    const currentGuests = regularTables.filter((t) => t.status === 'occupied' || t.status === 'billing')
      .reduce((sum, t) => sum + (t.guestCount || t.capacity || 2), 0);

    return {
      totalTables,
      totalCapacity,
      availableTables,
      occupiedTables,
      billingTables,
      cleaningTables,
      reservedTables,
      occupancyRate,
      liveRevenue,
      currentGuests,
      avgDurationMinutes: 48,
    };
  }, [tables, tick]);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (selectedSectionId !== 'all' && t.sectionId !== selectedSectionId) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = t.tableNumber.toLowerCase().includes(q);
        const matchLabel = t.label?.toLowerCase().includes(q);
        const matchWaiter = t.assignedWaiterName?.toLowerCase().includes(q);
        return matchNumber || matchLabel || matchWaiter;
      }
      return true;
    });
  }, [tables, selectedSectionId, statusFilter, searchQuery]);

  // Helper to calculate elapsed minutes since occupied
  const getElapsedMinutes = (lastOccupiedAt?: string): number => {
    if (!lastOccupiedAt) return 0;
    const diffMs = Date.now() - new Date(lastOccupiedAt).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Drag Handlers for 2D Canvas in Edit Mode
  const handleMouseDown = (table: FloorTable, e: React.MouseEvent) => {
    if (mode !== 'edit') return;
    e.stopPropagation();
    setDraggingTableId(table.id);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const mouseX = (e.clientX - canvasRect.left) / zoom;
    const mouseY = (e.clientY - canvasRect.top) / zoom;

    setDragOffset({
      x: mouseX - table.posX,
      y: mouseY - table.posY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTableId || mode !== 'edit') return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    let newX = (e.clientX - canvasRect.left) / zoom - dragOffset.x;
    let newY = (e.clientY - canvasRect.top) / zoom - dragOffset.y;

    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    // Boundaries
    newX = Math.max(20, Math.min(newX, 920));
    newY = Math.max(20, Math.min(newY, 580));

    setTables((prev) =>
      prev.map((t) => (t.id === draggingTableId ? { ...t, posX: newX, posY: newY } : t))
    );
  };

  const handleMouseUp = () => {
    if (draggingTableId) {
      playSound('tap');
      setDraggingTableId(null);
    }
  };

  // Status Change Trigger
  const handleUpdateStatus = (tableId: string, newStatus: TableStatus) => {
    playSound('pop');
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          status: newStatus,
          lastOccupiedAt: newStatus === 'occupied' ? new Date().toISOString() : t.lastOccupiedAt,
        };
      })
    );

    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Rotate Table
  const handleRotateTable = (tableId: string) => {
    playSound('slide');
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        const currentRot = t.rotation || 0;
        const nextRot = (currentRot + 45) % 360;
        return { ...t, rotation: nextRot };
      })
    );
  };

  // Delete Table
  const handleDeleteTable = (tableId: string) => {
    playSound('delete');
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    if (selectedTable?.id === tableId) setSelectedTable(null);
    if (editingTable?.id === tableId) setEditingTable(null);
  };

  // Duplicate Table
  const handleDuplicateTable = (table: FloorTable) => {
    playSound('pop');
    const newId = `tbl-custom-${Date.now()}`;
    const newTable: FloorTable = {
      ...table,
      id: newId,
      tableNumber: `${table.tableNumber}-B`,
      posX: Math.min(table.posX + 40, 850),
      posY: Math.min(table.posY + 40, 500),
      status: 'available',
      currentOrderId: undefined,
    };
    setTables((prev) => [...prev, newTable]);
  };

  // Table Transfer Handler
  const handleExecuteTransfer = () => {
    if (!selectedTable || !targetTransferTableId) return;
    playSound('success');

    const sourceId = selectedTable.id;
    const targetId = targetTransferTableId;
    const currentOrder = MOCK_TABLE_ORDERS[sourceId];

    if (currentOrder) {
      MOCK_TABLE_ORDERS[targetId] = currentOrder;
      delete MOCK_TABLE_ORDERS[sourceId];
    }

    setTables((prev) =>
      prev.map((t) => {
        if (t.id === targetId) {
          return {
            ...t,
            status: 'occupied',
            currentOrderId: selectedTable.currentOrderId,
            lastOccupiedAt: selectedTable.lastOccupiedAt,
            guestCount: selectedTable.guestCount,
          };
        }
        if (t.id === sourceId) {
          return {
            ...t,
            status: 'cleaning',
            currentOrderId: undefined,
            lastOccupiedAt: undefined,
            guestCount: undefined,
          };
        }
        return t;
      })
    );

    setShowTransferModal(false);
    setSelectedTable(null);
    setReceiptToast(
      isAr
        ? `تم نقل الطلب بنجاح من طاولة ${selectedTable.tableNumber} إلى ${
            tables.find((t) => t.id === targetId)?.tableNumber
          }`
        : `Order transferred successfully to ${
            tables.find((t) => t.id === targetId)?.tableNumber
          }`
    );
    setTimeout(() => setReceiptToast(null), 4000);
  };

  // Print Bill Simulation
  const handlePrintBill = (table: FloorTable) => {
    playSound('kitchen-bell');
    setReceiptToast(
      isAr
        ? `تم إرسال فاتورة طاولة ${table.tableNumber} إلى طابعة الكاشير بنجاح 🖨️`
        : `Bill for Table ${table.tableNumber} sent to cashier printer successfully 🖨️`
    );
    setTimeout(() => setReceiptToast(null), 3500);
  };

  // Intercom Call Waiter Simulation
  const handleCallWaiter = (table: FloorTable) => {
    playSound('kitchen-bell');
    setReceiptToast(
      isAr
        ? `تم إرسال إشعار فوري عبر الإنتركوم للويتر (${table.assignedWaiterName || 'طاقم الصالة'}) 🔔`
        : `Intercom alert dispatched to (${table.assignedWaiterName || 'Floor Staff'}) 🔔`
    );
    setTimeout(() => setReceiptToast(null), 3500);
  };

  // Quick Open in POS
  const handleOpenInPos = (table: FloorTable) => {
    playSound('tap');
    setActiveModule('pos');
  };

  // Check-In Reservation (Walk-In or Arrival)
  const handleCheckInReservation = (res: TableReservation) => {
    playSound('success');
    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, status: 'seated', checkInAt: new Date().toISOString() } : r))
    );

    if (res.tableId) {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== res.tableId) return t;
          return {
            ...t,
            status: 'occupied',
            guestCount: res.partySize,
            lastOccupiedAt: new Date().toISOString(),
            label: `ضيف VIP: ${res.guestName}`,
          };
        })
      );
    }

    setReceiptToast(
      isAr
        ? `تم تسجيل وصول الضيف ${res.guestName} وتسكينه على طاولة ${res.tableNumber || 'المحددة'} بنجاح 👑`
        : `Guest ${res.guestName} checked in and seated at Table ${res.tableNumber || 'Assigned'} 👑`
    );
    setTimeout(() => setReceiptToast(null), 4000);
  };

  // New Reservation Submission
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResGuestName || !newResPhone) return;

    playSound('success');
    const newId = `res-${Date.now()}`;
    const resNum = `RES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const matchedTable = tables.find((t) => t.id === newResTableId);

    const newRes: TableReservation = {
      id: newId,
      reservationNumber: resNum,
      guestName: newResGuestName,
      phone: newResPhone,
      tableId: newResTableId || undefined,
      tableNumber: matchedTable?.tableNumber,
      sectionId: newResSectionId,
      partySize: newResPartySize,
      reservationDate: newResDate,
      reservationTime: newResTime,
      durationMinutes: 120,
      status: 'confirmed',
      occasion: newResOccasion,
      depositAmount: Number(newResDeposit),
      depositPaid: newResDepositPaid,
      specialRequests: newResNotes,
      whatsappSent: true,
      whatsappSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      vipTier: newResVipTier,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReservations((prev) => [newRes, ...prev]);

    if (newResTableId) {
      setTables((prev) =>
        prev.map((t) => {
          if (t.id !== newResTableId) return t;
          return {
            ...t,
            status: 'reserved',
            label: `حجز: ${newResGuestName} (${newResTime})`,
          };
        })
      );
    }

    setShowReservationModal(false);
    // Reset form
    setNewResGuestName('');
    setNewResNotes('');

    // Trigger WhatsApp Simulator Preview
    setActiveWhatsAppRes(newRes);
    setShowWhatsAppModal(true);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (res: TableReservation) => {
    if (isAr) {
      return `مرحباً بك أستاذ/ة *${res.guestName}* 🌟\n\nيسرنا في *مطعم السلطان الملكي (فرع السليمانية - الرياض)* تأكيد حجزكم الموقر:\n\n` +
        `🔖 *رقم الحجز:* ${res.reservationNumber}\n` +
        `📅 *التاريخ:* ${res.reservationDate}\n` +
        `⏰ *الوقت:* ${res.reservationTime}\n` +
        `👥 *عدد الضيوف:* ${res.partySize} أفراد\n` +
        `🪑 *الطاولة:* ${res.tableNumber || 'أفضل طاولة متاحة'}\n` +
        `🎉 *المناسبة:* ${res.occasion === 'birthday' ? 'عيد ميلاد سعيد 🎂' : res.occasion === 'anniversary' ? 'ذكرى زواج سعيدة 💐' : 'ضيافة فاخرة'}\n` +
        `💳 *العربون المدفوع:* ${res.depositAmount} ر.س (مؤكد ✅)\n\n` +
        `📍 *الموقع:* طريق الملك فهد، الرياض\n` +
        `https://maps.google.com/?q=24.7136,46.6753\n\n` +
        `نتطلع لاستقبالكم وتقديم تجربة ضيافة لا تُنسى ✨\n` +
        `_للإلغاء أو التعديل نرجو الرد على هذه الرسالة قبل الموعد بـ ساعتين._`;
    } else {
      return `Hello *${res.guestName}* 🌟\n\nWe are delighted to confirm your reservation at *Sultan Royal Fine Dining (Sulaimaniyah - Riyadh)*:\n\n` +
        `🔖 *Reservation #:* ${res.reservationNumber}\n` +
        `📅 *Date:* ${res.reservationDate}\n` +
        `⏰ *Time:* ${res.reservationTime}\n` +
        `👥 *Guests:* ${res.partySize} People\n` +
        `🪑 *Table:* ${res.tableNumber || 'Best Available'}\n` +
        `💳 *Deposit Paid:* ${res.depositAmount} SAR (Confirmed ✅)\n\n` +
        `📍 *Location:* King Fahd Rd, Riyadh\n` +
        `https://maps.google.com/?q=24.7136,46.6753\n\n` +
        `We look forward to welcoming you! ✨`;
    }
  };

  // Simulate Sending WhatsApp
  const handleSimulateWhatsAppSend = (res: TableReservation) => {
    playSound('success');
    setReservations((prev) =>
      prev.map((r) => (r.id === res.id ? { ...r, whatsappSent: true, whatsappSentAt: 'الآن' } : r))
    );
    setShowWhatsAppModal(false);
    setWaToast(
      isAr
        ? `تم إرسال رسالة التأكيد عبر WhatsApp إلى ${res.phone} بنجاح ✅`
        : `WhatsApp confirmation message sent to ${res.phone} successfully ✅`
    );
    setTimeout(() => setWaToast(null), 4000);
  };

  // Render Table Shapes on Canvas
  const renderTableShape = (table: FloorTable) => {
    const isSelected = selectedTable?.id === table.id;
    const isDragging = draggingTableId === table.id;
    const elapsedMinutes = getElapsedMinutes(table.lastOccupiedAt);

    // Status Colors Mapping
    const getStatusStyle = (status: TableStatus) => {
      switch (status) {
        case 'available':
          return {
            border: 'border-emerald-500/70',
            bg: 'bg-emerald-950/40 hover:bg-emerald-900/50',
            text: 'text-emerald-300',
            glow: 'shadow-emerald-500/20 shadow-lg',
            badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            dot: 'bg-emerald-400',
          };
        case 'occupied':
          return {
            border: elapsedMinutes > 60 ? 'border-amber-400 animate-pulse' : 'border-amber-500/80',
            bg: 'bg-amber-950/50 hover:bg-amber-900/60',
            text: 'text-amber-300',
            glow: 'shadow-amber-500/30 shadow-lg',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            dot: 'bg-amber-400 animate-ping',
          };
        case 'billing':
          return {
            border: 'border-rose-500 animate-pulse',
            bg: 'bg-rose-950/60 hover:bg-rose-900/70',
            text: 'text-rose-300',
            glow: 'shadow-rose-500/40 shadow-xl',
            badge: 'bg-rose-500/30 text-rose-200 border-rose-500/50',
            dot: 'bg-rose-500',
          };
        case 'cleaning':
          return {
            border: 'border-cyan-500/70',
            bg: 'bg-cyan-950/40 hover:bg-cyan-900/50',
            text: 'text-cyan-300',
            glow: 'shadow-cyan-500/20 shadow-lg',
            badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            dot: 'bg-cyan-400',
          };
        case 'reserved':
          return {
            border: 'border-purple-500/80',
            bg: 'bg-purple-950/40 hover:bg-purple-900/50',
            text: 'text-purple-300',
            glow: 'shadow-purple-500/30 shadow-lg',
            badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
            dot: 'bg-purple-400',
          };
        default:
          return {
            border: 'border-slate-600',
            bg: 'bg-slate-900/40',
            text: 'text-slate-400',
            glow: '',
            badge: 'bg-slate-800 text-slate-400 border-slate-700',
            dot: 'bg-slate-500',
          };
      }
    };

    const style = getStatusStyle(table.status);

    // Architectural Landmark Visuals
    if (table.shape === 'landmark') {
      const getLandmarkIcon = () => {
        switch (table.landmarkType) {
          case 'stage_music':
            return <Music className="w-6 h-6 text-purple-400 animate-pulse" />;
          case 'fountain_decor':
            return <Trees className="w-7 h-7 text-teal-400 animate-bounce" />;
          case 'entrance':
            return <DoorOpen className="w-6 h-6 text-amber-400" />;
          case 'bar_counter':
            return <Coffee className="w-6 h-6 text-pink-400" />;
          default:
            return <Layers className="w-6 h-6 text-slate-400" />;
        }
      };

      return (
        <div
          key={table.id}
          onMouseDown={(e) => handleMouseDown(table, e)}
          onClick={() => {
            if (mode === 'edit') setEditingTable(table);
          }}
          style={{
            transform: `translate(${table.posX}px, ${table.posY}px) rotate(${table.rotation || 0}deg)`,
            width: `${table.width || 120}px`,
            height: `${table.height || 80}px`,
          }}
          className={`absolute flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-white/20 bg-slate-950/60 backdrop-blur-md transition-shadow select-none cursor-pointer ${
            mode === 'edit' ? 'cursor-grab active:cursor-grabbing hover:border-amber-400' : ''
          }`}
        >
          {getLandmarkIcon()}
          <span className="text-[11px] font-bold text-slate-300 mt-1 text-center truncate px-1">
            {table.label || table.tableNumber}
          </span>
        </div>
      );
    }

    // VIP Luxury Booth Visual
    if (table.shape === 'vip_booth') {
      return (
        <div
          key={table.id}
          onMouseDown={(e) => handleMouseDown(table, e)}
          onClick={() => {
            playSound('tap');
            if (mode === 'edit') {
              setEditingTable(table);
            } else {
              setSelectedTable(table);
            }
          }}
          style={{
            transform: `translate(${table.posX}px, ${table.posY}px) rotate(${table.rotation || 0}deg)`,
            width: `${table.width || 180}px`,
            height: `${table.height || 140}px`,
          }}
          className={`absolute rounded-3xl border-2 p-3 flex flex-col justify-between backdrop-blur-md transition-all select-none cursor-pointer ${
            style.border
          } ${style.bg} ${style.glow} ${
            isSelected ? 'ring-4 ring-amber-400 scale-105 z-30' : 'hover:scale-[1.02] z-10'
          } ${isDragging ? 'opacity-80 cursor-grabbing z-40' : ''}`}
        >
          {/* Top VIP Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-purple-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-black">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>VIP SUITE</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-300">{table.capacity}</span>
            </div>
          </div>

          {/* Central Title */}
          <div className="text-center my-auto">
            <div className="text-sm font-black text-white tracking-wider flex items-center justify-center gap-1">
              <span>{table.tableNumber}</span>
            </div>
            {table.label && (
              <div className="text-[10px] text-amber-400/90 font-medium truncate px-1 mt-0.5">
                {table.label}
              </div>
            )}
          </div>

          {/* Bottom Live Info Bar */}
          <div className="flex items-center justify-between text-[10px] border-t border-white/10 pt-1.5">
            <span className={`px-1.5 py-0.5 rounded-md font-bold border ${style.badge}`}>
              {table.status === 'available'
                ? isAr ? 'شاغرة' : 'Available'
                : table.status === 'occupied'
                ? isAr ? 'مشغولة' : 'Occupied'
                : table.status === 'billing'
                ? isAr ? 'طلب حساب' : 'Bill Req'
                : table.status === 'cleaning'
                ? isAr ? 'تنظيف' : 'Cleaning'
                : isAr ? 'محجوزة' : 'Reserved'}
            </span>
            {showTimers && table.status === 'occupied' && (
              <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                <Clock className="w-3 h-3" />
                <span>{elapsedMinutes}m</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Bar Stool Visual
    if (table.shape === 'bar_stool') {
      return (
        <div
          key={table.id}
          onMouseDown={(e) => handleMouseDown(table, e)}
          onClick={() => {
            playSound('tap');
            if (mode === 'edit') setEditingTable(table);
            else setSelectedTable(table);
          }}
          style={{
            transform: `translate(${table.posX}px, ${table.posY}px) rotate(${table.rotation || 0}deg)`,
            width: '52px',
            height: '52px',
          }}
          className={`absolute rounded-full border-2 p-1 flex flex-col items-center justify-center backdrop-blur-md transition-all select-none cursor-pointer ${
            style.border
          } ${style.bg} ${style.glow} ${
            isSelected ? 'ring-4 ring-pink-400 scale-110 z-30' : 'hover:scale-105 z-10'
          }`}
        >
          <span className="text-[10px] font-black text-white">{table.tableNumber}</span>
          <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${style.dot}`} />
        </div>
      );
    }

    // Standard Round / Square / Rectangle Table
    const isRound = table.shape === 'round';
    const isSquare = table.shape === 'square';
    const width = isRound ? (table.capacity > 4 ? '110px' : '90px') : isSquare ? '90px' : table.capacity > 6 ? '150px' : '120px';
    const height = isRound ? (table.capacity > 4 ? '110px' : '90px') : '90px';

    return (
      <div
        key={table.id}
        onMouseDown={(e) => handleMouseDown(table, e)}
        onClick={() => {
          playSound('tap');
          if (mode === 'edit') {
            setEditingTable(table);
          } else {
            setSelectedTable(table);
          }
        }}
        style={{
          transform: `translate(${table.posX}px, ${table.posY}px) rotate(${table.rotation || 0}deg)`,
          width,
          height,
        }}
        className={`absolute ${
          isRound ? 'rounded-full' : 'rounded-2xl'
        } border-2 p-2 flex flex-col items-center justify-between backdrop-blur-md transition-all select-none cursor-pointer ${
          style.border
        } ${style.bg} ${style.glow} ${
          isSelected ? 'ring-4 ring-amber-400 scale-105 z-30 shadow-2xl' : 'hover:scale-[1.03] z-10'
        } ${isDragging ? 'opacity-80 cursor-grabbing z-40' : ''}`}
      >
        {/* Top Mini Tag: Table Number & Capacity */}
        <div className="flex items-center justify-between w-full px-1">
          <span className="text-[11px] font-black text-white tracking-wider font-mono">
            {table.tableNumber}
          </span>
          {showCapacities && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-300 font-bold">
              <Users className="w-2.5 h-2.5 text-slate-400" />
              <span>{table.capacity}</span>
            </div>
          )}
        </div>

        {/* Center: Live Timer or Waiter */}
        <div className="text-center my-auto">
          {showTimers && table.status === 'occupied' ? (
            <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-amber-300">
              <Clock className="w-3 h-3" />
              <span>{elapsedMinutes} دقيقة</span>
            </div>
          ) : table.status === 'billing' ? (
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-rose-300 animate-bounce">
              <DollarSign className="w-3 h-3" />
              <span>طلب حساب</span>
            </div>
          ) : table.status === 'cleaning' ? (
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-cyan-300">
              <Sparkles className="w-3 h-3 animate-spin" />
              <span>تعقيم</span>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">
              {table.assignedWaiterName ? table.assignedWaiterName.split(' ')[0] : 'شاغرة'}
            </span>
          )}
        </div>

        {/* Bottom Status Pill */}
        <div className="w-full flex items-center justify-center">
          <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold border ${style.badge}`}>
            {table.status === 'available'
              ? isAr ? 'شاغرة' : 'Available'
              : table.status === 'occupied'
              ? isAr ? 'مشغولة' : 'Occupied'
              : table.status === 'billing'
              ? isAr ? 'حساب' : 'Bill'
              : table.status === 'cleaning'
              ? isAr ? 'تعقيم' : 'Clean'
              : isAr ? 'محجوزة' : 'Reserved'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {(receiptToast || waToast) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-1/2 translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-400/40 shadow-2xl text-amber-300 text-sm font-bold flex items-center gap-3 backdrop-blur-xl"
          >
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <span>{receiptToast || waToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER & KPI METRICS BAR */}
      <div className="p-3 rounded-2xl bg-card/80 border border-border backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Module Title & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Map className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-foreground">
                {isAr ? 'مخطط الصالة وإدارة الحجوزات الذكية' : 'Floor Plan & Table Reservations'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                2D RADAR
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? 'مصمم المخطط التفاعلي، رادار الإشغال اللحظي، حجوزات VIP ومحاكاة رسائل WhatsApp'
                : 'Interactive 2D floor designer, live occupancy radar & VIP WhatsApp bookings'}
            </p>
          </div>
        </div>

        {/* View Tabs & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-surface border border-border">
            <button
              onClick={() => {
                playSound('tap');
                setActiveTab('canvas');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'canvas'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>{isAr ? 'مخطط الصالة' : 'Floor Plan'}</span>
            </button>
            <button
              onClick={() => {
                playSound('tap');
                setActiveTab('reservations');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
                activeTab === 'reservations'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'سجل الحجوزات' : 'Reservations'}</span>
              <span className="w-2 h-2 rounded-full bg-purple-400 absolute top-1 end-1" />
            </button>
          </div>

          {/* Mode Switcher: Service vs Edit */}
          {activeTab === 'canvas' && (
            <button
              onClick={() => {
                playSound('tap');
                setMode((m) => (m === 'service' ? 'edit' : 'service'));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'edit'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-surface hover:bg-surface/80 text-foreground border-border'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{mode === 'edit' ? (isAr ? 'إنهاء التعديل' : 'Done Editing') : (isAr ? 'وضع المصمم' : 'Edit Layout')}</span>
            </button>
          )}

          {/* New Reservation Button */}
          <button
            onClick={() => {
              playSound('pop');
              setShowReservationModal(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'حجز طاولة جديد' : 'New Booking'}</span>
          </button>
        </div>
      </div>

      {/* STATS RADAR KPI BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {/* Occupancy Rate */}
        <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
            %
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">{isAr ? 'نسبة الإشغال' : 'Occupancy'}</div>
            <div className="text-base font-black text-foreground font-mono">{stats.occupancyRate}%</div>
          </div>
        </div>

        {/* Total Capacity & Guests */}
        <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">{isAr ? 'الضيوف بالصالة' : 'Current Guests'}</div>
            <div className="text-base font-black text-foreground font-mono">
              {stats.currentGuests} <span className="text-xs text-muted-foreground">/ {stats.totalCapacity}</span>
            </div>
          </div>
        </div>

        {/* Available */}
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-emerald-400">{isAr ? 'طاولات شاغرة' : 'Available'}</div>
            <div className="text-base font-black text-emerald-300 font-mono">{stats.availableTables}</div>
          </div>
        </div>

        {/* Occupied */}
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-amber-400">{isAr ? 'طاولات مشغولة' : 'Occupied'}</div>
            <div className="text-base font-black text-amber-300 font-mono">{stats.occupiedTables}</div>
          </div>
        </div>

        {/* Bill Requested */}
        <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-rose-400">{isAr ? 'طلب حساب' : 'Bill Req'}</div>
            <div className="text-base font-black text-rose-300 font-mono">{stats.billingTables}</div>
          </div>
        </div>

        {/* Reserved */}
        <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-purple-400">{isAr ? 'طاولات محجوزة' : 'Reserved'}</div>
            <div className="text-base font-black text-purple-300 font-mono">{stats.reservedTables}</div>
          </div>
        </div>

        {/* Active Dine-in Sales */}
        <div className="p-2.5 rounded-xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">{isAr ? 'مبيعات الصالة الجارية' : 'Live Dine-In'}</div>
            <div className="text-sm font-black text-amber-400 font-mono truncate">
              {stats.liveRevenue.toLocaleString()} <span className="text-[10px]">{isAr ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT VIEWPORT */}
      {activeTab === 'canvas' ? (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {/* Section Filter Tabs & Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Zone Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => {
                  playSound('tap');
                  setSelectedSectionId('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSectionId === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-surface hover:bg-surface/80 text-muted-foreground border border-border'
                }`}
              >
                <span>{isAr ? '🏛️ كافة الصالات' : '🏛️ All Zones'}</span>
                <span className="text-[10px] opacity-75">({tables.length})</span>
              </button>

              {sections.map((sec) => {
                const count = tables.filter((t) => t.sectionId === sec.id).length;
                const isSecActive = selectedSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      playSound('tap');
                      setSelectedSectionId(sec.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSecActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'bg-surface hover:bg-surface/80 text-foreground border border-border'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sec.color }}
                    />
                    <span>{isAr ? sec.nameAr : sec.nameEn}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Canvas Zoom & Visual Toggles */}
            <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-xl">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-foreground px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-border mx-1" />

              <button
                onClick={() => setShowTimers((t) => !t)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                  showTimers ? 'bg-amber-500/20 text-amber-300' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Toggle Timers"
              >
                {isAr ? 'العداد' : 'Timers'}
              </button>

              <button
                onClick={() => setShowGrid((g) => !g)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                  showGrid ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Toggle Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2D CANVAS CONTAINER */}
          <div className="flex-1 relative rounded-2xl bg-[#0b0e14] border border-border/80 overflow-hidden shadow-inner flex">
            {/* Blueprint Grid Background */}
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: '1000px',
                height: '650px',
                backgroundImage: showGrid
                  ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)'
                  : 'none',
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
              className="relative w-[1000px] h-[650px] min-w-[1000px] min-h-[650px] transition-transform duration-75 select-none"
            >
              {/* Floor Plan Perimeter Labels */}
              <div className="absolute top-2 start-4 text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                {selectedSectionId === 'all'
                  ? isAr ? 'الصالة الرئيسية — فرع السليمانية' : 'Main Dining & VIP Suites'
                  : sections.find((s) => s.id === selectedSectionId)?.nameAr}
              </div>

              {/* Render All Filtered Tables */}
              {filteredTables.map((table) => renderTableShape(table))}
            </div>

            {/* Edit Mode Palette (Sidebar on right/left when editing) */}
            <AnimatePresence>
              {mode === 'edit' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-3 end-3 bottom-3 w-64 bg-card/95 border border-border rounded-2xl p-3 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar z-40"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-foreground">
                          {isAr ? 'لوحة أدوات المصمم' : 'Designer Palette'}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold">DRAG & DROP</span>
                    </div>

                    <div className="text-[11px] font-bold text-muted-foreground mb-2">
                      {isAr ? 'إضافة عناصر جديدة للصالة:' : 'Add Table Elements:'}
                    </div>

                    <div className="space-y-2">
                      {/* Add Round Table */}
                      <button
                        onClick={() => {
                          playSound('pop');
                          const newTbl: FloorTable = {
                            id: `tbl-${Date.now()}`,
                            tableNumber: `T-${tables.length + 1}`,
                            sectionId: selectedSectionId === 'all' ? 'sec-main' : selectedSectionId,
                            capacity: 4,
                            shape: 'round',
                            status: 'available',
                            posX: 120,
                            posY: 120,
                            rotation: 0,
                            qrCodeToken: `qr_tbl_${Date.now()}`,
                            minSpend: 150,
                          };
                          setTables((prev) => [...prev, newTbl]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border hover:border-primary/40 text-start flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full border border-amber-400/60 bg-amber-400/10 flex items-center justify-center text-[10px] font-bold text-amber-400">
                            4
                          </div>
                          <span>{isAr ? 'طاولة دائرية (4 كراسي)' : 'Round Table (4 Seats)'}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-amber-400" />
                      </button>

                      {/* Add Square Table */}
                      <button
                        onClick={() => {
                          playSound('pop');
                          const newTbl: FloorTable = {
                            id: `tbl-${Date.now()}`,
                            tableNumber: `T-${tables.length + 1}`,
                            sectionId: selectedSectionId === 'all' ? 'sec-main' : selectedSectionId,
                            capacity: 2,
                            shape: 'square',
                            status: 'available',
                            posX: 140,
                            posY: 140,
                            rotation: 0,
                            qrCodeToken: `qr_tbl_${Date.now()}`,
                            minSpend: 100,
                          };
                          setTables((prev) => [...prev, newTbl]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border hover:border-primary/40 text-start flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md border border-emerald-400/60 bg-emerald-400/10 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                            2
                          </div>
                          <span>{isAr ? 'طاولة مربعة (شخصين)' : 'Square Table (2 Seats)'}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400" />
                      </button>

                      {/* Add Rectangle Table */}
                      <button
                        onClick={() => {
                          playSound('pop');
                          const newTbl: FloorTable = {
                            id: `tbl-${Date.now()}`,
                            tableNumber: `T-${tables.length + 1}`,
                            sectionId: selectedSectionId === 'all' ? 'sec-main' : selectedSectionId,
                            capacity: 6,
                            shape: 'rectangle',
                            status: 'available',
                            posX: 160,
                            posY: 160,
                            rotation: 0,
                            qrCodeToken: `qr_tbl_${Date.now()}`,
                            minSpend: 300,
                          };
                          setTables((prev) => [...prev, newTbl]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border hover:border-primary/40 text-start flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-5 rounded-md border border-blue-400/60 bg-blue-400/10 flex items-center justify-center text-[10px] font-bold text-blue-400">
                            6
                          </div>
                          <span>{isAr ? 'طاولة مستطيلة (6 كراسي)' : 'Rect Table (6 Seats)'}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-blue-400" />
                      </button>

                      {/* Add VIP Suite */}
                      <button
                        onClick={() => {
                          playSound('pop');
                          const newTbl: FloorTable = {
                            id: `tbl-${Date.now()}`,
                            tableNumber: `VIP-${tables.filter((t) => t.shape === 'vip_booth').length + 1}`,
                            sectionId: 'sec-vip',
                            capacity: 10,
                            shape: 'vip_booth',
                            status: 'available',
                            posX: 180,
                            posY: 180,
                            width: 190,
                            height: 150,
                            rotation: 0,
                            qrCodeToken: `qr_vip_${Date.now()}`,
                            minSpend: 1000,
                            vipTierRequired: true,
                            label: 'جناح عائلي فاخر',
                          };
                          setTables((prev) => [...prev, newTbl]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-start flex items-center justify-between text-xs font-bold text-purple-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Crown className="w-5 h-5 text-amber-400" />
                          <span>{isAr ? 'كابينة VIP عائلية' : 'VIP Private Booth'}</span>
                        </div>
                        <Plus className="w-4 h-4 text-purple-400" />
                      </button>

                      {/* Add Bar Stool */}
                      <button
                        onClick={() => {
                          playSound('pop');
                          const newTbl: FloorTable = {
                            id: `tbl-${Date.now()}`,
                            tableNumber: `BAR-${tables.filter((t) => t.shape === 'bar_stool').length + 1}`,
                            sectionId: 'sec-bar',
                            capacity: 1,
                            shape: 'bar_stool',
                            status: 'available',
                            posX: 200,
                            posY: 200,
                            rotation: 0,
                            qrCodeToken: `qr_bar_${Date.now()}`,
                            minSpend: 50,
                          };
                          setTables((prev) => [...prev, newTbl]);
                        }}
                        className="w-full p-2.5 rounded-xl bg-surface hover:bg-surface/80 border border-border hover:border-pink-500/40 text-start flex items-center justify-between text-xs font-bold text-foreground transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Coffee className="w-4 h-4 text-pink-400" />
                          <span>{isAr ? 'مقعد بار منفرد' : 'Bar Stool'}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-pink-400" />
                      </button>
                    </div>
                  </div>

                  {/* Reset Floor Layout */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <button
                      onClick={() => {
                        playSound('pop');
                        setTables(INITIAL_FLOOR_TABLES);
                        setReceiptToast(isAr ? 'تمت استعادة المخطط الافتراضي بنجاح' : 'Layout reset to default');
                        setTimeout(() => setReceiptToast(null), 3000);
                      }}
                      className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'استعادة التخطيط الأصلي' : 'Reset to Default'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* RESERVATIONS CALENDAR & VIP BOOKING LIST VIEW */
        <div className="flex-1 flex flex-col gap-3 min-h-0 bg-card/50 border border-border rounded-2xl p-4 overflow-hidden">
          {/* Reservations Header & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">
                  {isAr ? 'مفكرة وسجل حجوزات الصالة والـ VIP' : 'Table Reservations & VIP Directory'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? 'إدارة الضيوف، إرسال تأكيدات واتساب، وتسجيل الوصول الفوري'
                    : 'Manage guest arrivals, WhatsApp confirmations & check-ins'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => {
                playSound('pop');
                setShowReservationModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة حجز جديد' : 'New Reservation'}</span>
            </button>
          </div>

          {/* Reservations Table Grid */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
            {reservations.map((res) => {
              const matchedTable = tables.find((t) => t.id === res.tableId);
              const isConfirmed = res.status === 'confirmed';
              const isSeated = res.status === 'seated';

              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-surface/60 hover:bg-surface border border-border/80 hover:border-purple-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Guest Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-lg text-purple-300">
                      {res.guestName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{res.guestName}</span>
                        {res.vipTier && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            <span>{res.vipTier}</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSeated
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isConfirmed
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSeated
                            ? isAr ? 'تم الجلوس' : 'Seated'
                            : isConfirmed
                            ? isAr ? 'مؤكد' : 'Confirmed'
                            : isAr ? 'معلق' : 'Pending'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{res.phone}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{res.reservationTime} ({res.reservationDate})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{res.partySize} {isAr ? 'أفراد' : 'Guests'}</span>
                        </span>
                        {res.tableNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-amber-300 font-bold border border-white/10">
                            طاولة {res.tableNumber}
                          </span>
                        )}
                      </div>

                      {res.specialRequests && (
                        <div className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{res.specialRequests}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & WhatsApp Simulation */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {/* WhatsApp Action */}
                    <button
                      onClick={() => {
                        playSound('tap');
                        setActiveWhatsAppRes(res);
                        setShowWhatsAppModal(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isAr ? 'تأكيد WhatsApp' : 'WhatsApp'}</span>
                    </button>

                    {/* Check In Action */}
                    {!isSeated && (
                      <button
                        onClick={() => handleCheckInReservation(res)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAr ? 'تسجيل الوصول' : 'Check In'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: TABLE DETAILS & ACTIONS (Live Service Mode) */}
      <AnimatePresence>
        {selectedTable && mode === 'service' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-sm">
                    {selectedTable.tableNumber}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">
                      {selectedTable.label || `${isAr ? 'طاولة' : 'Table'} ${selectedTable.tableNumber}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{sections.find((s) => s.id === selectedTable.sectionId)?.nameAr}</span>
                      <span>•</span>
                      <span>{selectedTable.capacity} {isAr ? 'مقاعد' : 'Seats'}</span>
                      {selectedTable.assignedWaiterName && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-medium">{selectedTable.assignedWaiterName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-8 h-8 rounded-full bg-surface hover:bg-surface/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Status Switcher & Order Details */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* 1. Quick Status Selector */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    {isAr ? 'تغيير حالة الطاولة اللحظية:' : 'Quick Status Change:'}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'available', label: isAr ? 'شاغرة' : 'Available', color: 'hover:bg-emerald-500/20 text-emerald-400' },
                      { id: 'occupied', label: isAr ? 'مشغولة' : 'Occupied', color: 'hover:bg-amber-500/20 text-amber-400' },
                      { id: 'billing', label: isAr ? 'طلب حساب' : 'Bill Req', color: 'hover:bg-rose-500/20 text-rose-400' },
                      { id: 'cleaning', label: isAr ? 'تنظيف' : 'Cleaning', color: 'hover:bg-cyan-500/20 text-cyan-400' },
                      { id: 'reserved', label: isAr ? 'محجوزة' : 'Reserved', color: 'hover:bg-purple-500/20 text-purple-400' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleUpdateStatus(selectedTable.id, st.id as TableStatus)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          selectedTable.status === st.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : `bg-surface border-border/80 ${st.color}`
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Active Order Breakdown (if occupied / billing) */}
                {MOCK_TABLE_ORDERS[selectedTable.id] ? (
                  <div className="p-4 rounded-2xl bg-surface/60 border border-border space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-sm text-foreground">
                          {isAr ? 'الطلب الجاري على الطاولة' : 'Active Table Order'}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        {MOCK_TABLE_ORDERS[selectedTable.id].orderNumber}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {MOCK_TABLE_ORDERS[selectedTable.id].items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-foreground">
                          <span>
                            {item.qty}x {isAr ? item.nameAr : item.nameEn}
                          </span>
                          <span className="font-mono font-bold">
                            {(item.qty * item.price).toFixed(2)} {isAr ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-2 flex items-center justify-between font-black text-sm text-amber-400">
                      <span>{isAr ? 'الإجمالي الشامل (15% ضريبة):' : 'Total (Inc. VAT):'}</span>
                      <span className="font-mono text-base">
                        {MOCK_TABLE_ORDERS[selectedTable.id].total.toFixed(2)} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  </div>
                ) : selectedTable.status === 'occupied' ? (
                  <div className="p-4 rounded-2xl bg-surface/60 border border-border text-center text-xs text-muted-foreground">
                    {isAr ? 'لا توجد أصناف مسجلة حتى الآن' : 'No order items registered yet'}
                  </div>
                ) : null}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-border bg-surface/50 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Transfer Table */}
                  <button
                    onClick={() => {
                      playSound('tap');
                      setShowTransferModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-surface hover:bg-surface/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isAr ? 'نقل الطاولة' : 'Transfer'}</span>
                  </button>

                  {/* Print Bill */}
                  <button
                    onClick={() => handlePrintBill(selectedTable)}
                    className="px-3 py-2 rounded-xl bg-surface hover:bg-surface/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAr ? 'طباعة الحساب' : 'Print Bill'}</span>
                  </button>

                  {/* Call Waiter */}
                  <button
                    onClick={() => handleCallWaiter(selectedTable)}
                    className="px-3 py-2 rounded-xl bg-surface hover:bg-surface/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'نداء ويتر' : 'Call Waiter'}</span>
                  </button>
                </div>

                {/* Open in POS */}
                <button
                  onClick={() => handleOpenInPos(selectedTable)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Utensils className="w-4 h-4" />
                  <span>{isAr ? 'فتح الطلب في الكاشير' : 'Open in POS'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: TRANSFER TABLE MODAL */}
      <AnimatePresence>
        {showTransferModal && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black text-foreground">
                    {isAr ? 'نقل الطلب لطاولة أخرى' : 'Transfer Table Order'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="w-7 h-7 rounded-full bg-surface hover:bg-surface/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  {isAr
                    ? `اختر الطاولة الشاغرة المراد نقل طلب طاولة (${selectedTable.tableNumber}) إليها:`
                    : `Select an available table to transfer order from (${selectedTable.tableNumber}):`}
                </p>

                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {tables
                    .filter((t) => t.id !== selectedTable.id && t.status === 'available' && t.shape !== 'landmark')
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTargetTransferTableId(t.id)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          targetTransferTableId === t.id
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-surface hover:bg-surface/80 text-foreground border-border'
                        }`}
                      >
                        <div className="text-sm font-black">{t.tableNumber}</div>
                        <div className="text-[10px] opacity-75">{t.capacity} {isAr ? 'مقاعد' : 'Seats'}</div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-2 rounded-xl bg-surface hover:bg-surface/80 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={!targetTransferTableId}
                  onClick={handleExecuteTransfer}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isAr ? 'تأكيد النقل الفوري' : 'Confirm Transfer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: NEW RESERVATION FORM */}
      <AnimatePresence>
        {showReservationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black text-foreground">
                    {isAr ? 'تسجيل حجز طاولة جديد' : 'New Table Reservation'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="w-7 h-7 rounded-full bg-surface hover:bg-surface/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateReservation} className="space-y-3.5">
                {/* Guest Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'اسم الضيف الكريم:' : 'Guest Name:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? 'مثال: أ. سلطان القحطاني' : 'e.g. Sultan Al-Qahtani'}
                      value={newResGuestName}
                      onChange={(e) => setNewResGuestName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:border-purple-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'رقم الجوال (WhatsApp):' : 'Phone Number:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+9665..."
                      value={newResPhone}
                      onChange={(e) => setNewResPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:border-purple-400 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Date, Time & Party Size */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'التاريخ:' : 'Date:'}
                    </label>
                    <input
                      type="date"
                      value={newResDate}
                      onChange={(e) => setNewResDate(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'الوقت:' : 'Time:'}
                    </label>
                    <input
                      type="time"
                      value={newResTime}
                      onChange={(e) => setNewResTime(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'عدد الضيوف:' : 'Guests:'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={newResPartySize}
                      onChange={(e) => setNewResPartySize(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Table & Zone Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'القسم / الصالة المفضلة:' : 'Preferred Zone:'}
                    </label>
                    <select
                      value={newResSectionId}
                      onChange={(e) => setNewResSectionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs outline-none"
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {isAr ? s.nameAr : s.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'تعيين طاولة محددة (اختياري):' : 'Assign Table (Optional):'}
                    </label>
                    <select
                      value={newResTableId}
                      onChange={(e) => setNewResTableId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs outline-none"
                    >
                      <option value="">{isAr ? 'اختيار تلقائي من النظام' : 'Auto-Assign Best Table'}</option>
                      {tables
                        .filter((t) => t.shape !== 'landmark' && (newResSectionId ? t.sectionId === newResSectionId : true))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.tableNumber} ({t.capacity} {isAr ? 'كراسي' : 'seats'}) - {t.status}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Occasion & Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'نوع المناسبة:' : 'Occasion:'}
                    </label>
                    <select
                      value={newResOccasion}
                      onChange={(e) => setNewResOccasion(e.target.value as ReservationOccasion)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs outline-none"
                    >
                      <option value="casual">{isAr ? 'عشاء / غداء عادي' : 'Casual Dining'}</option>
                      <option value="birthday">{isAr ? 'احتفال عيد ميلاد 🎂' : 'Birthday Celebration'}</option>
                      <option value="anniversary">{isAr ? 'ذكرى زواج سعيدة 💐' : 'Wedding Anniversary'}</option>
                      <option value="business">{isAr ? 'عشاء عمل VIP 💼' : 'VIP Business Dinner'}</option>
                      <option value="family">{isAr ? 'اجتماع عائلي 👨‍👩‍👧‍👦' : 'Family Gathering'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'عربون الحجز (SAR):' : 'Deposit Amount:'}
                    </label>
                    <input
                      type="number"
                      value={newResDeposit}
                      onChange={(e) => setNewResDeposit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    {isAr ? 'ملاحظات وتجهيزات خاصة:' : 'Special Requests:'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={isAr ? 'مثال: باقة ورد، كتابة على الكيك، طاولة هادئة...' : 'e.g. Quiet table, cake setup...'}
                    value={newResNotes}
                    onChange={(e) => setNewResNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowReservationModal(false)}
                    className="px-3 py-2 rounded-xl bg-surface hover:bg-surface/80 text-xs font-bold text-muted-foreground cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isAr ? 'حفظ وإرسال WhatsApp' : 'Save & Confirm'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: WHATSAPP CONFIRMATION SIMULATOR */}
      <AnimatePresence>
        {showWhatsAppModal && activeWhatsAppRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#111b21] border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* WhatsApp App Bar */}
              <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                    💬
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{activeWhatsAppRes.guestName}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Online</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{activeWhatsAppRes.phone}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Canvas with WhatsApp Bubble */}
              <div className="p-4 bg-[#0b141a] space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-center">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[10px] text-slate-400 font-mono">
                    {isAr ? 'اليوم — رسالة مشفرة بنظام End-to-End' : 'Today — End-to-End Encrypted'}
                  </span>
                </div>

                {/* Sent Message Bubble */}
                <div className="p-3.5 rounded-2xl rounded-tr-none bg-[#005c4b] text-white text-xs whitespace-pre-wrap leading-relaxed shadow-md border border-emerald-400/20">
                  {generateWhatsAppMessage(activeWhatsAppRes)}
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 mt-2">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Action Footer */}
              <div className="p-3 bg-[#202c33] border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateWhatsAppMessage(activeWhatsAppRes));
                    playSound('tap');
                    setReceiptToast(isAr ? 'تم نسخ نص الرسالة للحافظة 📋' : 'Copied to clipboard 📋');
                    setTimeout(() => setReceiptToast(null), 2500);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? 'نسخ النص' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleSimulateWhatsAppSend(activeWhatsAppRes)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'محاكاة الإرسال الفوري' : 'Send via WhatsApp'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: TABLE CUSTOMIZER (Edit Mode Inspector) */}
      <AnimatePresence>
        {editingTable && mode === 'edit' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-foreground">
                    {isAr ? 'تعديل خصائص الطاولة' : 'Edit Table Properties'}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingTable(null)}
                  className="w-6 h-6 rounded-full bg-surface hover:bg-surface/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    {isAr ? 'رقم / كود الطاولة:' : 'Table Code / Number:'}
                  </label>
                  <input
                    type="text"
                    value={editingTable.tableNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingTable((t) => (t ? { ...t, tableNumber: val } : null));
                      setTables((prev) => prev.map((t) => (t.id === editingTable.id ? { ...t, tableNumber: val } : t)));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'السعة (عدد الكراسي):' : 'Capacity (Seats):'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={editingTable.capacity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingTable((t) => (t ? { ...t, capacity: val } : null));
                        setTables((prev) => prev.map((t) => (t.id === editingTable.id ? { ...t, capacity: val } : t)));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      {isAr ? 'الحد الأدنى للإنفاق (SAR):' : 'Min Spend (SAR):'}
                    </label>
                    <input
                      type="number"
                      value={editingTable.minSpend || 100}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingTable((t) => (t ? { ...t, minSpend: val } : null));
                        setTables((prev) => prev.map((t) => (t.id === editingTable.id ? { ...t, minSpend: val } : t)));
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                    {isAr ? 'القسم / الصالة:' : 'Section:'}
                  </label>
                  <select
                    value={editingTable.sectionId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingTable((t) => (t ? { ...t, sectionId: val } : null));
                      setTables((prev) => prev.map((t) => (t.id === editingTable.id ? { ...t, sectionId: val } : t)));
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground text-xs outline-none"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {isAr ? s.nameAr : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Actions: Rotate, Duplicate, Delete */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-1.5">
                <button
                  onClick={() => handleRotateTable(editingTable.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface/80 text-foreground text-xs font-bold border border-border flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تدوير' : 'Rotate'}</span>
                </button>

                <button
                  onClick={() => handleDuplicateTable(editingTable)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface/80 text-foreground text-xs font-bold border border-border flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تكرار' : 'Duplicate'}</span>
                </button>

                <button
                  onClick={() => handleDeleteTable(editingTable.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حذف' : 'Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
