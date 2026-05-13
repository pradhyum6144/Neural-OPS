"use client";

export function FloatingOrbs() {
  return (
    <>
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <style>{`
        .auth-orb {
          position: fixed;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
          filter: blur(90px);
        }

        .auth-orb-1 {
          width: 520px;
          height: 520px;
          top: -120px;
          left: -120px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.04) 60%, transparent 80%);
          animation: orb-drift-1 14s ease-in-out infinite;
        }

        .auth-orb-2 {
          width: 440px;
          height: 440px;
          bottom: -80px;
          right: -80px;
          background: radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0.06) 55%, transparent 80%);
          animation: orb-drift-2 18s ease-in-out infinite;
        }

        .auth-orb-3 {
          width: 280px;
          height: 280px;
          top: 45%;
          left: 60%;
          background: radial-gradient(circle, rgba(34,211,165,0.09) 0%, transparent 70%);
          animation: orb-drift-3 22s ease-in-out infinite;
        }

        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          33%       { transform: translate(40px, 30px) scale(1.08); opacity: 1; }
          66%       { transform: translate(-20px, 50px) scale(0.94); opacity: 0.7; }
        }

        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          40%       { transform: translate(-50px, -30px) scale(1.1); opacity: 0.9; }
          70%       { transform: translate(25px, -50px) scale(0.92); opacity: 0.6; }
        }

        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50%       { transform: translate(-30px, 40px) scale(1.12); opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
