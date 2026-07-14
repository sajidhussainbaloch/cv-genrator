const sbpToken = process.env.SUPABASE_SBP_TOKEN || "";
const projectRef = "ethzwbsgifpbqibtgtva";

async function runSQL(sql, description) {
  console.log(`\n${description}...`);
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sbpToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  if (response.ok) {
    const text = await response.text();
    console.log(`  ✓ ${text ? text.slice(0, 100) : "success"}`);
    return true;
  } else {
    const err = await response.text();
    console.log(`  ✗ ${err}`);
    return false;
  }
}

async function main() {
  console.log("Setting up Supabase project:", projectRef);

  // Step 1: Create profiles table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY,
      full_name TEXT,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, "Create profiles table");

  // Step 2: Enable RLS
  await runSQL(`
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  `, "Enable RLS on profiles");

  // Step 3: Create policies
  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
      END IF;
    END $$;
  `, "Create SELECT policy");

  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
      END IF;
    END $$;
  `, "Create UPDATE policy");

  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can insert own profile" ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
      END IF;
    END $$;
  `, "Create INSERT policy");

  // Step 4: Create auto-profile trigger
  await runSQL(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, email)
      VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
      RETURN new;
    END;
    $$;
  `, "Create handle_new_user function");

  await runSQL(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `, "Create auth trigger");

  // Step 5: Create cv_history table
  await runSQL(`
    CREATE TABLE IF NOT EXISTS public.cv_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      filename TEXT DEFAULT '',
      cv_text TEXT NOT NULL,
      analysis JSONB,
      optimized_text TEXT DEFAULT '',
      job_role TEXT DEFAULT '',
      job_skills TEXT DEFAULT '',
      job_location TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `, "Create cv_history table");

  await runSQL(`
    ALTER TABLE public.cv_history ENABLE ROW LEVEL SECURITY;
  `, "Enable RLS on cv_history");

  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own history' AND tablename = 'cv_history') THEN
        CREATE POLICY "Users can view own history" ON public.cv_history
          FOR SELECT USING (auth.uid() = user_id);
      END IF;
    END $$;
  `, "Create SELECT policy on cv_history");

  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own history' AND tablename = 'cv_history') THEN
        CREATE POLICY "Users can insert own history" ON public.cv_history
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      END IF;
    END $$;
  `, "Create INSERT policy on cv_history");

  await runSQL(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own history' AND tablename = 'cv_history') THEN
        CREATE POLICY "Users can delete own history" ON public.cv_history
          FOR DELETE USING (auth.uid() = user_id);
      END IF;
    END $$;
  `, "Create DELETE policy on cv_history");

  await runSQL(`
    CREATE INDEX IF NOT EXISTS idx_cv_history_user_id ON public.cv_history(user_id);
  `, "Create index on user_id");

  // Verify
  const check = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sbpToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public'" })
  });
  
  if (check.ok) {
    const tables = await check.json();
    console.log("\nPublic tables:", tables.map(t => `${t.table_name} (${t.table_type})`).join(", "));
  }

  console.log("\n✓ Database setup complete!");
}

main().catch(console.error);
