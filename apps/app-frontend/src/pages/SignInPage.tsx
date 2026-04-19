/**
 * flow: institutional-sign-in
 * step: auth_sign_in_form → auth_post_login_transition
 *
 * Three branded surfaces:
 *  - vertexa  → VertexaCloudLoginPage
 *  - northstar → NorthstarBankLoginPage
 *  - evergreen → BluestoneFinancialLoginPage
 */
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { VertexaLoginPage } from '../components/login/VertexaLoginPage'
import { NorthstarLoginPage } from '../components/login/NorthstarLoginPage'
import { BluestoneLoginPage } from '../components/login/BluestoneLoginPage'

export function SignInPage() {
  const { selectedTenant, loginEmail, loginSuccess, logout } = useSession()
  const navigate = useNavigate()

  function handleChooseAnother() {
    logout()
    navigate('/')
  }

  if (selectedTenant === 'vertexa') {
    return (
      <VertexaLoginPage
        defaultEmail={loginEmail}
        onLoginSuccess={loginSuccess}
        onChooseAnother={handleChooseAnother}
      />
    )
  }

  if (selectedTenant === 'northstar') {
    return (
      <NorthstarLoginPage
        defaultEmail={loginEmail}
        onLoginSuccess={loginSuccess}
        onChooseAnother={handleChooseAnother}
      />
    )
  }

  // evergreen → Bluestone Financial Group
  return (
    <BluestoneLoginPage
      defaultEmail={loginEmail}
      onLoginSuccess={loginSuccess}
      onChooseAnother={handleChooseAnother}
    />
  )
}
