import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Entry from '@/pages/Entry';
import Explore from '@/pages/Explore';
import ArtistProfile from '@/pages/ArtistProfile';
import Login from '@/pages/Login';
import RequireAuth from '@/components/RequireAuth';
import BecomeArtist from '@/pages/BecomeArtist';
import RequestBooking from '@/pages/RequestBooking';
import MySolicitudes from '@/pages/MySolicitudes';
import Account from '@/pages/Account';
import Onboarding from '@/pages/Onboarding';
import Chat from '@/pages/Chat';
import ContractPage from '@/pages/ContractPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="overflow-x-hidden pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/profile/:id" element={<ArtistProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/artista/nuevo" element={<RequireAuth><BecomeArtist /></RequireAuth>} />
          <Route path="/reservar/:artistId" element={<RequireAuth><RequestBooking /></RequireAuth>} />
          <Route path="/contrato/:bookingId" element={<RequireAuth><ContractPage /></RequireAuth>} />
          <Route path="/solicitudes" element={<MySolicitudes />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/cuenta" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="/bienvenida" element={<RequireAuth><Onboarding /></RequireAuth>} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;
