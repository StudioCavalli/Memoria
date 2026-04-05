/**
 * Memoria — Internationalization translations
 *
 * 4 locales: French (default), English, Spanish, Italian.
 * Structure mirrors the website approach: Record<Locale, Record<string, string>>.
 */

export type Locale = 'fr' | 'en' | 'es' | 'it';

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  it: 'IT',
};

export const LOCALE_DATE_CODES: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  it: 'it-IT',
};

export const translations: Record<Locale, Record<string, string>> = {
  // ---------------------------------------------------------------------------
  // French (default)
  // ---------------------------------------------------------------------------
  fr: {
    // Setup Screen
    'setup.title': 'Memoria',
    'setup.subtitle': 'Configuration de la tablette',
    'setup.pin.title': 'Code PIN de configuration',
    'setup.pin.placeholder': 'Entrez le code PIN',
    'setup.pin.error': 'Code PIN incorrect',
    'setup.pin.submit': 'Valider',
    'setup.login.server': 'Adresse du serveur',
    'setup.login.email': 'Adresse email',
    'setup.login.password': 'Mot de passe',
    'setup.login.password.placeholder': 'Votre mot de passe',
    'setup.login.submit': 'Se connecter',
    'setup.login.error': 'Identifiants incorrects',
    'setup.login.error.empty': 'Veuillez remplir tous les champs',
    'setup.login.error.credentials': 'Email ou mot de passe incorrect',
    'setup.login.error.token': "Impossible de récupérer le token d'authentification",
    'setup.login.error.seniors': 'Impossible de récupérer la liste des seniors',
    'setup.login.error.noseniors': 'Aucun senior trouvé dans ce compte',
    'setup.login.error.server': 'Erreur serveur',
    'setup.login.error.connection': 'Erreur de connexion',
    'setup.login.error.save': 'Erreur lors de la sauvegarde',
    'setup.login.connecting': 'Connexion...',
    'setup.login.subtitle': 'Connexion à votre compte',
    'setup.select.title': 'Choisissez le senior pour cette tablette',
    'setup.select.subtitle': 'Sélection du senior',

    // Home Screen
    'home.greeting.morning': 'Bonjour',
    'home.greeting.afternoon': 'Bon après-midi',
    'home.greeting.evening': 'Bonsoir',
    'home.hint': 'Appuyez sur le bouton pour me parler',
    'home.listening': 'Je vous écoute...',
    'home.thinking': 'Je réfléchis...',
    'home.speaking': 'Je vous réponds...',
    'home.silence': 'Je suis toujours là. Prenez votre temps.',
    'home.error.mic': "Désolée, je n'ai pas pu activer le microphone.",
    'home.error.generic': 'Désolée, il y a eu un petit problème. Réessayez dans un moment.',
    'home.error.server': 'Je ne suis pas disponible pour le moment. Vérifiez la connexion internet et réessayez dans quelques instants.',
    'home.goodbye': 'À bientôt !',
    'home.noaudio': "Je n'ai rien entendu. Réessayez.",
    'home.reconnecting': 'Je reviens dans un instant. Réessayez bientôt.',

    // Button
    'button.talk': 'Parler',
    'button.listening': "J'écoute\u2026",
    'button.thinking': 'Je réfléchis\u2026',
    'button.speaking': 'Je parle\u2026',
    'button.label': 'Parler à Memoria',
    'button.a11y.label': 'Parler à Memoria. État actuel :',
    'button.a11y.hint': 'Appuyez pour commencer à parler. Appui long pour terminer la session.',

    // Settings (hidden)
    'settings.title': 'Paramètres',
    'settings.pin.subtitle': 'Entrez le code PIN pour accéder aux paramètres',
    'settings.pin.placeholder': 'Code PIN',
    'settings.pin.error': 'Code PIN incorrect',
    'settings.pin.cancel': 'Annuler',
    'settings.pin.submit': 'Valider',
    'settings.current.senior': 'Senior actuel',
    'settings.current.server': 'Serveur',
    'settings.change.senior': 'Changer de senior',
    'settings.reset': 'Réinitialiser le jumelage',
    'settings.close': 'Fermer',
    'settings.pin.title': 'Code PIN requis',

    // Language
    'lang.title': 'Langue',
  },

  // ---------------------------------------------------------------------------
  // English
  // ---------------------------------------------------------------------------
  en: {
    // Setup Screen
    'setup.title': 'Memoria',
    'setup.subtitle': 'Tablet setup',
    'setup.pin.title': 'Setup PIN code',
    'setup.pin.placeholder': 'Enter the PIN code',
    'setup.pin.error': 'Incorrect PIN code',
    'setup.pin.submit': 'Submit',
    'setup.login.server': 'Server address',
    'setup.login.email': 'Email address',
    'setup.login.password': 'Password',
    'setup.login.password.placeholder': 'Your password',
    'setup.login.submit': 'Log in',
    'setup.login.error': 'Incorrect credentials',
    'setup.login.error.empty': 'Please fill in all fields',
    'setup.login.error.credentials': 'Incorrect email or password',
    'setup.login.error.token': 'Unable to retrieve authentication token',
    'setup.login.error.seniors': 'Unable to retrieve the list of seniors',
    'setup.login.error.noseniors': 'No senior found in this account',
    'setup.login.error.server': 'Server error',
    'setup.login.error.connection': 'Connection error',
    'setup.login.error.save': 'Error while saving',
    'setup.login.connecting': 'Connecting...',
    'setup.login.subtitle': 'Log in to your account',
    'setup.select.title': 'Choose the senior for this tablet',
    'setup.select.subtitle': 'Senior selection',

    // Home Screen
    'home.greeting.morning': 'Good morning',
    'home.greeting.afternoon': 'Good afternoon',
    'home.greeting.evening': 'Good evening',
    'home.hint': 'Press the button to talk to me',
    'home.listening': "I'm listening...",
    'home.thinking': "I'm thinking...",
    'home.speaking': "I'm responding...",
    'home.silence': "I'm still here. Take your time.",
    'home.error.mic': "Sorry, I couldn't activate the microphone.",
    'home.error.generic': 'Sorry, there was a small problem. Try again in a moment.',
    'home.error.server': "I'm not available right now. Check the internet connection and try again in a few moments.",
    'home.goodbye': 'See you soon!',
    'home.noaudio': "I didn't hear anything. Try again.",
    'home.reconnecting': "I'll be right back. Try again shortly.",

    // Button
    'button.talk': 'Talk',
    'button.listening': 'Listening\u2026',
    'button.thinking': 'Thinking\u2026',
    'button.speaking': 'Speaking\u2026',
    'button.label': 'Talk to Memoria',
    'button.a11y.label': 'Talk to Memoria. Current state:',
    'button.a11y.hint': 'Press to start talking. Long press to end the session.',

    // Settings (hidden)
    'settings.title': 'Settings',
    'settings.pin.subtitle': 'Enter the PIN code to access settings',
    'settings.pin.placeholder': 'PIN code',
    'settings.pin.error': 'Incorrect PIN code',
    'settings.pin.cancel': 'Cancel',
    'settings.pin.submit': 'Submit',
    'settings.current.senior': 'Current senior',
    'settings.current.server': 'Server',
    'settings.change.senior': 'Change senior',
    'settings.reset': 'Reset pairing',
    'settings.close': 'Close',
    'settings.pin.title': 'PIN code required',

    // Language
    'lang.title': 'Language',
  },

  // ---------------------------------------------------------------------------
  // Spanish
  // ---------------------------------------------------------------------------
  es: {
    // Setup Screen
    'setup.title': 'Memoria',
    'setup.subtitle': 'Configuración de la tablet',
    'setup.pin.title': 'Código PIN de configuración',
    'setup.pin.placeholder': 'Introduzca el código PIN',
    'setup.pin.error': 'Código PIN incorrecto',
    'setup.pin.submit': 'Validar',
    'setup.login.server': 'Dirección del servidor',
    'setup.login.email': 'Dirección de correo',
    'setup.login.password': 'Contraseña',
    'setup.login.password.placeholder': 'Su contraseña',
    'setup.login.submit': 'Conectarse',
    'setup.login.error': 'Credenciales incorrectas',
    'setup.login.error.empty': 'Por favor, rellene todos los campos',
    'setup.login.error.credentials': 'Correo o contraseña incorrecto',
    'setup.login.error.token': 'No se pudo obtener el token de autenticación',
    'setup.login.error.seniors': 'No se pudo obtener la lista de mayores',
    'setup.login.error.noseniors': 'No se encontró ningún mayor en esta cuenta',
    'setup.login.error.server': 'Error del servidor',
    'setup.login.error.connection': 'Error de conexión',
    'setup.login.error.save': 'Error al guardar',
    'setup.login.connecting': 'Conectando...',
    'setup.login.subtitle': 'Conexión a su cuenta',
    'setup.select.title': 'Elija el mayor para esta tablet',
    'setup.select.subtitle': 'Selección del mayor',

    // Home Screen
    'home.greeting.morning': 'Buenos días',
    'home.greeting.afternoon': 'Buenas tardes',
    'home.greeting.evening': 'Buenas noches',
    'home.hint': 'Pulse el botón para hablarme',
    'home.listening': 'Le escucho...',
    'home.thinking': 'Estoy pensando...',
    'home.speaking': 'Le respondo...',
    'home.silence': 'Sigo aquí. Tómese su tiempo.',
    'home.error.mic': 'Lo siento, no pude activar el micrófono.',
    'home.error.generic': 'Lo siento, hubo un pequeño problema. Inténtelo de nuevo en un momento.',
    'home.error.server': 'No estoy disponible en este momento. Compruebe la conexión a internet e inténtelo de nuevo en unos instantes.',
    'home.goodbye': '¡Hasta pronto!',
    'home.noaudio': 'No he oído nada. Inténtelo de nuevo.',
    'home.reconnecting': 'Vuelvo en un instante. Inténtelo de nuevo pronto.',

    // Button
    'button.talk': 'Hablar',
    'button.listening': 'Escuchando\u2026',
    'button.thinking': 'Pensando\u2026',
    'button.speaking': 'Hablando\u2026',
    'button.label': 'Hablar con Memoria',
    'button.a11y.label': 'Hablar con Memoria. Estado actual:',
    'button.a11y.hint': 'Pulse para empezar a hablar. Pulsación larga para terminar la sesión.',

    // Settings (hidden)
    'settings.title': 'Ajustes',
    'settings.pin.subtitle': 'Introduzca el código PIN para acceder a los ajustes',
    'settings.pin.placeholder': 'Código PIN',
    'settings.pin.error': 'Código PIN incorrecto',
    'settings.pin.cancel': 'Cancelar',
    'settings.pin.submit': 'Validar',
    'settings.current.senior': 'Mayor actual',
    'settings.current.server': 'Servidor',
    'settings.change.senior': 'Cambiar de mayor',
    'settings.reset': 'Reiniciar el emparejamiento',
    'settings.close': 'Cerrar',
    'settings.pin.title': 'Código PIN requerido',

    // Language
    'lang.title': 'Idioma',
  },

  // ---------------------------------------------------------------------------
  // Italian
  // ---------------------------------------------------------------------------
  it: {
    // Setup Screen
    'setup.title': 'Memoria',
    'setup.subtitle': 'Configurazione del tablet',
    'setup.pin.title': 'Codice PIN di configurazione',
    'setup.pin.placeholder': 'Inserire il codice PIN',
    'setup.pin.error': 'Codice PIN errato',
    'setup.pin.submit': 'Conferma',
    'setup.login.server': 'Indirizzo del server',
    'setup.login.email': 'Indirizzo email',
    'setup.login.password': 'Password',
    'setup.login.password.placeholder': 'La vostra password',
    'setup.login.submit': 'Accedi',
    'setup.login.error': 'Credenziali errate',
    'setup.login.error.empty': 'Compilare tutti i campi',
    'setup.login.error.credentials': 'Email o password errati',
    'setup.login.error.token': "Impossibile recuperare il token di autenticazione",
    'setup.login.error.seniors': 'Impossibile recuperare la lista degli anziani',
    'setup.login.error.noseniors': 'Nessun anziano trovato in questo account',
    'setup.login.error.server': 'Errore del server',
    'setup.login.error.connection': 'Errore di connessione',
    'setup.login.error.save': 'Errore durante il salvataggio',
    'setup.login.connecting': 'Connessione...',
    'setup.login.subtitle': 'Accesso al vostro account',
    'setup.select.title': "Scegliete l'anziano per questo tablet",
    'setup.select.subtitle': "Selezione dell'anziano",

    // Home Screen
    'home.greeting.morning': 'Buongiorno',
    'home.greeting.afternoon': 'Buon pomeriggio',
    'home.greeting.evening': 'Buonasera',
    'home.hint': 'Premete il pulsante per parlarmi',
    'home.listening': 'Vi ascolto...',
    'home.thinking': 'Sto pensando...',
    'home.speaking': 'Vi rispondo...',
    'home.silence': 'Sono ancora qui. Prendetevi il vostro tempo.',
    'home.error.mic': 'Mi dispiace, non sono riuscita ad attivare il microfono.',
    'home.error.generic': 'Mi dispiace, c\'è stato un piccolo problema. Riprovate tra un momento.',
    'home.error.server': 'Non sono disponibile al momento. Verificate la connessione internet e riprovate tra qualche istante.',
    'home.goodbye': 'A presto!',
    'home.noaudio': 'Non ho sentito nulla. Riprovate.',
    'home.reconnecting': 'Torno tra un istante. Riprovate presto.',

    // Button
    'button.talk': 'Parlare',
    'button.listening': 'Ascolto\u2026',
    'button.thinking': 'Penso\u2026',
    'button.speaking': 'Parlo\u2026',
    'button.label': 'Parlare con Memoria',
    'button.a11y.label': 'Parlare con Memoria. Stato attuale:',
    'button.a11y.hint': 'Premete per iniziare a parlare. Pressione prolungata per terminare la sessione.',

    // Settings (hidden)
    'settings.title': 'Impostazioni',
    'settings.pin.subtitle': 'Inserite il codice PIN per accedere alle impostazioni',
    'settings.pin.placeholder': 'Codice PIN',
    'settings.pin.error': 'Codice PIN errato',
    'settings.pin.cancel': 'Annulla',
    'settings.pin.submit': 'Conferma',
    'settings.current.senior': 'Anziano attuale',
    'settings.current.server': 'Server',
    'settings.change.senior': 'Cambiare anziano',
    'settings.reset': "Reimpostare l'associazione",
    'settings.close': 'Chiudi',
    'settings.pin.title': 'Codice PIN richiesto',

    // Language
    'lang.title': 'Lingua',
  },
};
