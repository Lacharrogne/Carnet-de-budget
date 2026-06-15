import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// On accepte les différents noms de clé publique rencontrés selon les
// environnements (Vercel, local, CI) pour éviter un crash au démarrage.
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('La variable VITE_SUPABASE_URL est manquante.')
}

if (!supabasePublishableKey) {
  throw new Error(
    'La clé Supabase est manquante (VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_KEY ou VITE_SUPABASE_ANON_KEY).',
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
