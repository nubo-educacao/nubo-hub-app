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

    const payload = {
      chatInput: message,
      userId: user?.id || null, // Pass userId or null if not authenticated
      history
    };

    console.log('Sending to n8n:', JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n webhook error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to communicate with AI service' },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log('N8N Raw Response:', text);
    
    if (!text) {
      console.error('N8N returned empty response');
      return NextResponse.json(
        { error: 'Empty response from AI service' },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse N8N response:', e);
      return NextResponse.json(
        { error: 'Invalid JSON response from AI service' },
        { status: 502 }
      );
    }
    // Check for "response", "text", or "output" fields
    const aiResponse = data.response || data.text || data.output || 'Desculpe, não consegui processar sua mensagem.';

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
