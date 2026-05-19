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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { QueueHistory } from '@/types';

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

interface HistoryChartProps {
  history: QueueHistory[];
}

export default function HistoryChart({ history }: HistoryChartProps) {
  const labels = history.map(r =>
    new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Queue Length (vehicles)',
        data: history.map(r => r.queue_length),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6' + '1A',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Avg Wait Wq (sec)',
        data: history.map(r => r.avg_wait_time),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b' + '1A',
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        tension: 0.3,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#94a3b8', maxTicksLimit: 8 },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: '#1e293b' },
        ticks: { color: '#3b82f6' },
        title: { display: true, text: 'Queue Length', color: '#3b82f6' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b' },
        title: { display: true, text: 'Wait Time (s)', color: '#f59e0b' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#f8fafc', font: { family: 'inherit' } },
      },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  return (
    <div className="glass-panel" style={{ height: '300px', width: '100%' }}>
      <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
        QUEUE LENGTH & WAIT TIME OVER TIME
      </div>
      <div style={{ height: 'calc(100% - 2rem)' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
