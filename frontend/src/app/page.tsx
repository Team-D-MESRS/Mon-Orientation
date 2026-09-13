import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white py-16v">
        <div className="bj-container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-bj-gray-50 mb-4v">
            Choisis ton avenir avec confiance
          </h1>
          <p className="text-lg text-bj-gray-500 max-w-2xl mx-auto mb-8v">
            Accompagnement personnalisé dans l&apos;orientation scolaire, de la 4e à la Terminale.
            Découvre les filières qui correspondent à tes talents et à tes ambitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalogue" className="bj-btn bj-btn-primary text-lg">
              Découvrir les filières
            </Link>
            <Link href="/connexion" className="bj-btn bj-btn-secondary text-lg">
              Mon espace
            </Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-12v">
        <div className="bj-container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8v">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6v">
            {[
              { step: '4e', title: 'Découvrir', desc: 'Explore les filières et les métiers', icon: '🔍' },
              { step: '3e', title: 'Choisir', desc: 'Saisis tes préférences', icon: '📝' },
              { step: '1re', title: 'Préparer', desc: 'Affine ton projet d\'orientation', icon: '🎯' },
              { step: 'Terminale', title: 'Décider', desc: 'Valide ton choix définitif', icon: '✅' },
            ].map((item) => (
              <div key={item.step} className="bj-card p-6v text-center">
                <div className="text-4xl mb-4v">{item.icon}</div>
                <div className="inline-block px-3v py-1v bg-bj-green/10 text-bj-green rounded-full text-sm font-semibold mb-3v">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2v">{item.title}</h3>
                <p className="text-bj-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-bj-gray-975 py-12v">
        <div className="bj-container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8v">Nos services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6v">
            {[
              { title: 'Catalogue', desc: 'Plus de 100 filières à explorer', icon: '📚', href: '/catalogue' },
              { title: 'Conseiller IA', desc: 'Assistant intelligent multilingue', icon: '🤖', href: '/conseiller' },
              { title: 'Mes notes', desc: 'Suivi depuis EducMaster', icon: '📊', href: '/espace-apprenant' },
              { title: 'Statistiques', desc: 'Données nationales en temps réel', icon: '📈', href: '/stats' },
            ].map((service) => (
              <Link key={service.title} href={service.href} className="bj-card p-6v hover:shadow-lg transition-all">
                <div className="text-3xl mb-3v">{service.icon}</div>
                <h3 className="text-lg font-bold mb-2v">{service.title}</h3>
                <p className="text-bj-gray-500 text-sm">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Callout */}
      <section className="py-12v">
        <div className="bj-container">
          <div className="bg-bj-green/5 border border-bj-green/20 rounded-bj-lg p-8v flex flex-col md:flex-row items-center gap-6v">
            <div className="text-4xl">🗣️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2v">Nouveau : Le conseiller IA parle vos langues</h3>
              <p className="text-bj-gray-500">
                Fongbé, Yoruba, Bariba, Dendi... Posez vos questions dans votre langue maternelle.
                Un accompagnement inclusif pour tous les Béninois.
              </p>
            </div>
            <Link href="/conseiller" className="bj-btn bj-btn-primary whitespace-nowrap">
              Essayer
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
