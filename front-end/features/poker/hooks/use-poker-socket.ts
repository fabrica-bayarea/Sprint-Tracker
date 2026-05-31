"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type PokerState = 'WAITING' | 'VOTING' | 'REVEALED' | 'CLOSED';

export interface PokerUser {
  userId: string;
  userName?: string;
  hasVoted: boolean;
  voteValue?: string;
}

const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; sprinttacker-session=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  
  return localStorage.getItem('sprinttacker-session') || '';
};

export function usePokerSocket(sessionId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [users, setUsers] = useState<Record<string, PokerUser>>({});
  const [sessionState, setSessionState] = useState<PokerState>('WAITING');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_BASE_URL_WS || 'ws://localhost:3000';
    const token = getAuthToken();

    const socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinPokerSession', { sessionId }, (response: { ok: boolean; reason?: string }) => {
        if (response && !response.ok) {
          console.error(response.reason);
        }
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('pokerSessionState', (data: {
      sessionId: string;
      users: PokerUser[];
      pokerStatus: PokerState;
    }) => {
      if (data.sessionId !== sessionId) return;

      const map: Record<string, PokerUser> = {};
      data.users.forEach(u => {
        map[u.userId] = u;
      });
      setUsers(map);

      if (data.pokerStatus) {
        setSessionState(data.pokerStatus);
      }
    });

    socket.on('pokerUserJoined', (data: { sessionId: string; userId: string; userName?: string }) => {
      if (data.sessionId !== sessionId) return;
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          userName: data.userName,
          hasVoted: false,
          voteValue: undefined,
        },
      }));
    });

    socket.on('pokerUserLeft', (data: { sessionId: string; userId: string }) => {
      if (data.sessionId !== sessionId) return;
      setUsers(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });

    socket.on('pokerVoteSubmitted', (data: { sessionId: string; userId: string }) => {
      if (data.sessionId !== sessionId) return;
      setUsers(prev => ({
        ...prev,
        [data.userId]: { ...prev[data.userId], hasVoted: true },
      }));
    });

    socket.on('pokerVotesRevealed', (data: {
      sessionId: string;
      votes: Array<{ boardMemberUserId: string; voteValue: string }>;
    }) => {
      if (data.sessionId !== sessionId) return;
      setSessionState('REVEALED');
      setUsers(prev => {
        const next = { ...prev };
        data.votes.forEach(v => {
          if (next[v.boardMemberUserId]) {
            next[v.boardMemberUserId] = { ...next[v.boardMemberUserId], voteValue: v.voteValue };
          }
        });
        return next;
      });
    });

    socket.on('pokerNextCard', (data: { sessionId: string }) => {
      if (data.sessionId !== sessionId) return;
      setSessionState('VOTING');
      setUsers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          next[key] = { ...next[key], hasVoted: false, voteValue: undefined };
        });
        return next;
      });
    });

    socket.on('pokerSessionClosed', (data: { sessionId: string }) => {
      if (data.sessionId !== sessionId) return;
      setSessionState('CLOSED');
    });

    return () => {
      socket.emit('leavePokerSession', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  return {
    socket: socketRef.current,
    connected,
    users,
    sessionState,
  };
}