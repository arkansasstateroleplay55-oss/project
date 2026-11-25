import {
  CarFront, ChevronDown, CircleUserRound, FileCode2, Flag, Globe2,
  Leaf, LogIn, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Paintbrush, Search,
  Shield, ShieldCheck, Upload, UsersRound, Wrench, X, Bomb, Zap,
  Bell, Bookmark, Heart, ShoppingCart, UserCog, Settings, Sun, Moon, Eye, EyeOff,
  Tag, FileText, Video, Image, Download, Trash2, Send, AlertTriangle, Check, XCircle,
  CheckCircle2, Crown, UserPlus, MessageSquare, ExternalLink, Home, Package, Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const Icons: Record<string, LucideIcon> = {
  CarFront, ChevronDown, CircleUserRound, FileCode2, Flag, Globe2,
  Leaf, LogIn, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Paintbrush, Search,
  Shield, ShieldCheck, Upload, UsersRound, Wrench, X, Bomb, Zap,
  Bell, Bookmark, Heart, ShoppingCart, UserCog, Settings, Sun, Moon, Eye, EyeOff,
  Tag, FileText, Video, Image, Download, Trash2, Send, AlertTriangle, Check, XCircle,
  CheckCircle2, Crown, UserPlus, MessageSquare, ExternalLink, Home, Package, Filter,
};

export function getIcon(name: string): LucideIcon {
  return Icons[name] ?? Package;
}
