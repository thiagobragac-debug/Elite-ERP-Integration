import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Activity, 
  DollarSign, 
  Shield, 
  Users, 
  Server, 
  HardDrive, 
  AlertCircle,
  Database,
  Search,
  Zap,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  X,
  CheckSquare,
  ShieldCheck,
  RefreshCw,
  Plus,
  CreditCard,
  FileText,
  Lock,
  Eye,
  ChevronDown,
  Edit2,
  LogIn,
  History,
  LayoutGrid,
  List as ListIcon,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { TenantForm } from '../../components/Forms/TenantForm';
import { PlanForm } from '../../components/Forms/PlanForm';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import { supabase } from '../../lib/supabase';
import { SaaSFilterModal } from './components/SaaSFilterModal';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';

type SaaSAdminTab = 'overview' | 'tenants' | 'plans' | 'billing' | 'health' | 'settings';
