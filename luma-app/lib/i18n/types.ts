export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

export interface Translations {
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      forgotPassword: string;
      button: string;
      noAccount: string;
      signUp: string;
      continueWith: string;
    };
    register: {
      title: string;
      subtitle: string;
      fullName: string;
      email: string;
      password: string;
      terms: string;
      termsLink: string;
      and: string;
      privacyLink: string;
      button: string;
      continueWith: string;
      alreadyHaveAccount: string;
      signIn: string;
      fieldsRequired: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      email: string;
      button: string;
      rememberPassword: string;
      signIn: string;
      emailRequired: string;
      emailSent: string;
      emailError: string;
    };
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
  };
  errors: {
    invalidCredentials: string;
    emailNotConfirmed: string;
    invalidEmail: string;
    passwordTooShort: string;
    userAlreadyRegistered: string;
    generic: string;
  };
}

