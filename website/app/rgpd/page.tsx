import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'RGPD — Protection des données — Memoria',
  description: 'Informations RGPD spécifiques au service Memoria : nature des données traitées, chiffrement, droits des utilisateurs.',
}

export default function RGPD() {
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
          RGPD — Protection des données
        </h1>
        <p className="text-text-muted text-sm mb-4">
          Dernière mise à jour : avril 2026
        </p>
        <p className="text-text-muted mb-12 leading-relaxed">
          Cette page détaille les mesures spécifiques de protection des données mises en place
          dans le cadre du service Memoria, en complément de notre{' '}
          <Link href="/politique-de-confidentialite" className="text-brown hover:underline font-semibold">
            politique de confidentialité
          </Link>.
        </p>

        <div className="space-y-10 text-text-dark leading-relaxed">
          {/* Nature des données */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              1. Nature des données traitées
            </h2>
            <p className="text-text-muted mb-3">
              Le service Memoria traite des catégories de données particulièrement sensibles :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Enregistrements vocaux :</strong> conversations enregistrées avec le
                consentement explicite du senior ou de son représentant légal.
              </li>
              <li>
                <strong>Transcriptions textuelles :</strong> retranscription automatique des
                conversations, datées et classées chronologiquement.
              </li>
              <li>
                <strong>Données cognitives :</strong> scores de richesse lexicale, cohérence
                narrative, temps de réponse, indicateurs de vitalité linguistique.
              </li>
              <li>
                <strong>Données de santé :</strong> marqueurs cognitifs déduits de l&apos;analyse
                linguistique, alertes de déclin potentiel. Ces données relèvent de l&apos;article 9
                du RGPD (catégories particulières de données).
              </li>
              <li>
                <strong>Données biographiques :</strong> souvenirs, anecdotes, récits de vie
                structurés en biographie.
              </li>
            </ul>
          </section>

          {/* Cadre légal données de santé */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              2. Données de santé — Cadre légal spécifique
            </h2>
            <p className="text-text-muted mb-3">
              Le traitement de données de santé par Memoria est soumis à un cadre juridique renforcé :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Article 9.2.a du RGPD :</strong> le traitement repose sur le consentement
                explicite de la personne concernée ou de son représentant légal.
              </li>
              <li>
                <strong>Article L.1111-8 du Code de la santé publique :</strong> les données de santé
                à caractère personnel sont hébergées dans des conditions conformes aux exigences
                de sécurité définies par la réglementation.
              </li>
              <li>
                Memoria n&apos;est pas un dispositif médical au sens du Règlement (UE) 2017/745.
                Les indicateurs fournis sont des outils d&apos;aide à la vigilance et ne constituent
                en aucun cas un diagnostic médical.
              </li>
            </ul>
          </section>

          {/* Consentement */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              3. Consentement explicite
            </h2>
            <p className="text-text-muted mb-3">
              Avant toute utilisation du service Memoria, un consentement explicite est requis :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>Consentement à l&apos;enregistrement vocal des conversations.</li>
              <li>Consentement au traitement des données de santé (analyse cognitive).</li>
              <li>Consentement au partage des Gazettes avec les membres de la famille désignés.</li>
              <li>Consentement aux alertes médicales envoyées aux contacts référents.</li>
            </ul>
            <p className="text-text-muted mt-3">
              Chaque consentement peut être retiré à tout moment depuis l&apos;espace personnel
              ou par demande écrite.
            </p>
          </section>

          {/* Sécurité et chiffrement */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              4. Sécurité et chiffrement des données
            </h2>
            <p className="text-text-muted mb-3">
              Memoria met en place des mesures techniques et organisationnelles avancées :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Chiffrement AES-256 :</strong> toutes les données sensibles (enregistrements
                vocaux, transcriptions, données cognitives) sont chiffrées au repos avec l&apos;algorithme
                AES-256.
              </li>
              <li>
                <strong>Chiffrement en transit :</strong> toutes les communications utilisent le
                protocole TLS 1.3.
              </li>
              <li>
                <strong>Clés de chiffrement :</strong> gestion sécurisée des clés avec rotation
                régulière.
              </li>
              <li>
                <strong>Contrôle d&apos;accès :</strong> authentification forte et principe du moindre
                privilège.
              </li>
              <li>
                <strong>Journalisation :</strong> tous les accès aux données sensibles sont tracés
                et audités.
              </li>
            </ul>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              5. Hébergement des données
            </h2>
            <p className="text-text-muted mb-3">
              Le site vitrine est hébergé par Vercel (États-Unis). Pour le service Memoria en
              production :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Hébergement HDS prévu :</strong> les données de santé seront hébergées
                auprès d&apos;un hébergeur certifié HDS (Hébergeur de Données de Santé) conformément
                à l&apos;article L.1111-8 du Code de la santé publique.
              </li>
              <li>
                <strong>Localisation :</strong> les données de santé seront stockées sur des
                serveurs situés en France ou dans l&apos;Union Européenne.
              </li>
            </ul>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              6. Durée de conservation configurable
            </h2>
            <p className="text-text-muted mb-3">
              L&apos;utilisateur ou son représentant légal peut configurer la durée de conservation
              de ses données :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>Durée minimale : durée de l&apos;abonnement actif.</li>
              <li>Durée maximale : 5 ans après la fin de l&apos;abonnement.</li>
              <li>Les biographies exportées peuvent être conservées indéfiniment par la famille.</li>
              <li>Les données de santé sont supprimées automatiquement à l&apos;expiration de la durée choisie.</li>
            </ul>
          </section>

          {/* Droits spécifiques */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              7. Exercice des droits RGPD
            </h2>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-4 mb-2">
              a) Droit à l&apos;export (portabilité)
            </h3>
            <p className="text-text-muted">
              Vous pouvez exporter l&apos;intégralité de vos données à tout moment via l&apos;endpoint
              dédié de l&apos;API Memoria :
            </p>
            <div className="mt-2 bg-white rounded-xl p-4 font-mono text-sm text-brown border border-brown/10">
              GET /api/gdpr/export
            </div>
            <p className="text-text-muted mt-2">
              Les données sont fournies au format JSON structuré, incluant les transcriptions,
              biographies et scores cognitifs.
            </p>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-6 mb-2">
              b) Droit à l&apos;effacement
            </h3>
            <p className="text-text-muted">
              Vous pouvez demander la suppression complète et irréversible de votre compte et de
              toutes les données associées via :
            </p>
            <div className="mt-2 bg-white rounded-xl p-4 font-mono text-sm text-brown border border-brown/10">
              DELETE /api/gdpr/delete-account
            </div>
            <p className="text-text-muted mt-2">
              La suppression est effective sous 72 heures. Un email de confirmation vous est envoyé.
              Les sauvegardes chiffrées sont purgées sous 30 jours.
            </p>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-6 mb-2">
              c) Autres droits
            </h3>
            <p className="text-text-muted">
              Pour exercer vos droits d&apos;accès, de rectification, d&apos;opposition ou de
              limitation, adressez votre demande à :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li>
                <strong>Email :</strong>{' '}
                <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li>
                <strong>Courrier :</strong> Foxcase — RGPD, 45 Boulevard de la Croisette, 06400 Cannes, France
              </li>
            </ul>
          </section>

          {/* Sous-traitants IA */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              8. Sous-traitants et APIs IA
            </h2>
            <p className="text-text-muted mb-3">
              Le service Memoria fait appel à des APIs d&apos;intelligence artificielle pour le
              traitement conversationnel et la synthèse vocale. Les données transmises à ces
              sous-traitants sont :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>Transmises de manière chiffrée (TLS 1.3).</li>
              <li>Non utilisées pour l&apos;entraînement des modèles (clauses contractuelles spécifiques).</li>
              <li>Supprimées des serveurs du sous-traitant après traitement (pas de rétention).</li>
            </ul>
            <p className="text-text-muted mt-3">
              Les sous-traitants concernés sont : <strong>Anthropic</strong> (Claude),{' '}
              <strong>OpenAI</strong> (GPT) et <strong>ElevenLabs</strong> (synthèse vocale).
              Des accords de traitement de données (DPA) sont en place avec chacun d&apos;entre eux.
            </p>
          </section>

          {/* Analyse d'impact */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              9. Analyse d&apos;impact (AIPD)
            </h2>
            <p className="text-text-muted">
              Compte tenu de la nature sensible des données traitées (données de santé, données
              relatives à des personnes vulnérables), une analyse d&apos;impact relative à la
              protection des données (AIPD) au sens de l&apos;article 35 du RGPD a été réalisée.
              Cette analyse identifie les risques et les mesures de mitigation mises en place.
            </p>
          </section>

          {/* Notification de violation */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              10. Notification en cas de violation de données
            </h2>
            <p className="text-text-muted">
              En cas de violation de données à caractère personnel, Foxcase s&apos;engage à :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2 mt-3">
              <li>Notifier la CNIL dans un délai de 72 heures (article 33 du RGPD).</li>
              <li>Informer les personnes concernées dans les meilleurs délais si la violation est
                susceptible d&apos;engendrer un risque élevé pour leurs droits et libertés
                (article 34 du RGPD).</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              11. Contact
            </h2>
            <p className="text-text-muted">
              Pour toute question relative à la protection de vos données dans le cadre de
              Memoria :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li><strong>Christopher Cavalli</strong> — Référent protection des données</li>
              <li>
                <strong>Email :</strong>{' '}
                <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li><strong>Téléphone :</strong> +33 6 10 44 98 18</li>
              <li><strong>Adresse :</strong> 45 Boulevard de la Croisette, 06400 Cannes, France</li>
            </ul>
            <p className="text-text-muted mt-4">
              Vous pouvez également saisir la{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brown hover:underline">
                CNIL
              </a>{' '}
              si vous estimez que vos droits ne sont pas respectés.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
