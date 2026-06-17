import { useState } from "react"
import '../App.css';

function Recuperacion({ setPagina }) {

  const [user, setUser] = useState("")
  const [mensaje, setMensaje] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user.trim()) {
      setMensaje("Ingresa tu usuario o correo")
      return
    }

    setMensaje("Recuperación no disponible por API en esta versión. Contacta al administrador para restablecer la clave.")
  }

  return (
    <div className='min-h-screen w-full bg-[url(/Fondo.jpg)] bg-cover bg-center flex items-center justify-center p-4'>
      
      <form 
        className='bg-[#b59981] p-10 md:p-14 rounded-[40px] shadow-2xl w-full max-w-md flex flex-col gap-4'
        onSubmit={handleSubmit}
      >

        <h2 className='text-white text-3xl font-serif text-center mb-6'>
          Recuperar Contraseña
        </h2>

        <input type="text" placeholder="Nombre de usuario" value={user} onChange={(e) => setUser(e.target.value)}
        className="bg-transparent border-b-2 border-black/80 py-2 px-1 text-black placeholder-black/40 outline-none focus:border-white transition-colors"/>

        <button type="submit" className="bg-[#e6d2c1] text-black font-bold py-3 px-6 rounded-full shadow-lg hover:bg-[#d9c5b4] active:scale-95 transition-all mt-4">
          Buscar
        </button>

        {mensaje && (
          <p className="text-center text-black font-medium mt-3">
            {mensaje}
          </p>
        )}

        <p className="text-center mt-6 text-black text-sm font-medium cursor-pointer hover:text-white transition-colors" onClick={() => setPagina("login")}>Volver al login</p>

      </form>
    </div>
  )
}

export default Recuperacion