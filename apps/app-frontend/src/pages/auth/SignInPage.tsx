/**
 * flow: institutional-sign-in
 * step: auth_sign_in_form → auth_post_login_transition
 *
 * Renders InstitutionalSignInPage (spec sign_in_shell); tenant-specific visuals come from
 * branding_profiles via institutionalBrandingByTenant.
 */
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../contexts/SessionContext'
import { InstitutionalSignInPage } from '../../components/login/InstitutionalSignInPage'

export function SignInPage() {
  const { loginEmail, loginSuccess, logout } = useSession()
  const navigate = useNavigate()

  function handleChooseAnother() {
    logout()
    navigate('/')
  }

  return (
    <InstitutionalSignInPage
      defaultEmail={loginEmail}
      onLoginSuccess={loginSuccess}
      onChooseAnother={handleChooseAnother}
    />
  )
}
