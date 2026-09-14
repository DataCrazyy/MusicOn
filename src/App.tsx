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
import Login from '@/pages/Login';
import RequireAuth from '@/components/RequireAuth';
import BecomeArtist from '@/pages/BecomeArtist';
import RequestBooking from '@/pages/RequestBooking';
import MySolicitudes from '@/pages/MySolicitudes';

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
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard/progreso" element={<RequireAuth><Progreso /></RequireAuth>} />
            <Route path="/booking" element={<RequireAuth><BookingForm /></RequireAuth>} />
            <Route path="/payment" element={<RequireAuth><Payment /></RequireAuth>} />
            <Route path="/confirmation" element={<RequireAuth><Confirmation /></RequireAuth>} />
            <Route path="/client" element={<RequireAuth><ClientProfile /></RequireAuth>} />
            <Route path="/pro" element={<RequireAuth><ProPlan /></RequireAuth>} />
            <Route path="/referidos" element={<RequireAuth><Referidos /></RequireAuth>} />
            <Route path="/comparar" element={<Comparar />} />
            <Route path="/contrato/:bookingId" element={<RequireAuth><Contrato /></RequireAuth>} />
            <Route path="/documentos" element={<RequireAuth><Documentos /></RequireAuth>} />
            <Route path="/artista/:id/apoyar" element={<Apoyar />} />
            <Route path="/login" element={<Login />} />
            <Route path="/artista/nuevo" element={<RequireAuth><BecomeArtist /></RequireAuth>} />
            <Route path="/reservar/:artistId" element={<RequireAuth><RequestBooking /></RequireAuth>} />
            <Route path="/solicitudes" element={<RequireAuth><MySolicitudes /></RequireAuth>} />
          </Routes>
        </div>
        <BottomNav />
        </CompareProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
