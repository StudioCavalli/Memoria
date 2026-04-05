# Scenario de demonstration — Salon Silver Eco, 2 juin 2026

**Duree totale : 5 minutes**
**Materiel : 1 Totem Memoria (tablette) + 1 ecran laptop (dashboard)**

---

## Avant la demo (preparation)

- [ ] Backend deploye et fonctionnel (verifier `GET /health`)
- [ ] Tablette chargee, en mode kiosque, connectee au WiFi + 4G backup
- [ ] Dashboard ouvert sur le laptop, connecte avec le compte demo
- [ ] Donnees de demo chargees (30 jours d'historique)
- [ ] Volume tablette au maximum
- [ ] Video de backup prete sur le telephone (au cas ou)

---

## Temps 1 — La Voix (1min30)

### Accroche (15s)
> "Imaginez : votre grand-mere a 85 ans. Elle a des histoires incroyables a raconter,
> mais personne ne prend le temps de les ecouter. Un jour, elle ne sera plus la.
> Et ces histoires disparaitront avec elle."

### Presentation du Totem (15s)
> "Voici Memoria. Un seul bouton. Pas de menu, pas d'ecran complique.
> Jeanne, 85 ans, n'a qu'a appuyer ici."

*Appuyer sur le bouton. Memoria salue.*

### Conversation live (1min)
*Laisser le jury parler a Memoria. Si personne ne se porte volontaire, parler soi-meme :*

> "Bonjour Memoria, je me souviens de mon ecole a Nice dans les annees 50."

*Laisser l'IA repondre. Continuer avec :*

> "Oui, j'avais une maitresse qui s'appelait Madame Rossi, elle etait tres gentille."

*Montrer la fluidite : reponse < 1.5s, voix naturelle, relance pertinente.*

**Point cle a verbaliser :**
> "Vous voyez la latence ? Moins de 1.5 seconde. Pour un senior, une IA lente est une IA cassee."

---

## Temps 2 — La Memoire (1min30)

### Transition vers le dashboard (15s)
> "Pendant que Jeanne raconte, tout se passe en coulisses."

*Se tourner vers le laptop. Montrer le dashboard.*

### Le souvenir extrait (30s)
> "Regardez : le souvenir de l'ecole a ete transcrit, resume, et classe automatiquement
> dans le theme 'Enfance'. Les noms (Madame Rossi), les lieux (Nice), les periodes
> (annees 50) sont extraits."

*Montrer la page Souvenirs, cliquer sur le souvenir.*

### La Gazette (30s)
> "Chaque dimanche, la famille recoit cette Gazette — un PDF elegant qui compile
> les souvenirs de la semaine. C'est un tresor familial que les petits-enfants
> pourront relire dans 20 ans."

*Montrer un exemple de Gazette dans la page Gazettes.*

### Transition (15s)
> "Mais Memoria ne fait pas que recueillir des souvenirs. Il veille aussi sur la sante."

---

## Temps 3 — La Sentinelle (2min)

### Le module cognitif (45s)
> "A chaque session, Memoria analyse le langage de Jeanne sans qu'elle le sache :
> combien de mots differents elle utilise, la complexite de ses phrases,
> le temps qu'elle met a repondre."

*Montrer la page Metriques : graphique 30 jours, score de vitalite.*

> "Ici, Jeanne a un score de vitalite de 87 sur 100. Stable depuis un mois. Tout va bien."

### L'alerte (30s)
> "Mais si un jour ce score chute brutalement — vocabulaire en baisse de 20%,
> temps de reponse qui augmente — la famille recoit une alerte immediatement."

*Montrer la page Alertes, cliquer sur une alerte de demo.*

> "Un medecin met en moyenne 2 a 3 ans a diagnostiquer un declin cognitif.
> Memoria peut le detecter 6 mois plus tot. Parce qu'il parle avec Jeanne tous les jours."

### Le differenciateur (30s)
> "C'est ce qui nous rend uniques : aucun concurrent ne combine biographie IA
> et detection cognitive. Les robots compagnons ne recueillent pas de souvenirs.
> Les plateformes de biographie ne surveillent pas la sante.
> Memoria fait les deux."

### Closing (15s)
> "Le produit est fonctionnel. 109 fichiers de code, teste, documente.
> Ce qu'on cherche maintenant, c'est des partenaires pour le deployer
> aupres des seniors de la Cote d'Azur."

*Laisser le silence. Sourire.*

---

## Questions anticipees

**"C'est pas un peu intrusif ?"**
> Non, l'analyse est invisible. Le senior croit discuter avec un ami.
> Il n'y a aucun test, aucune evaluation. Juste une conversation.

**"Comment gerez-vous les donnees de sante ?"**
> Chiffrement AES-256, conformite RGPD native, hebergement HDS prevu.
> Le senior peut exporter ou supprimer toutes ses donnees a tout moment.

**"Combien ca coute ?"**
> 29,90 EUR/mois pour une famille, 19,90 EUR/mois par resident en EHPAD.
> On explore la prise en charge par les mutuelles et les CCAS.

**"Vous avez teste avec de vrais seniors ?"**
> On lance un pilote avec 20 seniors a Nice cet ete. C'est exactement
> le type d'accompagnement qu'on cherche aupres de la CCI.

**"Pourquoi Python et pas [autre chose] ?"**
> L'ecosysteme IA est en Python — Anthropic, OpenAI, spaCy. FastAPI nous donne
> l'async natif pour le streaming WebSocket. Pas de surcharge inter-services.

---

## Backup en cas de probleme

| Probleme | Solution |
|----------|----------|
| WiFi salon tombe | Basculer sur partage 4G du telephone |
| Backend plante | Relancer `./start.sh` (30 secondes) |
| Tablette freeze | Force quit + relancer l'app (10 secondes) |
| Tout plante | Lancer la video de demo pre-enregistree sur le telephone |
| Pas de son | Brancher une enceinte Bluetooth de backup |
