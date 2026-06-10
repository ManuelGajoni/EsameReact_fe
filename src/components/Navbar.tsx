export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-green-600 font-extrabold text-2xl tracking-tight">Fields</span>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-200">
          Accedi / Registrati
        </button>
      </div>
    </nav>
  );
}
