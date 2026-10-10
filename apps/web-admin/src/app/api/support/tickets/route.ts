import { NextResponse } from 'next/server';
import {
  readTickets,
  saveTickets,
  processAiResponse,
  SupportTicket,
  TicketMessage,
} from '@/lib/support-backend';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userPhone = searchParams.get('userPhone');

    const all = readTickets();
    if (userId || userPhone) {
      const filtered = all.filter(
        (t) => (userId && t.userId === userId) || (userPhone && t.userPhone === userPhone)
      );
      return NextResponse.json({ ok: true, tickets: filtered });
    }

    return NextResponse.json({ ok: true, tickets: all });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const all = readTickets();
    const now = new Date().toISOString();

    const ticketId = body.id || ('t-' + Date.now().toString().slice(-6));
    const userMsgId = 'msg-' + Date.now();
    const aiMsgId = 'msg-ai-' + (Date.now() + 10);

    // AI Intent & Verification Processing
    const aiResult = processAiResponse(
      {
        userIgn: body.userIgn,
        subject: body.subject,
        category: body.category,
      },
      body.message || '',
      body.imageUrl
    );

    const userMessage: TicketMessage = {
      id: userMsgId,
      senderRole: 'USER',
      senderName: body.userIgn || body.userPhone || 'Player',
      message: (body.message || '').trim(),
      imageUrl: body.imageUrl,
      timestamp: now,
    };

    const aiMessage: TicketMessage = {
      id: aiMsgId,
      senderRole: 'AI_BOT',
      senderName: 'AI Support',
      isAi: true,
      message: aiResult.response,
      timestamp: new Date(Date.now() + 500).toISOString(),
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: body.userId || 'u-guest',
      userPhone: body.userPhone || '01700000000',
      userIgn: body.userIgn || 'GUEST_PLAYER',
      subject: (body.subject || 'General Inquiry').trim(),
      category: body.category || 'OTHER',
      status: aiResult.paymentVerified ? 'RESOLVED' : 'OPEN',
      priority: aiResult.paymentVerified ? 'HIGH' : body.priority || 'MEDIUM',
      matchId: body.matchId,
      createdAt: now,
      updatedAt: now,
      paymentVerified: aiResult.paymentVerified,
      verifiedTrxId: aiResult.verifiedTrxId,
      verifiedAmount: aiResult.verifiedAmount,
      messages: [userMessage, aiMessage],
    };

    const updated = [newTicket, ...all];
    saveTickets(updated);

    return NextResponse.json({ ok: true, ticket: newTicket });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, status, reply } = body;

    const all = readTickets();
    const index = all.findIndex((t) => t.id === ticketId);
    if (index === -1) {
      return NextResponse.json({ ok: false, error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = all[index];
    const now = new Date().toISOString();

    if (status) {
      ticket.status = status;
    }

    if (reply && reply.message) {
      const newMsg: TicketMessage = {
        id: 'msg-' + Date.now(),
        senderRole: reply.senderRole || 'ADMIN',
        senderName: reply.senderName || (reply.senderRole === 'ADMIN' ? 'Admin Support' : ticket.userIgn),
        message: reply.message.trim(),
        imageUrl: reply.imageUrl,
        timestamp: now,
        isAi: reply.senderRole === 'AI_BOT',
      };
      ticket.messages.push(newMsg);

      // If user replied, generate automated AI follow-up
      if (reply.senderRole === 'USER') {
        const aiResult = processAiResponse(ticket, reply.message, reply.imageUrl);
        const aiMsg: TicketMessage = {
          id: 'msg-ai-' + Date.now(),
          senderRole: 'AI_BOT',
          senderName: 'AI Support',
          isAi: true,
          message: aiResult.response,
          timestamp: new Date(Date.now() + 600).toISOString(),
        };
        ticket.messages.push(aiMsg);
        if (aiResult.paymentVerified) {
          ticket.status = 'RESOLVED';
          ticket.paymentVerified = true;
          ticket.verifiedTrxId = aiResult.verifiedTrxId;
          ticket.verifiedAmount = aiResult.verifiedAmount;
        }
      }
    }

    ticket.updatedAt = now;
    all[index] = ticket;
    saveTickets(all);

    return NextResponse.json({ ok: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get('all');
    const ticketId = searchParams.get('id');

    if (clearAll === 'true' || !ticketId) {
      saveTickets([]);
      return NextResponse.json({ ok: true, message: 'All support tickets reset to 0' });
    }

    const all = readTickets();
    const filtered = all.filter((t) => t.id !== ticketId);
    saveTickets(filtered);

    return NextResponse.json({ ok: true, message: `Ticket ${ticketId} deleted` });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
