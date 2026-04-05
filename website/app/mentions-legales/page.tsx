import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Mentions légales — Memoria',
  description: 'Mentions légales du site Memoria, conformément à la loi LCEN.',
}

export default function MentionsLegales() {
  return (
    <main className="min-h-screen bg-cream">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 sm:pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brown hover:text-brown-dark transition-colors mb-8"
        >
          &larr; Retour à l&apos;accueil
        </Link>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-text-dark mb-4">
          Mentions légales
        </h1>
        <p className="text-text-muted text-sm mb-12">
          Dernière mise à jour : avril 2026
        </p>

        <div className="space-y-10 text-text-dark leading-relaxed">
          {/* Éditeur */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              1. Éditeur du site
            </h2>
            <p className="text-text-muted">
              Le site <strong>memoria.foxcase.fr</strong> (ci-après « le Site ») est édité par :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li><strong>Raison sociale :</strong> Foxcase — Entrepreneur individuel</li>
              <li><strong>Responsable :</strong> Christopher Cavalli</li>
              <li><strong>SIREN :</strong> 834 802 407</li>
              <li><strong>SIRET :</strong> 834 802 407 00033</li>
              <li><strong>Adresse :</strong> 45 Boulevard de la Croisette, 06400 Cannes, France</li>
              <li><strong>Code NAF :</strong> 6201Z — Programmation informatique</li>
              <li><strong>Email :</strong> christopher.cavalli@hotmail.com</li>
              <li><strong>Téléphone :</strong> +33 6 10 44 98 18</li>
            </ul>
          </section>

          {/* Directeur de la publication */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              2. Directeur de la publication
            </h2>
            <p className="text-text-muted">
              Le directeur de la publication est <strong>Christopher Cavalli</strong>,
              en sa qualité de représentant légal de Foxcase.
            </p>
          </section>

          {/* Hébergeur */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              3. Hébergeur
            </h2>
            <p className="text-text-muted">
              Le site est hébergé par :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li><strong>Vercel Inc.</strong></li>
              <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
              <li>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brown hover:underline">vercel.com</a></li>
            </ul>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              4. Propriété intellectuelle
            </h2>
            <p className="text-text-muted">
              L&apos;ensemble des contenus présents sur le Site (textes, images, graphismes, logo, icônes,
              logiciels, etc.) est protégé par les lois françaises et internationales relatives à la
              propriété intellectuelle. Toute reproduction, représentation, modification, publication,
              adaptation de tout ou partie des éléments du Site, quel que soit le moyen ou le procédé
              utilisé, est interdite sans l&apos;autorisation écrite préalable de Foxcase.
            </p>
            <p className="text-text-muted mt-3">
              La marque <strong>Memoria</strong> ainsi que le logo associé sont la propriété exclusive
              de Foxcase. Toute utilisation non autorisée constitue une contrefaçon sanctionnée par
              les articles L.335-2 et suivants du Code de la propriété intellectuelle.
            </p>
          </section>

          {/* Crédits */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              5. Crédits photographiques
            </h2>
            <p className="text-text-muted">
              Les photographies utilisées sur le Site proviennent de la plateforme{' '}
              <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-brown hover:underline">
                Unsplash
              </a>{' '}
              et sont utilisées conformément à leur licence libre de droits (Unsplash License).
            </p>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              6. Limitation de responsabilité
            </h2>
            <p className="text-text-muted">
              Les informations fournies sur le Site le sont à titre indicatif et sont susceptibles
              d&apos;évoluer. Foxcase ne saurait être tenu responsable des erreurs, d&apos;une absence
              de disponibilité des informations ou de la présence de virus sur le Site.
            </p>
            <p className="text-text-muted mt-3">
              Memoria est un outil d&apos;aide et de prévention. Il ne se substitue en aucun cas à un
              diagnostic médical professionnel. En cas de doute sur l&apos;état de santé d&apos;un
              proche, consultez un professionnel de santé.
            </p>
          </section>

          {/* Liens hypertextes */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              7. Liens hypertextes
            </h2>
            <p className="text-text-muted">
              Le Site peut contenir des liens vers d&apos;autres sites internet. Foxcase n&apos;exerce
              aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu
              ou à leur politique de confidentialité.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              8. Droit applicable et juridiction compétente
            </h2>
            <p className="text-text-muted">
              Les présentes mentions légales sont régies par le droit français. En cas de litige,
              et après tentative de résolution amiable, les tribunaux compétents de Grasse (Alpes-Maritimes)
              seront seuls compétents.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              9. Contact
            </h2>
            <p className="text-text-muted">
              Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li><strong>Email :</strong>{' '}
                <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li><strong>Téléphone :</strong> +33 6 10 44 98 18</li>
              <li><strong>Adresse :</strong> 45 Boulevard de la Croisette, 06400 Cannes, France</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
