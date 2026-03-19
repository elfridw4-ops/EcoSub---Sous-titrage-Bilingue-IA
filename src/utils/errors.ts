
export enum ErrorType {
  AUTH = 'AUTH',
  API_KEY = 'API_KEY',
  NETWORK = 'NETWORK',
  COOKIE = 'COOKIE',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  action?: string;
}

export const handleAppError = (error: any): AppError => {
  console.error("Handling Error:", error);

  // Firebase Auth Errors
  if (error.code?.startsWith('auth/')) {
    switch (error.code) {
      case 'auth/popup-blocked':
        return {
          type: ErrorType.AUTH,
          message: "Le popup de connexion a été bloqué.",
          action: "Veuillez autoriser les popups pour ce site ou ouvrir l'application dans un nouvel onglet."
        };
      case 'auth/popup-closed-by-user':
        return {
          type: ErrorType.AUTH,
          message: "Connexion annulée.",
          details: "Le popup a été fermé avant la fin de l'authentification."
        };
      case 'auth/unauthorized-domain':
        return {
          type: ErrorType.AUTH,
          message: "Domaine non autorisé.",
          details: "Ce domaine n'est pas configuré dans la console Firebase.",
          action: "Contactez l'administrateur pour ajouter ce domaine aux domaines autorisés."
        };
      case 'auth/network-request-failed':
        return {
          type: ErrorType.NETWORK,
          message: "Erreur réseau lors de l'authentification.",
          action: "Vérifiez votre connexion internet et réessayez."
        };
      case 'auth/invalid-credential':
        return {
          type: ErrorType.AUTH,
          message: "Identifiants invalides.",
          action: "Veuillez réessayer de vous connecter."
        };
      default:
        return {
          type: ErrorType.AUTH,
          message: "Erreur d'authentification : " + (error.message || error.code),
        };
    }
  }

  // Cookie / Iframe Errors (Specific to AI Studio environment)
  const errorMsg = error.message || String(error);
  
  if (errorMsg.includes('missing initial state')) {
    return {
      type: ErrorType.AUTH,
      message: "Erreur de session d'authentification (Mobile/Safari).",
      details: "L'état initial de la session a été perdu. C'est une erreur classique sur les navigateurs mobiles (Safari iOS, Chrome Android) due aux restrictions de cookies tiers (ITP) ou à la perte du sessionStorage.",
      action: "Veuillez réessayer de vous connecter. Le système utilise désormais un popup sécurisé pour éviter ce problème."
    };
  }
  
  // Distinguish between pure network errors and cookie-related failures in iframes
  const isIframe = window.self !== window.top;
  
  if (errorMsg.includes('Cookie check') || errorMsg.includes('Authenticate in new window') || errorMsg.includes('cookies de sécurité')) {
    return {
      type: ErrorType.COOKIE,
      message: "Problème de cookies de sécurité.",
      details: "Votre navigateur (souvent sur mobile) bloque les cookies tiers nécessaires au fonctionnement dans l'iframe.",
      action: "Veuillez ouvrir l'application dans un nouvel onglet (bouton en haut à droite) pour corriger cela."
    };
  }

  if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
    if (isIframe) {
      return {
        type: ErrorType.COOKIE,
        message: "Erreur de connexion (Cookies/Iframe).",
        details: "La requête a échoué. Cela arrive souvent dans l'aperçu AI Studio à cause des restrictions de cookies.",
        action: "Veuillez ouvrir l'application dans un nouvel onglet pour corriger cela."
      };
    }
    return {
      type: ErrorType.NETWORK,
      message: "Erreur de connexion réseau.",
      details: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      action: "Vérifiez votre connexion et réessayez. Si le problème persiste, le serveur est peut-être en train de redémarrer."
    };
  }

  // API Key Errors
  if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid key')) {
    return {
      type: ErrorType.API_KEY,
      message: "Clé API Gemini invalide.",
      action: "Veuillez vérifier votre clé API dans les paramètres ou vous connecter avec Google."
    };
  }

  if (errorMsg.includes('quota') || errorMsg.includes('429')) {
    return {
      type: ErrorType.API_KEY,
      message: "Quota dépassé pour la clé API.",
      action: "Veuillez réessayer plus tard ou utiliser votre propre clé API."
    };
  }

  // Default
  return {
    type: ErrorType.UNKNOWN,
    message: "Une erreur inattendue est survenue.",
    details: errorMsg
  };
};
