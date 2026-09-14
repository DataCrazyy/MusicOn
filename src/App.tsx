import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import { CompareProvider } from '@/components/CompareContext';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Entry from '@/pages/Entry';
import Wizard from '@/pages/Wizard';
import Explore from '@/pages/Explore';
import ArtistProfile from '@/pages/ArtistProfile';
import Chat from '@/pages/Chat';
import Escrow from '@/pages/Escrow';
import Dashboard from '@/pages/Dashboard';
import Progreso from '@/pages/Progreso';
import BookingForm from '@/pages/BookingForm';
import Confirmation from '@/pages/Confirmation';
import Payment from '@/pages/Payment';
import ClientProfile from '@/pages/ClientProfile';
import ProPlan from '@/pages/ProPlan';
import Referidos from '@/pages/Referidos';
import Comparar from '@/pages/Comparar';
import Contrato from '@/pages/Contrato';
import Documentos from '@/pages/Documentos';
import Apoyar from '@/pages/Apoyar';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CompareProvider>
        <Navbar />
        <div className="pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Entry />} />
            <Route path="/wizard" element={<Wizard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile/:id" element={<ArtistProfile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/escrow" element={<Escrow />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/progreso" element={<Progreso />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/client" element={<ClientProfile />} />
            <Route path="/pro" element={<ProPlan />} />
            <Route path="/referidos" element={<Referidos />} />
            <Route path="/comparar" element={<Comparar />} />
            <Route path="/contrato/:bookingId" element={<Contrato />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/artista/:id/apoyar" element={<Apoyar />} />
          </Routes>
        </div>
        <BottomNav />
        </CompareProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
