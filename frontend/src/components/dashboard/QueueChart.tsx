"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TickPayload } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface QueueChartProps {
  history: TickPayload[];
}

export default function QueueChart({ history }: QueueChartProps) {
  const labels = history.map(h => h.tick);
  
  const latestSignals = history.length > 0 ? history[history.length - 1].signals : [];
  
  const colors = [
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#10b981', // green
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];

  const datasets = latestSignals.map((signal, index) => {
    return {
      label: `${signal.name} (${signal.signalId})`,
      data: history.map(h => {
        const sig = h.signals.find(s => s.signalId === signal.signalId);
        return sig ? sig.queueLength : 0;
      }),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '1A', // 10% opacity
      borderWidth: 2,
      pointRadius: 0,
      pointHitRadius: 10,
      tension: 0.3,
      fill: true,
    };
  });

  const data = {
    labels,
    datasets,
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animation for real-time performance
    },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', maxTicksLimit: 10 }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', stepSize: 5 }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc',
          font: { family: 'inherit' }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="glass-panel" style={{ height: '350px', width: '100%', marginTop: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        LIVE QUEUE LENGTH OVER TIME (LAST 60 TICKS)
      </div>
      <div style={{ height: 'calc(100% - 2rem)' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
