import { notFound } from 'next/navigation';
import { JUNCTION_IDS } from '@/lib/sim/constants';
import { DeskView } from '@/views/desk/DeskView';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!JUNCTION_IDS.includes(id)) notFound();
  return <DeskView key={id} id={id} />;
}
