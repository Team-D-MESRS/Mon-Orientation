import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-bj-gray-50 text-white py-12v">
      <div className="bj-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8v mb-8v">
          <div>
            <div className="flex items-center gap-3v mb-4v">
              <div className="w-10 h-10 bg-bj-green rounded-full flex items-center justify-center font-bold text-sm">
                MO
              </div>
              <div>
                <div className="font-bold text-sm">Mon Orientation</div>
                <div className="text-xs text-bj-gray-750">Plateforme nationale</div>
              </div>
            </div>
            <p className="text-sm text-bj-gray-625">
              Accompagnement personnalisé dans l&apos;orientation scolaire pour les élèves du Bénin.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4v">Services</h4>
            <ul className="space-y-2v text-sm text-bj-gray-750">
              <li><Link href="/catalogue" className="hover:text-bj-green transition-colors">Catalogue des filières</Link></li>
              <li><Link href="/conseiller" className="hover:text-bj-green transition-colors">Conseiller IA</Link></li>
              <li><Link href="/espace-apprenant" className="hover:text-bj-green transition-colors">Mon espace</Link></li>
              <li><Link href="/stats" className="hover:text-bj-green transition-colors">Statistiques</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4v">Informations</h4>
            <ul className="space-y-2v text-sm text-bj-gray-750">
              <li><a href="#" className="hover:text-bj-green transition-colors">Guide d&apos;utilisation</a></li>
              <li><a href="#" className="hover:text-bj-green transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-bj-green transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-bj-green transition-colors">Données personnelles</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4v">Gouvernement</h4>
            <ul className="space-y-2v text-sm text-bj-gray-750">
              <li><a href="https://www.enseignementsecondaire.gouv.bj" className="hover:text-bj-green transition-colors" target="_blank" rel="noopener noreferrer">MESTFP</a></li>
              <li><a href="https://www.educmaster.bj" className="hover:text-bj-green transition-colors" target="_blank" rel="noopener noreferrer">EducMaster</a></li>
              <li><a href="https://www.benin.bj" className="hover:text-bj-green transition-colors" target="_blank" rel="noopener noreferrer">Gouvernement du Bénin</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-bj-gray-425 pt-6v flex flex-col md:flex-row items-center justify-between gap-4v">
          <p className="text-xs text-bj-gray-625">
            © 2026 Mon Orientation — Ministère de l&apos;Enseignement Secondaire, Technique et de la Formation Professionnelle
          </p>
          <div className="flex gap-4v text-xs text-bj-gray-625">
            <a href="#" className="hover:text-bj-green transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-bj-green transition-colors">Accessibilité</a>
            <a href="#" className="hover:text-bj-green transition-colors">Données personnelles</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
