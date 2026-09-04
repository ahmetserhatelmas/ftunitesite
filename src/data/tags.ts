import { CommentTag } from '../types';

export const AVAILABLE_TAGS: CommentTag[] = [
  { id: 'motm', label: 'Maçın Adamı', emoji: '👑', type: 'positive' },
  { id: 'gamechanger', label: 'Oyunu Değiştirdi', emoji: '⚡', type: 'positive' },
  { id: 'warrior', label: 'Savaşçı Ruh', emoji: '🦁', type: 'positive' },
  { id: 'clutch_save', label: 'Kritik Kurtarış', emoji: '🧤', type: 'positive' },
  { id: 'sniper', label: 'Usta Ayak', emoji: '🎯', type: 'positive' },
  { id: 'tactical_boss', label: 'Taktik Lideri', emoji: '🧠', type: 'positive' },
  { id: 'tireless', label: 'Basmadık Yer Bırakmadı', emoji: '🏃‍♂️', type: 'positive' },
  { id: 'solid_def', label: 'Kaya Gibi Defans', emoji: '🛡️', type: 'positive' },
  
  { id: 'standard', label: 'Görevini Yaptı', emoji: '⚖️', type: 'neutral' },
  { id: 'quiet', label: 'Sessiz Kaldı', emoji: '🤫', type: 'neutral' },
  
  { id: 'invisible', label: 'Sahada Yoktu', emoji: '👻', type: 'negative' },
  { id: 'pass_errors', label: 'Pas Hataları Çoktu', emoji: '⚠️', type: 'negative' },
  { id: 'slow', label: 'Temposu Düşüktü', emoji: '🐢', type: 'negative' },
  { id: 'clumsy_foul', label: 'Gereksiz Fauller', emoji: '🟨', type: 'negative' },
  { id: 'missed_chances', label: 'Net Fırsatları Harcadı', emoji: '🤦‍♂️', type: 'negative' },
];
