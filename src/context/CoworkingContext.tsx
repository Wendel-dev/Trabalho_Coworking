import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  pendingPayments: boolean;
}

export interface Environment {
  id: string;
  name: string;
  type: 'MEETING_ROOM' | 'WORKSTATION' | 'PARKING';
  capacity: number;
  pricePerHour: number;
  image: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
  description: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface Reservation {
  id: string;
  userId: string;
  environmentId: string;
  startTime: Date;
  endTime: Date;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';
  totalPrice: number;
}

interface CoworkingContextType {
  currentUser: User | null;
  users: User[];
  environments: Environment[];
  services: Service[];
  reservations: Reservation[];
  login: (email: string) => boolean;
  logout: () => void;
  makeReservation: (envId: string, start: Date, end: Date) => string | null;
  checkIn: (resId: string) => void;
}

const CoworkingContext = createContext<CoworkingContextType | undefined>(undefined);

export const CoworkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [users] = useState<User[]>([
    { id: '1', name: 'Administrador', email: 'adm@cowork.com', role: 'ADMIN', pendingPayments: false },
    { id: '2', name: 'Guilherme', email: 'guilherme@gmail.com', role: 'USER', pendingPayments: false },
  ]);

  const [environments] = useState<Environment[]>([
    { id: 'env1', name: 'Sala Alpha (Reunião)', type: 'MEETING_ROOM', capacity: 8, pricePerHour: 50, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800', status: 'AVAILABLE', description: 'Sala equipada para videoconferências e apresentações.' },
    { id: 'env2', name: 'Sala Beta (Privativa)', type: 'MEETING_ROOM', capacity: 4, pricePerHour: 35, image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800', status: 'AVAILABLE', description: 'Ideal para reuniões rápidas e privadas.' },
    { id: 'env3', name: 'Estação Flex 01', type: 'WORKSTATION', capacity: 1, pricePerHour: 15, image: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800', status: 'AVAILABLE', description: 'Cadeira ergonômica e conexão ultra rápida.' },
    { id: 'env4', name: 'Estação Flex 02', type: 'WORKSTATION', capacity: 1, pricePerHour: 15, image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800', status: 'AVAILABLE', description: 'Espaço compartilhado focado em produtividade.' },
    { id: 'env5', name: 'Vaga Coberta 10', type: 'PARKING', capacity: 1, pricePerHour: 10, image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=800', status: 'MAINTENANCE', description: 'Estacionamento seguro com manobrista.' },
  ]);

  const [services] = useState<Service[]>([
    { id: 's1', name: 'Café Ilimitado', price: 20, description: 'Grãos selecionados e bebidas quentes.', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800' },
    { id: 's2', name: 'Endereço Fiscal', price: 150, description: 'Utilize nosso endereço para seu CNPJ.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800' },
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([]);

  const login = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const makeReservation = (envId: string, start: Date, end: Date) => {
    if (!currentUser) return 'Faça login primeiro';
    if (currentUser.pendingPayments) return 'Você possui pendências financeiras';
    
    // RN-01: Antecedência mínima 30 min
    const thirtyMinFromNow = new Date(Date.now() + 30 * 60 * 1000);
    if (start < thirtyMinFromNow) return 'Reserva deve ter 30 min de antecedência';

    // RN-11: Fracionamento mínimo 1h
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Reserva mínima de 1 hora';

    // RNF-09: Verificação de conflito simples
    const conflict = reservations.some(r => 
      r.environmentId === envId && 
      r.status !== 'CANCELLED' &&
      ((start >= r.startTime && start < r.endTime) || (end > r.startTime && end <= r.endTime))
    );
    if (conflict) return 'Este horário já está reservado';

    const env = environments.find(e => e.id === envId);
    if (env?.status === 'MAINTENANCE') return 'Ambiente em manutenção';

    const newRes: Reservation = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      environmentId: envId,
      startTime: start,
      endTime: end,
      status: 'CONFIRMED',
      totalPrice: (env?.pricePerHour || 0) * diffHours
    };

    setReservations([...reservations, newRes]);
    return null;
  };

  const checkIn = (resId: string) => {
    setReservations(prev => prev.map(r => 
      r.id === resId ? { ...r, status: 'CHECKED_IN' as const } : r
    ));
  };

  return (
    <CoworkingContext.Provider value={{ 
      currentUser, users, environments, services, reservations, 
      login, logout, makeReservation, checkIn 
    }}>
      {children}
    </CoworkingContext.Provider>
  );
};

export const useCoworking = () => {
  const context = useContext(CoworkingContext);
  if (!context) throw new Error('useCoworking must be used within CoworkingProvider');
  return context;
};
