import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Removed edge runtime to fix local dev connection termination issues
// export const runtime = 'edge'; 

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const authHeader = request.headers.get('Authorization');
    
    // We can still do lightweight auth checks here or getting User ID if needed for logging
    // But for streaming performance, we forward quickly.
    
    // Initialize Supabase Client (Optional here if agent handles persistence)
    // Kept for user ID extraction
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    });
    console.log('[NextAPI] Supabase client initialized. Checking user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[NextAPI] Supabase auth check done. User ID: ${user?.id || 'null'}`);
    
    const webhookUrl = process.env.AGENT_URL;

    if (!webhookUrl) {
      console.error('[NextAPI] CRITICAL: AGENT_URL is not defined in environment variables');
      return NextResponse.json({ error: 'Configuration error: AGENT_URL missing' }, { status: 500 });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const payload = {
      chatInput: message,
      userId: user?.id || null, 
    };

    console.log(`[NextAPI] Attempting to fetch from: ${webhookUrl}`);
    console.log(`[NextAPI] User ID from Supabase: ${user?.id || 'NOT_LOGGED_IN'}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[NextAPI] Agent responded with error! Status: ${response.status}`);
        console.error(`[NextAPI] Agent error body: ${errorText}`);
        return NextResponse.json({ 
            error: 'Agent Error', 
            status: response.status,
            details: errorText.substring(0, 100) 
        }, { status: response.status });
    }

    console.log('[NextAPI] Connection successful, starting stream...');

    // Proxy the stream
    // Using simple ReadableStream passthrough
    const stream = response.body;

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked'
        },
        status: 200
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
