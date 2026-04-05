import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import { CoworkingProvider, useCoworking } from './context/CoworkingContext';
import type { Reservation } from './context/CoworkingContext';
import { Layout, LogIn, Calendar, Coffee, User, Settings, LogOut, BarChart, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// --- Navbar ---
const Navbar = () => {
  const { currentUser, logout } = useCoworking();
  return (
    <nav style={{ backgroundColor: '#000', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #A38' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Layout size={24} color="#44C" />
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>COWORK<span style={{color: '#A38'}}>PRO</span></span>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {currentUser ? (
          <>
            <Link to="/dashboard" style={linkStyle}>Espaços</Link>
            <Link to="/services" style={linkStyle}>Serviços</Link>
            <Link to="/reservations" style={linkStyle}>Reservas</Link>
            {currentUser.role === 'ADMIN' && <Link to="/admin" style={{...linkStyle, color: '#A38'}}>Admin</Link>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px' }}>
              <span style={{fontSize: '0.9rem', opacity: 0.8}}>{currentUser.name}</span>
              <button onClick={logout} style={logoutBtnStyle}><LogOut size={18} /></button>
            </div>
          </>
        ) : (
          <Link to="/login" style={loginBtnStyle}>Entrar</Link>
        )}
      </div>
    </nav>
  );
};

// --- Pages ---

const SchedulePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { environments, reservations, makeReservation } = useCoworking();
  const env = environments.find(e => e.id === id);

  if (!env) return <div style={{padding: '2rem'}}>Ambiente não encontrado</div>;

  const days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const hours = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 às 22:00

  const getSlotStatus = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const now = new Date();
    if (slotStart < now) return 'PAST';

    const isReserved = reservations.some(r => 
      r.environmentId === id && 
      r.status !== 'CANCELLED' &&
      ((slotStart >= new Date(r.startTime) && slotStart < new Date(r.endTime)) ||
       (slotEnd > new Date(r.startTime) && slotEnd <= new Date(r.endTime)))
    );

    return isReserved ? 'RESERVED' : 'AVAILABLE';
  };

  const handleQuickReserve = (date: Date, hour: number) => {
    const start = new Date(date);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(date);
    end.setHours(hour + 1, 0, 0, 0);

    const error = makeReservation(id!, start, end);
    if (error) alert(error);
    else alert(`Reserva para ${start.toLocaleDateString()} às ${hour}:00 confirmada!`);
  };

  return (
    <div style={{padding: '2rem'}}>
      <button onClick={() => navigate(-1)} style={{...btnPrimaryStyle, width: 'auto', marginBottom: '1.5rem', backgroundColor: '#666'}}>← Voltar</button>
      
      <div style={{display: 'flex', gap: '2rem', marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee'}}>
        <img src={env.image} alt={env.name} style={{width: '200px', height: '140px', objectFit: 'cover', borderRadius: '4px'}} />
        <div>
          <h2 style={{margin: '0 0 0.5rem 0'}}>{env.name}</h2>
          <p style={{color: '#666', fontSize: '0.9rem'}}>{env.description}</p>
          <div style={{display: 'flex', gap: '20px', marginTop: '1rem'}}>
            <span><strong>Capacidade:</strong> {env.capacity} pessoas</span>
            <span><strong>Valor:</strong> R$ {env.pricePerHour}/h</span>
          </div>
        </div>
      </div>

      <h3 style={{marginBottom: '1rem'}}>Grade de Disponibilidade</h3>
      <div style={{overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', padding: '1rem'}}>
        <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '4px'}}>
          <thead>
            <tr>
              <th style={{padding: '8px', minWidth: '80px'}}>Horário</th>
              {days.map(d => (
                <th key={d.toISOString()} style={{padding: '8px', minWidth: '100px', textAlign: 'center', fontSize: '0.85rem'}}>
                  {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map(h => (
              <tr key={h}>
                <td style={{textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem'}}>{h}:00</td>
                {days.map(d => {
                  const status = getSlotStatus(d, h);
                  return (
                    <td key={d.toISOString() + h} style={{padding: '0'}}>
                      <button
                        disabled={status !== 'AVAILABLE'}
                        onClick={() => handleQuickReserve(d, h)}
                        style={{
                          width: '100%',
                          padding: '10px 4px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: status === 'AVAILABLE' ? 'pointer' : 'default',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          backgroundColor: status === 'AVAILABLE' ? '#e6fffa' : status === 'RESERVED' ? '#fff5f5' : '#f7fafc',
                          color: status === 'AVAILABLE' ? '#2c7a7b' : status === 'RESERVED' ? '#c53030' : '#a0aec0'
                        }}
                      >
                        {status === 'AVAILABLE' ? 'Livre' : status === 'RESERVED' ? 'Ocupado' : '-'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = () => {
  const { login, currentUser } = useCoworking();
  const [email, setEmail] = React.useState('guilherme@gmail.com');
  if (currentUser) return <Navigate to="/dashboard" />;
  return (
    <div style={pageCenterStyle}>
      <div style={cardStyle}>
        <h2 style={{color: '#000', marginBottom: '1.5rem'}}>Acesso</h2>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="E-mail" />
        <button onClick={() => login(email)} style={btnPrimaryStyle}>Entrar</button>
        <div style={{marginTop: '1rem', fontSize: '0.8rem', color: '#666'}}>
          <p>Usuário: guilherme@gmail.com</p>
          <p>Admin: adm@cowork.com</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { environments, reservations } = useCoworking();

  const isOccupiedNow = (envId: string) => {
    const now = new Date();
    return reservations.some(r => 
      r.environmentId === envId && 
      r.status !== 'CANCELLED' && 
      now >= new Date(r.startTime) && 
      now <= new Date(r.endTime)
    );
  };

  return (
    <div style={{padding: '2rem'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Escolha seu Espaço</h2>
      <div style={gridStyle}>
        {environments.map(env => {
          const occupied = isOccupiedNow(env.id);
          return (
            <div key={env.id} style={{...envCardStyle, opacity: env.status === 'MAINTENANCE' ? 0.7 : 1}}>
              <div style={{position: 'relative'}}>
                <img src={env.image} alt={env.name} style={imgStyle} />
                {occupied && (
                  <div style={{position: 'absolute', top: '10px', right: '10px', backgroundColor: '#e53e3e', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                    OCUPADO AGORA
                  </div>
                )}
              </div>
              <div style={{padding: '1rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <h3 style={{margin: '0 0 0.5rem 0'}}>{env.name}</h3>
                  <span style={{fontSize: '0.7rem', color: '#666'}}>Cap: {env.capacity}</span>
                </div>
                <p style={{fontSize: '0.85rem', color: '#666', height: '40px'}}>{env.description}</p>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                  <span style={{fontWeight: 'bold', color: '#44C'}}>R$ {env.pricePerHour}/h</span>
                  <Link 
                    to={`/reserve/${env.id}`}
                    style={{
                      ...btnPrimaryStyle, 
                      width: 'auto', 
                      padding: '6px 12px', 
                      textDecoration: 'none',
                      textAlign: 'center',
                      backgroundColor: env.status === 'MAINTENANCE' ? '#ccc' : '#44C',
                      pointerEvents: env.status === 'MAINTENANCE' ? 'none' : 'auto'
                    }}
                  >
                    {env.status === 'MAINTENANCE' ? 'Manutenção' : 'Ver Agenda'}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Services = () => {
  const { services } = useCoworking();
  return (
    <div style={{padding: '2rem'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Serviços Adicionais</h2>
      <div style={gridStyle}>
        {services.map(s => (
          <div key={s.id} style={envCardStyle}>
            <img src={s.image} alt={s.name} style={imgStyle} />
            <div style={{padding: '1rem'}}>
              <h3 style={{margin: '0 0 0.5rem 0'}}>{s.name}</h3>
              <p style={{fontSize: '0.85rem', color: '#666'}}>{s.description}</p>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                <span style={{fontWeight: 'bold', color: '#A38'}}>R$ {s.price}</span>
                <button style={{...btnPrimaryStyle, width: 'auto', padding: '6px 12px', backgroundColor: '#000'}}>Contratar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Reservations = () => {
  const { reservations, environments, checkIn, currentUser } = useCoworking();
  const userReservations = reservations.filter(r => r.userId === currentUser?.id);

  return (
    <div style={{padding: '2rem'}}>
      <h2 style={{marginBottom: '1.5rem'}}>Minhas Reservas</h2>
      {userReservations.length === 0 ? <p>Nenhuma reserva encontrada.</p> : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {userReservations.map(r => {
            const env = environments.find(e => e.id === r.environmentId);
            return (
              <div key={r.id} style={{...envCardStyle, display: 'flex', padding: '1rem', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <Calendar size={32} color="#44C" />
                  <div>
                    <h4 style={{margin: 0}}>{env?.name}</h4>
                    <p style={{margin: 0, fontSize: '0.8rem', color: '#666'}}>
                      {r.startTime.toLocaleString()} - {r.endTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                  <span style={{fontWeight: 'bold'}}>R$ {r.totalPrice.toFixed(2)}</span>
                  {r.status === 'CONFIRMED' ? (
                    <button onClick={() => checkIn(r.id)} style={{...btnPrimaryStyle, width: 'auto', backgroundColor: '#28a745'}}>Check-in Digital</button>
                  ) : (
                    <span style={{color: '#28a745', display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle size={18}/> Realizado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const { reservations, environments, users } = useCoworking();
  const totalRevenue = reservations.reduce((acc, r) => acc + r.totalPrice, 0);
  const occupation = (reservations.length / (environments.length * 10)) * 100; // Simulação

  return (
    <div style={{padding: '2rem'}}>
      <h2 style={{marginBottom: '2rem'}}>Relatórios Gerenciais (ADM)</h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '3rem'}}>
        <div style={statCard}>
          <BarChart color="#44C" />
          <h3>Receita Total</h3>
          <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>R$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div style={statCard}>
          <Clock color="#A38" />
          <h3>Taxa de Ocupação</h3>
          <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{occupation.toFixed(1)}%</p>
        </div>
        <div style={statCard}>
          <User color="#000" />
          <h3>Clientes Ativos</h3>
          <p style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{users.length}</p>
        </div>
      </div>
      
      <h3>Últimas Atividades</h3>
      <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
        <thead>
          <tr style={{textAlign: 'left', borderBottom: '2px solid #eee'}}>
            <th style={{padding: '10px'}}>ID</th>
            <th>Ambiente</th>
            <th>Usuário</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.id} style={{borderBottom: '1px solid #eee'}}>
              <td style={{padding: '10px'}}>{r.id}</td>
              <td>{environments.find(e => e.id === r.environmentId)?.name}</td>
              <td>{users.find(u => u.id === r.userId)?.name}</td>
              <td>R$ {r.totalPrice}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Styles ---
const linkStyle = { color: '#fff', textDecoration: 'none', fontSize: '0.9rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold' as const, color: '#444' };
const logoutBtnStyle = { background: 'none', border: 'none', color: '#A38', cursor: 'pointer' };
const loginBtnStyle = { backgroundColor: '#44C', color: '#fff', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none' };
const pageCenterStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' };
const cardStyle: React.CSSProperties = { width: '300px', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' as const };
const btnPrimaryStyle = { width: '100%', padding: '10px', backgroundColor: '#44C', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' };
const envCardStyle = { backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' };
const imgStyle = { width: '100%', height: '160px', objectFit: 'cover' as const };
const statCard = { padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', textAlign: 'center' as const };

function App() {
  return (
    <CoworkingProvider>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reserve/:id" element={<SchedulePage />} />
            <Route path="/services" element={<Services />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </CoworkingProvider>
  );
}

export default App;
