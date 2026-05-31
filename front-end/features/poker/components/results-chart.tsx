"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export function ResultsChart({
  votes,
}: {
  votes: Array<{ voteValue: string }>;
}) {
  const distribution: Record<string, number> = {};
  let totalVotes = 0;
  
  votes.forEach((v) => {
    if (v.voteValue && v.voteValue !== "?") {
      distribution[v.voteValue] = (distribution[v.voteValue] || 0) + 1;
      totalVotes++;
    }
  });

  const data = Object.keys(distribution).map((key) => ({
    name: key,
    votos: distribution[key],
  })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

  // Encontrar o mais votado para dar destaque
  let maxVotos = 0;
  data.forEach((d) => {
    if (d.votos > maxVotos) maxVotos = d.votos;
  });

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
        Nenhum voto numérico computado.
      </div>
    );
  }

  return (
    <div className="w-full mt-4">
      <h3 className="text-sm font-semibold mb-4 text-center">Distribuição dos Votos</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip 
              cursor={{ fill: "rgba(0,0,0,0.05)" }} 
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} 
            />
            <Bar dataKey="votos" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.votos === maxVotos ? "#dc2626" : "#fca5a5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
