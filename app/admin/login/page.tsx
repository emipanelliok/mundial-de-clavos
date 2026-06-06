import { adminLogin } from "./actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-rust font-display text-sm tracking-widest mb-1">
            MUNDIAL DE CLAVOS
          </p>
          <h1 className="font-display text-4xl text-white">ADMIN</h1>
        </div>

        <form action={adminLogin} className="space-y-4">
          <div>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              required
              autoFocus
              className="w-full bg-white/10 text-white placeholder:text-white/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-rust transition-colors"
            />
          </div>

          {error && (
            <p className="text-crimson text-xs text-center">
              Contraseña incorrecta.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-rust text-white font-display text-xl py-3 rounded-xl tracking-wide hover:bg-rust-dark transition-colors"
          >
            ENTRAR
          </button>
        </form>
      </div>
    </main>
  );
}
