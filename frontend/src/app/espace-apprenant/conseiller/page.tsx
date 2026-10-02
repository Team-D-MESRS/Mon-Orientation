import { redirect } from 'next/navigation';

/** Compatibilité avec les anciens liens : Guido a désormais sa page autonome dans la navigation principale. */
export default function AncienneRouteGuidoPage() {
  redirect('/conseiller');
}
