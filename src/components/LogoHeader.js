const LogoHeader = () => (
    <>
      <img 
        src="/sevas.png" 
        alt="Sevas Logo" 
        className="logo mx-auto h-16 mb-4" 
        onError={(e) => (e.target.src = 'https://via.placeholder.com/150x50?text=Sevas+Logo')} 
      />
      <h1 className="heading text-2xl font-bold text-center mb-6">Sevas Online Laundry Booking System</h1>
    </>
  );
  
  export default LogoHeader;
  