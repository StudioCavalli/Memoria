import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Memoria',
  description: 'Politique de confidentialité de Memoria, conforme au RGPD.',
}

export default function PolitiqueDeConfidentialite() {
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
          Politique de confidentialité
        </h1>
        <p className="text-text-muted text-sm mb-12">
          Dernière mise à jour : avril 2026
        </p>

        <div className="space-y-10 text-text-dark leading-relaxed">
          {/* Introduction */}
          <section>
            <p className="text-text-muted">
              La présente politique de confidentialité décrit la manière dont Foxcase
              (ci-après « nous », « notre ») collecte, utilise et protège vos données personnelles
              dans le cadre du site web Memoria et du service associé, conformément au Règlement
              Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi
              Informatique et Libertés du 6 janvier 1978 modifiée.
            </p>
          </section>

          {/* Responsable du traitement */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              1. Responsable du traitement
            </h2>
            <ul className="space-y-1 text-text-muted list-none">
              <li><strong>Foxcase</strong> — Entrepreneur individuel</li>
              <li><strong>Représentant :</strong> Christopher Cavalli</li>
              <li><strong>Adresse :</strong> 45 Boulevard de la Croisette, 06400 Cannes, France</li>
              <li><strong>Email :</strong>{' '}
                <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li><strong>Téléphone :</strong> +33 6 10 44 98 18</li>
              <li><strong>SIREN :</strong> 834 802 407</li>
            </ul>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              2. Données personnelles collectées
            </h2>
            <p className="text-text-muted mb-3">
              Nous pouvons collecter les données personnelles suivantes selon votre utilisation du Site
              et du service Memoria :
            </p>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-4 mb-2">
              a) Via le formulaire de contact et la newsletter
            </h3>
            <ul className="list-disc list-inside text-text-muted space-y-1 ml-2">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (facultatif)</li>
              <li>Contenu du message</li>
            </ul>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-4 mb-2">
              b) Via le service Memoria
            </h3>
            <ul className="list-disc list-inside text-text-muted space-y-1 ml-2">
              <li>Données d&apos;identification (nom, prénom, date de naissance, lien familial)</li>
              <li>Enregistrements vocaux et transcriptions</li>
              <li>Données cognitives (scores linguistiques, indicateurs de vitalité)</li>
              <li>Données de santé déduites (marqueurs cognitifs)</li>
              <li>Données de connexion et d&apos;utilisation (logs, appareil, navigateur)</li>
            </ul>
          </section>

          {/* Finalités */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              3. Finalités du traitement
            </h2>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>Fournir le service Memoria (recueil biographique, analyse cognitive)</li>
              <li>Générer les Gazettes mensuelles pour les familles</li>
              <li>Détecter les signes précoces de déclin cognitif (module Sentinelle)</li>
              <li>Répondre à vos demandes de contact ou de démonstration</li>
              <li>Envoyer la newsletter (si vous y avez consenti)</li>
              <li>Améliorer le service et l&apos;expérience utilisateur</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </section>

          {/* Base légale */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              4. Base légale du traitement
            </h2>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Consentement explicite</strong> (article 6.1.a du RGPD) : pour le traitement
                des données de santé, les enregistrements vocaux et la newsletter.
              </li>
              <li>
                <strong>Exécution du contrat</strong> (article 6.1.b) : pour la fourniture du service
                Memoria souscrit par l&apos;utilisateur ou sa famille.
              </li>
              <li>
                <strong>Intérêt légitime</strong> (article 6.1.f) : pour l&apos;amélioration du service,
                les statistiques d&apos;utilisation et la sécurité du Site.
              </li>
              <li>
                <strong>Obligation légale</strong> (article 6.1.c) : pour la conservation de certaines
                données imposée par la loi.
              </li>
            </ul>
          </section>

          {/* Durée de conservation */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              5. Durée de conservation
            </h2>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li>
                <strong>Données de contact :</strong> 3 ans à compter du dernier contact.
              </li>
              <li>
                <strong>Données du service Memoria :</strong> conservées pendant la durée de
                l&apos;abonnement, puis 1 an après la résiliation (sauf demande de suppression anticipée).
              </li>
              <li>
                <strong>Données de santé :</strong> durée configurable par l&apos;utilisateur ou son
                représentant légal, avec un maximum de 5 ans.
              </li>
              <li>
                <strong>Cookies :</strong> 13 mois maximum conformément aux recommandations de la CNIL.
              </li>
            </ul>
          </section>

          {/* Droits des utilisateurs */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              6. Vos droits
            </h2>
            <p className="text-text-muted mb-3">
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside text-text-muted space-y-2 ml-2">
              <li><strong>Droit d&apos;accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie.</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données.</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes.</li>
              <li><strong>Droit à la limitation :</strong> demander la suspension du traitement dans certains cas.</li>
              <li><strong>Droit de retirer votre consentement :</strong> à tout moment, sans affecter la licéité du traitement antérieur.</li>
              <li><strong>Directives post-mortem :</strong> définir des directives relatives à la conservation et à la communication de vos données après votre décès.</li>
            </ul>

            <h3 className="font-heading text-lg font-bold text-text-dark mt-6 mb-2">
              Comment exercer vos droits
            </h3>
            <p className="text-text-muted">
              Adressez votre demande par email à{' '}
              <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                christopher.cavalli@hotmail.com
              </a>{' '}
              en joignant une copie d&apos;un justificatif d&apos;identité. Nous nous engageons à vous
              répondre dans un délai de 30 jours.
            </p>
            <p className="text-text-muted mt-3">
              En cas de désaccord, vous pouvez introduire une réclamation auprès de la{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brown hover:underline">
                CNIL
              </a>{' '}
              (Commission Nationale de l&apos;Informatique et des Libertés).
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              7. Cookies
            </h2>
            <p className="text-text-muted">
              Le Site utilise des cookies strictement nécessaires au fonctionnement du service.
              Aucun cookie publicitaire ou de suivi n&apos;est déposé sans votre consentement préalable.
            </p>
            <p className="text-text-muted mt-3">
              Vous pouvez à tout moment paramétrer vos préférences de cookies via les réglages de
              votre navigateur ou via notre bandeau de consentement.
            </p>
          </section>

          {/* Transferts */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              8. Transferts de données hors UE
            </h2>
            <p className="text-text-muted">
              Certaines données peuvent être transférées vers des pays situés hors de l&apos;Union
              Européenne dans le cadre de l&apos;utilisation de nos sous-traitants techniques.
              Ces transferts sont encadrés par des clauses contractuelles types approuvées par la
              Commission Européenne ou par des décisions d&apos;adéquation.
            </p>
          </section>

          {/* Sous-traitants */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              9. Sous-traitants
            </h2>
            <p className="text-text-muted mb-3">
              Nous faisons appel aux sous-traitants suivants pour le fonctionnement du service :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-text-muted border-collapse">
                <thead>
                  <tr className="border-b border-brown/20">
                    <th className="text-left py-2 pr-4 font-bold text-text-dark">Sous-traitant</th>
                    <th className="text-left py-2 pr-4 font-bold text-text-dark">Finalité</th>
                    <th className="text-left py-2 font-bold text-text-dark">Localisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/10">
                  <tr>
                    <td className="py-2 pr-4">Vercel Inc.</td>
                    <td className="py-2 pr-4">Hébergement du site web</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Anthropic (Claude)</td>
                    <td className="py-2 pr-4">Traitement IA conversationnelle</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">OpenAI</td>
                    <td className="py-2 pr-4">Traitement IA conversationnelle (backup)</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">ElevenLabs</td>
                    <td className="py-2 pr-4">Synthèse vocale</td>
                    <td className="py-2">États-Unis</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Modification */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              10. Modification de la politique
            </h2>
            <p className="text-text-muted">
              Nous nous réservons le droit de modifier la présente politique de confidentialité à tout
              moment. En cas de modification substantielle, nous vous en informerons par email ou via
              une notification sur le Site. La date de dernière mise à jour figure en haut de cette page.
            </p>
          </section>

          {/* Contact DPO */}
          <section>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-brown mb-4">
              11. Contact — Délégué à la protection des données
            </h2>
            <p className="text-text-muted">
              Pour toute question relative à la protection de vos données personnelles, vous pouvez
              contacter notre référent protection des données :
            </p>
            <ul className="mt-3 space-y-1 text-text-muted list-none">
              <li><strong>Christopher Cavalli</strong></li>
              <li>
                <strong>Email :</strong>{' '}
                <a href="mailto:christopher.cavalli@hotmail.com" className="text-brown hover:underline">
                  christopher.cavalli@hotmail.com
                </a>
              </li>
              <li><strong>Adresse :</strong> 45 Boulevard de la Croisette, 06400 Cannes, France</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
