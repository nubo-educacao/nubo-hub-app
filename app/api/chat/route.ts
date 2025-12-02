import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    const authHeader = request.headers.get('Authorization');

    // Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Create client with user's token if available to respect RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : undefined,
      },
    });

    // 1. Get User ID (optional, but good for verification)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (user) {
      // 2. Save User Message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        sender: 'user',
        content: message,
      });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL is not defined');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      console.error(`n8n webhook error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to communicate with AI service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.response || 'Desculpe, não consegui processar sua mensagem.';

    if (user) {
      // 3. Save AI Message
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        sender: 'cloudinha',
        content: aiResponse,
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
