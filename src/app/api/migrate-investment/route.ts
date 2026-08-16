import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = createAdminClient();
  
  try {
    // 1. Mở rộng bảng projects - thêm cột đầu tư
    await supabase.rpc("exec_sql", {
      query: `ALTER TABLE public.projects 
              ADD COLUMN IF NOT EXISTS investment_target integer DEFAULT 0,
              ADD COLUMN IF NOT EXISTS break_even integer DEFAULT 0,
              ADD COLUMN IF NOT EXISTS revenue_share text,
              ADD COLUMN IF NOT EXISTS roi_estimate jsonb;`
    });

    // 2. Tạo bảng investments
    await supabase.rpc("exec_sql", {
      query: `CREATE TABLE IF NOT EXISTS public.investments (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
              user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
              amount integer NOT NULL DEFAULT 0,
              investment_date date DEFAULT CURRENT_DATE,
              payment_status varchar(50) DEFAULT 'pending',
              investor_name varchar(255),
              investor_email varchar(255),
              investor_phone text,
              notes text,
              created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
              updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
            );`
    });

    // 3. Tạo bảng project_progress
    await supabase.rpc("exec_sql", {
      query: `CREATE TABLE IF NOT EXISTS public.project_progress (
              id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
              project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
              progress_date date NOT NULL,
              progress_percent integer NOT NULL,
              milestones_completed text[],
              description text,
              created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
            );`
    });

    // 4. Update sample data
    await supabase.rpc("exec_sql", {
      query: `UPDATE public.projects 
              SET investment_target = 500000000, 
                  break_even = 200000000,
                  roi_estimate = '[{"year":1,"rate":8},{"year":2,"rate":12},{"year":3,"rate":18}]'::jsonb,
                  revenue_share = '60-40'
              WHERE id = '44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7';`
    });

    // 5. Thêm progress sample
    await supabase.rpc("exec_sql", {
      query: `INSERT INTO public.project_progress (project_id, progress_date, progress_percent, description)
              VALUES 
                ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', '2026-06-01', 15, 'Hoàn thành nghiên cứu khả thi'),
                ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', '2026-07-01', 35, 'Hoàn thành hồ sơ pháp lý'),
                ('44b1faf9-5d03-4aee-8b5c-42bdfb41d8c7', '2026-07-19', 45, 'Bắt đầu thi công giai đoạn 1')
              ON CONFLICT DO NOTHING;`
    });

    return NextResponse.json({ success: true, message: "Migration completed!" });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
