export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

export interface Translations {
  auth: {
    brand: {
      name: string;
      tagline: string;
    };
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
      googleContinue: string;
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
      googleContinue: string;
      alreadyHaveAccount: string;
      signIn: string;
      fieldsRequired: string;
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      subtitleStep1: string;
      subtitleStep2: string;
      subtitleStep3: string;
      stepLabel: string;
      email: string;
      code: string;
      codePlaceholder: string;
      newPassword: string;
      confirmPassword: string;
      button: string;
      buttonSendCode: string;
      buttonVerifyCode: string;
      buttonResetPassword: string;
      resendCode: string;
      rememberPassword: string;
      signIn: string;
      emailRequired: string;
      emailSent: string;
      emailError: string;
      codeSent: string;
      codeRequestError: string;
      codeInvalid: string;
      codeVerified: string;
      codeVerifyError: string;
      verificationMissing: string;
      passwordTooShort: string;
      passwordMismatch: string;
      passwordUpdated: string;
      passwordUpdateError: string;
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

