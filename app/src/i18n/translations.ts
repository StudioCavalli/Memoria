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
    'setup.lang.title': 'Choisissez votre langue',
    'setup.lang.next': 'Continuer',
    'setup.pairing.header': 'Associer la tablette',
    'setup.pairing.title': 'Code de pairing',
    'setup.pairing.subtitle': 'Entrez le code affiché sur le dashboard',
    'setup.pairing.submit': 'Connecter',
    'setup.pairing.success': 'Connexion réussie !',
    'setup.pairing.welcome': 'Bienvenue {name}',
    'setup.pairing.error.invalid': 'Code invalide ou expiré. Vérifiez le code sur le dashboard.',
    'setup.pairing.error.server': 'Erreur de connexion au serveur.',

    // Legacy keys (kept for hidden settings compatibility)
    'setup.pin.title': 'Code PIN de configuration',
    'setup.pin.placeholder': 'Entrez le code PIN',
    'setup.pin.error': 'Code PIN incorrect',
    'setup.pin.submit': 'Valider',

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
    'settings.unlink': 'Dissocier la tablette',
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
    'setup.lang.title': 'Choose your language',
    'setup.lang.next': 'Continue',
    'setup.pairing.header': 'Link the tablet',
    'setup.pairing.title': 'Pairing code',
    'setup.pairing.subtitle': 'Enter the code displayed on the dashboard',
    'setup.pairing.submit': 'Connect',
    'setup.pairing.success': 'Connection successful!',
    'setup.pairing.welcome': 'Welcome {name}',
    'setup.pairing.error.invalid': 'Invalid or expired code. Check the code on the dashboard.',
    'setup.pairing.error.server': 'Server connection error.',

    // Legacy keys (kept for hidden settings compatibility)
    'setup.pin.title': 'Setup PIN code',
    'setup.pin.placeholder': 'Enter the PIN code',
    'setup.pin.error': 'Incorrect PIN code',
    'setup.pin.submit': 'Submit',

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
    'settings.unlink': 'Unlink tablet',
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
    'setup.lang.title': 'Elija su idioma',
    'setup.lang.next': 'Continuar',
    'setup.pairing.header': 'Asociar la tablet',
    'setup.pairing.title': 'Código de emparejamiento',
    'setup.pairing.subtitle': 'Introduzca el código que aparece en el dashboard',
    'setup.pairing.submit': 'Conectar',
    'setup.pairing.success': 'Conexión exitosa!',
    'setup.pairing.welcome': 'Bienvenido {name}',
    'setup.pairing.error.invalid': 'Código inválido o caducado. Verifique el código en el dashboard.',
    'setup.pairing.error.server': 'Error de conexión al servidor.',

    // Legacy keys (kept for hidden settings compatibility)
    'setup.pin.title': 'Código PIN de configuración',
    'setup.pin.placeholder': 'Introduzca el código PIN',
    'setup.pin.error': 'Código PIN incorrecto',
    'setup.pin.submit': 'Validar',

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
    'settings.unlink': 'Desasociar la tableta',
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
    'setup.lang.title': 'Scegliete la vostra lingua',
    'setup.lang.next': 'Continua',
    'setup.pairing.header': 'Associare il tablet',
    'setup.pairing.title': 'Codice di associazione',
    'setup.pairing.subtitle': 'Inserite il codice visualizzato sulla dashboard',
    'setup.pairing.submit': 'Connetti',
    'setup.pairing.success': 'Connessione riuscita!',
    'setup.pairing.welcome': 'Benvenuto {name}',
    'setup.pairing.error.invalid': 'Codice non valido o scaduto. Verificate il codice sulla dashboard.',
    'setup.pairing.error.server': 'Errore di connessione al server.',

    // Legacy keys (kept for hidden settings compatibility)
    'setup.pin.title': 'Codice PIN di configurazione',
    'setup.pin.placeholder': 'Inserire il codice PIN',
    'setup.pin.error': 'Codice PIN errato',
    'setup.pin.submit': 'Conferma',

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
    'settings.unlink': 'Disassociare il tablet',
    'settings.close': 'Chiudi',
    'settings.pin.title': 'Codice PIN richiesto',

    // Language
    'lang.title': 'Lingua',
  },
};
