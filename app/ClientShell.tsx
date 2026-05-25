"use client";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={{ padding: '12px 24px', background: '#111', color: '#fff' }}>
        <h1 style={{ margin: 0 }}>MLB Team Draft League</h1>
        <nav style={{ marginTop: 8 }}>
          <a href="/" style={{ color: '#fff', marginRight: 16 }}>Home</a>
          <a href="/draft" style={{ color: '#fff', marginRight: 16 }}>Draft</a>
          <a href="/standings" style={{ color: '#fff', marginRight: 16 }}>Standings</a>
          <a href="/owners" style={{ color: '#fff', marginRight: 16 }}>Owners</a>
          <a href="/countries" style={{ color: '#fff' }}>Countries</a>
        </nav>
      </header>

      <main style={{ padding: 24 }}>
        {children}
      </main>
    </>
  );
}
