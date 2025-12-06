import LoginForm from "@/components/features/auth/login-form";

export default function LoginPage() {
  const isLdapEnabled = process.env.ENABLE_LDAP_OAUTH === 'true';
  const isGoogleEnabled = process.env.ENABLE_GOOGLE_OAUTH === 'true';
  const isMicrosoftEnabled = process.env.ENABLE_MICROSOFT_OAUTH === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrlApi = process.env.BASE_URL_API || 'http://localhost:3000';

  return (
    <LoginForm 
      isLdapEnabled={isLdapEnabled}
      isGoogleEnabled={isGoogleEnabled}
      isMicrosoftEnabled={isMicrosoftEnabled}
      isProduction={isProduction}
      baseUrlApi={baseUrlApi}
    />
  );
}
