export default function Navbar({ setPage, handleLogout }) {
  return (
    <nav className="main-nav">
      {["home","apply","login","admin-login","repayment","dashboard"].map(p => (
        <a key={p} href="#" className="nav-link" onClick={e => { e.preventDefault(); setPage(p); }}>
          {p.replace("-", " ").toUpperCase()}
        </a>
      ))}
      <button className="nav-button" onClick={handleLogout}>Logout</button>
    </nav>
  );
}
